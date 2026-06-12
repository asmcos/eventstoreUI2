export const esserver =
  process.env.EVENTSTORE_WS_URL ?? "ws://127.0.0.1:8080/";

export const uploadpath =
  process.env.UPLOAD_BASE_URL ?? "http://127.0.0.1:8081/uploads/";

export const siteConfig = {
  name: "辰龙文档中心",
  title: "辰龙社区文档中心",
  description:
    "汇聚操作系统、Rust编程与系统开发的专业文档、书籍和实战指南。专注于系统编程、操作系统与Rust技术的专业文档资源平台。",
  domain: process.env.NEXT_PUBLIC_SITE_URL ?? "https://docs.chenlongos.cn",
  beian: "",
  contact: "contact@akae.cn",
  keywords: [
    "系统编程",
    "操作系统",
    "Rust",
    "Linux内核",
    "技术文档",
    "技术书籍",
    "技术博客",
  ],
} as const;
