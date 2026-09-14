import type { Metadata } from "next";
import { TagPage } from "@/components/tag/TagPage";

export async function generateMetadata({ params }: { params: { tag: string } }): Promise<Metadata> {
  const name = decodeURIComponent(params.tag);
  return { title: `#${name} · LifeBook` };
}

export default function TagRoutePage({ params }: { params: { tag: string } }) {
  return <TagPage tag={decodeURIComponent(params.tag)} />;
}
