export type Category = {
  slug: string;
  eyebrow: string;
  title: string;
  description: string;
  accent: string;
  filters: string[];
  education: { title: string; body: string }[];
  image: string;
  imageAlt: string;
};

export type Product = {
  id: string;
  slug: string;
  categorySlug: string;
  title: string;
  brand: string;
  badge?: string;
  origin?: string;
  subcategory?: string;
  price?: number;
  shortDescription: string;
  description: string;
  ingredients?: string;
  usage?: string;
  commitment?: string;
  imageUrl?: string;
  featured?: boolean;
  stock?: number;
};

export const CONTACT = {
  hotline: "0909.000.000",
  phoneHref: "0909000000",
  zalo: "https://zalo.me/0909000000",
  address: "10/20/98 Khúc Thừa Dụ, An Biên, Hải Phòng",
  hours: "Thứ 2 - Chủ Nhật · 8:00 - 22:00"
};

export const categories: Category[] = [
  {
    slug: "yen-sao",
    eyebrow: "01 / Tinh hoa thiên nhiên",
    title: "Yến Sào",
    description:
      "Tuyển chọn từ những tổ yến thiên nhiên thượng hạng, chế biến thủ công tỉ mỉ, giữ trọn vẹn giá trị dinh dưỡng và hương vị tinh khiết.",
    accent: "Dưỡng nhan · Bồi bổ · Trường thọ",
    filters: ["Tất Cả", "Yến chưng sẵn", "Yến tinh chế", "Yến thô", "Quà tặng"],
    image:
      "https://images.unsplash.com/photo-1587049352824-f7e128d4ebe5?auto=format&fit=crop&w=1200&q=70",
    imageAlt: "Hũ thuỷ tinh vàng hổ phách gợi cảm giác yến chưng cao cấp",
    education: [
      {
        title: "Yến Sào Là Gì?",
        body: "Yến sào là tổ của loài chim yến, giàu protein, axit amin và khoáng chất thiết yếu."
      },
      {
        title: "Công Dụng Tuyệt Vời",
        body: "Bồi bổ cơ thể, tăng cường hệ miễn dịch, làm đẹp da và hỗ trợ phục hồi sức khỏe."
      },
      {
        title: "Cách Dùng Đúng",
        body: "Nên dùng khi bụng đói, tốt nhất vào sáng sớm hoặc tối trước khi ngủ 30 phút."
      }
    ]
  },
  {
    slug: "an-cung",
    eyebrow: "02 / Hộ thần - hồi sinh",
    title: "An Cung Ngưu Hoàng",
    description:
      "Dòng An Cung Ngưu Hoàng cao cấp nhập khẩu chính ngạch từ Hàn Quốc và Trung Quốc, hỗ trợ phòng ngừa đột quỵ, tai biến mạch máu não.",
    accent: "Phòng & hỗ trợ đột quỵ",
    filters: ["Tất Cả", "An Cung Hàn Quốc", "An Cung Trung Quốc", "Dòng Thượng Hạng", "Ngưu Hoàng Thanh Tâm"],
    image:
      "https://images.unsplash.com/photo-1702353531290-8fe0bfbf2732?auto=format&fit=crop&w=1200&q=70",
    imageAlt: "Viên hoàn đông y truyền thống xếp gọn trong khay, gợi dòng An Cung cao cấp",
    education: [
      {
        title: "Nguồn Gốc Danh Y",
        body: "An Cung Ngưu Hoàng Hoàn là bài thuốc cổ truyền có lịch sử hơn 200 năm."
      },
      {
        title: "Công Dụng Chính",
        body: "Hỗ trợ thanh nhiệt, giải độc, an thần và hỗ trợ phục hồi sau tai biến."
      },
      {
        title: "Đối Tượng Sử Dụng",
        body: "Phù hợp cho người cao tuổi, người có tiền sử huyết áp, tim mạch hoặc mất ngủ."
      }
    ]
  },
  {
    slug: "sam-linh-chi",
    eyebrow: "03 / Thượng phẩm bổ dưỡng",
    title: "Sâm & Linh Chi",
    description:
      "Nhân sâm Hàn Quốc 6 năm tuổi và Linh Chi đỏ cao cấp - bộ đôi thảo dược quý hỗ trợ tăng cường miễn dịch, chống lão hóa.",
    accent: "Tăng cường sinh lực · Trường thọ",
    filters: ["Tất Cả", "Hồng Sâm Cô Đặc", "Hồng Sâm Nước", "Viên Hồng Sâm", "Sâm Tươi", "Cao Linh Chi", "Nấm Linh Chi", "Trà Linh Chi"],
    image:
      "https://images.unsplash.com/photo-1695798790639-c3c4294373ab?auto=format&fit=crop&w=1200&q=70",
    imageAlt: "Củ sâm tươi với rễ nguyên vẹn, gợi hình ảnh nhân sâm Hàn Quốc 6 năm tuổi",
    education: [
      {
        title: "Sâm Hàn Quốc 6 Năm",
        body: "Sâm 6 năm tuổi chứa hàm lượng Saponin cao, hỗ trợ bồi bổ khí huyết và tăng sức bền."
      },
      {
        title: "Linh Chi Đỏ",
        body: "Linh Chi đỏ chứa nhiều hoạt chất sinh học hỗ trợ miễn dịch, gan và chống oxy hóa."
      },
      {
        title: "Kết Hợp Hoàn Hảo",
        body: "Sâm bổ khí, Linh Chi bổ âm, tạo sự cân bằng lý tưởng cho cơ thể."
      }
    ]
  },
  {
    slug: "thuc-pham-chuc-nang",
    eyebrow: "04 / Khoa học dinh dưỡng",
    title: "Thực Phẩm Chức Năng",
    description:
      "Đa dạng dòng thực phẩm chức năng cao cấp nhập khẩu: Tinh dầu thông đỏ, Đông trùng hạ thảo, Collagen, hỗ trợ gan, khớp, tim mạch.",
    accent: "Sức khỏe chủ động mỗi ngày",
    filters: ["Tất Cả", "Tinh Dầu Thông Đỏ", "Đông Trùng Hạ Thảo", "Collagen & Làm Đẹp", "Hỗ Trợ Gan"],
    image:
      "https://images.unsplash.com/photo-1649333243484-df91ff7b73ad?auto=format&fit=crop&w=1200&q=70",
    imageAlt: "Bộ ba lọ thực phẩm chức năng đặt trên khay gỗ, thể hiện chuẩn trình bày boutique",
    education: [
      {
        title: "Giải Pháp Toàn Diện",
        body: "Đáp ứng từng nhu cầu sức khỏe: giải độc gan, bảo vệ tim mạch, hỗ trợ xương khớp và làm đẹp da."
      },
      {
        title: "Chất Lượng Quốc Tế",
        body: "Sản phẩm có nguồn gốc rõ ràng từ thương hiệu uy tín Hàn Quốc, Nhật Bản, Mỹ."
      },
      {
        title: "Tư Vấn Cá Nhân Hóa",
        body: "Đội ngũ Mr Du tư vấn để chọn đúng sản phẩm theo thể trạng và mục tiêu sức khỏe."
      }
    ]
  }
];

