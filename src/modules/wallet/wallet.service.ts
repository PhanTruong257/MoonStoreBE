import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

import {
  getActiveSellerIdForUser,
  getUserIdFromRequest as extractUserId,
} from '../../common/auth/request-user.helper';
import { WALLET_TRANSACTION_TYPE, WITHDRAWAL_STATUS } from '../../common/constants';
import { PrismaService } from '../../prisma/prisma.service';
import type { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import type { WalletDetailResponseDto } from './dto/wallet-response.dto';

@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  private getUserIdFromRequest(req: Request) {
    return extractUserId(req, this.jwtService);
  }

  private getSellerIdForUser(userId: number) {
    return getActiveSellerIdForUser(this.prisma, userId);
  }

  async getOrCreateWallet(sellerId: number) {
    return this.prisma.sellerWallet.upsert({
      where: { sellerId },
      create: {
        sellerId,
        balance: new Prisma.Decimal(0),
        totalEarned: new Prisma.Decimal(0),
        totalWithdrawn: new Prisma.Decimal(0),
      },
      update: {},
    });
  }

  /**
   * Credit a seller's wallet for a delivered order group, net of platform commission.
   *
   * Idempotent: if a CREDIT transaction already exists for the group it is a no-op,
   * so retries / duplicate DELIVERED transitions never double-credit.
   *
   * When called from within an outer transaction, pass that transaction `client`
   * so the credit commits atomically with the status change.
   */
  async creditSellerWallet(
    sellerId: number,
    orderGroupId: number,
    grossAmount: number,
    commissionRate: number,
    client?: Prisma.TransactionClient
  ) {
    const fee = Math.round(grossAmount * (commissionRate / 100) * 100) / 100;
    const net = Math.round((grossAmount - fee) * 100) / 100;

    const run = async (tx: Prisma.TransactionClient) => {
      const alreadyCredited = await tx.walletTransaction.findFirst({
        where: { orderGroupId, type: WALLET_TRANSACTION_TYPE.CREDIT },
        select: { id: true },
      });
      if (alreadyCredited) {
        return;
      }

      const wallet = await tx.sellerWallet.upsert({
        where: { sellerId },
        create: {
          sellerId,
          balance: new Prisma.Decimal(net),
          totalEarned: new Prisma.Decimal(net),
          totalWithdrawn: new Prisma.Decimal(0),
        },
        update: {
          balance: { increment: new Prisma.Decimal(net) },
          totalEarned: { increment: new Prisma.Decimal(net) },
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WALLET_TRANSACTION_TYPE.CREDIT,
          amount: new Prisma.Decimal(grossAmount),
          fee: new Prisma.Decimal(fee),
          net: new Prisma.Decimal(net),
          description: `Order #${orderGroupId} delivered`,
          orderGroupId,
        },
      });
    };

    if (client) {
      await run(client);
    } else {
      await this.prisma.$transaction(run);
    }
  }

  /**
   * Reverse the seller credit for an order group (refund / completed return).
   *
   * Debits back exactly the net amount that was previously credited for the group.
   * Idempotent: a no-op when the group was never credited or was already reversed.
   * Must run inside the caller's transaction so it commits with the refund/return.
   */
  async reverseSellerCreditForGroup(orderGroupId: number, client: Prisma.TransactionClient) {
    const credit = await client.walletTransaction.findFirst({
      where: { orderGroupId, type: WALLET_TRANSACTION_TYPE.CREDIT },
      select: { id: true, walletId: true, net: true },
    });
    if (!credit) {
      return;
    }

    const alreadyReversed = await client.walletTransaction.findFirst({
      where: { orderGroupId, type: WALLET_TRANSACTION_TYPE.DEBIT },
      select: { id: true },
    });
    if (alreadyReversed) {
      return;
    }

    await client.sellerWallet.update({
      where: { id: credit.walletId },
      data: {
        balance: { decrement: credit.net },
        totalEarned: { decrement: credit.net },
      },
    });

    await client.walletTransaction.create({
      data: {
        walletId: credit.walletId,
        type: WALLET_TRANSACTION_TYPE.DEBIT,
        amount: credit.net,
        fee: new Prisma.Decimal(0),
        net: new Prisma.Decimal(-Number(credit.net)),
        description: `Order #${orderGroupId} refunded / returned`,
        orderGroupId,
      },
    });
  }

  async getWalletDetail(req: Request): Promise<WalletDetailResponseDto> {
    const userId = this.getUserIdFromRequest(req);
    const sellerId = await this.getSellerIdForUser(userId);

    const wallet = await this.prisma.sellerWallet.findUnique({
      where: { sellerId },
      include: {
        transactions: { orderBy: { createdAt: 'desc' }, take: 50 },
        withdrawals: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });

    if (!wallet) {
      return {
        wallet: { balance: 0, totalEarned: 0, totalWithdrawn: 0 },
        transactions: [],
        withdrawals: [],
      };
    }

    return {
      wallet: {
        balance: Number(wallet.balance),
        totalEarned: Number(wallet.totalEarned),
        totalWithdrawn: Number(wallet.totalWithdrawn),
      },
      transactions: wallet.transactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: Number(tx.amount),
        fee: Number(tx.fee),
        net: Number(tx.net),
        description: tx.description,
        orderGroupId: tx.orderGroupId ?? null,
        createdAt: tx.createdAt.toISOString(),
      })),
      withdrawals: wallet.withdrawals.map((w) => ({
        id: w.id,
        amount: Number(w.amount),
        bankName: w.bankName,
        bankAccount: w.bankAccount,
        bankHolder: w.bankHolder,
        status: w.status,
        note: w.note ?? null,
        processedAt: w.processedAt?.toISOString() ?? null,
        createdAt: w.createdAt.toISOString(),
      })),
    };
  }

  async createWithdrawal(req: Request, payload: CreateWithdrawalDto) {
    const userId = this.getUserIdFromRequest(req);
    const sellerId = await this.getSellerIdForUser(userId);

    if (!payload.amount || payload.amount <= 0) {
      throw new BadRequestException('Invalid withdrawal amount.');
    }

    const wallet = await this.prisma.sellerWallet.findUnique({ where: { sellerId } });
    if (!wallet) {
      throw new BadRequestException('Wallet not found.');
    }

    if (Number(wallet.balance) < payload.amount) {
      throw new BadRequestException('Insufficient balance.');
    }

    const withdrawal = await this.prisma.$transaction(async (tx) => {
      await tx.sellerWallet.update({
        where: { sellerId },
        data: {
          balance: { decrement: new Prisma.Decimal(payload.amount) },
          totalWithdrawn: { increment: new Prisma.Decimal(payload.amount) },
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WALLET_TRANSACTION_TYPE.DEBIT,
          amount: new Prisma.Decimal(payload.amount),
          fee: new Prisma.Decimal(0),
          net: new Prisma.Decimal(-payload.amount),
          description: `Withdrawal request`,
        },
      });

      return tx.withdrawalRequest.create({
        data: {
          walletId: wallet.id,
          amount: new Prisma.Decimal(payload.amount),
          bankName: payload.bankName,
          bankAccount: payload.bankAccount,
          bankHolder: payload.bankHolder,
          status: WITHDRAWAL_STATUS.PENDING,
        },
      });
    });

    return { withdrawalId: withdrawal.id, status: withdrawal.status };
  }

  async getWithdrawalById(withdrawalId: number) {
    const withdrawal = await this.prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
    });
    if (!withdrawal) throw new NotFoundException('Withdrawal not found.');
    return withdrawal;
  }
}
