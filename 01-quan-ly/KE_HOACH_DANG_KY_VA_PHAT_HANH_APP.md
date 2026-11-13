# Kế hoạch đăng ký và phát hành QLNT trên các nền tảng

- **Trạng thái:** Dự thảo chuẩn bị phát hành — chưa phải quyết định triển khai
- **Ngày rà soát nguồn:** 2026-11-13
- **Vai trò lập:** Marketing
- **Căn cứ kỹ thuật:** QLNT-D007 — Web responsive và ứng dụng mobile đóng gói bằng Capacitor từ một codebase
- **Phạm vi:** Apple App Store (iOS), Google Play (Android), Web/PWA

## 1. Mục tiêu và giới hạn

Tài liệu lập lộ trình chuẩn bị tài khoản, hồ sơ, sản phẩm, kiểm thử, đăng ký phát hành và ước tính phí nền tảng. Đây là kế hoạch để chủ dự án xem xét; chưa chốt ngày phát hành, pháp nhân đứng tên, loại tài khoản, khu vực phát hành, mô hình thu tiền hoặc mức độ sẵn sàng của sản phẩm.

Theo QLNT-D007, web responsive và ứng dụng mobile dùng chung codebase, ứng dụng mobile được đóng gói bằng Capacitor. Bản web/PWA có thể là kênh phát hành độc lập. Việc có chung codebase không đồng nghĩa một bản build tự động đáp ứng yêu cầu UX, quyền riêng tư, thanh toán và kiểm duyệt của từng cửa hàng.

## 2. Tóm tắt phương án

| Kênh | Tài khoản/chi phí nền tảng đã biết | Điều kiện chính | Điểm cần đánh giá |
|---|---|---|---|
| Web responsive/PWA | Không có phí tài khoản cửa hàng đã xác định | Tên miền, HTTPS, hosting, hỗ trợ trình duyệt/thiết bị và chính sách quyền riêng tư | Phí tên miền, hosting, vận hành và hỗ trợ chưa xác định. Chưa biết PWA có thay thế được nhu cầu phân phối qua cửa hàng hay không. |
| Apple App Store | Apple Developer Program: 99 USD mỗi năm; giá địa phương có thể áp dụng | Cá nhân/sole proprietor có thể đăng ký cá nhân; tổ chức cần pháp nhân hợp lệ, D‑U‑N‑S (trừ cơ quan chính phủ), người đăng ký có thẩm quyền ràng buộc pháp nhân, email công việc theo domain và website công khai hoạt động | Apple yêu cầu ứng dụng có giá trị vượt website được đóng gói lại. Cần đánh giá trải nghiệm Capacitor và giá trị native trước khi quyết định phát hành. |
| Google Play | Play Console full distribution: 25 USD một lần | Cá nhân hoặc tổ chức; tổ chức cần D‑U‑N‑S, hồ sơ thanh toán khớp dữ liệu pháp nhân, website, thông tin liên hệ và xác minh | Tài khoản cá nhân mới tạo sau 2023-11-13 phải hoàn thành closed test với tối thiểu 12 tester opt-in liên tục 14 ngày trước khi xin quyền production. |

Không chọn thay chủ dự án giữa tài khoản cá nhân và tổ chức. Trước khi mở tài khoản, cần biết đơn vị nào sở hữu ứng dụng, chịu trách nhiệm dữ liệu, ký thỏa thuận nền tảng, nhận khoản thanh toán (nếu có), và tên/địa chỉ/liên hệ nào sẽ hiển thị công khai.

## 3. Yêu cầu theo loại tài khoản

### Apple App Store

**Cá nhân/sole proprietor:** Seller name hiển thị trên App Store là tên pháp lý cá nhân. Apple yêu cầu Apple Account bật xác thực hai yếu tố và người đăng ký đủ tuổi thành niên theo khu vực. Cá nhân không cần D‑U‑N‑S.

