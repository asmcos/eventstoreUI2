import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-clip">
      <Header />
      <div className="w-full flex-1">{children}</div>
      <Footer />
    </div>
  );
}
