import { Check, Download, FileCode, FileText } from "lucide-react";
import PageContainer from "@/components/layout/PageContainer";
import SectionHeader from "@/components/ui/SectionHeader";

export default function ResourcesSection() {
  return (
    <section id="resources" className="bg-white py-16">
      <PageContainer>
        <SectionHeader
          title="技术资源下载"
          description="获取系统编程与操作系统开发相关的实用资源"
          centered
        />
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 transition-all duration-300 hover:shadow-md">
            <div className="mb-6 flex items-center">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <FileCode className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Rust系统编程示例代码</h3>
                <p className="text-gray-600">实用代码片段与完整项目示例</p>
              </div>
            </div>
            <ul className="mb-6 space-y-3">
              {["内存安全示例代码集", "异步IO操作实现", "系统调用封装库"].map((item) => (
                <li key={item} className="flex items-center text-gray-700">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="flex items-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700"
            >
              <Download className="mr-2 h-4 w-4" /> 下载资源包
            </button>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 transition-all duration-300 hover:shadow-md">
            <div className="mb-6 flex items-center">
              <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">操作系统内核学习手册</h3>
                <p className="text-gray-600">内核原理与实践指南文档</p>
              </div>
            </div>
            <ul className="mb-6 space-y-3">
              {["Linux内核架构详解", "进程管理与调度手册", "内核调试实战指南"].map((item) => (
                <li key={item} className="flex items-center text-gray-700">
                  <Check className="mr-2 h-4 w-4 text-green-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="flex items-center rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-purple-700"
            >
              <Download className="mr-2 h-4 w-4" /> 下载PDF文档
            </button>
          </div>
        </div>
      </PageContainer>
    </section>
  );
}
