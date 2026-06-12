import { buildMetadata } from "@/lib/seo";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const metadata = buildMetadata({
  title: "管理后台",
  noIndex: true,
});

export default function AdminPage() {
  return <AdminDashboard />;
}
