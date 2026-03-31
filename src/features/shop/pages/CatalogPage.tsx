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
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { CURRENCY } from "@/lib/types";
import { MOCK_PRODUCTS } from "@/lib/constants";

const SORT_OPTIONS = [
  { value: "position", label: "Posición" },
  { value: "name-asc", label: "Nombre: A a la Z" },
  { value: "name-desc", label: "Nombre: Z a A" },
  { value: "price-asc", label: "Precio: de menor a mayor" },
  { value: "price-desc", label: "Precio: de mayor a menor" },
  { value: "date-desc", label: "Fecha: Lo más reciente primero" },
];

const CatalogPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const catSlug = searchParams.get("cat") || "";
  const search = searchParams.get("q") || "";
  const sortParam = searchParams.get("sort") || "position";
  const [localSearch, setLocalSearch] = useState(search);
  const [showFilters, setShowFilters] = useState(false);
  const [priceMin, setPriceMin] = useState(searchParams.get("pmin") || "");
  const [priceMax, setPriceMax] = useState(searchParams.get("pmax") || "");

  const brandSlug = searchParams.get("brand") || "";

  const { products, loading } = useProducts({
    category: catSlug || undefined,
    brand: brandSlug || undefined,
    search: search || undefined,
    sort: sortParam,
    priceMin: searchParams.get("pmin") ? Number(searchParams.get("pmin")) : undefined,
    priceMax: searchParams.get("pmax") ? Number(searchParams.get("pmax")) : undefined,
  });
  const { categories, allCategories } = useCategories();
  const { brands } = useBrands();

  const displayProducts = products.length > 0 ? products : (loading ? [] : MOCK_PRODUCTS.filter(p => !catSlug || p.category === catSlug).map(p => ({
    ...p, slug: p.id, images: [p.image], discount_percent: p.discount, brand: { id: '', name: p.brand, slug: '', is_active: true },
  })) as any);

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams);
    if (localSearch) params.set("q", localSearch);
    else params.delete("q");
    setSearchParams(params);
  };

  const handleSort = (v: string) => {
    const params = new URLSearchParams(searchParams);
    if (v === "position") params.delete("sort");
    else params.set("sort", v);
    setSearchParams(params);
  };

  const handlePriceFilter = () => {
    const params = new URLSearchParams(searchParams);
    if (priceMin) params.set("pmin", priceMin);
    else params.delete("pmin");
    if (priceMax) params.set("pmax", priceMax);
    else params.delete("pmax");
    setSearchParams(params);
  };

  const clearPriceFilter = () => {
    setPriceMin("");
    setPriceMax("");
    const params = new URLSearchParams(searchParams);
    params.delete("pmin");
    params.delete("pmax");
    setSearchParams(params);
  };

  const handleCategoryChange = (v: string) => {
    const params = new URLSearchParams(searchParams);
    if (v === "all") params.delete("cat");
    else params.set("cat", v);
    setSearchParams(params);
  };

  const activeCatName = catSlug
    ? (allCategories || []).find((c: any) => c.slug === catSlug)?.name || categories.find(c => c.slug === catSlug)?.name || "Catálogo"
    : "";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 sm:py-8">
        {/* Search bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Buscar productos..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="bg-secondary/50 border-primary/20"
            />
            <Button onClick={handleSearch} className="glow-green-sm"><Search className="h-4 w-4" /></Button>
          </div>
          <Button variant="outline" className="sm:hidden" onClick={() => setShowFilters(!showFilters)}>
            <SlidersHorizontal className="h-4 w-4 mr-2" /> Filtros
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar filters */}
          <aside className={`w-full lg:w-64 shrink-0 space-y-6 ${showFilters ? "block" : "hidden lg:block"}`}>
            {/* Category filter with subcategories */}
            <div className="bg-card rounded-xl border border-primary/10 p-4 space-y-3">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-foreground">Categorías</h3>
              <button
                onClick={() => handleCategoryChange("all")}
                className={`block w-full text-left text-sm px-2 py-1.5 rounded-md transition-colors ${!catSlug ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
              >
                Todas
              </button>
              {categories.map(cat => (
                <div key={cat.id}>
                  <button
                    onClick={() => handleCategoryChange(cat.slug)}
                    className={`block w-full text-left text-sm px-2 py-1.5 rounded-md transition-colors ${catSlug === cat.slug ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
                  >
                    {cat.name}
                  </button>
                  {cat.children && cat.children.length > 0 && (
                    <div className="ml-3 mt-1 space-y-0.5 border-l-2 border-primary/10 pl-2">
                      {cat.children.map((sub: any) => (
                        <button
                          key={sub.id}
                          onClick={() => handleCategoryChange(sub.slug)}
                          className={`block w-full text-left text-xs px-2 py-1 rounded-md transition-colors ${catSlug === sub.slug ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
                        >
                          {sub.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Price filter */}
            <div className="bg-card rounded-xl border border-primary/10 p-4 space-y-3">
              <h3 className="font-semibold text-sm uppercase tracking-wide text-foreground">Filtrar por precio</h3>
              <div className="flex gap-2 items-center">
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-muted-foreground">Desde</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{CURRENCY}</span>
                    <Input
                      type="number"
                      min={0}
                      value={priceMin}
                      onChange={(e) => setPriceMin(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handlePriceFilter()}
                      className="pl-7 h-9 text-sm bg-secondary/50 border-primary/20"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="flex-1 space-y-1">
                  <label className="text-xs text-muted-foreground">Hasta</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{CURRENCY}</span>
                    <Input
                      type="number"
                      min={0}
                      value={priceMax}
                      onChange={(e) => setPriceMax(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handlePriceFilter()}
                      className="pl-7 h-9 text-sm bg-secondary/50 border-primary/20"
                      placeholder="20,000"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handlePriceFilter} className="flex-1 h-8 text-xs">Aplicar</Button>
                {(searchParams.get("pmin") || searchParams.get("pmax")) && (
                  <Button size="sm" variant="ghost" onClick={clearPriceFilter} className="h-8 text-xs px-2">
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>

            {/* Brand filter */}
            {brands.length > 0 && (
              <div className="bg-card rounded-xl border border-primary/10 p-4 space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-foreground">Marcas</h3>
                {brands.map(b => (
                  <button
                    key={b.id}
                    onClick={() => {
                      const params = new URLSearchParams(searchParams);
                      const current = params.get("brand");
                      if (current === b.slug) params.delete("brand");
                      else params.set("brand", b.slug);
                      setSearchParams(params);
                    }}
                    className={`block w-full text-left text-sm px-2 py-1.5 rounded-md transition-colors ${searchParams.get("brand") === b.slug ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            )}
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Header with title + sort */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
              <h1 className="text-xl sm:text-2xl font-display font-bold">
                {activeCatName || (search ? `Resultados: "${search}"` : "Catálogo de Productos")}
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Ordenar por</span>
                <Select value={sortParam} onValueChange={handleSort}>
                  <SelectTrigger className="w-[200px] h-9 text-sm bg-secondary/50 border-primary/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SORT_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              {loading ? "Cargando..." : `${displayProducts.length} producto${displayProducts.length !== 1 ? "s" : ""}`}
            </p>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4] rounded-xl" />)}
              </div>
            ) : displayProducts.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-lg">No se encontraron productos</p>
                <p className="text-sm mt-1">Intenta ajustar los filtros</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {displayProducts.map((p: any) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default CatalogPage;
