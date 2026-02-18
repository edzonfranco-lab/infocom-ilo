import Header from "@/features/shop/components/Header";
import HeroBanner from "@/features/shop/components/HeroBanner";
import CategoryBar from "@/features/shop/components/CategoryBar";
import ProductGrid from "@/features/shop/components/ProductGrid";
import Benefits from "@/features/shop/components/Benefits";
import BrandsCarousel from "@/features/shop/components/BrandsCarousel";
import WhatsAppButton from "@/features/shop/components/WhatsAppButton";
import Footer from "@/features/shop/components/Footer";
import { useProducts } from "@/features/shop/hooks/useProducts";
import { MOCK_PRODUCTS } from "@/lib/constants";

const HomePage = () => {
  const { products: featured, loading: loadingFeatured } = useProducts({ featured: true, limit: 10 });
  const { products: newProducts, loading: loadingNew } = useProducts({ isNew: true, limit: 10 });

  // Fallback to mock if DB is empty
  const featuredDisplay = featured.length > 0 ? featured : MOCK_PRODUCTS.filter(p => p.isFeatured).map(p => ({
    ...p, slug: p.id, images: [p.image], discount_percent: p.discount, brand: { id: '', name: p.brand, slug: '', is_active: true },
  })) as any;
  const newDisplay = newProducts.length > 0 ? newProducts : MOCK_PRODUCTS.filter(p => p.isNew).map(p => ({
    ...p, slug: p.id, images: [p.image], discount_percent: p.discount, brand: { id: '', name: p.brand, slug: '', is_active: true },
  })) as any;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroBanner />
        <CategoryBar />
        <ProductGrid title="Productos Destacados" subtitle="Los más vendidos de la temporada" products={featuredDisplay} loading={loadingFeatured} />
        <Benefits />
        <ProductGrid title="Recién Llegados" subtitle="Lo último en tecnología" products={newDisplay} loading={loadingNew} />
        <BrandsCarousel />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default HomePage;
