# Quy trình kiểm tra xung đột trước khi đưa công việc vào kế hoạch

- **Trạng thái:** Bắt buộc từ 2026-11-18 theo `QLNT-D017` và `RULES_CORE.md` Mục 11.
- **Áp dụng:** Mọi đề xuất công việc/scope mới, mọi thay đổi mục tiêu Sprint và mọi Issue triển khai của QLNT.

## 1. Nguyên tắc

Kiểm tra xung đột diễn ra **trước** khi một công việc được đưa vào kế hoạch hoặc tạo Issue để thực hiện. Đây không phải bước phê duyệt thay chủ dự án; mục tiêu là phát hiện phần đã làm, phần trùng lặp, phần mâu thuẫn và phần chưa đủ căn cứ.

## 2. Phiếu kiểm tra tối thiểu

PM hoặc Lead đề xuất lập một mục `CHK-YYYYMMDD-xx` trong Issue hoặc comment Issue, ghi rõ:

| Nội dung phải kiểm tra | Nguồn tối thiểu | Kết quả cần ghi |
| --- | --- | --- |
| Quyết định/baseline | `DECISIONS.md`, brief, hồ sơ BA/Tech/QA được chốt | Phù hợp / mâu thuẫn / cần xác nhận |
| Phạm vi giai đoạn | Mục tiêu giai đoạn, Sprint và ràng buộc D014–D016 | Trong phạm vi / ngoài phạm vi |
| Công việc đã thực hiện | GitHub Issues/Project, commit/PR, `git status`, bằng chứng QA | Trùng lặp / một phần đã làm / chưa làm |
| Phụ thuộc và ưu tiên | Issue đang mở, phụ thuộc kỹ thuật/nghiệp vụ, Rule 10 | Không chặn / có nút cổ chai / cần sắp lại |
| Kiến trúc, chi phí, dữ liệu/bảo mật | Hồ sơ Tech/ops, ngân sách và rule hiện hành | Không ảnh hưởng / cần Tech/PM/chủ dự án duyệt |
| Tài liệu nguồn | Vị trí tài liệu, trạng thái phê duyệt, tác giả | Đủ căn cứ / thiếu căn cứ |

## 3. Quyết định sau kiểm tra

| Kết quả | Hành động |
| --- | --- |
| Không xung đột, đủ căn cứ | PM/Lead được đưa vào kế hoạch cấp phù hợp và tạo Issue có DoD. |
| Có phần đã thực hiện | Không tạo công việc trùng. Liên kết Issue/commit hiện có, chỉ tạo phần còn thiếu sau khi rà soát DoD. |
| Có xung đột hoặc ảnh hưởng baseline, chi phí, kiến trúc, dữ liệu/bên thứ ba | Dừng phần bị ảnh hưởng, PM tổng hợp căn cứ và trình chủ dự án quyết định. |
| Thiếu căn cứ hoặc trạng thái không rõ | Ghi `Chờ xác nhận`; không đưa vào Sprint/không bắt đầu thực hiện. |

## 4. Trách nhiệm

- **Lead đề xuất:** cung cấp mục tiêu, căn cứ chuyên môn, phạm vi và DoD kiểm chứng được.
- **PM:** kiểm tra liên mảng, Issue/Project, lịch sử thực hiện; ghi kết quả `CHK`; không tự giải quyết xung đột vượt thẩm quyền.
- **BA/Tech/QA/Knowledge Governance:** xác nhận phần xung đột thuộc chuyên môn khi PM yêu cầu.
- **Chủ dự án:** quyết định khi xung đột tác động baseline, phạm vi, chi phí, kiến trúc hoặc thiếu thẩm quyền.

