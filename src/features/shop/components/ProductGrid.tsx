import ProductCard from "@/features/shop/components/ProductCard";
import type { Product } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductGridProps {
  title: string;
  subtitle?: string;
  products: Product[];
  loading?: boolean;
}

const ProductGrid = ({ title, subtitle, products, loading }: ProductGridProps) => {
  return (
    <section className="py-8 sm:py-12 relative">
      <div className="container">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold tracking-wide">{title}</h2>
          {subtitle && <p className="text-muted-foreground mt-1 font-body text-sm sm:text-base">{subtitle}</p>}
          <div className="h-1 w-16 bg-gradient-to-r from-primary to-primary/30 rounded-full mt-3" />
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[3/4] rounded-xl" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-muted-foreground text-center py-12">No hay productos disponibles</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ProductGrid;
