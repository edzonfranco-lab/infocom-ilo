import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const slides = [
  {
    title: "Laptops de Alto Rendimiento",
    subtitle: "Las mejores marcas al mejor precio",
    cta: "Ver Laptops",
    bg: "from-primary/20 to-primary/5",
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=1200&h=500&fit=crop",
  },
  {
    title: "Monitores Gaming",
    subtitle: "Hasta 250Hz de tasa de refresco",
    cta: "Ver Monitores",
    bg: "from-accent/20 to-accent/5",
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=1200&h=500&fit=crop",
  },
  {
    title: "Periféricos Profesionales",
    subtitle: "Teclados, mouse y más para gamers y oficina",
    cta: "Ver Periféricos",
    bg: "from-success/20 to-success/5",
    image: "https://images.unsplash.com/photo-1541140532154-b024d1c0c78e?w=1200&h=500&fit=crop",
  },
];

const HeroBanner = () => {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), []);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <section className="relative overflow-hidden bg-card">
      <div className="relative h-[300px] sm:h-[400px] lg:h-[480px]">
        {slides.map((slide, i) => (
          <div
            key={i}
            className={`absolute inset-0 transition-all duration-700 ease-in-out ${
              i === current ? "opacity-100 translate-x-0" : "opacity-0 translate-x-full"
            }`}
          >
            <div className="absolute inset-0">
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
            </div>
            <div className="relative container h-full flex items-center">
              <div className="max-w-lg space-y-4">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold leading-tight">
                  {slide.title}
                </h2>
                <p className="text-lg text-muted-foreground">{slide.subtitle}</p>
                <Button size="lg" className="font-semibold">
                  {slide.cta}
                </Button>
              </div>
            </div>
          </div>
        ))}

        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80 backdrop-blur"
          onClick={prev}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-background/50 hover:bg-background/80 backdrop-blur"
          onClick={next}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 rounded-full transition-all ${
                i === current ? "w-8 bg-primary" : "w-2 bg-foreground/30"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