**Tổ chức:** Tên pháp nhân hợp lệ được hiển thị làm Seller. Apple yêu cầu D‑U‑N‑S gắn với pháp nhân (trừ tổ chức chính phủ), người đăng ký có thẩm quyền ký kết thay tổ chức, email công việc thuộc domain của tổ chức và website công khai, hoạt động, gắn với tổ chức. Apple không nhận tên thương mại/DBA, tên giả định hoặc chi nhánh như một pháp nhân độc lập. Có thể cần cung cấp hồ sơ doanh nghiệp; Apple có thể yêu cầu chứng thực tài liệu tùy khu vực.

**D‑U‑N‑S và thời gian:** D‑U‑N‑S miễn phí khi yêu cầu trực tiếp từ D&B; cần tra cứu trước vì pháp nhân có thể đã có số. Apple hướng dẫn cho phép tối đa 5 ngày làm việc để nhận số và thêm tối đa 2 ngày làm việc để dữ liệu được chuyển sang Apple. Google nêu quy trình có thể mất đến 30 ngày; trang D&B nêu quy trình thông thường ở một số khu vực có thể mất đến 30 ngày làm việc. Đây là các ước lượng khác nhau theo nền tảng/khu vực, không phải cam kết thời hạn. Cần xác minh thời gian áp dụng tại Việt Nam trước khi lập lịch; không mua dịch vụ xử lý nhanh nếu chưa được duyệt.

### Google Play

**Cá nhân:** Xác minh danh tính bằng giấy tờ tùy thân chính thức. Chủ tài khoản cá nhân còn phải xác minh thiết bị Android; với tài khoản tạo sau 2023-11-13, phải có tối thiểu 12 tester opt-in liên tục ít nhất 14 ngày trong closed test rồi mới nộp yêu cầu quyền production. Yêu cầu này chỉ áp dụng cho nhóm tài khoản cá nhân mới nêu trên.

**Tổ chức:** Cần D‑U‑N‑S (trừ trường hợp ngoại lệ giới hạn như cơ quan chính phủ được xác nhận), giấy tờ định danh chính thức của người đại diện và giấy tờ tổ chức. Tên pháp lý/địa chỉ trong Google Payments profile phải khớp hồ sơ D&B. Cần website tổ chức được xác minh, số điện thoại tổ chức và số điện thoại/email liên hệ được xác minh. Tên pháp lý, địa chỉ pháp lý, email và số điện thoại nhà phát triển của tổ chức có thể được hiển thị công khai trên Google Play theo yêu cầu Google/khu vực. Cần dùng thông tin liên hệ có thể tiếp tục duy trì lâu dài.

Tài khoản tổ chức tránh được yêu cầu 12 tester áp dụng cho tài khoản cá nhân mới, nhưng không loại bỏ yêu cầu kiểm thử chất lượng, xác minh danh tính, policy review hay các yêu cầu khác của Google. Không lập tài khoản cá nhân chỉ để né hồ sơ tổ chức nếu chủ sở hữu thực tế là một tổ chức.

## 4. Hồ sơ và đầu vào cần chuẩn bị

### Chủ dự án/đơn vị sở hữu

- Chốt pháp nhân hoặc cá nhân đứng tên; người có thẩm quyền quản lý tài khoản và ký thỏa thuận.
- Tên pháp lý, địa chỉ đăng ký, giấy tờ tổ chức/đại diện và thông tin định danh tương ứng. Không đưa giấy tờ nhạy cảm vào Git hoặc tài liệu công khai.
- Kiểm tra D‑U‑N‑S hiện có; nếu cần cấp mới, đối chiếu tên pháp lý, địa chỉ trụ sở và thông tin liên hệ với hồ sơ đăng ký doanh nghiệp.
- Quyết định email, số điện thoại, website và địa chỉ hỗ trợ nào có thể hiển thị công khai; thiết lập chủ thể chịu trách nhiệm duy trì và xử lý yêu cầu người dùng.
- Xác nhận quốc gia/khu vực phát hành và đầu mối tiếp nhận khiếu nại/quyền riêng tư.

### Sản phẩm và kỹ thuật

