import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "管理后台",
  noIndex: true,
});

export default function AdminPage() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">管理后台</h1>
      <p className="text-gray-600">
        用户管理、权限分配、事件审计功能正在从旧版迁移中。
      </p>
    </div>
  );
}
