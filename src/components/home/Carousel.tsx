"use client";

import { useCallback, useEffect, useState } from "react";

const SLIDES = [
  {
    title: "Rust 内核模块代码",
    type: "code" as const,
    content: `// Rust内核模块初始化
use kernel::prelude::*;

module! {
    type: MyKernelModule,
    name: "sys_demo",
    license: "GPL",
}

impl KernelModule for MyKernelModule {
    fn init() -> Result<Self> {
        pr_info!("Rust内核模块初始化完成\\n");
        Ok(Self)
    }
}`,
  },
  {
    title: "内核架构可视化",
    type: "architecture" as const,
    nodes: [
      { title: "进程调度器", desc: "Process Scheduler", icon: "📊", top: "15%", left: "8%" },
      { title: "内存管理", desc: "Memory Allocation", icon: "💾", top: "15%", left: "55%" },
      { title: "I/O 控制器", desc: "Input/Output", icon: "🔌", top: "55%", left: "32%" },
    ],
  },
  {
    title: "系统终端输出",
    type: "terminal" as const,
    commands: [
      { prompt: "$", command: "make kernel_module" },
      { output: "[INFO] 编译内核模块...", type: "info" as const },
      { output: "[SUCCESS] 模块编译完成", type: "success" as const },
      { prompt: "$", command: "insmod sys_demo.ko" },
      { prompt: "$", command: "dmesg | grep Rust" },
      { output: "[1234.567] Rust内核模块初始化完成" },
      { prompt: "$[ChenLongOS]", cursor: true },
    ],
  },
];

const INTERVAL = 4000;

export default function Carousel() {
  const [current, setCurrent] = useState(0);

  const goTo = useCallback((index: number) => {
    setCurrent(index);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, INTERVAL);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-[300px] w-full overflow-hidden rounded-xl border border-blue-400/20 bg-[#121212] shadow-[0_4px_25px_rgba(0,0,0,0.7),0_0_30px_rgba(56,189,248,0.15)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(56,189,248,0.15),transparent_60%),radial-gradient(circle_at_70%_70%,rgba(16,185,129,0.15),transparent_60%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:20px_20px]" />

      <div className="relative z-[2] h-full w-full">
        {SLIDES.map((slide, index) => (
          <div
            key={slide.title}
            className={`absolute inset-0 flex flex-col rounded-lg bg-[rgba(30,30,46,0.95)] p-[18px] transition-opacity duration-700 ${
              index === current ? "opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <div className="relative mb-[15px] flex items-center gap-2 border-b border-blue-400/10 pb-2 before:absolute before:top-0 before:right-0 before:left-0 before:h-[3px] before:rounded-t before:bg-gradient-to-r before:from-sky-400 before:via-blue-400 before:to-blue-600">
              <span className="font-mono text-sm text-slate-400">//</span>
              <h3 className="font-mono text-base font-medium text-sky-400">{slide.title}</h3>
            </div>

            {slide.type === "code" && (
              <pre className="flex-1 overflow-auto rounded-md bg-[#1e1e2e] p-[15px] font-mono text-sm leading-[1.6] whitespace-pre-wrap text-slate-200 shadow-[inset_0_0_10px_rgba(79,70,229,0.2)]">
                {slide.content}
              </pre>
            )}

            {slide.type === "architecture" && (
              <div className="relative flex-1 p-2.5">
                {slide.nodes.map((node) => (
                  <div
                    key={node.title}
                    className="absolute w-[42%] rounded-lg border border-blue-400/30 bg-slate-800/90 p-3 shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_15px_rgba(0,0,0,0.4),0_0_10px_rgba(56,189,248,0.2)] sm:w-[38%]"
                    style={{ top: node.top, left: node.left }}
                  >
                    <div className="text-sm text-sky-400">{node.title}</div>
                    <div className="text-xs text-slate-400">{node.desc}</div>
                    <span className="absolute -top-2.5 -right-2.5 flex h-7 w-7 items-center justify-center rounded-full border border-blue-400/50 bg-[#1e1e2e] text-xs">
                      {node.icon}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {slide.type === "terminal" && (
              <div className="flex-1 overflow-auto rounded-md bg-[#111827] p-[15px] font-mono text-sm leading-[1.6] shadow-[inset_0_0_10px_rgba(16,185,129,0.2)]">
                {slide.commands.map((cmd, i) => {
                  if ("prompt" in cmd && cmd.prompt) {
                    return (
                      <div key={i} className="mb-1.5">
                        <span className="font-medium text-emerald-500">{cmd.prompt} </span>
                        {cmd.command && <span className="text-slate-200">{cmd.command}</span>}
                        {cmd.cursor && (
                          <span className="ml-0.5 inline-block h-3.5 w-2 animate-pulse bg-emerald-500" />
                        )}
                      </div>
                    );
                  }
                  if ("output" in cmd && cmd.output) {
                    const color =
                      cmd.type === "info"
                        ? "text-blue-400"
                        : cmd.type === "success"
                          ? "text-emerald-500"
                          : "text-slate-300";
                    return (
                      <div key={i} className={`mb-1.5 ${color}`}>
                        {cmd.output}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="absolute bottom-3 left-1/2 z-[3] flex -translate-x-1/2 gap-2">
        {SLIDES.map((_, index) => (
          <button
            key={index}
            type="button"
            aria-label={`切换到第 ${index + 1} 张幻灯片`}
            onClick={() => goTo(index)}
            className={`h-2.5 w-2.5 rounded-full transition-all ${
              index === current
                ? "scale-125 bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]"
                : "bg-blue-400/30 hover:bg-blue-400/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
