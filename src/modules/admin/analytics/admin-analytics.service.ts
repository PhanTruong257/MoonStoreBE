import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import type { Content, Part } from '@google/genai';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';

import { assertAdminFromRequest } from '../../../common/auth/request-user.helper';
import {
  getGeminiChatModel,
  PRODUCT_STATUS,
  SELLER_STATUS,
} from '../../../common/constants';
import { decimalToNumberOrZero } from '../../../common/utils/decimal.helper';
import { PrismaService } from '../../../prisma/prisma.service';
import { isQuotaError } from '../../../common/utils/ai-error.helper';
import { ANALYTICS_TOOL_DECLARATIONS } from './analytics-tool-declarations';
import type {
  AdminAnalyticsAskResponseDto,
  AnalyticsHistoryItem,
} from '../dto/analytics.dto';

const MAX_TOOL_ITERATIONS = 6;
const MAX_HISTORY_TURNS = 6;
const DEFAULT_MONTHS = 6;
const MAX_MONTHS = 24;

const SYSTEM_PROMPT = `Bạn là trợ lý phân tích dữ liệu cho ADMIN của sàn TMĐT Moon Store.
Nhiệm vụ: trả lời câu hỏi về số liệu kinh doanh bằng cách GỌI TOOL để lấy dữ liệu thật, rồi diễn giải ngắn gọn bằng tiếng Việt.
Quy tắc bắt buộc:
- LUÔN gọi tool phù hợp để lấy số liệu, TUYỆT ĐỐI KHÔNG tự bịa con số.
- Có thể gọi nhiều tool nếu câu hỏi cần nhiều loại số liệu.
- Nếu câu hỏi nằm ngoài phạm vi các tool, nói thẳng là chưa hỗ trợ.
- Trả lời ngắn gọn, nêu rõ con số quan trọng và xu hướng (tăng/giảm) nếu có.
- Đơn vị tiền tệ là VND.`;

