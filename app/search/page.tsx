import { Suspense } from "react";
import { SearchClient } from "@/components/search/SearchClient";

/** 搜索页 —— 需求文档第十四节。客户端组件需在 Suspense 边界内使用 useSearchParams。 */
export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchClient />
    </Suspense>
  );
}
