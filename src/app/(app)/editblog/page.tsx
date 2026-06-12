import { Suspense } from "react";
import { buildMetadata } from "@/lib/seo";
import EditBlogClient from "./EditBlogClient";

export const metadata = buildMetadata({
  title: "编辑博客",
  noIndex: true,
});

export default function EditBlogPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-gray-500">
          加载编辑器…
        </div>
      }
    >
      <EditBlogClient />
    </Suspense>
  );
}
