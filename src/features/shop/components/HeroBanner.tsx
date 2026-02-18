import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBanners } from "@/features/shop/hooks/useBanners";
import { useIsMobile } from "@/hooks/use-mobile";

const fallbackSlides = [
  { title: "Laptops de Alto Rendimiento", subtitle: "Las mejores marcas al mejor precio en Ilo", cta_text: "Ver Laptops", image_desktop: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&h=500&fit=crop", link_url: "/catalogo?cat=laptops" },
  { title: "Cámaras de Seguridad", subtitle: "Protege tu hogar y negocio con tecnología de punta", cta_text: "Ver Cámaras", image_desktop: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=1200&h=500&fit=crop", link_url: "/catalogo?cat=camaras-seguridad" },
  { title: "Periféricos Profesionales", subtitle: "Teclados, mouse y más para gamers y oficina", cta_text: "Ver Periféricos", image_desktop: "https://images.unsplash.com/photo-1541140532154-b024d1c0c78e?w=1200&h=500&fit=crop", link_url: "/catalogo?cat=perifericos" },
];

const HeroBanner = () => {
  const { banners } = useBanners();
  const isMobile = useIsMobile();
  const [current, setCurrent] = useState(0);

  const slides = banners.length > 0
    ? banners.map((b) => ({
        title: b.title,
        subtitle: b.subtitle || "",
        cta_text: b.cta_text || "Ver más",
        image_desktop: isMobile && b.image_mobile ? b.image_mobile : b.image_desktop,
        link_url: b.link_url || "/catalogo",
      }))
    : fallbackSlides;

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), [slides.length]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), [slides.length]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  useEffect(() => {
    if (current >= slides.length) setCurrent(0);
  }, [slides.length, current]);

  return (
    <section className="relative overflow-hidden bg-card">
      <div className="relative h-[250px] sm:h-[400px] lg:h-[500px]">
        {slides.map((slide, i) => (
          <div key={i} className={`absolute inset-0 transition-all duration-700 ease-in-out ${i === current ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"}`}>
            <div className="absolute inset-0">
              <img src={slide.image_desktop} alt={slide.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
              <div className="absolute inset-0 bg-grid-pattern opacity-30" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
            </div>
            <div className="relative container h-full flex items-center">
              <div className="max-w-lg space-y-4 sm:space-y-5">
                <div className="inline-block px-3 py-1 text-xs font-display font-semibold text-primary border border-primary/30 rounded-full uppercase tracking-widest">
                  INFOCOM TECNOLOGY
                </div>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-display font-bold leading-tight tracking-wide">{slide.title}</h2>
                <p className="text-sm sm:text-lg text-muted-foreground font-body">{slide.subtitle}</p>
                <a href={slide.link_url}>
                  <Button size="lg" className="font-display font-semibold tracking-wider glow-green-sm">{slide.cta_text}</Button>
                </a>
              </div>
            </div>
          </div>
        ))}

        <Button variant="ghost" size="icon" className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-primary/20 backdrop-blur border border-primary/20" onClick={prev}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-primary/20 backdrop-blur border border-primary/20" onClick={next}>
          <ChevronRight className="h-5 w-5" />
        </Button>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={`h-1.5 rounded-full transition-all ${i === current ? "w-10 bg-primary glow-green-sm" : "w-3 bg-foreground/20"}`} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