- Hoàn thiện domain chính thức, HTTPS, trang giới thiệu/hỗ trợ, trang quyền riêng tư và trang yêu cầu xóa tài khoản.
- Kiểm kê dữ liệu app, web, backend và mọi SDK/đối tác: loại dữ liệu, mục đích, nơi nhận/chia sẻ, thời hạn lưu, quyền truy cập, bảo vệ và quy trình xóa. Đối chiếu đặc biệt dữ liệu khách thuê, thông tin liên hệ, ảnh hóa đơn và giấy tờ định danh được nhắc trong tài liệu hạ tầng; phạm vi dữ liệu thực tế cần Tech/BA xác minh.
- Xây luồng yêu cầu xóa tài khoản trong ứng dụng; với Google còn phải cung cấp trang web bên ngoài để bắt đầu yêu cầu xóa. Nêu rõ dữ liệu nào phải lưu theo căn cứ hợp pháp và thời gian xử lý.
- Đánh giá quyền hệ điều hành Capacitor dùng (camera, ảnh, thông báo, vị trí, v.v.) theo tính năng thật; chỉ xin quyền cần thiết, có giải thích và luồng đồng ý phù hợp.
- Với iOS, kiểm tra trải nghiệm mobile, hoạt động ngoại tuyến nếu được quảng bá, tích hợp native có giá trị và trải nghiệm khác một webview đơn thuần. Apple yêu cầu app có tính năng, nội dung và UI vượt website được đóng gói lại; khả năng được duyệt vẫn do Apple đánh giá.
- Hoàn tất môi trường backend dùng được cho reviewer/tester, tài khoản demo an toàn với dữ liệu giả, và tài liệu hướng dẫn thao tác.

### Store listing / nội dung công khai

- Tên app, mô tả, danh mục, khu vực/ngôn ngữ, biểu tượng, ảnh chụp màn hình và nội dung quảng bá trung thực với build sẽ nộp.
- URL quyền riêng tư; URL hỗ trợ; chính sách xóa dữ liệu/tài khoản; email và điện thoại hỗ trợ.
- Apple App Privacy Details: khai báo các loại dữ liệu app/SDK thu thập, sử dụng và liên kết với người dùng theo thực tế.
- Google Play Data safety: khai báo thu thập, chia sẻ và sử dụng dữ liệu, bao gồm SDK; nội dung phải nhất quán với privacy policy và cập nhật khi cách xử lý dữ liệu thay đổi.
- Khai báo phân loại nội dung/đối tượng, quảng cáo, quyền nhạy cảm, đăng nhập, thanh toán và các biểu mẫu store khác theo đúng build. Những nội dung này chưa được đánh giá đủ từ tài liệu Marketing hiện có.
- Chuẩn bị ghi chú review, thông tin demo account, backend hoạt động và tài liệu quyền sử dụng cho mọi hình ảnh/thương hiệu/asset trong listing.

## 5. Quyền riêng tư, an toàn dữ liệu và thu tiền

1. Cần một chính sách quyền riêng tư hoạt động trên URL công khai và truy cập được trong app. Chính sách phải phản ánh dữ liệu, mục đích, chia sẻ, bảo mật, lưu giữ và xóa; nội dung này cần BA/Tech/đầu mối pháp lý xác nhận theo cách hệ thống triển khai thực tế.
2. Apple yêu cầu cung cấp privacy disclosures trong App Store Connect và có liên kết chính sách quyền riêng tư; Google yêu cầu Data safety form và chính sách quyền riêng tư trên Play Console lẫn trong app.
3. Nếu app cho tạo tài khoản, Apple yêu cầu bắt đầu xóa tài khoản ngay trong app. Google yêu cầu cách khởi tạo yêu cầu xóa trong app và qua một trang web bên ngoài; phải xóa dữ liệu gắn với tài khoản, trừ dữ liệu được phép lưu và đã giải thích rõ.
4. QLNT dự kiến xử lý dữ liệu cá nhân và ảnh hóa đơn/giấy tờ nhạy cảm theo tài liệu dự án. Cần rà soát kỹ quyền truy cập, lưu trữ, thời gian lưu, xóa, mã hóa, log, xử lý sự cố và thông tin công khai trước khi hoàn thành khai báo store. Tài liệu này không kết luận về tuân thủ pháp luật.
5. Chưa có quyết định về giao dịch số, đăng ký trả phí, vật phẩm ảo, điểm/voucher hoặc dịch vụ trả phí nào được bán trong app, trên web hay ngoài app. Nếu bật thu tiền, cần rà soát riêng quy định billing/commission theo loại sản phẩm, khu vực, chương trình và phương thức giao dịch trước khi thiết kế flow. Không dùng một tỷ lệ commission làm ngân sách mặc định.

