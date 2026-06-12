"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getKey } from "@/lib/auth/keys";

export default function CreatorAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { Keypriv } = getKey();
    if (!Keypriv) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
      return;
    }
    setReady(true);
  }, [router, pathname]);

  if (!ready) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-500">
        <Loader2 className="mr-2 h-6 w-6 animate-spin text-indigo-600" />
        验证登录状态…
      </div>
    );
  }

  return <>{children}</>;
}
