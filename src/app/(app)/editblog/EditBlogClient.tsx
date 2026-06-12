"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import EditBlogForm, { type BlogFormData } from "@/components/blog/EditBlogForm";
import BlogListSidebar from "@/components/blog/BlogListSidebar";
import { getKey } from "@/lib/auth/keys";
import { collectBlogs, fetchBlogById, fetchBlogCount } from "@/lib/esclient/wrap";
import { showNotification } from "@/lib/notify";
import { getTagValue } from "@/lib/utils/ids";

const PAGE_SIZE = 5;
const EMPTY_BLOG: BlogFormData = { title: "", content: "", coverUrl: "", labels: [] };

export default function EditBlogClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const blogIdParam = searchParams.get("blogid");

  const [loading, setLoading] = useState(true);
  const [blogId, setBlogId] = useState<string | null>(blogIdParam);
  const [formData, setFormData] = useState<BlogFormData>(EMPTY_BLOG);
  const [editorKey, setEditorKey] = useState("new");
  const [blogs, setBlogs] = useState<{ id: string; title: string; coverUrl?: string }[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  const loadBlogList = useCallback(async (page: number, pubkey: string) => {
    const offset = (page - 1) * PAGE_SIZE;
    const raw = await collectBlogs(pubkey, offset, PAGE_SIZE);
    const items = raw
      .filter((m) => m?.data)
      .map((m) => {
        const data = JSON.parse(m.data as string) as { title?: string; coverUrl?: string };
        const id = getTagValue(m.tags as [string, string][] | undefined, "d") ?? m.id ?? "";
        return { id, title: data.title ?? "未命名", coverUrl: data.coverUrl };
      });
    setBlogs(items);
    setCurrentPage(page);
  }, []);

  const loadBlog = useCallback(async (id: string, pubkey: string) => {
    const msg = await fetchBlogById(id);
    if (!msg || msg.code !== 200) {
      showNotification("博客加载失败", "error");
      return;
    }
    if (msg.user !== pubkey) {
      showNotification("你不是这篇博客的作者，无法编辑", "warning");
      return;
    }
    const data = JSON.parse(msg.data as string) as BlogFormData;
    setFormData({
      title: data.title ?? "",
      content: data.content ?? "",
      coverUrl: data.coverUrl ?? "",
      labels: data.labels ?? [],
    });
    setEditorKey(id);
  }, []);

  useEffect(() => {
    const { Keypub } = getKey();
    if (!Keypub) {
      setLoading(false);
      return;
    }

    void (async () => {
      setLoading(true);
      try {
        const count = await fetchBlogCount(Keypub);
        setTotalCount(count);

        const id = blogIdParam;
        setBlogId(id);
        if (id) {
          await loadBlog(id, Keypub);
        } else {
          setFormData(EMPTY_BLOG);
          setEditorKey(`new-${Date.now()}`);
        }
        await loadBlogList(1, Keypub);
      } finally {
        setLoading(false);
      }
    })();
  }, [blogIdParam, loadBlog, loadBlogList]);

  const handleSelectBlog = (id: string) => {
    router.push(`/editblog?blogid=${encodeURIComponent(id)}`);
  };

  const handleNewBlog = () => {
    router.push("/editblog");
  };

  const handleSaveSuccess = async (savedId: string) => {
    const { Keypub } = getKey();
    if (!Keypub) return;
    if (!blogId && savedId) {
      router.replace(`/editblog?blogid=${encodeURIComponent(savedId)}`);
    }
    setTotalCount(await fetchBlogCount(Keypub));
    await loadBlogList(currentPage, Keypub);
  };

  const handlePageChange = async (page: number) => {
    const { Keypub } = getKey();
    if (!Keypub || page < 1 || page > totalPages) return;
    await loadBlogList(page, Keypub);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-500">
        <Loader2 className="mr-2 h-6 w-6 animate-spin text-indigo-600" />
        加载编辑器…
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/creator"
        className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-indigo-600"
      >
        <ArrowLeft className="mr-1 h-4 w-4" /> 返回创作中心
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <EditBlogForm
            blogId={blogId}
            initialData={formData}
            editorKey={editorKey}
            onSaveSuccess={handleSaveSuccess}
          />
        </div>
        <div>
          <BlogListSidebar
            blogs={blogs}
            activeId={blogId}
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            onPageChange={handlePageChange}
            onSelect={handleSelectBlog}
            onNew={handleNewBlog}
          />
        </div>
      </div>
    </div>
  );
}
