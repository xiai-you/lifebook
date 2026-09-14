import type { Metadata } from "next";
import { getCategoryName } from "@/lib/constants/categories";
import { CategoryPage } from "@/components/category/CategoryPage";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  return { title: `${getCategoryName(params.id)} · LifeBook` };
}

export default function CategoryRoutePage({ params }: { params: { id: string } }) {
  return <CategoryPage categoryId={params.id} />;
}
