import { Link } from "react-router-dom";
import { MOCK_CATEGORIES } from "@/lib/constants";
import { Laptop, Monitor, Keyboard, Projector, Printer, Package } from "lucide-react";

const icons: Record<string, any> = {
  laptops: Laptop,
  monitores: Monitor,
  perifericos: Keyboard,
  proyectores: Projector,
  impresoras: Printer,
  accesorios: Package,
};

const CategoryBar = () => {
  return (
    <section className="py-8 bg-secondary/30">
      <div className="container">
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
          {MOCK_CATEGORIES.map((cat) => {
            const Icon = icons[cat.slug] || Package;
            return (
              <Link
                key={cat.id}
                to={`/catalogo/${cat.slug}`}
                className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-card hover:shadow-md transition-all group"
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
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
