"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, Search, X } from "lucide-react";

const navLinks = [
  { href: "/", label: "首页" },
  { href: "/books", label: "技术书籍" },
  { href: "/blogs", label: "博客文章" },
  { href: "/topics", label: "话题" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? "bg-gray-900/95 shadow-md"
            : "bg-gray-900"
        }`}
      >
        <div className="border-b border-gray-800">
          <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <Link href="/" className="logo-title">
              辰龙文档中心
            </Link>

            <nav className="hidden space-x-8 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="font-medium text-gray-300 transition-colors hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              <Link href="/creator" className="hidden creator-btn md:inline-flex">
                创作中心
              </Link>
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="rounded-full p-2 transition-colors hover:bg-gray-800"
                aria-label="搜索"
              >
                <Search className="h-5 w-5 text-gray-400" />
              </button>
              <button
                type="button"
                onClick={() => setMobileOpen(!mobileOpen)}
                className="rounded-md p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white md:hidden"
                aria-label="菜单"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-b border-gray-700 bg-gray-800 shadow-lg md:hidden">
            <div className="space-y-1 px-2 py-3">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block rounded-md px-3 py-2 text-base font-medium text-white transition-colors hover:bg-gray-700"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/creator"
                className="mt-2 block rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-center font-semibold text-white"
                onClick={() => setMobileOpen(false)}
              >
                创作中心
              </Link>
            </div>
          </div>
        )}
      </header>

      {searchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-3xl scale-100 rounded-xl bg-gray-800 p-6 opacity-100 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">技术资源搜索</h3>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-gray-400 transition-colors hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="search"
                placeholder="搜索系统编程、操作系统、Rust相关资源..."
                className="w-full rounded-lg border border-gray-600 bg-gray-700 py-3 pl-10 pr-4 text-white outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="mt-6">
              <h4 className="mb-3 text-sm font-medium uppercase tracking-wider text-gray-400">
                热门技术搜索
              </h4>
              <div className="flex flex-wrap gap-2">
                {["Rust系统编程", "Linux内核", "操作系统原理", "Rust异步编程", "内存安全"].map(
                  (tag) => (
                    <span
                      key={tag}
                      className="cursor-pointer rounded-full bg-gray-700 px-3 py-1 text-sm text-gray-300 transition-colors hover:bg-gray-600"
                    >
                      {tag}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
