import { MOCK_BRANDS } from "@/lib/constants";

const BrandsCarousel = () => {
  const doubled = [...MOCK_BRANDS, ...MOCK_BRANDS];

  return (
    <section className="py-12 overflow-hidden">
      <div className="container mb-8">
        <h2 className="text-2xl sm:text-3xl font-display font-bold">Marcas Asociadas</h2>
        <div className="h-1 w-16 bg-primary rounded-full mt-3" />
      </div>
      <div className="relative">
        <div className="flex animate-marquee gap-12 items-center">
          {doubled.map((brand, i) => (
            <div
              key={i}
              className="shrink-0 h-16 w-32 flex items-center justify-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition-all duration-300"
            >
              <img
                src={brand.logo}
                alt={brand.name}
                className="max-h-full max-w-full object-contain"
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandsCarousel;