## 6. Lộ trình và phụ thuộc đề xuất

Không gán ngày bắt đầu/kết thúc hoặc cam kết thời lượng tổng thể. Tiến độ chỉ có thể lập sau khi chủ dự án chốt account owner, pháp nhân, phạm vi phát hành và thời điểm build đủ điều kiện. D‑U‑N‑S có thể là đường găng nếu đi theo tài khoản tổ chức.

| Giai đoạn | Việc cần làm | Phụ thuộc / đầu ra kiểm tra được |
|---|---|---|
| A. Quyết định đầu vào | Chốt chủ tài khoản, cá nhân/tổ chức, legal seller, khu vực, kênh và monetization cần khảo sát | Quyết định của chủ dự án; danh sách người chịu trách nhiệm; không phát sinh tài khoản/chi phí trước khi duyệt |
| B. Hồ sơ định danh | Tra cứu D‑U‑N‑S; nếu thiếu thì chuẩn bị hồ sơ pháp nhân, yêu cầu cấp mới; chuẩn hóa email, website, địa chỉ và liên hệ | Dữ liệu pháp lý thống nhất; D‑U‑N‑S đã xác minh nếu loại tài khoản yêu cầu. Thời gian Google/D&B có thể kéo dài đến 30 ngày hoặc 30 ngày làm việc tùy nguồn/khu vực |
| C. Product/privacy readiness | Hoàn thiện domain, hỗ trợ, privacy policy, disclosure, xóa tài khoản, kiểm kê SDK/data map, demo account, iOS/Android QA | BA/Tech xác nhận dữ liệu thực tế; privacy/deletion flows chạy được; app đủ tính năng, ổn định và có nội dung review |
| D. Tạo tài khoản và listing | Người có thẩm quyền đăng ký tài khoản đã chọn; xác minh pháp lý/liên hệ; tạo listing và điền các biểu mẫu quyền riêng tư/an toàn dữ liệu | Hồ sơ B; chủ tài khoản được xác nhận; phí được chủ dự án duyệt riêng; listing khớp build |
| E. Kiểm thử trước phát hành | Web/PWA kiểm thử trình duyệt/thiết bị; TestFlight hoặc track thử Android; kiểm tra cài đặt, đăng nhập, permission, dữ liệu giả, xóa tài khoản, lỗi và hiệu năng | Build candidate; checklist QA; với Play personal account mới, closed test 12 tester liên tục 14 ngày trước khi xin production access |
| F. Nộp duyệt và phát hành | Nộp binary/listing, cung cấp reviewer access/ghi chú; xử lý câu hỏi hoặc bị từ chối; chủ tài khoản quyết định phát hành | G3/đánh giá sẵn sàng phát hành của dự án; store forms hoàn chỉnh; phê duyệt cuối cùng của chủ dự án trước khi phát hành |
| G. Sau phát hành | Theo dõi crash, đánh giá, yêu cầu dữ liệu/xóa tài khoản, policy và phản hồi; duy trì tài khoản/domain/chính sách | Người trực vận hành và hỗ trợ được phân công; quy trình cập nhật listing/build; ngân sách duy trì được chốt |

Web/PWA có thể phát hành theo nhánh riêng khi domain, hosting, chất lượng, bảo mật và quyền riêng tư đã sẵn sàng; không cần chờ quy trình duyệt cửa hàng. Tuy nhiên, đây vẫn là phương án cần chủ dự án chốt cùng lộ trình các store.

