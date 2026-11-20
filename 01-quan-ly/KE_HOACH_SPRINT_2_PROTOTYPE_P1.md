# Kế hoạch Sprint 2 — Prototype P1

- **Trạng thái:** Kế hoạch cấp Sprint đã chuẩn hoá ngày 2026-11-18; trạng thái thực thi xem duy nhất tại GitHub Project `QLNT #2`.
- **Căn cứ:** `QLNT-D015`, `QLNT-D016`, `KE_HOACH_TONG_THE_DU_AN.md`.
- **Sprint:** 2 tuần, chỉ bắt đầu khi danh sách task và ngày start được PM xác nhận trên Project.

## Mục tiêu Sprint

Chứng minh Prototype P1 chạy cục bộ trên Web/Mobile: kiến trúc tách `Headless Core` và renderer, cảnh 3D isometric cố định, luồng Sổ quản lý ảo F04 Single-Page và các nghiệp vụ P1 đã chốt. Trong Sprint không kết nối API/dịch vụ bên thứ ba và không phát sinh chi phí hạ tầng, theo `QLNT-D016`.

## Phạm vi và đầu ra đo được

| Nhóm đầu ra | Cách xác nhận |
| --- | --- |
| Prototype chạy cục bộ | Build/chạy được trên môi trường xác định; bằng chứng nằm trong Issue kỹ thuật tương ứng |
| Luồng P1 trọng tâm | Đối chiếu baseline P1 và AC/DoD bởi BA/QA; các mục chưa chạy ghi rõ `Chưa kiểm tra` hoặc `N/A`, không coi là Pass |
| Trải nghiệm 3D camera cố định và Sổ F04 | Bằng chứng thao tác trên Web/Mobile theo tiêu chí UX/Tech đã chốt |
| Chất lượng/điều hành | 100% Issue có nhật ký trạng thái, liên kết commit/PR và kết quả nghiệm thu trước khi đóng |

## Ràng buộc

- Chỉ dùng thư viện cục bộ; không gọi API/dịch vụ bên thứ ba (`QLNT-D016`).
- Không dùng tài liệu này để thay đổi phạm vi, baseline P1, kiến trúc, chi phí hay lịch Sprint.
- Mọi thay đổi đề xuất và mọi công việc mới phải qua kiểm tra xung đột trước khi được đưa vào kế hoạch/Issue.

## Quản lý công việc

Các công việc triển khai và DoD được quản lý ở GitHub Issues `#54`–`#68` trong Project `#2`. Trạng thái hiện tại của từng Issue trên Project là nguồn chuẩn; không dùng tài liệu kế hoạch thay cho bảng công việc. PM đối chiếu mục tiêu Sprint với bằng chứng thực tế trước khi báo cáo kết quả.

## Điều kiện nghiệm thu Sprint

1. BA xác nhận đối chiếu nghiệp vụ/baseline hoặc nêu sai lệch cần chủ dự án quyết định.
2. QA đối chiếu từng test case/DoD với kết quả thực thi; phân biệt Pass, Fail, Not Run và N/A.
3. Tech Lead xác nhận liên kết Issue–branch/PR–commit và tuân thủ `QLNT-D016`.
4. Knowledge Governance báo cáo chất lượng hồ sơ và đề xuất cải tiến.
5. PM chỉ đóng Sprint sau khi có bằng chứng cho từng điều kiện trên và chủ dự án chấp thuận nếu có sai lệch phạm vi.

> Bản chi tiết trước chuẩn hoá được lưu để truy vết tại `../04-van-hanh/lich-su/ho-so-thuc-thi-chi-tiet/KE_HOACH_SPRINT_2_PROTOTYPE_P1_TRUOC_CHUAN_HOA_2026-11-18.md`; không phải kế hoạch đang hiệu lực.

