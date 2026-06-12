import Link from "next/link";
import { siteConfig } from "@/lib/config";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 pt-16 pb-8 text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="mb-4 inline-block">
              <span className="text-2xl font-bold text-white">
                辰龙<span className="text-blue-400">文档中心</span>
              </span>
            </Link>
            <p className="mb-6 text-gray-400">
              专注于系统编程、操作系统与Rust技术的专业文档资源平台，助力开发者深入技术核心。
            </p>
          </div>
          <div>
            <h4 className="mb-4 text-lg font-semibold">内容导航</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/books" className="text-gray-400 transition-colors hover:text-white">
                  技术书籍
                </Link>
              </li>
              <li>
                <Link href="/blogs" className="text-gray-400 transition-colors hover:text-white">
                  博客文章
                </Link>
              </li>
              <li>
                <Link href="/topics" className="text-gray-400 transition-colors hover:text-white">
                  话题论坛
                </Link>
              </li>
              <li>
                <Link href="/#resources" className="text-gray-400 transition-colors hover:text-white">
                  资源下载
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-lg font-semibold">技术领域</h4>
            <ul className="space-y-2">
              {["Rust系统编程", "Linux内核", "操作系统原理", "系统性能优化", "嵌入式开发"].map(
                (item) => (
                  <li key={item}>
                    <span className="text-gray-400">{item}</span>
                  </li>
                )
              )}
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-lg font-semibold">联系我们</h4>
            <ul className="space-y-3 text-gray-400">
              <li>asmcos@akae.cn</li>
              <li>https://github.com/chenlongos</li>
              <li>{siteConfig.domain}</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <p className="mb-4 text-sm text-gray-400 md:mb-0">
              © 2025 - {year} 辰龙社区文档中心. 保留所有权利。
            </p>
            <div className="flex space-x-6 text-sm">
              <span className="text-gray-400">隐私政策</span>
              <span className="text-gray-400">使用条款</span>
              <span className="text-gray-400">内容声明</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
