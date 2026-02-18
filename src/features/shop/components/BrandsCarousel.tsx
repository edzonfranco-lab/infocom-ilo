import { useBrands } from "@/features/shop/hooks/useBrands";
import { MOCK_BRANDS } from "@/lib/constants";

const BrandsCarousel = () => {
  const { brands } = useBrands();
  const displayBrands = brands.length > 0
    ? brands.map(b => ({ name: b.name, logo: b.logo_url || "" }))
    : MOCK_BRANDS;
  const doubled = [...displayBrands, ...displayBrands];

  return (
    <section className="py-8 sm:py-12 overflow-hidden">
      <div className="container mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold">Marcas Asociadas</h2>
        <div className="h-1 w-16 bg-primary rounded-full mt-3" />
      </div>
      <div className="relative">
        <div className="flex animate-marquee gap-8 sm:gap-12 items-center">
          {doubled.map((brand, i) => (
            <div key={i} className="shrink-0 h-12 w-24 sm:h-16 sm:w-32 flex items-center justify-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300">
              <img src={brand.logo} alt={brand.name} className="max-h-full max-w-full object-contain" loading="lazy" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandsCarousel;