## 7. Ước tính chi phí

### Phí nền tảng đã xác định

Quy đổi tham khảo dùng **tỷ giá bán USD của Vietcombank 25.870 VND/USD**, niêm yết lúc 23:00 ngày 12/11/2026 (nguồn chính thức gần nhất tra được trong ngày rà soát 13/11/2026). Đây là ước tính, không phải số tiền thanh toán cuối cùng; tỷ giá, thuế và cách thu tại Việt Nam có thể khác.

| Khoản | Loại | USD | VND ước tính | Ghi chú |
|---|---|---:|---:|---|
| Apple Developer Program | Hằng năm | 99 USD/năm | 2.561.130 VND/năm | Giá địa phương có thể áp dụng; chưa gồm thuế/phí thanh toán. |
| Google Play Console full distribution | Một lần | 25 USD | 646.750 VND | Phí đăng ký một lần; không tính lại hàng năm theo nguồn hiện hành. |
| Apple + Google, năm đầu | Sàn phí tài khoản năm đầu | 124 USD | 3.207.880 VND | Chỉ khi chủ dự án chọn phát hành trên cả hai cửa hàng và không có điều chỉnh giá/thuế. Đây là first-year floor cho phí tài khoản đã biết, không gồm phát triển/vận hành. |
| Apple + Google, năm gia hạn tiếp theo | Sàn phí gia hạn | 99 USD/năm | 2.561.130 VND/năm | Chỉ phí Apple định kỳ đã biết; không gồm chi phí vận hành và các khoản khác. |
| Web/PWA | Không có phí tài khoản cửa hàng | 0 USD phí tài khoản đã biết | 0 VND phí tài khoản đã biết | Không đồng nghĩa tổng chi phí bằng 0; domain, hosting, email, hỗ trợ và vận hành chưa được báo giá. |

**Cách tính:** 99 × 25.870 = 2.561.130 VND; 25 × 25.870 = 646.750 VND; (99 + 25) × 25.870 = 3.207.880 VND.

### Miễn phí, có điều kiện và chưa xác định

| Hạng mục | Phân loại | Dự toán / việc cần xác minh |
|---|---|---|
| D‑U‑N‑S | Miễn phí theo quy trình yêu cầu chuẩn | D&B nói không thu phí cấp/duy trì; không hết hạn. Dịch vụ xử lý nhanh có thể mất phí, mức giá tùy khu vực và chưa xác định; không nằm trong floor và chưa được duyệt. |
| Commission Apple / Google | Có điều kiện theo giao dịch/chương trình/khu vực | Phát sinh nếu bán hàng hóa/dịch vụ số hoặc giao dịch thuộc quy định nền tảng. Chưa biết loại giao dịch/monetization QLNT chọn nên không đưa vào tổng cố định. Cần đối chiếu policy chính thức trước khi thiết kế thanh toán. |
| Phí nhận tiền, thuế, chuyển đổi ngoại tệ, phí thẻ | Có điều kiện | Phụ thuộc cấu hình payout, ngân hàng, quốc gia, loại giao dịch và thuế áp dụng; chưa xác định. |
| Domain, DNS, HTTPS, hosting, email hỗ trợ | Chưa xác định | Cần báo giá/kiểm tra hợp đồng hạ tầng; QLNT-D014 ưu tiên Free Tier nhưng không suy ra tên miền/email đã có hoặc không mất phí. |
| QA thiết bị, tester, hỗ trợ khách hàng, pháp lý/thuế, tài sản listing | Chưa xác định | Phụ thuộc phạm vi phát hành, nguồn lực và yêu cầu pháp lý; chưa có báo giá hoặc phân công. |
| Dịch vụ nghiên cứu/thị trường và quảng bá | Chưa xác định | Ngoài phí đăng ký tài khoản; chỉ lập ngân sách khi chủ dự án giao phạm vi và phê duyệt. |

