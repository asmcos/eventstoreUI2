import CreatorAuthGuard from "@/components/creator/CreatorAuthGuard";
import CreatorSidebar from "@/components/creator/CreatorSidebar";
import { NotifyBridge, ToastProvider } from "@/lib/notify";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <CreatorAuthGuard>
      <ToastProvider>
        <NotifyBridge />
        <div className="min-h-screen bg-gray-100">
          <CreatorSidebar />
          <main className="ml-0 min-h-screen p-6 md:ml-64 md:p-8">{children}</main>
        </div>
      </ToastProvider>
    </CreatorAuthGuard>
  );
}
