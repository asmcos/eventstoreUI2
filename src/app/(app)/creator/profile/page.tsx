import { buildMetadata } from "@/lib/seo";
import CreatorProfileForm from "@/components/creator/CreatorProfileForm";

export const metadata = buildMetadata({
  title: "个人资料",
  noIndex: true,
});

export default function CreatorProfilePage() {
  return <CreatorProfileForm />;
}