**Kịch bản sàn phí tài khoản:** Web/PWA: 0 USD phí store account đã biết; Google Play: 25 USD lần đầu; Apple: 99 USD/năm; cả hai store: 124 USD năm đầu và 99 USD/năm gia hạn. Các mức này không phải tổng chi phí phát hành.

## 8. Rủi ro và biện pháp giảm thiểu

| Rủi ro | Tác động | Biện pháp chuẩn bị |
|---|---|---|
| Chưa chốt pháp nhân/chủ tài khoản | Seller name, giấy tờ, payout hoặc quyền kiểm soát không đúng đơn vị | Chốt trước khi đăng ký; dùng email/quyền truy cập được tổ chức quản lý nếu tài khoản tổ chức |
| Sai khác thông tin D‑U‑N‑S và hồ sơ pháp lý | Kéo dài xác minh hoặc không mở được tài khoản tổ chức | So khớp tên pháp lý và địa chỉ trên giấy tờ, D&B và Payments profile; tra cứu D‑U‑N‑S trước |
| Thời gian cấp D‑U‑N‑S khác nhau | Trễ lịch phát hành | Không hứa ngày; bắt đầu rà soát sớm sau quyết định tài khoản; xác nhận timeline địa phương với D&B/Google |
| Google Play cá nhân mới cần closed test | Không thể xin production trước đủ thời gian và số tester | Nếu thực tế chọn tài khoản cá nhân mới, chuẩn bị 12 tester opt-in đủ 14 ngày; vẫn phải qua đánh giá production access |
| iOS app bị xem là website đóng gói | Bị từ chối theo tiêu chí minimum functionality | Đánh giá UX mobile/native và lợi ích app; dẫn chiếu QLNT-D007, bổ sung giá trị hữu ích, kiểm thử trên thiết bị trước nộp |
| Khai báo privacy/Data safety lệch SDK/backend | Từ chối, yêu cầu sửa hoặc giảm niềm tin | Lập data inventory theo bản build/SDK thật; BA, Tech và người phụ trách quyền riêng tư rà soát nhất quán |
| Không có luồng xóa tài khoản/dữ liệu | Không đáp ứng chính sách cửa hàng | Xây luồng trong app và trang ngoài app cho Google; kiểm thử xác nhận xóa và ghi rõ dữ liệu phải lưu hợp pháp |
| Dữ liệu nhạy cảm của người thuê/ảnh chứng từ | Rủi ro riêng tư, bảo mật và pháp lý | Rà soát quyền truy cập, lưu trữ, thời hạn, xóa, log, disclosure, sự cố và vùng phát hành trước khi công bố |
| Chi phí vận hành/monetization bị bỏ sót | Ngân sách thực tế cao hơn phí đăng ký | Tách phí nền tảng khỏi domain/hosting, thuế, payout, commission, QA và hỗ trợ; chỉ lập tổng ngân sách sau khi biết mô hình thu tiền |

## 9. Quyết định cần chủ dự án chốt trước khi biến kế hoạch thành baseline

1. **Chủ thể phát hành:** Cá nhân, hộ/cơ sở kinh doanh hay pháp nhân nào sở hữu app và chịu trách nhiệm với người dùng? Tên pháp lý nào sẽ hiển thị công khai?
2. **Loại tài khoản:** Apple cá nhân hay tổ chức; Google cá nhân hay tổ chức? Ai là Account Holder/owner và ai được thêm quyền quản trị?
3. **Kênh và phạm vi phát hành:** Web/PWA, Android, iOS; phát hành thị trường/khu vực nào và theo thứ tự nào?
4. **Thời điểm:** Khi nào được phép bắt đầu xin D‑U‑N‑S, tạo tài khoản có phí và nộp app? Chưa đặt lịch cho tới khi có quyết định này và build sẵn sàng.
5. **Tên và thông tin công khai:** Domain, email, số điện thoại, địa chỉ hỗ trợ nào có thể hiển thị trên từng store? Ai duy trì các kênh này?
6. **Monetization:** App/web có bán dịch vụ số, subscription, vật phẩm ảo, điểm/voucher hoặc giao dịch nào khác không? Kênh thanh toán nào cần nghiên cứu policy riêng?
7. **Quyền riêng tư:** Ai xác nhận data inventory, privacy policy, retention/deletion, SDK và phạm vi xử lý dữ liệu nhạy cảm trước store submission?
8. **Ngân sách:** Có cho phép chi phí một lần/hằng năm đã nêu hay không; có mức trần/nguồn thanh toán hay không; có chấp thuận khoản dịch vụ D‑U‑N‑S xử lý nhanh nếu cần hay không?

