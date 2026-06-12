import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "发布话题",
  noIndex: true,
});

export default function EditTopicPage() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
      <h1 className="mb-4 text-2xl font-bold text-gray-900">发布话题</h1>
      <p className="text-gray-600">论坛话题发布编辑器正在迁移中。</p>
    </div>
  );
}
