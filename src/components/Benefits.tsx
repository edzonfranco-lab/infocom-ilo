import { Truck, Shield, Headphones, Award } from "lucide-react";

const benefits = [
  { icon: Truck, title: "Envío Gratis", desc: "En compras mayores a S/800" },
  { icon: Shield, title: "Pago Seguro", desc: "Tus datos siempre protegidos" },
  { icon: Headphones, title: "Atención 24/7", desc: "Soporte por WhatsApp" },
  { icon: Award, title: "Garantía", desc: "Productos 100% originales" },
];

const Benefits = () => {
  return (
    <section className="py-10 bg-secondary/50">
      <div className="container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, i) => (
            <div key={i} className="flex items-center gap-3 p-4">
              <div className="shrink-0 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <b.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{b.title}</h3>
                <p className="text-xs text-muted-foreground">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