const defaultProduct = {
  origin: "Hàn Quốc",
  ingredients: "Thành phần được tuyển chọn từ nguồn nguyên liệu cao cấp, có chứng từ rõ ràng.",
  usage: "Sử dụng theo hướng dẫn trên bao bì hoặc theo tư vấn của chuyên gia Mr Du.",
  commitment: "Cam kết chính hãng, tư vấn chuyên sâu, giao hàng toàn quốc và đổi trả theo chính sách."
};

export const products: Product[] = [
  product("yen-sam-dong-trung-duong-kieng", "yen-sao", "Yến Sâm Đông Trùng Đường Kiêng", "QiQi Yến Sào", "Yến chưng sẵn", "Là giải pháp bồi bổ thượng hạng dành cho người cần kiểm soát đường huyết, kết hợp Isomalt, đông trùng hạ thảo và hồng sâm thật.", 55000, true, "Hải Phòng, Việt Nam"),
  product("yen-sam-dong-trung", "yen-sao", "Yến Sâm Đông Trùng", "QiQi Yến Sào", "Yến chưng sẵn", "Nước yến bồi bổ kết hợp hồng sâm và đông trùng hạ thảo, hương vị thanh nhẹ, phù hợp chăm sóc sức khỏe hằng ngày.", 55000, true, "Hải Phòng, Việt Nam"),
  product("hoang-yen-dong-trung", "yen-sao", "Hoàng Yến Đông Trùng", "QiQi Yến Sào", "Yến chưng sẵn", "Dòng yến chưng cao cấp với đông trùng hạ thảo, vị ngọt thanh, thích hợp làm quà biếu sức khỏe.", 65000, true, "Hải Phòng, Việt Nam"),
  product("yen-rut-long-nuoc", "yen-sao", "Yến rút lông nước", "QiQi Yến Sào", "Yến tinh chế", "Tổ yến rút lông thủ công, giữ dáng tổ đẹp và độ tinh sạch cao cho người thích tự chưng yến tại nhà.", 2800000, true, "Khánh Hòa, Việt Nam"),
  product("yen-tho-100g", "yen-sao", "Yến thô 100g", "QiQi Yến Sào", "Yến thô", "Yến thô nguyên tổ 100g, giữ trọn hương vị tự nhiên và hàm lượng dinh dưỡng nguyên bản.", 2200000),
  product("yen-tinh-che-100g", "yen-sao", "Yến Tinh Chế 100g", "QiQi Yến Sào", "Yến tinh chế", "Yến tinh chế sạch lông, tiện dùng, phù hợp bồi bổ cho gia đình và người lớn tuổi.", 2600000),
  product("set-6-yen-chung-duong-phen", "yen-sao", "Set 6 Yến Chưng Đường Phèn", "QiQi Yến Sào", "Quà tặng", "Set yến chưng đường phèn thanh mát, đóng gói sang trọng để biếu tặng.", 330000),
  product("set-6-yen-chung-dong-trung-ha-thao", "yen-sao", "Set 6 Yến Chưng Đông Trùng Hạ Thảo", "QiQi Yến Sào", "Quà tặng", "Bộ 6 hũ yến chưng đông trùng hạ thảo, tăng cường bồi bổ và phục hồi thể trạng.", 390000),
  product("set-10-hu-yen-duong-kieng", "yen-sao", "Set 10 Hũ Yến Đường Kiêng", "QiQi Yến Sào", "Quà tặng", "Dòng yến chưng đường kiêng, phù hợp người cần hạn chế đường nhưng vẫn muốn bồi bổ.", 520000),
  product("set-10-hu-yen-dong-trung", "yen-sao", "Set 10 Hũ Yến Đông Trùng", "QiQi Yến Sào", "Quà tặng", "Set 10 hũ yến đông trùng hạ thảo tiện dùng, phù hợp chăm sóc sức khỏe dài ngày.", 620000),
  product("set-10-hu-yen-duong-phen", "yen-sao", "Set 10 Hũ Yến Đường Phèn", "QiQi Yến Sào", "Quà tặng", "Set yến đường phèn vị truyền thống, dịu ngọt và dễ dùng cho mọi độ tuổi.", 500000),
  product("set-6-hu-yen-sam-dong-trung-ha-thao", "yen-sao", "Set 6 Hũ Yến Sâm Đông Trùng Hạ Thảo", "QiQi Yến Sào", "Quà tặng", "Công thức yến, hồng sâm và đông trùng hạ thảo giúp bồi bổ thể lực.", 420000),
  product("yen-duong-kieng-30", "yen-sao", "Yến Đường Kiêng 30%", "QiQi Yến Sào", "Yến chưng sẵn", "Hàm lượng yến 30%, vị ngọt nhẹ từ đường ăn kiêng, phù hợp dùng đều đặn.", 65000),
  product("yen-hu-dong-trung-30", "yen-sao", "Yến Hũ Đông Trùng 30%", "QiQi Yến Sào", "Yến chưng sẵn", "Yến chưng hàm lượng cao kết hợp đông trùng hạ thảo, giúp phục hồi sức khỏe.", 70000),
  product("set-6-hu-yen-sam-dong-trung", "yen-sao", "Set 6 Hũ Yến Sâm Đông Trùng", "QiQi Yến Sào", "Quà tặng", "Bộ quà yến sâm đông trùng hạ thảo thiết kế trang nhã, phù hợp biếu tặng.", 410000),
  product("yen-tinh-che-50g", "yen-sao", "Yến Tinh Chế 50g", "QiQi Yến Sào", "Yến tinh chế", "Yến tinh chế sạch, đóng gói 50g cho nhu cầu dùng thử hoặc biếu tặng nhỏ gọn.", 1350000),
  product("yen-duong-phen-30", "yen-sao", "Yến Đường Phèn 30%", "QiQi Yến Sào", "Yến chưng sẵn", "Yến chưng đường phèn hàm lượng 30%, thơm nhẹ và dễ dùng.", 65000),

  product("an-cung-samsung-gum-jee-hwan-60v", "an-cung", "An Cung Samsung Gum Jee Hwan 60 Viên", "Samsung Pharma", "An Cung Hàn Quốc", "Dòng An Cung phổ thông từ Samsung Hàn Quốc, hỗ trợ bổ não, điều hòa huyết áp và phòng ngừa tai biến.", undefined, true),
  product("an-cung-mugunghwa-gongjinbo-60v", "an-cung", "An Cung Mugunghwa Gongjinbo 60 Viên", "Mugunghwa Pharma", "An Cung Hàn Quốc", "Sản phẩm cao cấp của Mugunghwa Pharma, bào chế từ các dược liệu quý hỗ trợ tuần hoàn não.", undefined, true),
  product("an-cung-dong-nhan-duong", "an-cung", "An Cung Hoàn Đồng Nhân Đường", "Đồng Nhân Đường", "An Cung Trung Quốc", "Bài thuốc cổ truyền danh tiếng, phù hợp người quan tâm đến dòng An Cung chuẩn Trung Hoa.", undefined, false, "Trung Quốc"),
  product("an-cung-samsung-gi-ryeok-60v", "an-cung", "An Cung Samsung Gi Ryeok Hwan 60 Viên", "Samsung Pharma", "An Cung Hàn Quốc", "Dòng viên hoàn hỗ trợ bồi bổ khí huyết, tinh thần tỉnh táo và tăng cường thể lực.", undefined, false),
  product("thien-sam-nui-xa-huong-mugunghwa", "an-cung", "Thiên Sâm Núi Xạ Hương Mugunghwa 10 Viên", "Mugunghwa Pharma", "Dòng Thượng Hạng", "Dòng thượng hạng kết hợp sâm núi và xạ hương, chuyên dùng làm quà biếu sức khỏe.", undefined, false),
  product("nguu-hoang-thanh-tam-bio-apgold-10v", "an-cung", "Ngưu Hoàng Thanh Tâm Bio Apgold 10 Viên", "Bio Apgold", "Ngưu Hoàng Thanh Tâm", "Viên thanh tâm hỗ trợ an thần, thanh nhiệt và ổn định cơ thể cho người lớn tuổi.", undefined, true),
  product("nguu-hoang-thanh-tam-woohwang-10v", "an-cung", "Ngưu Hoàng Thanh Tâm WooHwang 10 Viên", "WooHwang", "Ngưu Hoàng Thanh Tâm", "Dòng Ngưu Hoàng Thanh Tâm Hàn Quốc đóng hộp 10 viên, tiện dùng và bảo quản.", undefined, false),
  product("nguu-tong-thong-samdawon", "an-cung", "Ngưu Tổng Thống Dát Vàng Samdawon 10 Viên", "Samdawon", "Dòng Thượng Hạng", "Dòng ngưu hoàng dát vàng sang trọng, phù hợp quà biếu cao cấp cho người thân và đối tác.", undefined, false),

  product("tinh-chat-hong-sam-kgc-240g", "sam-linh-chi", "Tinh Chất Hồng Sâm KGC Extract 240g", "KGC Cheong Kwan Jang", "Hồng Sâm Cô Đặc", "Tinh chất cô đặc từ hồng sâm 6 năm tuổi của KGC, hàm lượng Saponin cao và vị sâm đậm.", undefined, true),
  product("nuoc-hong-sam-won-kgc-70ml-30goi", "sam-linh-chi", "Nước Hồng Sâm WON KGC 70ml x 30 Gói", "KGC Cheong Kwan Jang", "Hồng Sâm Nước", "Nước hồng sâm đóng gói tiện dùng, phù hợp bồi bổ sức khỏe mỗi ngày.", undefined, false),
  product("nuoc-hong-sam-khong-duong-daesan", "sam-linh-chi", "Nước Hồng Sâm Không Đường Daesan", "Daesan", "Hồng Sâm Nước", "Dòng nước hồng sâm không đường, phù hợp người cần hạn chế đường trong khẩu phần.", undefined, false),
  product("vien-hong-sam-kgc-pill-168g", "sam-linh-chi", "Viên Hồng Sâm KGC Extract Pill 168g", "KGC Cheong Kwan Jang", "Viên Hồng Sâm", "Viên hồng sâm cô đặc tiện mang theo, hỗ trợ tăng cường sức bền và tỉnh táo.", undefined, false),
  product("sam-tuoi-han-quoc-6-nam-1kg", "sam-linh-chi", "Sâm Tươi Hàn Quốc 6 Năm Tuổi 1kg", "Geumsan Ginseng", "Sâm Tươi", "Sâm tươi vùng Geumsan, củ đẹp, thích hợp ngâm mật ong, hầm gà hoặc chế biến tại nhà.", undefined, false),
  product("cao-linh-chi-bio-apgold-50g", "sam-linh-chi", "Cao Linh Chi Bio Apgold 50g x 5 Lọ", "Bio Apgold", "Cao Linh Chi", "Cao linh chi cô đặc hỗ trợ miễn dịch, gan và giấc ngủ.", undefined, false),
  product("nam-linh-chi-do-youngji-1kg", "sam-linh-chi", "Nấm Linh Chi Đỏ Youngji 1kg", "Youngji", "Nấm Linh Chi", "Nấm linh chi đỏ nguyên tai, thích hợp thái lát đun nước uống hằng ngày.", undefined, false),
  product("tra-linh-chi-100goi", "sam-linh-chi", "Trà Linh Chi Hộp 100 Gói", "Bio Apgold", "Trà Linh Chi", "Trà linh chi đóng gói tiện lợi, vị dịu, dễ dùng cho văn phòng và gia đình.", undefined, false),

  product("tinh-dau-thong-do-kwangdong-120v", "thuc-pham-chuc-nang", "Tinh Dầu Thông Đỏ Kwangdong 120 Viên", "Kwangdong", "Tinh Dầu Thông Đỏ", "Viên tinh dầu thông đỏ hỗ trợ thanh lọc cơ thể, tim mạch, huyết áp và tuần hoàn.", undefined, true),
  product("tinh-dau-thong-do-daesan-premium-180v", "thuc-pham-chuc-nang", "Tinh Dầu Thông Đỏ Daesan Premium 180 Viên", "Daesan", "Tinh Dầu Thông Đỏ", "Dòng thông đỏ premium 180 viên, phù hợp chăm sóc tim mạch dài ngày.", undefined, false),
  product("dong-trung-ha-thao-mugunghwa-60g", "thuc-pham-chuc-nang", "Tinh Chất Đông Trùng Mugunghwa 60 Gói", "Mugunghwa Pharma", "Đông Trùng Hạ Thảo", "Tinh chất đông trùng dạng gói tiện dùng, hỗ trợ phục hồi sức khỏe và đề kháng.", undefined, false),
  product("nuoc-dong-trung-samsung-30goi", "thuc-pham-chuc-nang", "Nước Đông Trùng Samsung 30 Gói", "Samsung Pharma", "Đông Trùng Hạ Thảo", "Nước đông trùng đóng gói từ Samsung Pharma, phù hợp biếu tặng và dùng hằng ngày.", undefined, false),
  product("nuoc-elastin-collagen-7500mg", "thuc-pham-chuc-nang", "Nước Elastin Collagen 7500mg", "Healthway", "Collagen & Làm Đẹp", "Collagen dạng nước hàm lượng cao, hỗ trợ da, tóc, móng và độ đàn hồi.", undefined, false),
  product("nuoc-giai-ruou-dream", "thuc-pham-chuc-nang", "Nước Giải Rượu Dream 30 Gói", "Dream Korea", "Hỗ Trợ Gan", "Thức uống hỗ trợ giải rượu, giảm mệt mỏi và bảo vệ gan sau tiệc.", undefined, false),
  product("nuoc-bo-gan-pocheon-hovenia", "thuc-pham-chuc-nang", "Nước Bổ Gan Pocheon Hovenia", "Pocheon", "Hỗ Trợ Gan", "Nước bổ gan từ Hovenia, hỗ trợ men gan và phục hồi sau căng thẳng.", undefined, false),
  product("vien-ho-gan-silymarin-premium", "thuc-pham-chuc-nang", "Viên Hộ Gan Silymarin Premium", "Premium Health", "Hỗ Trợ Gan", "Viên Silymarin hỗ trợ bảo vệ tế bào gan và tăng cường chức năng gan.", undefined, false)
];

function product(
  slug: string,
  categorySlug: string,
  title: string,
  brand: string,
  subcategory: string,
  description: string,
  price?: number,
  featured = false,
  origin = defaultProduct.origin
): Product {
  return {
    id: slug,
    slug,
    categorySlug,
    title,
    brand,
    badge: featured ? "Chính Hãng" : undefined,
    origin,
    subcategory,
    price,
    shortDescription: description,
    description,
    ingredients: defaultProduct.ingredients,
    usage: defaultProduct.usage,
    commitment: defaultProduct.commitment,
    featured,
    stock: 100
  };
}

export function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}

export function getProductsByCategory(categorySlug: string) {
  return products.filter((item) => item.categorySlug === categorySlug);
}

export function getProduct(categorySlug: string, slug: string) {
  return products.find((item) => item.categorySlug === categorySlug && item.slug === slug);
}

export function getFeaturedProducts() {
  return products.filter((item) => item.featured).slice(0, 8);
}

export function formatPrice(price?: number) {
  if (!price) return "Liên hệ";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);
}
