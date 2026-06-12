import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="mb-4 text-4xl font-bold text-gray-900">404</h1>
      <p className="mb-8 text-gray-600">页面未找到</p>
      <Link href="/" className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700">
        返回首页
      </Link>
    </main>
  );
}
