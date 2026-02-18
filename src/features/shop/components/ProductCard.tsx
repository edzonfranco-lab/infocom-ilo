import { ShoppingCart, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CURRENCY } from "@/lib/types";
import type { Product } from "@/lib/types";
import { addToCart } from "@/lib/cart";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product as any);
    toast.success(`${product.name} agregado al carrito`);
  };

  const mainImage = product.images?.[0] || "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop";

  return (
    <Link to={`/producto/${product.slug}`}>
      <Card className="group overflow-hidden hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 bg-card border-primary/10 hover:border-primary/30 h-full">
        <div className="relative aspect-square overflow-hidden bg-secondary">
          <img src={mainImage} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.discount_percent && product.discount_percent > 0 && (
              <Badge className="bg-destructive text-destructive-foreground text-xs font-bold">-{product.discount_percent}%</Badge>
            )}
            {product.is_new && (
              <Badge className="bg-primary text-primary-foreground text-xs font-bold glow-green-sm">Nuevo</Badge>
            )}
            {product.stock === 0 && (
              <Badge variant="secondary" className="text-xs font-bold">Agotado</Badge>
            )}
          </div>
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full shadow-lg border border-primary/20">
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardContent className="p-3 sm:p-4 space-y-2">
          <p className="text-xs text-primary font-semibold uppercase tracking-wide">{product.brand?.name || ""}</p>
          <h3 className="text-sm font-medium line-clamp-2 min-h-[2.5rem] leading-tight">{product.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">{CURRENCY}{Number(product.price).toLocaleString()}</span>
            {product.original_price && (
              <span className="text-sm text-muted-foreground line-through">{CURRENCY}{Number(product.original_price).toLocaleString()}</span>
            )}
          </div>
          <Button size="sm" className="w-full gap-2 mt-2 glow-green-sm" onClick={handleAddToCart} disabled={product.stock === 0}>
            <ShoppingCart className="h-4 w-4" />
            {product.stock === 0 ? "Agotado" : "Agregar"}
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProductCard;
