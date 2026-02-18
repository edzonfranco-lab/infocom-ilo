import Header from "@/features/shop/components/Header";
import Footer from "@/features/shop/components/Footer";
import WhatsAppButton from "@/features/shop/components/WhatsAppButton";
import { COMPANY_INFO, COMPANY_NAME } from "@/lib/types";
import { Target, Eye, MapPin, Clock } from "lucide-react";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <section className="py-12 sm:py-20 relative">
          <div className="absolute inset-0 bg-grid-pattern opacity-20" />
          <div className="container relative">
            <h1 className="text-3xl sm:text-4xl font-display font-bold text-center mb-4">Sobre Nosotros</h1>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">{COMPANY_INFO.description}</p>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="p-6 sm:p-8 bg-card rounded-2xl border border-primary/10 hover:border-primary/30 transition-all hover:glow-green-sm">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-display font-bold mb-3 text-primary">Misión</h2>
                <p className="text-muted-foreground leading-relaxed text-sm">{COMPANY_INFO.mission}</p>
              </div>
              <div className="p-6 sm:p-8 bg-card rounded-2xl border border-primary/10 hover:border-primary/30 transition-all hover:glow-green-sm">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Eye className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-display font-bold mb-3 text-primary">Visión</h2>
                <p className="text-muted-foreground leading-relaxed text-sm">{COMPANY_INFO.vision}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto mt-12">
              <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-primary/10">
                <MapPin className="h-8 w-8 text-primary shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm">Ubicación</h3>
                  <p className="text-xs text-muted-foreground">Ilo, Moquegua - Perú</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-primary/10">
                <Clock className="h-8 w-8 text-primary shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm">Experiencia</h3>
                  <p className="text-xs text-muted-foreground">+11 años en el mercado</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default AboutPage;
