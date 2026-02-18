import { Truck, Shield, Headphones, Award } from "lucide-react";

const benefits = [
  { icon: Truck, title: "Envío Gratis", desc: "En compras mayores a S/800" },
  { icon: Shield, title: "Pago Seguro", desc: "Tus datos siempre protegidos" },
  { icon: Headphones, title: "Atención 24/7", desc: "Soporte por WhatsApp" },
  { icon: Award, title: "Garantía", desc: "Productos 100% originales" },
];

const Benefits = () => {
  return (
    <section className="py-8 sm:py-10 bg-secondary/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      <div className="container relative">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {benefits.map((b, i) => (
            <div key={i} className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-card/50 border border-primary/10 hover:border-primary/30 transition-all hover:glow-green-sm">
              <div className="shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <b.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-xs sm:text-sm">{b.title}</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
