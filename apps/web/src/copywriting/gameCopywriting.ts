export function formatVndCurrency(amount: number): string {
  return Math.max(0, Math.round(amount)).toLocaleString('vi-VN');
}

export const GAME_COPYWRITING = {
  paymentDue(roomNumber: string, amount: number, monthPeriod = '2026-11'): string {
    const monthLabel = monthPeriod.includes('-') ? monthPeriod.split('-')[1] : monthPeriod;
    return `Ting! Hóa đơn tháng ${monthLabel} của phòng ${roomNumber} đã sẵn sàng (${formatVndCurrency(amount)} đ). Nhờ bạn kiểm tra chỉ số điện nước và quét mã VietQR khi thuận tiện nhé!`;
  },

  billPending(roomNumber: string): string {
    return `Khách phòng ${roomNumber} vừa gửi ảnh biên lai chuyển khoản. Chủ nhà kiểm tra và xác nhận 1 chạm để tặng điểm uy tín nhé!`;
  },

  billPaid(roomNumber: string, reputationDelta = 2): string {
    return `Tuyệt vời! Đã xác nhận thanh toán phòng ${roomNumber}. Khách thuê nhận +${reputationDelta} điểm Sao Uy Tín!`;
  },

  deviceBroken(roomNumber: string, deviceName: string): string {
    return `Phòng ${roomNumber} vừa báo sự cố ${deviceName}. Chấm than đỏ đã bật để chủ nhà ưu tiên xử lý sớm giúp khách nhé!`;
  },

  maintenanceResolved(roomNumber: string, deviceName: string): string {
    return `Hoàn tất sửa chữa ${deviceName} tại phòng ${roomNumber}! Phòng đã trở lại trạng thái an toàn và ghi nhận vào sổ lịch sử.`;
  },
} as const;
