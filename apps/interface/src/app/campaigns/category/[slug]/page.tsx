import { notFound } from "next/navigation";
import { CATEGORY_TAXONOMY, getCategoryBySlug } from "@/lib/categories";
import CategoryPageClient from "./CategoryPageClient";

export function generateStaticParams() {
  return CATEGORY_TAXONOMY.map((cat) => ({ slug: cat.slug }));
}

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const category = getCategoryBySlug(params.slug);
  if (!category) notFound();
  return <CategoryPageClient slug={params.slug} />;
}
