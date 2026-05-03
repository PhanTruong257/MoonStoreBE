import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

import { getUserIdFromRequest as extractUserId } from '../../common/auth/request-user.helper';
import { PAYMENT_METHOD, PAYMENT_STATUS, USER_ROLE } from '../../common/constants';
import { toDecimal } from '../../common/utils/decimal.helper';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  ConfirmManualResponseDto,
  QrPaymentInfoDto,
  VnpayIpnResponseDto,
  VnpayReturnResponseDto,
} from './dto/payments-response.dto';
import { buildTransferContent, buildVietQrImageUrl, getVietQrConfig } from './vietqr.helper';
import {
  VNPAY_RESPONSE_CODE_SUCCESS,
  VNPAY_TRANSACTION_STATUS_SUCCESS,
  buildVnpayPaymentUrl,
  getVnpayConfig,
  verifyVnpaySignature,
} from './vnpay.helper';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  private getUserIdFromRequest(req: Request) {
    return extractUserId(req, this.jwtService);
  }

  async createQrPayment(orderId: number, amount: number): Promise<QrPaymentInfoDto> {
    const config = getVietQrConfig();
    if (!config.bankBin || !config.accountNo || !config.accountName) {
      throw new BadRequestException('VietQR is not configured.');
    }

    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        method: PAYMENT_METHOD.QR,
        amount: toDecimal(amount),
        status: PAYMENT_STATUS.PENDING,
      },
      select: { id: true, status: true },
    });

    const transferContent = buildTransferContent(config.transferPrefix, orderId);
    const qrUrl = buildVietQrImageUrl(config, amount, transferContent);

    return {
      paymentId: payment.id,
      orderId,
      amount,
      bankBin: config.bankBin,
      bankName: config.bankName,
      accountNo: config.accountNo,
      accountName: config.accountName,
      transferContent,
      qrUrl,
      paymentStatus: payment.status,
      expiresAt: null,
    };
  }

  async getOrderQrInfo(req: Request, orderId: number): Promise<QrPaymentInfoDto> {
    const userId = this.getUserIdFromRequest(req);

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        finalAmount: true,
        paymentMethod: true,
        paymentStatus: true,
      },
    });

    if (!order || order.userId !== userId) {
      throw new NotFoundException('Order not found.');
    }
    if (order.paymentMethod !== PAYMENT_METHOD.QR) {
      throw new BadRequestException('Order is not paid by QR.');
    }

    const payment = await this.prisma.payment.findFirst({
      where: { orderId, method: PAYMENT_METHOD.QR },
      orderBy: { id: 'desc' },
      select: { id: true, status: true, amount: true },
    });
    if (!payment) {
      throw new NotFoundException('QR payment not found.');
    }

    const config = getVietQrConfig();
    const transferContent = buildTransferContent(config.transferPrefix, orderId);
    const amount = Number(payment.amount);
    const qrUrl = buildVietQrImageUrl(config, amount, transferContent);

    return {
      paymentId: payment.id,
      orderId,
      amount,
      bankBin: config.bankBin,
      bankName: config.bankName,
      accountNo: config.accountNo,
      accountName: config.accountName,
      transferContent,
      qrUrl,
      paymentStatus: payment.status,
      expiresAt: null,
    };
  }

  async confirmPaymentManual(req: Request, paymentId: number): Promise<ConfirmManualResponseDto> {
    const userId = this.getUserIdFromRequest(req);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });
    if (!user) {
      throw new ForbiddenException('User not found.');
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        orderId: true,
        method: true,
        status: true,
        order: {
          select: {
            orderGroups: { select: { sellerId: true } },
          },
        },
      },
    });
    if (!payment) {
      throw new NotFoundException('Payment not found.');
    }
    if (payment.method !== PAYMENT_METHOD.QR) {
      throw new BadRequestException('Only QR payments support manual confirm.');
    }

    if (user.role !== USER_ROLE.ADMIN) {
      const seller = await this.prisma.seller.findUnique({
        where: { userId },
        select: { id: true },
      });
      const sellerOwnsGroup =
        seller && payment.order.orderGroups.some((group) => group.sellerId === seller.id);
      if (!sellerOwnsGroup) {
        throw new ForbiddenException('Not authorized to confirm this payment.');
      }
    }

    if (payment.status === PAYMENT_STATUS.PAID) {
      return {
        paymentId: payment.id,
        orderId: payment.orderId,
        paymentStatus: payment.status,
      };
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: PAYMENT_STATUS.PAID },
      });
      await tx.paymentTransaction.create({
        data: {
          paymentId: payment.id,
          transactionCode: `MANUAL_${Date.now()}`,
          gatewayResponse: JSON.stringify({
            method: 'manual',
            confirmedBy: userId,
          }),
          status: PAYMENT_STATUS.PAID,
        },
      });
      await tx.order.update({
        where: { id: payment.orderId },
        data: { paymentStatus: PAYMENT_STATUS.PAID },
      });
    });

    return {
      paymentId: payment.id,
      orderId: payment.orderId,
      paymentStatus: PAYMENT_STATUS.PAID,
    };
  }

  async createVnpayPayment(orderId: number, amount: number, ipAddr: string): Promise<string> {
    const config = getVnpayConfig();
    if (!config.tmnCode || !config.hashSecret || !config.url) {
      throw new BadRequestException('VNPay is not configured.');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });
    if (!order) {
      throw new NotFoundException('Order not found.');
    }

    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        method: PAYMENT_METHOD.VNPAY,
        amount: toDecimal(amount),
        status: PAYMENT_STATUS.PENDING,
      },
      select: { id: true },
    });

    return buildVnpayPaymentUrl(config, {
      amount,
      txnRef: String(payment.id),
      orderInfo: `Thanh_toan_don_hang_${orderId}`,
      ipAddr,
    });
  }

  async handleVnpayReturn(query: Record<string, string>): Promise<VnpayReturnResponseDto> {
    const config = getVnpayConfig();
    const isValid = verifyVnpaySignature(config.hashSecret, query);
    if (!isValid) {
      return {
        paid: false,
        orderId: null,
        paymentId: null,
        message: 'Invalid signature.',
      };
    }

    const paymentId = Number(query.vnp_TxnRef);
    if (!Number.isFinite(paymentId) || paymentId <= 0) {
      return {
        paid: false,
        orderId: null,
        paymentId: null,
        message: 'Invalid transaction reference.',
      };
    }

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      select: { id: true, orderId: true, status: true },
    });
    if (!payment) {
      return {
        paid: false,
        orderId: null,
        paymentId,
        message: 'Payment not found.',
      };
    }

    const isSuccess =
      query.vnp_ResponseCode === VNPAY_RESPONSE_CODE_SUCCESS &&
      query.vnp_TransactionStatus === VNPAY_TRANSACTION_STATUS_SUCCESS;

    if (payment.status === PAYMENT_STATUS.PENDING) {
      const nextStatus = isSuccess ? PAYMENT_STATUS.PAID : PAYMENT_STATUS.FAILED;

      await this.prisma.$transaction(async (tx) => {
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: nextStatus },
        });
        await tx.paymentTransaction.create({
          data: {
            paymentId: payment.id,
            transactionCode: query.vnp_TransactionNo ?? '',
            gatewayResponse: JSON.stringify(query),
            status: nextStatus,
          },
        });
        if (isSuccess) {
          await tx.order.update({
            where: { id: payment.orderId },
            data: { paymentStatus: PAYMENT_STATUS.PAID },
          });
        }
      });
    }

    return {
      paid: isSuccess,
      orderId: payment.orderId,
      paymentId: payment.id,
      message: isSuccess ? 'Payment successful.' : 'Payment failed.',
    };
  }

  async handleVnpayIpn(query: Record<string, string>): Promise<VnpayIpnResponseDto> {
    const result = await this.handleVnpayReturn(query);
    if (!result.paymentId) {
      return { RspCode: '01', Message: 'Order not found' };
    }
    if (!result.paid) {
      return { RspCode: '02', Message: 'Payment failed' };
    }
    return { RspCode: '00', Message: 'Confirm Success' };
  }
}