Cho đến khi các câu hỏi phù hợp được chốt, các mức phí/tài khoản trong tài liệu chỉ dùng để chuẩn bị và ước lượng; không phải ủy quyền đăng ký hoặc chi tiêu.

## 10. Nguồn tham khảo chính thức

Các nguồn dưới đây được tra cứu ngày **2026-11-13**. Chính sách và phí có thể thay đổi; cần mở lại nguồn trước lúc đăng ký/nộp app.

### Apple

- [Apple Developer Program enrollment requirements and annual fee](https://developer.apple.com/help/account/membership/program-enrollment/)
- [Apple D‑U‑N‑S number requirements and Apple processing notes](https://developer.apple.com/help/account/membership/D-U-N-S/)
- [Apple App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/) — minimum functionality, completeness, privacy and review access.
- [Apple App Review information for common review issues](https://developer.apple.com/app-store/review/) — app review examples, including web wrapper/minimum functionality.
- [Apple offering account deletion in an app](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion)
- [Apple App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/)
- [Apple Small Business Program](https://developer.apple.com/app-store/small-business-program/) — eligibility and terms must be rechecked if QLNT chooses in-app digital sales.

### Google Play

- [Create a Play Console developer account and one-time registration fee](https://support.google.com/googleplay/android-developer/answer/6112435)
- [Required information for a Play Console developer account](https://support.google.com/googleplay/android-developer/answer/13628312)
- [Verify developer identity information](https://support.google.com/googleplay/android-developer/answer/10841920)
- [Testing requirements for new personal developer accounts](https://support.google.com/googleplay/android-developer/answer/14151465)
- [Google Play User Data, Data safety, privacy policy, and account deletion requirements](https://support.google.com/googleplay/android-developer/answer/10144311)

### D&B và tỷ giá tham khảo

- [Dun & Bradstreet: request a D‑U‑N‑S number, standard cost and processing estimate](https://www.dnb.com/en-us/smb/duns/get-a-duns.html) — D&B states standard request is free; its general page cites up to 30 business days for many cases. Expedited service is optional and fee-bearing.
- [Vietcombank exchange rates](https://www.vietcombank.com.vn/en/To-Chuc/Trang-chu-DCTC/KHTC---Ti-gia---DCTC) — USD sell rate 25,870 VND, shown as updated 23:00 on 12/11/2026, used as the nearest official rate located on 13/11/2026.

### Tài liệu dự án

- `4.Du_an/QLNT/01-quan-ly/PROJECT_BRIEF.md`
- `4.Du_an/QLNT/01-quan-ly/DECISIONS.md` — QLNT-D007 (client architecture); QLNT-D014 (infrastructure cost preference, not a determination that domain/email/store launch is free).
- `4.Du_an/QLNT/03-ky-thuat/TECH_PROFILE.md`
- `4.Du_an/QLNT/04-van-hanh/QUALITY_AND_RELEASE.md`
- `4.Du_an/QLNT/04-van-hanh/HA_TANG_VA_VAN_HANH_HE_THONG.md`

## 11. Trạng thái chuẩn bị

Chưa tạo hoặc thay đổi tài khoản Apple/Google; chưa yêu cầu D‑U‑N‑S; chưa mua dịch vụ; chưa nộp app, bật monetization hay phát sinh chi phí. Chưa xác nhận pháp nhân, loại tài khoản, domain/hỗ trợ công khai, data inventory cuối cùng, build readiness, timeline hoặc mô hình thu tiền. Các nội dung này cần được chốt trước khi PM lập task triển khai phát hành.
