# Kế hoạch tổng thể dự án QLNT

- **Trạng thái:** Đang thực hiện; kế hoạch cấp dự án, không phải bảng phân rã công việc.
- **Cập nhật:** 2026-11-18
- **Căn cứ:** `PROJECT_BRIEF.md`, `DECISIONS.md` (đặc biệt `QLNT-D008`, `QLNT-D014`–`D017`) và GitHub Project `QLNT #2`.

## 1. Mục đích lớn

Xây dựng QLNT giúp chủ nhà quản lý nhà trọ bằng trải nghiệm game hoá, nhưng dữ liệu và nghiệp vụ quản lý vẫn rõ ràng, an toàn và có thể kiểm chứng. Đích đồ hoạ là thế giới **3D camera isometric cố định**; phát triển tăng dần từ prototype hình khối/sprite trong không gian 3D tới object 3D hoàn chỉnh mà không phá vỡ Domain Core.

## 2. Mục tiêu theo giai đoạn

| Giai đoạn | Mục tiêu | Cổng/đầu ra cần chứng minh | Trạng thái |
| --- | --- | --- | --- |
| G1 — Thiết kế | Có baseline P1 về nghiệp vụ, UX, kỹ thuật, QA và vận hành | `QLNT-D015`; bộ baseline P1 đã chốt | Đã qua |
| G2 — Prototype P1 | Chứng minh luồng quản lý cốt lõi và trải nghiệm 3D/Sổ F04 chạy cục bộ trên Web/Mobile | Bằng chứng chức năng theo baseline, kiểm thử và đối chiếu DoD trên GitHub Issues | Đang đối chiếu lại trạng thái |
| G3 — Pilot | Thử nghiệm có kiểm soát với người dùng mục tiêu tại Hà Nội | Pilot scope, chỉ số thành công, chi phí và điều kiện dữ liệu được chủ dự án duyệt | Chưa lập kế hoạch chi tiết |
| G4 — Mở rộng | Hoàn thiện SaaS, vận hành và phát hành nền tảng khi đủ căn cứ | Quyết định phạm vi, hạ tầng, chi phí và phát hành riêng | Chưa áp dụng |

## 3. Nguyên tắc lập kế hoạch

1. Một kế hoạch chỉ mô tả mục tiêu, phạm vi, ràng buộc, mốc/cổng, đầu ra đo được và cách đánh giá.
2. Không tạo kế hoạch vi mô theo từng hiệu ứng, màn hình hoặc commit. Các phần việc đó phải là GitHub Issue thật trong `theGonlyK/QLNT`, gắn GitHub Project `#2`, có vai trò, phụ thuộc và DoD.
3. Trước khi đưa bất kỳ công việc nào vào kế hoạch hoặc tạo Issue triển khai, bắt buộc thực hiện quy trình tại `QUY_TRINH_KIEM_TRA_XUNG_DOT_TRUOC_KE_HOACH.md`.
4. Trạng thái thực hiện chỉ lấy từ GitHub Issue/Project, commit/PR và bằng chứng kiểm thử; không suy ra từ checkbox trong tài liệu.
5. Kế hoạch không thay đổi baseline, chi phí, kiến trúc hay kết nối bên thứ ba. Các thay đổi đó cần quyết định/chấp thuận riêng của chủ dự án.

## 4. Chỉ số điều hành

- 100% công việc đã được chốt có Issue thật, liên kết Project #2, vai trò, phụ thuộc, ưu tiên và DoD.
- 100% công việc được bắt đầu có trạng thái `In Progress` và có nhật ký/bằng chứng liên quan.
- 0 công việc được đưa vào kế hoạch khi chưa có kết quả kiểm tra xung đột hoặc khi xung đột chưa được chủ dự án quyết định.
- Mỗi Sprint chỉ được nghiệm thu khi mục tiêu Sprint và từng DoD được đối chiếu bằng bằng chứng, không chỉ bằng số commit/suite.

## 5. Tài liệu điều hành

Danh mục, trạng thái và nơi quản lý từng loại hồ sơ: `DANH_MUC_TAI_LIEU_QUAN_LY.md`.

