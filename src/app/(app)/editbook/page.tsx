import { Suspense } from "react";
import { buildMetadata } from "@/lib/seo";
import EditBookClient from "./EditBookClient";

export const metadata = buildMetadata({
  title: "编辑书籍",
  noIndex: true,
});

export default function EditBookPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-gray-500">
          加载编辑器…
        </div>
      }
    >
      <EditBookClient />
    </Suspense>
  );
}
