# Dự toán chi phí dự án QLNT

- **Trạng thái:** Dự thảo tổng hợp để Chủ dự án xem xét; chưa phải ngân sách được duyệt hoặc cam kết chi.
- **Ngày cập nhật:** 2026-11-14
- **Vai trò lập:** PM vận hành
- **Phạm vi:** Hạ tầng Dev/STG/MVP/Pilot/Scale và phí tài khoản/phát hành ứng dụng đã có trong hồ sơ.
- **Nguồn task:** GitHub Issue [#52](https://github.com/theGonlyK/QLNT/issues/52), Project #2.

## 1. Tóm tắt điều hành

Hồ sơ hiện có hai nhóm chi phí đã định lượng được: (1) hạ tầng theo ba giai đoạn do Tech/Dev đưa ra và (2) phí tài khoản Apple/Google từ kế hoạch Marketing. Nếu chọn phát hành cả iOS và Android, mức phí tài khoản nền tảng năm đầu khoảng **3.206.640 VND** theo tỷ giá bán Vietcombank 25.860 VND/USD cập nhật 11:33 ngày 13/11/2026. Phí này chưa gồm thuế hoặc phí thanh toán.

Theo quyết định QLNT-D014, giai đoạn mặc định ưu tiên Free Tier với mục tiêu hạ tầng **0 VND/tháng**. Nếu lên Giai đoạn 2, hồ sơ Dev ước tính **350.000–600.000 VND/tháng**; Giai đoạn 3 **1.500.000–2.500.000 VND/tháng**. Đây là ước tính kỹ thuật nội bộ, chưa phải báo giá nhà cung cấp. Supabase Free có quota và có thể tạm dừng project sau một tuần ít hoạt động; vì vậy mục tiêu 0 đồng chỉ đạt khi cấu hình và mức sử dụng nằm trong giới hạn dịch vụ.

**Chưa thể tính tổng ngân sách đầy đủ**, vì chưa có effort/đơn giá nhân công Dev, báo giá tên miền/email, QA và vận hành, pháp lý/thuế, truyền thông, payout/commission hoặc thời lượng mỗi giai đoạn. Các tổng dưới đây chỉ cộng khoản đã có con số và giả định giữ nguyên một mức hạ tầng đủ 12 tháng.

## 2. Nguồn và nguyên tắc tính

| Nguồn | Dữ liệu đưa vào dự toán |
|---|---|
| `04-van-hanh/HA_TANG_VA_VAN_HANH_HE_THONG.md` | G1: 0đ/tháng; G2: 350.000–600.000đ/tháng; G3: 1.500.000–2.500.000đ/tháng; quy mô/cấu hình theo giai đoạn. |
| `04-van-hanh/lich-su/ho-so-thuc-thi-chi-tiet/HO_SO_DIEU_PHOI_SPRINT_1_VA_QUY_MO_HA_TANG.md` | Cùng dải chi phí; Dev nêu dựng VPS mất khoảng 2 giờ khi Docker Compose và schema đã chuẩn bị. Đây là effort có điều kiện, chưa có đơn giá nhân công. |
| `01-quan-ly/KE_HOACH_SPRINT_2_PROTOTYPE_P1.md` và `01-quan-ly/DECISIONS.md` (QLNT-D014) | Sprint 2/Prototype dùng Local-First + Cloudflare Pages Free, mục tiêu hạ tầng 0đ; không tự nâng cấp dịch vụ trả phí. |
| `01-quan-ly/KE_HOACH_DANG_KY_VA_PHAT_HANH_APP.md` | Apple Developer Program 99 USD/năm; Google Play Console 25 USD một lần; D‑U‑N‑S chuẩn miễn phí; các khoản launch khác chưa báo giá. |

Quy đổi USD dùng **25.860 VND/USD**, tỷ giá bán USD Vietcombank lúc 11:33 ngày 13/11/2026. Đây là tỷ giá tham khảo, không phải tỷ giá đảm bảo khi thanh toán. Giá địa phương, thuế, phí thẻ/ngân hàng có thể làm số tiền thực tế khác.

## 3. Bảng chi phí đã có căn cứ

| Hạng mục | Chu kỳ | Dự toán | Độ chắc chắn / điều kiện |
|---|---:|---:|---|
| Cloudflare Pages + Supabase Free + Cloudflare R2 Free + IndexedDB (G1) | Tháng | **0đ mục tiêu** | Theo QLNT-D014; phụ thuộc quota, cấu hình, hoạt động và phạm vi dữ liệu. Không gồm domain/email hiện hữu hay chi phí lao động. |
| Hạ tầng Giai đoạn 2: VPS VN 4 vCPU/8GB/100GB, R2/CDN và backup | Tháng | **350.000–600.000đ** | Ước tính Dev nội bộ; cần báo giá nhà cung cấp, xác minh VAT, backup, lưu trữ vượt quota và domain. |
| Hạ tầng Giai đoạn 3: cụm App + DB HA, R2/CDN | Tháng | **1.500.000–2.500.000đ** | Ước tính Dev nội bộ; chưa có báo giá, SLA hay thiết kế HA cuối cùng. |
| Google Play Console (phân phối đầy đủ) | Một lần | **25 USD ≈ 646.500đ** | Tỷ giá tham khảo nêu trên; chưa gồm thuế/phí thanh toán. |
| Apple Developer Program | Hằng năm | **99 USD ≈ 2.560.140đ/năm** | Có thể thu bằng nội tệ; chưa gồm thuế/phí thanh toán. |
| Apple + Google, năm đầu | Một lần + hằng năm | **124 USD ≈ 3.206.640đ** | Chỉ khi chọn cả hai store; Google một lần + Apple năm đầu. |
| Apple + Google, năm tiếp theo | Hằng năm | **99 USD ≈ 2.560.140đ/năm** | Chỉ phí Apple đã biết; Google không thu lại phí đăng ký theo thông tin hiện tại. |
| D‑U‑N‑S chuẩn | Một lần | **0đ** | Miễn phí theo Apple/D&B; dịch vụ xử lý nhanh chưa có giá và không được mặc định chọn. |
| Dựng VPS theo Docker/schema đã chuẩn bị | Effort kỹ thuật | **Khoảng 2 giờ** | Ước tính Tech có điều kiện; chưa rõ đã nằm trong effort Dev hay tính phí riêng, chưa quy đổi thành tiền. |

## 4. Kịch bản tổng hợp theo 12 tháng

> Giả định một mức hạ tầng được dùng đủ 12 tháng và chọn cả Apple lẫn Google. Các giai đoạn là các mức thay thế theo quy mô, không cộng lẫn nhau. Không gồm lao động, domain/email, thuế/phí thanh toán, giao dịch, quảng bá hoặc khoản chưa có giá.

| Kịch bản | Hạ tầng trong 12 tháng | Phí store năm đầu | Tổng khoản đã định lượng năm đầu | Năm kế tiếp nếu giữ nguyên tầng |
|---|---:|---:|---:|---:|
| **G1 — Dev/STG/MVP/Pilot nhỏ, trong Free Tier** | 0đ mục tiêu | 3.206.640đ | **3.206.640đ** | **2.560.140đ/năm** store; hạ tầng mục tiêu 0đ |
| **G2 — Pilot mở rộng** | 4.200.000–7.200.000đ | 3.206.640đ | **7.406.640–10.406.640đ** | **6.760.140–9.760.140đ/năm** |
| **G3 — SaaS mở rộng** | 18.000.000–30.000.000đ | 3.206.640đ | **21.206.640–33.206.640đ** | **20.560.140–32.560.140đ/năm** |

### Phí store năm đầu theo kênh

| Kênh | Phí tài khoản năm đầu đã biết | Ghi chú |
|---|---:|---|
| Web/PWA | **0đ phí tài khoản store đã biết** | Không đồng nghĩa tổng chi phí web bằng 0; domain, email, vận hành và hỗ trợ chưa được báo giá. |
| Android / Google Play | **646.500đ** | Phí đăng ký một lần; chưa gồm hạ tầng. |
| iOS / Apple App Store | **2.560.140đ** | Phí thành viên một năm; gia hạn theo năm. |
| Android + iOS | **3.206.640đ** | Cộng hai khoản trên; chưa gồm hạ tầng/thuế. |

Nếu chỉ chọn một cửa hàng, thay 3.206.640đ bằng phí riêng của kênh đó; hiện chưa có quyết định chọn kênh hoặc loại tài khoản.

## 5. Chi phí Dev và các khoản chưa thể cộng

| Khoản | Trạng thái | Dữ liệu cần để dự toán |
|---|---|---|
| Công sức phát triển Prototype P1/sản phẩm | **Chưa có tổng effort/đơn giá** | Tech Lead cần phân rã task đã chốt, ước tính giờ/ngày công theo vai trò và giả định năng suất; chỉ quy thành tiền nếu có nhân sự/nhà cung cấp tính phí. Không nhân số task hoặc ngày sprint thành tiền khi chưa có dữ liệu. |
| Setup VPS | Có ước tính **~2 giờ** có điều kiện | Xác nhận effort đã nằm trong task Dev hay phí triển khai riêng; lấy đơn giá được duyệt nếu có. |
| Domain, DNS, email công việc/hỗ trợ, HTTPS | Chưa rõ đã có hay chưa | Kiểm tra tài sản/hợp đồng hiện hữu, nhà cung cấp, gói và chu kỳ gia hạn. |
| Vượt quota Free Tier/dịch vụ trả phí | Chưa định lượng | Dự báo DB, storage, egress, request, backup, email/SMS/Realtime; chọn gói. Supabase Pro niêm yết từ 25 USD/tháng, nhưng QLNT chưa chọn và khoản này không nằm trong baseline. |
| Apple/Google commission, payout, thuế, đổi ngoại tệ | Có điều kiện, chưa chốt | Chốt monetization/khu vực và xác định giao dịch, doanh thu, thuế/phí áp dụng. Không áp tỷ lệ giả định vào tổng. |
| QA thiết bị, tester, hỗ trợ người dùng | Chưa rõ nguồn lực/chi phí | Chốt loại tài khoản và nguồn tester. Yêu cầu 12 tester trong 14 ngày nếu thuộc tài khoản Google cá nhân mới là điều kiện kiểm thử, chưa đồng nghĩa phải trả phí. |
| Listing, hình/video, pháp lý/quyền riêng tư, marketing quảng cáo | Chưa có báo giá/phân công | Xác định đầu ra, người làm, công cụ/nhà cung cấp và mức trần. |
| License asset/thư viện | Chưa thấy chi phí license cho các lựa chọn tham khảo hiện tại | Kenney CC0 được ghi là nguồn ưu tiên miễn phí; vẫn cần xác minh quyền từng asset. Chi phí tạo/chỉnh sửa asset và thời gian Dev không mặc định bằng 0. |

## 6. Đầu vào cần Tech/Dev xác nhận

1. Dải G2 350.000–600.000đ/tháng và G3 1.500.000–2.500.000đ/tháng gồm nhà cung cấp/dịch vụ nào, thời điểm lấy giá, VAT, backup, dung lượng R2 và khoản vượt quota nào?
2. Ở G2, Supabase được thay thế hoàn toàn bằng VPS hay vẫn có phí dịch vụ riêng?
3. Các tài liệu khác nhau về sizing G3: có nơi nêu 2 VPS 4 vCPU/8GB + DB 4 vCPU/16GB, nơi khác nêu DB 8 vCPU/16GB. Tech cần chốt sizing và báo giá theo cấu hình cuối.
4. Xác nhận setup VPS khoảng 2 giờ có nằm trong effort Tech hay tính phí riêng; bổ sung effort/đơn giá cho task Dev nếu cần ngân sách tiền mặt.
5. Xác nhận G1/0đ có đáp ứng yêu cầu production, backup, uptime và dữ liệu nhạy cảm; Free Tier có hạn mức, không đồng nghĩa miễn phí production vô điều kiện.

### Vì sao G2 cao hơn G1 và có thể tiết giảm ra sao?

G2 không phải mức tăng theo tỷ lệ người dùng áp lên G1. G1 là **mục tiêu 0đ dựa trên Local-First và quota Free Tier**, không có máy chủ compute phải thuê liên tục. G2 đổi sang **01 VPS luôn chạy 4 vCPU / 8GB RAM / 100GB NVMe**, trên đó dự kiến chạy API, PostgreSQL và Redis; thêm sao lưu định kỳ, Cloudflare R2/CDN và khả năng dùng 50–100GB ảnh/tài sản. Chi phí chính vì thế chuyển từ mức dùng miễn phí/giới hạn sang phí máy chủ cố định hằng tháng, cộng storage/backup và phần vận hành. G2 tương đương khoảng **13,53–23,20 USD/tháng** theo tỷ giá của bảng.

Gọi đây là “tăng cấp số nhân” không chính xác về toán học: lấy tỷ lệ so với 0đ không xác định được. Cách diễn đạt đúng là **G1 → G2 tạo một khoản chi định kỳ mới 350.000–600.000đ/tháng**. Hồ sơ chưa bóc tách từng dòng báo giá, nên chưa chứng minh được mức nào trong dải G2 là tối thiểu hoặc bắt buộc.

| Đề xuất để Tech đánh giá | Tác động chi phí tiềm năng | Điều kiện / đánh đổi |
|---|---|---|
| Giữ G1 lâu nhất có thể; chỉ chuyển khi số đo thật cho thấy đã tối ưu mà vẫn vượt quota/đáp ứng kém yêu cầu | Tránh trả VPS sớm; có thể giữ hạ tầng ở 0đ mục tiêu | Không kích hoạt chỉ vì đạt mốc số lượng khách hàng. Theo QLNT-D014 phải đánh giá lại kiến trúc lẫn phạm vi. Hiện QLNT-D016 yêu cầu Chủ dự án xác nhận trước khi kết nối dịch vụ bên thứ ba; không tự tạo/kết nối Cloudflare, Supabase hoặc R2. |
| Đo tải và xin báo giá VPS nhỏ hơn trước khi chốt sizing 4 vCPU/8GB | Có thể giảm phí máy chủ cố định | Tech cần kiểm thử tải, RAM/CPU, DB, giờ cao điểm và dự phòng; cấu hình nhỏ hơn có thể giảm hiệu năng/độ sẵn sàng. Chưa có báo giá đủ căn cứ để nêu số tiền. |
| Triển khai theo thành phần, hoãn Redis nếu đo đạc chưa cho thấy cần; giữ static assets trên CDN và R2 trong quota miễn phí | Có thể giảm tài nguyên và tránh mua dư | Chỉ là phương án kỹ thuật cần Tech xác nhận; bảo đảm backup, bảo mật dữ liệu và hiệu năng trước khi bỏ thành phần. R2 Free có giới hạn storage/operations; không đồng nghĩa mọi ảnh bill được lưu miễn phí vô hạn. |
| Giảm dữ liệu cần đồng bộ/lưu lâu: nén ảnh, giới hạn kích thước, retention theo nghiệp vụ đã được duyệt, nén asset 3D và cache | Giảm storage, backup và truyền tải; giúp kéo dài G1 | Không tự xóa chứng từ hoặc đổi chính sách lưu dữ liệu. BA/Chủ dự án phải xác nhận retention; QA kiểm tra chất lượng ảnh và luồng khôi phục. |
| So sánh VPS với managed Supabase Pro hoặc mô hình serverless nhỏ | Có thể giảm công vận hành hoặc phù hợp tải thấp, nhưng không chắc giảm tiền | Supabase Pro đang niêm yết từ 25 USD/tháng (~646.500đ theo tỷ giá bảng), cao hơn phần thấp của dải G2; không phải lựa chọn tiết kiệm mặc định. Cloudflare Workers Paid từ 5 USD/tháng chỉ áp dụng workload Workers, không thay thế nguyên vẹn Postgres/VPS. Tech cần so tổng chi phí, quota, backup, dữ liệu và effort trực vận hành. |

**PM đề xuất:** Chưa chuyển sang G2 chỉ dựa trên quy mô dự kiến 50–300 chủ trọ. Giữ G1 làm mục tiêu và yêu cầu Tech trình số đo/điều kiện vượt ngưỡng cùng bảng giá chi tiết theo nhà cung cấp trước khi đề nghị G2. Đây là đề xuất đánh giá, không thay đổi baseline hay cho phép kết nối/mua dịch vụ.

## 8. Kết luận PM

- Dùng **G1 / mục tiêu hạ tầng 0đ mỗi tháng** cho Sprint 2/Prototype theo QLNT-D014, có điều kiện theo Free Tier; không suy ra tổng chi phí dự án bằng 0.
- Nếu chọn cả hai store, có thể dự trù sơ bộ **3,21 triệu đồng** phí tài khoản năm đầu. Nếu G2/G3 chạy đủ 12 tháng, tổng các khoản đã định lượng khoảng **7,41–10,41 triệu** và **21,21–33,21 triệu đồng** tương ứng.
- **Chưa đặt baseline tổng ngân sách** đến khi Tech xác nhận sizing/báo giá G2/G3; có effort/đơn giá Dev nếu tính lao động; Chủ dự án chốt kênh, pháp nhân/tài khoản, monetization, thời lượng từng giai đoạn và hạn mức ngân sách.
- Tài liệu không ủy quyền tạo tài khoản, mua dịch vụ, bật gói trả phí, tăng hạ tầng hoặc phát hành ứng dụng.

## 9. Nguồn tham khảo

- [Apple Developer Program enrollment and annual fee](https://developer.apple.com/help/account/membership/program-enrollment/) — 99 USD/năm; giá nội tệ có thể áp dụng; truy cập 2026-11-13.
- [Google Play Console registration fee](https://support.google.com/googleplay/android-developer/answer/6112435) — 25 USD một lần; truy cập 2026-11-13.
- [Vietcombank exchange rates](https://www.vietcombank.com.vn/en/KHCN/Cong-cu-Tien-ich/Ty-gia) — USD bán 25.860 VND, cập nhật 11:33 ngày 2026-11-13.
- [Supabase pricing](https://supabase.com/pricing) và [billing limits](https://supabase.com/docs/guides/platform/billing-on-supabase) — Free $0 với quota và hạn chế; project Free có thể pause sau một tuần ít hoạt động; Pro từ 25 USD/tháng, kiểm tra lại ngày 2026-11-14.
- [Cloudflare R2 pricing](https://developers.cloudflare.com/r2/pricing/) — Free Tier gồm 10 GB-month, 1 triệu Class A và 10 triệu Class B operations; egress miễn phí; vượt quota có thể tính phí.
- [Cloudflare Workers/Pages Functions pricing](https://developers.cloudflare.com/workers/platform/pricing/) — Pages Functions tính theo Workers; Free có quota; static assets miễn phí; kiểm tra lại ngày 2026-11-14.
- [Supabase Free project pausing](https://supabase.com/docs/guides/platform/free-project-pausing) — dự án Free có thể bị pause khi hoạt động DB thấp trong chu kỳ 7 ngày; truy cập 2026-11-14.

## 10. Trạng thái phê duyệt

**Đang chờ:** Tech xác nhận các mục 1–5 tại Mục 6; Chủ dự án chốt ngân sách sau khi đủ đầu vào. Chưa có khoản nào trong tài liệu được duyệt chi.
