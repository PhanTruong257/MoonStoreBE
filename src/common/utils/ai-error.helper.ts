/**
 * Nhận biết lỗi hết hạn mức (quota) / rate-limit từ Gemini (HTTP 429,
 * RESOURCE_EXHAUSTED) để hiển thị thông báo thân thiện thay vì lỗi chung.
 */
export const isQuotaError = (error: unknown): boolean => {
  const status = (error as { status?: number })?.status;
  if (status === 429) return true;
  const message = String((error as { message?: string })?.message ?? '');
  return /RESOURCE_EXHAUSTED|quota|rate.?limit|429/i.test(message);
};
