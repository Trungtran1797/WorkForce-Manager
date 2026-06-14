export function formatCurrencyVnd(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(value % 1_000_000_000 === 0 ? 0 : 1)} tỷ`
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)} triệu`
  }

  return value.toLocaleString('vi-VN')
}

export function formatDate(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleDateString('vi-VN')
}

/** Số tiền đầy đủ kèm hậu tố "đ" (vd. 12.345.678 đ) — dùng cho phiếu lương/hợp đồng. */
export function formatMoney(value: number): string {
  return `${Math.round(value).toLocaleString('vi-VN')} đ`
}

/** Định dạng kích thước file dễ đọc (vd. 1.2 MB, 350 KB). */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/** Định dạng ngày giờ đầy đủ (vd. 14/06/2026 09:30) — dùng cho bình luận, lịch sử. */
export function formatDateTime(isoDate: string): string {
  const date = new Date(isoDate)
  return date.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