@Injectable()
export class AdminAnalyticsService {
  private readonly logger = new Logger(AdminAnalyticsService.name);
  private readonly ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_AI_API_KEY });
  private readonly model = getGeminiChatModel();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // ---------- NL2SQL: admin hỏi bằng tiếng Việt → AI gọi tool ----------
  async ask(
    req: Request,
    question: string,
    history: AnalyticsHistoryItem[] = [],
  ): Promise<AdminAnalyticsAskResponseDto> {
    await assertAdminFromRequest(req, this.jwtService, this.prisma);

    const contents: Content[] = history
      .slice(-MAX_HISTORY_TURNS)
      .map((h) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }],
      }));
    contents.push({ role: 'user', parts: [{ text: question }] });

    const collected: { tool: string; result: unknown }[] = [];
    let finalText = '';

    try {
      for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
        const response = await this.ai.models.generateContent({
          model: this.model,
          config: {
            systemInstruction: SYSTEM_PROMPT,
            temperature: 0.1,
            tools: [{ functionDeclarations: ANALYTICS_TOOL_DECLARATIONS }],
          },
          contents,
        });

        const calls = response.functionCalls ?? [];
        if (!calls.length) {
          finalText = response.text ?? '';
          break;
        }

        const modelContent = response.candidates?.[0]?.content;
        if (modelContent) contents.push(modelContent);

        const responseParts: Part[] = [];
        for (const call of calls) {
          const result = await this.executeTool(call.name ?? '', call.args ?? {});
          collected.push({ tool: call.name ?? '', result });
          responseParts.push({
            functionResponse: { name: call.name ?? '', response: result },
          });
        }
        contents.push({ role: 'user', parts: responseParts });
      }
    } catch (error) {
      this.logger.error('Admin analytics NL2SQL error', error as Error);
      return {
        text: isQuotaError(error)
          ? 'AI đang quá tải hoặc đã hết lượt dùng miễn phí hôm nay, vui lòng thử lại sau.'
          : 'Có lỗi khi truy vấn số liệu, vui lòng thử lại.',
        data: [],
      };
    }

    if (!finalText) {
      finalText = collected.length
        ? 'Đây là số liệu bạn cần.'
        : 'Mình chưa rõ câu hỏi, bạn thử hỏi cụ thể hơn về doanh thu, sản phẩm, đơn hàng... nhé.';
    }

    return { text: finalText, data: collected };
  }

  // ---------- Dashboard trực tiếp (không qua AI) cho biểu đồ ----------
  async getDashboard(req: Request) {
    await assertAdminFromRequest(req, this.jwtService, this.prisma);
    const [overview, revenue, topProducts, statusBreakdown, userGrowth, returnRefund] =
      await Promise.all([
        this.getOverview(),
        this.getRevenueByPeriod(DEFAULT_MONTHS),
        this.getTopProducts(5, DEFAULT_MONTHS),
        this.getOrderStatusBreakdown(DEFAULT_MONTHS),
        this.getUserGrowth(DEFAULT_MONTHS),
        this.getReturnRefundStats(DEFAULT_MONTHS),
      ]);
    return { overview, revenue, topProducts, statusBreakdown, userGrowth, returnRefund };
  }

  // ---------- Dispatcher tool ----------
  private async executeTool(
    name: string,
    args: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const months = typeof args.months === 'number' ? args.months : undefined;
    const limit = typeof args.limit === 'number' ? args.limit : undefined;
    switch (name) {
      case 'getOverview':
        return this.getOverview();
      case 'getRevenueByPeriod':
        return this.getRevenueByPeriod(months);
      case 'getTopProducts':
        return this.getTopProducts(limit, months);
      case 'getOrderStatusBreakdown':
        return this.getOrderStatusBreakdown(months);
      case 'getUserGrowth':
        return this.getUserGrowth(months);
      case 'getReturnRefundStats':
        return this.getReturnRefundStats(months);
      default:
        return { error: `Tool không hỗ trợ: ${name}` };
    }
  }

  // ---------- Các hàm truy vấn số liệu ----------
  private async getOverview(): Promise<Record<string, unknown>> {
    const [orderAgg, users, sellers, products] = await Promise.all([
      this.prisma.order.aggregate({ _sum: { finalAmount: true }, _count: { _all: true } }),
      this.prisma.user.count(),
      this.prisma.seller.count({ where: { status: SELLER_STATUS.ACTIVE } }),
      this.prisma.product.count({ where: { status: PRODUCT_STATUS.ACTIVE } }),
    ]);
    return {
      chartType: 'kpi',
      unit: 'VND',
      totalRevenue: decimalToNumberOrZero(orderAgg._sum.finalAmount),
      totalOrders: orderAgg._count._all,
      totalUsers: users,
      activeSellers: sellers,
      activeProducts: products,
    };
  }

  private async getRevenueByPeriod(months = DEFAULT_MONTHS): Promise<Record<string, unknown>> {
    const m = this.clampMonths(months);
    const since = this.startOfMonthsAgo(m);
    const orders = await this.prisma.order.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true, finalAmount: true },
    });

    const keys = this.lastMonthKeys(m);
    const bucket = new Map(keys.map((k) => [k, { revenue: 0, orders: 0 }]));
    for (const order of orders) {
      const entry = bucket.get(this.monthKey(order.createdAt));
      if (entry) {
        entry.revenue += decimalToNumberOrZero(order.finalAmount);
        entry.orders += 1;
      }
    }

    return {
      chartType: 'line',
      unit: 'VND',
      series: keys.map((k) => ({ period: k, ...bucket.get(k)! })),
    };
  }

  private async getTopProducts(
    limit = 5,
    months = DEFAULT_MONTHS,
  ): Promise<Record<string, unknown>> {
    const lim = Math.min(Math.max(1, Math.floor(limit)), 20);
    const since = this.startOfMonthsAgo(this.clampMonths(months));
    const items = await this.prisma.orderItem.findMany({
      where: { orderGroup: { order: { createdAt: { gte: since } } } },
      select: { productName: true, quantity: true, unitPriceAtTime: true },
    });

    const map = new Map<string, { quantity: number; revenue: number }>();
    for (const item of items) {
      const current = map.get(item.productName) ?? { quantity: 0, revenue: 0 };
      current.quantity += item.quantity;
      current.revenue += decimalToNumberOrZero(item.unitPriceAtTime) * item.quantity;
      map.set(item.productName, current);
    }

    const top = [...map.entries()]
      .map(([name, value]) => ({ name, quantity: value.quantity, revenue: value.revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, lim);

    return { chartType: 'bar', unit: 'VND', items: top };
  }

  private async getOrderStatusBreakdown(
    months = DEFAULT_MONTHS,
  ): Promise<Record<string, unknown>> {
    const since = this.startOfMonthsAgo(this.clampMonths(months));
    const groups = await this.prisma.orderGroup.groupBy({
      by: ['status'],
      _count: { _all: true },
      where: { order: { createdAt: { gte: since } } },
    });
    return {
      chartType: 'pie',
      items: groups.map((g) => ({ status: g.status, count: g._count._all })),
    };
  }

  private async getUserGrowth(months = DEFAULT_MONTHS): Promise<Record<string, unknown>> {
    const m = this.clampMonths(months);
    const since = this.startOfMonthsAgo(m);
    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    });

    const keys = this.lastMonthKeys(m);
    const bucket = new Map(keys.map((k) => [k, 0]));
    for (const user of users) {
      const key = this.monthKey(user.createdAt);
      if (bucket.has(key)) bucket.set(key, (bucket.get(key) ?? 0) + 1);
    }

    return {
      chartType: 'line',
      series: keys.map((k) => ({ period: k, newUsers: bucket.get(k) ?? 0 })),
    };
  }

  private async getReturnRefundStats(
    months = DEFAULT_MONTHS,
  ): Promise<Record<string, unknown>> {
    const since = this.startOfMonthsAgo(this.clampMonths(months));
    const [returns, refunds, totalOrders] = await Promise.all([
      this.prisma.returnRequest.count({ where: { createdAt: { gte: since } } }),
      this.prisma.refundRequest.count({ where: { createdAt: { gte: since } } }),
      this.prisma.order.count({ where: { createdAt: { gte: since } } }),
    ]);
    const ratePercent =
      totalOrders > 0 ? Math.round(((returns + refunds) / totalOrders) * 1000) / 10 : 0;
    return {
      chartType: 'kpi',
      returns,
      refunds,
      totalOrders,
      returnRefundRatePercent: ratePercent,
    };
  }

  // ---------- Helpers thời gian ----------
  private clampMonths(months: number): number {
    if (!Number.isFinite(months)) return DEFAULT_MONTHS;
    return Math.min(Math.max(1, Math.floor(months)), MAX_MONTHS);
  }

  /** Ngày đầu tiên của tháng (m-1) tháng trước (để gồm cả tháng hiện tại = m mốc). */
  private startOfMonthsAgo(m: number): Date {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    d.setMonth(d.getMonth() - (m - 1));
    return d;
  }

  private monthKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  private lastMonthKeys(m: number): string[] {
    const base = new Date();
    base.setDate(1);
    base.setHours(0, 0, 0, 0);
    const keys: string[] = [];
    for (let i = m - 1; i >= 0; i--) {
      const d = new Date(base);
      d.setMonth(base.getMonth() - i);
      keys.push(this.monthKey(d));
    }
    return keys;
  }
}
