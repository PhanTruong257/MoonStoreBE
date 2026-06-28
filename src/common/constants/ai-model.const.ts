/**
 * Model Gemini dùng để SINH VĂN BẢN (chat tư vấn, agent đặt hàng, NL2SQL thống kê,
 * viết mô tả sản phẩm từ ảnh). Đổi model chỉ cần set GEMINI_CHAT_MODEL trong .env.
 *
 * LƯU Ý: phải đọc qua HÀM (lazy) — KHÔNG đọc `process.env` ở cấp module — vì .env
 * của dự án được nạp muộn (lúc Prisma khởi tạo), đọc sớm sẽ luôn ra giá trị mặc định.
 * Model EMBEDDING (gemini-embedding-001) là loại khác, không dùng biến này.
 */
export const getGeminiChatModel = (): string =>
  process.env.GEMINI_CHAT_MODEL?.trim() || 'gemini-2.5-flash';
