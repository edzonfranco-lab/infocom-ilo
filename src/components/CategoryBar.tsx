import { Link } from "react-router-dom";
import { MOCK_CATEGORIES } from "@/lib/constants";
import { Laptop, Monitor, Keyboard, Projector, Printer, Package, Camera, Shield } from "lucide-react";

const icons: Record<string, any> = {
  laptops: Laptop,
  monitores: Monitor,
  perifericos: Keyboard,
  "camaras-seguridad": Camera,
  proyectores: Projector,
  impresoras: Printer,
  accesorios: Package,
};

const CategoryBar = () => {
  return (
    <section className="py-8 bg-secondary/20 relative">
      <div className="absolute inset-0 bg-cyber-lines" />
      <div className="container relative">
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {MOCK_CATEGORIES.map((cat) => {
            const Icon = icons[cat.slug] || Package;
            return (
              <Link
                key={cat.id}
                to={`/catalogo/${cat.slug}`}
                className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-card/80 border border-transparent hover:border-primary/20 transition-all group hover:glow-green-sm"
              >
                <div className="h-12 w-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-all">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-xs font-medium text-center">{cat.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryBar;
