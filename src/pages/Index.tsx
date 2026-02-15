import Header from "@/components/Header";
import HeroBanner from "@/components/HeroBanner";
import CategoryBar from "@/components/CategoryBar";
import ProductGrid from "@/components/ProductGrid";
import Benefits from "@/components/Benefits";
import BrandsCarousel from "@/components/BrandsCarousel";
import WhatsAppButton from "@/components/WhatsAppButton";
import Footer from "@/components/Footer";
import { MOCK_PRODUCTS } from "@/lib/constants";

const Index = () => {
  const featured = MOCK_PRODUCTS.filter((p) => p.isFeatured);
  const newProducts = MOCK_PRODUCTS.filter((p) => p.isNew);

  return (
    <div className="min-h-screen bg-background dark">
      <Header />
      <main>
        <HeroBanner />
        <CategoryBar />
        <ProductGrid
          title="Productos Destacados"
          subtitle="Los más vendidos de la temporada"
          products={featured}
        />
        <Benefits />
        <ProductGrid
          title="Recién Llegados"
          subtitle="Lo último en tecnología"
          products={newProducts}
        />
        <BrandsCarousel />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
