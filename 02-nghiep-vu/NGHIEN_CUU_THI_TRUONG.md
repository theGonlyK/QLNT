# Nghiên cứu thị trường P1 — QLNT

**Trạng thái:** Dự thảo desk research, chưa phải kết quả khảo sát người dùng

**Cập nhật:** 2026-11-11

**Phạm vi:** Nghiệp vụ quản lý nhà trọ P1 tại Hà Nội; phục vụ PM, BA, UX và Tech Lead.

## 1. Mục tiêu và giới hạn

Tổng hợp tín hiệu công khai để định hướng các câu hỏi cần kiểm chứng cho P1: quản lý phòng/khách, hợp đồng, hóa đơn và thu tiền thủ công, thiết bị và sự cố, cùng cách trình bày nghiệp vụ bằng thế giới game. Tài liệu cung cấp bằng chứng và giả thuyết cho BA/UX; không chốt yêu cầu sản phẩm, giá hay mô hình kinh doanh.

Đây là nghiên cứu bàn giấy từ trang sản phẩm và cổng tin đăng. Chưa phỏng vấn chủ trọ/người thuê, chưa phát khảo sát và chưa đo mức sẵn lòng sử dụng hay trả tiền. Số lượng tin đăng là dữ liệu của từng nền tảng, không đại diện tổng quy mô thị trường. Chưa thiết lập cỡ mẫu, mốc thời gian, nguồn lực hoặc chỉ tiêu thành công cho pilot; các nội dung này đang để chủ dự án quyết định.

P1 trong tài liệu này bám theo yêu cầu dự án hiện tại: quản lý một tòa nhà trong cảnh 3D isometric cố định, quản lý khách/phòng và thiết bị, báo hỏng, quy trình thu tiền thủ công, nhiệm vụ/điểm thưởng và yếu tố giải trí. Tìm trọ/bản đồ công khai và Sale thuộc P2; thanh toán tự động và tích hợp thiết bị thuộc giai đoạn sau. Không dùng nghiên cứu này để mở rộng phạm vi.

## 2. Câu hỏi nghiên cứu

1. Chủ trọ hiện quản lý phòng, người thuê, hợp đồng, tiền thuê/điện/nước, thu tiền và sửa chữa bằng công cụ nào; bước nào mất công hoặc hay sai?
2. Quy trình xác nhận thanh toán thủ công cần bằng chứng, trạng thái và lịch sử nào để cả chủ trọ lẫn người thuê hiểu đúng?
3. Người thuê cần theo dõi hóa đơn, gửi chứng từ, báo hỏng và biết tiến độ xử lý ra sao?
4. Chủ trọ quy mô nhỏ đánh đổi thế nào giữa miễn phí, thao tác thủ công, quảng cáo, giới hạn số phòng, đa thiết bị và tự động hóa?
5. Giao diện game 3D cố định có làm nghiệp vụ dễ hiểu hơn không, hay gây chậm/khó tìm thao tác so với một màn hình danh sách?
6. Cơ chế nhiệm vụ/điểm thưởng nào tạo động lực mà không gây áp lực, xấu hổ hoặc chấm điểm tiêu cực lên người thuê?

## 3. Bằng chứng công khai đã rà soát

