import { ShoppingCart, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Product, CURRENCY } from "@/lib/constants";
import { addToCart } from "@/lib/cart";
import { toast } from "sonner";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product);
    toast.success(`${product.name} agregado al carrito`);
  };

  return (
    <Link to={`/producto/${product.id}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-card border-border h-full">
        <div className="relative aspect-square overflow-hidden bg-secondary">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.discount && (
              <Badge className="bg-destructive text-destructive-foreground text-xs font-bold">
                -{product.discount}%
              </Badge>
            )}
            {product.isNew && (
              <Badge className="bg-success text-success-foreground text-xs font-bold">
                Nuevo
              </Badge>
            )}
            {product.stock === 0 && (
              <Badge variant="secondary" className="text-xs font-bold">
                Agotado
              </Badge>
            )}
          </div>
          {/* Hover actions */}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
            <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full shadow-lg">
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardContent className="p-4 space-y-2">
          <p className="text-xs text-primary font-semibold uppercase tracking-wide">{product.brand}</p>
          <h3 className="text-sm font-medium line-clamp-2 min-h-[2.5rem] leading-tight">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">
              {CURRENCY}{product.price.toLocaleString()}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                {CURRENCY}{product.originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          <Button
            size="sm"
            className="w-full gap-2 mt-2"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
          >
            <ShoppingCart className="h-4 w-4" />
            {product.stock === 0 ? "Agotado" : "Agregar"}
          </Button>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProductCard;
