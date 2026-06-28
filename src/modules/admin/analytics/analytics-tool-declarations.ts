import { Type } from '@google/genai';
import type { FunctionDeclaration } from '@google/genai';

/**
 * Tool truy vấn số liệu cho NL2SQL (admin). Gemini chỉ ĐƯỢC chọn trong các tool
 * an toàn này — không sinh SQL thô. Phần thực thi nằm ở AdminAnalyticsService.
 */
export const ANALYTICS_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'getOverview',
    description:
      'Lấy số liệu tổng quan toàn sàn: tổng doanh thu, tổng số đơn, tổng người dùng, ' +
      'số seller đang hoạt động, số sản phẩm đang bán. Dùng cho câu hỏi tổng quan.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'getRevenueByPeriod',
    description:
      'Lấy doanh thu và số đơn theo từng tháng (chuỗi thời gian). ' +
      'Dùng cho câu hỏi về doanh thu, xu hướng, so sánh tháng.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        months: {
          type: Type.NUMBER,
          description: 'Số tháng gần nhất muốn xem (mặc định 6, tối đa 24)',
        },
      },
    },
  },
  {
    name: 'getTopProducts',
    description:
      'Lấy danh sách sản phẩm bán chạy nhất (theo doanh thu) trong khoảng thời gian. ' +
      'Dùng cho câu hỏi "sản phẩm bán chạy", "top sản phẩm".',
    parameters: {
      type: Type.OBJECT,
      properties: {
        limit: { type: Type.NUMBER, description: 'Số sản phẩm muốn lấy (mặc định 5, tối đa 20)' },
        months: { type: Type.NUMBER, description: 'Số tháng gần nhất (mặc định 6)' },
      },
    },
  },
  {
    name: 'getOrderStatusBreakdown',
    description:
      'Đếm số đơn (theo nhóm shop) theo từng trạng thái (chờ xác nhận, đã xác nhận, đang giao, đã giao, đã hủy). ' +
      'Dùng cho câu hỏi về tỉ lệ/phân bố trạng thái đơn, đơn bị hủy.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        months: { type: Type.NUMBER, description: 'Số tháng gần nhất (mặc định 6)' },
      },
    },
  },
  {
    name: 'getUserGrowth',
    description:
      'Lấy số người dùng đăng ký mới theo từng tháng. Dùng cho câu hỏi về tăng trưởng người dùng.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        months: { type: Type.NUMBER, description: 'Số tháng gần nhất (mặc định 6)' },
      },
    },
  },
  {
    name: 'getReturnRefundStats',
    description:
      'Lấy thống kê đổi/trả và hoàn tiền: số yêu cầu trả hàng, số yêu cầu hoàn tiền, ' +
      'tổng đơn và tỉ lệ trên tổng đơn. Dùng cho câu hỏi về đổi trả, hoàn tiền, tỉ lệ khiếu nại.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        months: { type: Type.NUMBER, description: 'Số tháng gần nhất (mặc định 6)' },
      },
    },
  },
];
