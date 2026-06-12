import { buildMetadata } from "@/lib/seo";
import NewBookClient from "./NewBookClient";

export const metadata = buildMetadata({
  title: "新建书籍",
  noIndex: true,
});

export default function NewBookPage() {
  return <NewBookClient />;
}
