import { buildMetadata } from "@/lib/seo";
import CreatorDashboard from "@/components/creator/CreatorDashboard";

export const metadata = buildMetadata({
  title: "创作中心",
  noIndex: true,
});

export default function CreatorPage() {
  return <CreatorDashboard />;
}
