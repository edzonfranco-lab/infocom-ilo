import ProductCard from "@/components/ProductCard";
import { Product } from "@/lib/constants";

interface ProductGridProps {
  title: string;
  subtitle?: string;
  products: Product[];
}

const ProductGrid = ({ title, subtitle, products }: ProductGridProps) => {
  return (
    <section className="py-12">
      <div className="container">
        <div className="mb-8">
          <h2 className="text-2xl sm:text-3xl font-display font-bold">{title}</h2>
          {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
          <div className="h-1 w-16 bg-primary rounded-full mt-3" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductGrid;
