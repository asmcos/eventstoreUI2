import Link from "next/link";
import { ArrowRight, CheckCircle, Code, Cog, Gauge } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import SectionHeader from "@/components/ui/SectionHeader";

const topics = [
  {
    title: "Rust系统编程",
    description:
      "探索Rust在系统开发中的应用，包括内存安全、并发编程和底层硬件交互技术",
    href: "/topics",
    icon: Code,
    color: "blue",
    items: ["Rust内存模型与所有权系统", "异步编程与高性能IO", "系统工具与库开发实践"],
  },
  {
    title: "操作系统内核",
    description:
      "深入解析操作系统核心机制，包括进程管理、内存分配和文件系统实现原理",
    href: "/topics",
    icon: Cog,
    color: "purple",
    items: ["进程调度与同步机制", "虚拟内存与分页管理", "内核模块开发与调试"],
  },
  {
    title: "系统性能优化",
    description: "学习系统级性能分析与优化技术，提升软件运行效率和资源利用率",
    href: "/topics",
    icon: Gauge,
    color: "green",
    items: ["性能分析工具与方法论", "内存与缓存优化策略", "并发与多线程优化"],
  },
];

const colorMap = {
  blue: {
    card: "from-blue-50 to-indigo-50 border-blue-100",
    icon: "bg-blue-100 text-blue-600",
    check: "text-blue-500",
    link: "text-blue-600 hover:text-blue-700",
  },
  purple: {
    card: "from-purple-50 to-pink-50 border-purple-100",
    icon: "bg-purple-100 text-purple-600",
    check: "text-purple-500",
    link: "text-purple-600 hover:text-purple-700",
  },
  green: {
    card: "from-green-50 to-teal-50 border-green-100",
    icon: "bg-green-100 text-green-600",
    check: "text-green-500",
    link: "text-green-600 hover:text-green-700",
  },
};

export default function TopicsSection() {
  return (
    <section id="topics" className="bg-white py-16">
      <PageContainer>
        <SectionHeader
          title="核心技术专题"
          description="聚焦系统编程领域的核心技术方向"
          centered
        />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {topics.map((topic) => {
            const colors = colorMap[topic.color as keyof typeof colorMap];
            const Icon = topic.icon;
            return (
              <div
                key={topic.title}
                className={`rounded-xl border bg-gradient-to-br p-6 transition-all duration-300 hover:shadow-md ${colors.card}`}
              >
                <div
                  className={`mb-6 flex h-14 w-14 items-center justify-center rounded-lg ${colors.icon}`}
                >
                  <Icon className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">{topic.title}</h3>
                <p className="mb-4 text-gray-600">{topic.description}</p>
                <ul className="mb-6 space-y-2">
                  {topic.items.map((item) => (
                    <li key={item} className="flex items-center text-sm text-gray-700">
                      <CheckCircle className={`mr-2 h-4 w-4 shrink-0 ${colors.check}`} />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={topic.href}
                  className={`inline-flex items-center font-medium transition-colors ${colors.link}`}
                >
                  进入专题 <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </PageContainer>
    </section>
  );
}
