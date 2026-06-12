interface BlogDividerProps {
  variant?: "top" | "bottom";
}

export default function BlogDivider({ variant = "top" }: BlogDividerProps) {
  const isBottom = variant === "bottom";
  return (
    <div className={`blog-divider flex items-center gap-3 opacity-80 ${isBottom ? "bottom-divider" : "top-divider"}`}>
      <div
        className={`h-px flex-1 bg-gradient-to-r ${
          isBottom
            ? "from-violet-500/0 via-violet-500/60 to-violet-500/0"
            : "from-indigo-500/0 via-indigo-500/60 to-indigo-500/0"
        }`}
      />
      <div
        className={`relative h-2 w-2 rounded-full shadow-[0_0_0_2px_rgba(79,70,229,0.1)] ${
          isBottom ? "bg-violet-500" : "bg-indigo-600"
        }`}
      >
        <span
          className={`absolute top-1/2 left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full ${
            isBottom ? "bg-violet-500/20" : "bg-indigo-500/20"
          }`}
        />
      </div>
      <div
        className={`h-px flex-1 bg-gradient-to-r ${
          isBottom
            ? "from-violet-500/0 via-violet-500/60 to-violet-500/0"
            : "from-indigo-500/0 via-indigo-500/60 to-indigo-500/0"
        }`}
      />
    </div>
  );
}