| Nguồn / ngày hiển thị | Quan sát từ nguồn | Liên quan đến P1 | Giới hạn |
|---|---|---|---|
| [LOZIDO — tính năng](https://quanlytro.me/tinh-nang-phan-mem-quan-ly-nha-tro.html?is_mobile_view=1), truy cập 2026-11-11 | Nhà cung cấp liệt kê quản lý phòng/khách, hợp đồng, chỉ số điện nước, hóa đơn, cọc/công nợ; gói nâng cao có app người thuê, QR, nhắc nợ, báo sự cố, quản lý tài sản và phân quyền. | Nghiệp vụ cốt lõi đã được nhiều sản phẩm thương mại bao phủ; dùng làm danh sách đối chiếu luồng. | Nội dung do nhà cung cấp tự mô tả; không xác minh chất lượng hoặc tỷ lệ sử dụng thực tế. |
| [LOZIDO — giá và giới hạn gói](https://quanlytro.me/bang-gia.html), truy cập 2026-11-11 | Trang quảng bá gói miễn phí giới hạn một cơ sở/15 phòng, thao tác cơ bản và chỉ dùng điện thoại; gói trả phí có nhiều cơ sở, đa thiết bị, tự động hóa và xuất dữ liệu. | Có thể hỏi chủ trọ họ coi trọng giới hạn nào và liệu thao tác thủ công có đủ cho quy mô của họ. | Điều khoản/gói có thể thay đổi; trang cũng hiển thị thông tin thời gian dùng thử không hoàn toàn nhất quán giữa các phần. Không suy ra mức sẵn lòng chi trả. |
| [DayTro — App Store Việt Nam](https://apps.apple.com/vn/app/daytro-qu%E1%BA%A3n-l%C3%BD-nh%C3%A0-tr%E1%BB%8D/id6794803947), truy cập 2026-11-11 | Mô tả ứng dụng nêu hợp đồng, điện nước, hóa đơn, theo dõi thanh toán, QR, gửi chứng từ, báo hỏng, phân quyền; người thuê có thể xem hóa đơn và báo sự cố. Nhà phát triển công bố gói Free tối đa 3 phòng và Pro 99.000đ/tháng hoặc 999.000đ/năm. | Cung cấp ví dụ cụ thể để kiểm tra kỳ vọng về trạng thái thanh toán, chứng từ, sửa chữa và ranh giới giữa gói miễn phí/trả phí. | Tính năng/giá là thông tin do nhà phát triển khai báo trên cửa hàng; không phải khảo sát độc lập hoặc xác nhận giá giao dịch hiện tại. |
| [Zotro — App Store Việt Nam](https://apps.apple.com/vn/app/zotro/id6752543560), truy cập 2026-11-11 | Mô tả ứng dụng nêu quản lý phòng, người thuê, tiện ích, hóa đơn, công nợ, nhắc hạn và báo cáo. | Một đối chiếu bổ sung cho kỳ vọng cơ bản trên di động. | Nội dung do nhà phát triển khai báo; lượng đánh giá trên trang còn nhỏ, không đại diện thị trường. |
| [Nhà Tốt — tin thuê phòng Hà Nội](https://www.nhatot.com/thue-phong-tro-ha-noi/), trang hiển thị cập nhật 2026-10-21, truy cập 2026-11-11 | Trang hiển thị 3.706 tin; đưa ra dải giá theo diện tích và các ví dụ tin ở nhiều khu vực Hà Nội. | Gợi ý bối cảnh đa dạng về loại phòng, giá và khu vực; có thể dùng để chọn ví dụ trong phỏng vấn sau này. | Chỉ là tồn lượng tin của một nền tảng tại thời điểm trang cập nhật; có thể có tin lặp, tin không còn hiệu lực và sai số phân loại. Không xem đây là quy mô thị trường hay giá giao dịch. |
| [Batdongsan.com.vn — báo cáo T8/2024](https://research.batdongsan.com.vn/images/report/bds/4-Bao-cao-TT-BDS_T8_2024.pdf), truy cập 2026-11-11 | Báo cáo ghi chỉ số mức độ quan tâm tin nhà trọ cho thuê tại Hà Nội tăng 47% và lượng tin đăng giảm 14% trong T8/2024 so với T7/2024. | Cho thấy dữ liệu cổng tin có thể biến động theo tháng; mùa vụ/cú sốc ngắn hạn cần được kiểm soát khi diễn giải khảo sát. | Số liệu cũ, là chỉ số nền tảng chứ không phải số hộ/người thuê; không dùng làm dự báo cho 2026. |

## 4. Tổng hợp Marketing: dữ kiện, diễn giải và giả thuyết

### Dữ kiện quan sát được

- Các trang sản phẩm đã rà soát mô tả nhóm nghiệp vụ khá gần nhau: phòng, người thuê, hợp đồng, tiền dịch vụ/hóa đơn, thanh toán/công nợ; một số đã mô tả báo hỏng và app phía người thuê.
- Một số nhà cung cấp công khai gói miễn phí kèm giới hạn số phòng/cơ sở hoặc tính năng; tự động hóa, xuất dữ liệu hay đa thiết bị thường được đặt ở gói trả phí.
- Cổng tin thuê phòng công khai nhiều mức diện tích/giá và nhiều khu vực; báo cáo cổng tin năm 2024 cho thấy mức quan tâm và lượng tin có thể thay đổi đáng kể theo tháng.

### Diễn giải có mức tin cậy vừa/thấp

- Chỉ thêm quản lý phòng, hóa đơn hoặc nhắc nợ có thể khó tạo khác biệt vì các tính năng đó đã phổ biến trong thông điệp sản phẩm được rà soát.
- Hướng trải nghiệm game nên được kiểm tra bằng tác vụ thật: người dùng có tìm thấy phòng, hiểu trạng thái, xác nhận khoản thu và gửi báo hỏng nhanh/chính xác không. Chưa có căn cứ kết luận giao diện game tự nó là lợi thế.
- Phân tầng miễn phí/trả phí và mức độ thủ công là chủ đề phù hợp để hỏi, nhưng chưa đủ căn cứ xác định mô hình giá cho QLNT.

### Giả thuyết cần kiểm chứng

1. Chủ trọ nhỏ có thể chấp nhận thao tác thủ công nếu quy trình rõ, ít nhập lặp và có lịch sử dễ tra cứu.
2. Người thuê cần biết hóa đơn gồm khoản nào, đã nộp chứng từ chưa, ai đang xử lý và khi nào sự cố được hoàn tất.
3. Trình bày trạng thái công việc bằng avatar/hoạt ảnh có thể tăng dễ nhớ, nhưng cần giữ xác nhận rõ trước mọi thay đổi dữ liệu thật và có cách xem thay thế khi cảnh 3D khó dùng.
4. Điểm thưởng có thể khuyến khích hoàn thành nhiệm vụ, song cần tránh biến thanh toán trễ hoặc sự cố cá nhân thành xếp hạng tiêu cực; đây là rủi ro UX cần kiểm tra cùng BA.

## 5. Kế hoạch khảo sát đề xuất — chưa triển khai

Trình chủ dự án duyệt trước khi liên hệ người tham gia hoặc phát tán bảng hỏi, theo quy trình của skill Marketing.

| Nhóm cần tìm hiểu | Cách tiếp cận đề xuất | Chủ đề/câu hỏi mở đầu |
|---|---|---|
| Chủ trọ/người trực tiếp quản lý | Phỏng vấn bán cấu trúc; cho họ mô tả hoặc làm thử quy trình đang dùng | “Lần gần nhất thu tiền tháng, anh/chị làm từ bước nào đến bước nào?”; “Hay phải dò lại thông tin gì?”; “Khi báo hỏng đến, ai theo dõi đến lúc xử lý xong?” |
| Người thuê, sinh viên/người đi làm | Phỏng vấn theo trải nghiệm gần nhất; không hỏi thông tin cá nhân hoặc số tiền nhạy cảm nếu không cần | “Lần gần nhất anh/chị nhận hóa đơn/gửi tiền/báo hỏng diễn ra thế nào?”; “Khó biết điều gì sau khi gửi chứng từ?”; “Thông báo nào hữu ích, thông báo nào gây áp lực?” |
| Chủ trọ và người thuê trong cùng luồng | Thử nghiệm nguyên mẫu sau khi BA/UX có luồng mẫu | Đưa một tình huống hóa đơn và báo hỏng; yêu cầu người tham gia nói thành tiếng điều họ nghĩ trạng thái hiện tại có nghĩa gì; ghi nhận lỗi hiểu và thao tác cần trợ giúp. |

**Cần PM chốt trước khi chạy:** đối tượng/địa bàn cụ thể, phương pháp và kênh, cỡ mẫu, lịch, nguồn lực/chi phí nếu có, cách xin đồng thuận và lưu dữ liệu, người nhận báo cáo. Các mục này chưa được đặt baseline ở tài liệu này. Không phát survey hoặc thu dữ liệu cá nhân trong bước desk research.

## 6. Đầu ra gợi ý cho các vai trò

- **BA:** đối chiếu luồng quản lý phòng/khách, hóa đơn, nộp chứng từ, duyệt đã nhận tiền, báo hỏng và lịch sử; gắn rõ nhu cầu nào đã chốt trong yêu cầu và câu hỏi nào còn cần nghiên cứu.
- **UX:** kiểm tra khả năng hiểu trạng thái và tìm thao tác trong cảnh isometric cố định; thử một phương án xem danh sách hoặc bảng trạng thái như phương án dễ tiếp cận, chưa mặc định thành yêu cầu mới.
- **Tech Lead:** dùng các tính năng đối thủ làm bối cảnh phân tích phạm vi; không suy ra yêu cầu tích hợp, thanh toán tự động hay đa nền tảng từ thông điệp marketing của đối thủ.
- **PM:** chốt kế hoạch khảo sát trước khi triển khai; quyết định khi nào cần cập nhật phạm vi/tài liệu yêu cầu dựa trên bằng chứng người dùng.

## 7. Tài liệu tham khảo nghiệp vụ đề xuất

Các trang LOZIDO, DayTro và Zotro ở mục 3 là nguồn tham khảo nghiệp vụ đáng xem tiếp về hóa đơn, trạng thái thanh toán, sự cố và trải nghiệm người thuê. Hiện báo cáo chỉ lưu liên kết và ghi chú nguồn; không sao chép ảnh, biểu mẫu hay nội dung vào `2.Tai_lieu_tham_khao/`. Nếu cần bổ sung tệp hoặc ảnh chụp màn hình vào thư viện chung, thực hiện rà quyền sử dụng và xin duyệt đúng vị trí/phạm vi trước.
