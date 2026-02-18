import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/features/shop/components/Header";
import Footer from "@/features/shop/components/Footer";
import WhatsAppButton from "@/features/shop/components/WhatsAppButton";
import ProductCard from "@/features/shop/components/ProductCard";
import { useProducts } from "@/features/shop/hooks/useProducts";
import { useCategories } from "@/features/shop/hooks/useCategories";
import { useBrands } from "@/features/shop/hooks/useBrands";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, SlidersHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { MOCK_PRODUCTS } from "@/lib/constants";

const CatalogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const catSlug = searchParams.get("cat") || "";
  const search = searchParams.get("q") || "";
  const [localSearch, setLocalSearch] = useState(search);
  const [showFilters, setShowFilters] = useState(false);

  const { products, loading } = useProducts({ category: catSlug || undefined, search: search || undefined });
  const { categories } = useCategories();
  const { brands } = useBrands();

  // Fallback
  const displayProducts = products.length > 0 ? products : (loading ? [] : MOCK_PRODUCTS.filter(p => !catSlug || p.category === catSlug).map(p => ({
    ...p, slug: p.id, images: [p.image], discount_percent: p.discount, brand: { id: '', name: p.brand, slug: '', is_active: true },
  })) as any);

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams);
    if (localSearch) params.set("q", localSearch);
    else params.delete("q");
    setSearchParams(params);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 flex gap-2">
            <Input placeholder="Buscar productos..." value={localSearch} onChange={(e) => setLocalSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} className="bg-secondary/50 border-primary/20" />
            <Button onClick={handleSearch} className="glow-green-sm"><Search className="h-4 w-4" /></Button>
          </div>
          <Button variant="outline" className="sm:hidden" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="h-4 w-4 mr-2" /> Filtros
          </Button>
          <div className={`flex gap-2 ${showFilters ? "flex" : "hidden sm:flex"}`}>
            <Select value={catSlug || "all"} onValueChange={(v) => {
              const params = new URLSearchParams(searchParams);
              if (v === "all") params.delete("cat");
              else params.set("cat", v);
              setSearchParams(params);
            }}>
              <SelectTrigger className="w-[160px] bg-secondary/50 border-primary/20">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-display font-bold mb-6">
          {catSlug ? categories.find(c => c.slug === catSlug)?.name || "Catálogo" : search ? `Resultados: "${search}"` : "Catálogo de Productos"}
        </h1>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-xl" />)}
          </div>
        ) : displayProducts.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg">No se encontraron productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {displayProducts.map((p: any) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default CatalogPage;
