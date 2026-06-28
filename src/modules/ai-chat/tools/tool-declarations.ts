import { Type } from '@google/genai';
import type { FunctionDeclaration } from '@google/genai';

/**
 * Khai báo các "tool" (function declarations) để Gemini biết nó có thể gọi gì
 * trong luồng trợ lý đặt hàng. Phần thực thi nằm ở OrderToolsService.
 */
export const ORDER_TOOL_DECLARATIONS: FunctionDeclaration[] = [
  {
    name: 'searchProducts',
    description:
      'Tìm sản phẩm đang bán trên Moon Store theo nhu cầu/mô tả của khách. ' +
      'Dùng khi khách muốn tìm hoặc mua sản phẩm. Trả về danh sách kèm productId, tên, giá, tồn kho.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        query: {
          type: Type.STRING,
          description:
            'Mô tả nhu cầu hoặc tên sản phẩm, vd "tai nghe chống ồn pin trâu"',
        },
        maxPrice: {
          type: Type.NUMBER,
          description: 'Giá tối đa (đồng), nếu khách có nêu ngân sách',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'getProductDetail',
    description:
      'Lấy chi tiết một sản phẩm theo productId (giá, tồn kho, thông số, các tùy chọn). ' +
      'Dùng khi cần xác nhận thông tin hoặc khi sản phẩm có tùy chọn (size/màu) trước khi đặt.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        productId: { type: Type.NUMBER, description: 'ID sản phẩm' },
      },
      required: ['productId'],
    },
  },
  {
    name: 'getMyDefaultAddress',
    description:
      'Lấy địa chỉ giao hàng mặc định của khách đang đăng nhập. ' +
      'Gọi để biết và thông báo cho khách đơn sẽ giao tới đâu.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  {
    name: 'validateVoucher',
    description:
      'Kiểm tra mã giảm giá có hợp lệ không và tính số tiền được giảm trên tạm tính (subtotal). ' +
      'Dùng khi khách cung cấp mã giảm giá.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        code: { type: Type.STRING, description: 'Mã giảm giá' },
        subtotal: {
          type: Type.NUMBER,
          description: 'Tổng tiền hàng tạm tính (đồng) để tính mức giảm',
        },
      },
      required: ['code', 'subtotal'],
    },
  },
  {
    name: 'proposeOrder',
    description:
      'Tạo BẢN NHÁP đơn hàng để khách xác nhận (KHÔNG tạo đơn thật, KHÔNG trừ tiền). ' +
      'Gọi khi đã biết rõ sản phẩm + số lượng khách muốn mua. Hệ thống tự tính tiền, ' +
      'lấy địa chỉ mặc định và trả về thẻ xác nhận để khách bấm nút "Đặt đơn".',
    parameters: {
      type: Type.OBJECT,
      properties: {
        items: {
          type: Type.ARRAY,
          description: 'Danh sách sản phẩm muốn đặt',
          items: {
            type: Type.OBJECT,
            properties: {
              productId: { type: Type.NUMBER, description: 'ID sản phẩm' },
              quantity: { type: Type.NUMBER, description: 'Số lượng (>=1)' },
              optionIds: {
                type: Type.ARRAY,
                description:
                  'ID các tùy chọn đã chọn (nếu sản phẩm có size/màu...)',
                items: { type: Type.NUMBER },
              },
            },
            required: ['productId', 'quantity'],
          },
        },
        voucherCode: {
          type: Type.STRING,
          description: 'Mã giảm giá nếu khách muốn áp (tùy chọn)',
        },
        paymentMethod: {
          type: Type.STRING,
          description:
            'Phương thức thanh toán: VNPAY, QR hoặc COD. Mặc định VNPAY nếu khách không nêu.',
        },
      },
      required: ['items'],
    },
  },
];
