import { cn } from "@/lib/utils/cn";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
}

/** 与原版 Svelte 一致的 container 宽度 */
export default function PageContainer({
  children,
  className,
  narrow = false,
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "container mx-auto w-full px-4 sm:px-6 lg:px-8",
        narrow && "max-w-4xl",
        className
      )}
    >
      {children}
    </div>
  );
}
