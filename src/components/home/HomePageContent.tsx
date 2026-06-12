import Link from "next/link";
import { ArrowRight, BookOpen, Code, FileText } from "lucide-react";
import Carousel from "./Carousel";
import BookCard from "./BookCard";
import BlogCard from "./BlogCard";
import TopicsSection from "./TopicsSection";
import ResourcesSection from "./ResourcesSection";
import PageContainer from "@/components/layout/PageContainer";
import SectionHeader from "@/components/ui/SectionHeader";
import type { HomePageData } from "@/lib/esclient/server";
import { bookGrid, blogGrid } from "@/lib/layout";

interface HomePageContentProps {
  data: HomePageData;
}

function FilterSelect({ options }: { options: string[] }) {
  return (
    <div className="relative">
      <select className="appearance-none rounded-lg border border-gray-200 bg-white py-2 pr-10 pl-4 transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none">
        {options.map((opt) => (
          <option key={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

export default function HomePageContent({ data }: HomePageContentProps) {
  const { books, blogs, usersProfile, browseLogs, backendError } = data;

  return (
    <main className="flex w-full flex-col overflow-x-hidden bg-gray-50 pt-16 font-sans text-gray-900 antialiased">
      {backendError && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-900">
          {backendError}
        </div>
      )}

      {/* Hero — 对齐原版 from-gray-800 to-gray-700 */}
      <section
        id="home"
        className="relative bg-gradient-to-br from-gray-800 to-gray-700 py-16 text-white md:py-24"
      >
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-blue-500 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-60 w-60 rounded-full bg-purple-500 blur-3xl" />
        </div>

        <div className="absolute right-0 bottom-0 left-0">
          <svg
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            className="h-16 w-full"
            aria-hidden
          >
            <path
              d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z"
              opacity=".25"
              className="fill-gray-50"
            />
            <path
              d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z"
              opacity=".5"
              className="fill-gray-50"
            />
            <path
              d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z"
              className="fill-gray-50"
            />
          </svg>
        </div>

        <PageContainer className="relative z-10">
          <div className="flex flex-col items-center md:flex-row">
            <div className="mb-10 md:mb-0 md:w-1/2">
              <div className="mb-6 inline-block rounded-full border border-blue-500/30 bg-blue-500/20 px-4 py-2 backdrop-blur-sm">
                <span className="flex items-center text-sm font-medium">
                  <Code className="mr-2 h-4 w-4 text-blue-400" />
                  系统编程技术资源平台
                </span>
              </div>

              <div className="group">
                <h1 className="relative mb-4 inline-block text-[clamp(2rem,5vw,3.5rem)] leading-tight font-bold">
                  <span className="bg-gradient-to-r from-gray-100 to-gray-200 bg-clip-text text-transparent">
                    探索
                  </span>
                  <span className="relative z-10 bg-gradient-to-r from-blue-300 to-blue-500 bg-clip-text text-transparent">
                    系统编程
                  </span>
                  <span className="bg-gradient-to-r from-gray-100 to-gray-200 bg-clip-text text-transparent">
                    的核心世界
                  </span>
                  <span className="absolute inset-0 -z-10 -rotate-1 transform bg-gradient-to-r from-blue-400/20 to-purple-500/20 opacity-70 blur-xl" />
                  <span className="mt-1 block h-1 w-full origin-left scale-x-75 transform rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-transform duration-500 group-hover:scale-x-100" />
                </h1>
              </div>

              <p className="text-balance mb-8 max-w-lg text-lg text-gray-300 md:text-xl">
                汇聚操作系统、Rust编程与系统开发的专业文档、书籍和实战指南
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="#books"
                  className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow"
                >
                  浏览技术书籍
                </Link>
                <Link
                  href="#blogs"
                  className="rounded-lg border-2 border-white bg-transparent px-6 py-3 font-medium text-white transition-all duration-200 hover:bg-white/10"
                >
                  阅读博客文章
                </Link>
              </div>
            </div>

            <div className="relative flex w-full justify-center md:w-1/2 md:justify-end">
              <div className="relative w-full max-w-md pb-10 pt-10">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 opacity-70 blur-xl" />
                <div className="relative z-10">
                  <Carousel />
                </div>

                <div className="absolute -bottom-10 -left-10 z-20 flex items-center gap-2 rounded-lg border border-gray-100 bg-white p-3 shadow-lg">
                  <BookOpen className="h-7 w-7 text-blue-600" />
                  <div>
                    <p className="font-semibold text-gray-900">50+</p>
                    <p className="text-xs text-gray-500">专业技术书籍</p>
                  </div>
                </div>

                <div className="absolute -top-10 -right-10 z-20 flex items-center gap-2 rounded-lg border border-gray-100 bg-white p-3 shadow-lg">
                  <FileText className="h-7 w-7 text-purple-600" />
                  <div>
                    <p className="font-semibold text-gray-900">120+</p>
                    <p className="text-xs text-gray-500">技术博客文章</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* Books */}
      <section id="books" className="bg-gray-50 py-16">
        <PageContainer>
          <SectionHeader
            title="推荐技术书籍"
            description="精选系统编程、操作系统与Rust领域的高质量技术书籍"
            action={
              <FilterSelect
                options={["全部书籍", "操作系统", "Rust编程", "系统编程", "最新上架"]}
              />
            }
          />
          {books.length > 0 ? (
            <div className={bookGrid}>
              {books.map((book) => (
                <BookCard key={book.id} book={book} viewCount={browseLogs[book.id] ?? 0} />
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-gray-500">暂无书籍数据</p>
          )}
          <div className="mt-12 text-center">
            <Link
              href="/books"
              className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-6 py-3 font-medium text-gray-900 transition-all duration-200 hover:bg-gray-50"
            >
              查看更多书籍
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </PageContainer>
      </section>

      <TopicsSection />

      {/* Blogs */}
      <section id="blogs" className="bg-gray-50 py-16">
        <PageContainer>
          <SectionHeader
            title="最新博客文章"
            description="系统编程与操作系统领域的技术分享与实践指南"
            action={
              <FilterSelect
                options={["最新发布", "Rust编程", "操作系统", "系统编程", "热门文章"]}
              />
            }
          />
          {blogs.length > 0 ? (
            <div className={blogGrid}>
              {blogs.map((blog) => (
                <BlogCard
                  key={blog.id}
                  blog={blog}
                  viewCount={browseLogs[blog.id] ?? 0}
                  author={usersProfile[blog.user]}
                  variant="home"
                />
              ))}
            </div>
          ) : (
            <p className="py-12 text-center text-gray-500">暂无博客数据</p>
          )}
          <div className="mt-12 text-center">
            <Link
              href="/blogs"
              className="inline-flex items-center rounded-lg border border-gray-200 bg-white px-6 py-3 font-medium text-gray-900 transition-all duration-200 hover:bg-gray-50"
            >
              查看更多文章
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </PageContainer>
      </section>

      <ResourcesSection />
    </main>
  );
}
