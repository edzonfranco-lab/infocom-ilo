import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { removeFromCart, updateCartQuantity, clearCart } from "@/lib/cart";
import { CURRENCY } from "@/lib/types";
import { Link } from "react-router-dom";

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

const CartDrawer = ({ open, onClose }: CartDrawerProps) => {
  const { items, total, count } = useCart();

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-display flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" /> Carrito ({count})
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-muted-foreground">
            <ShoppingBag className="h-16 w-16 opacity-30" />
            <p>Tu carrito está vacío</p>
            <Button variant="outline" onClick={onClose}>Seguir Comprando</Button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-3 py-4">
              {items.map((item) => {
                const img = (item.product as any).images?.[0] || (item.product as any).image || "";
                return (
                  <div key={item.product.id} className="flex gap-3 p-3 bg-secondary/30 rounded-lg border border-primary/10">
                    <img src={img} alt={item.product.name} className="h-16 w-16 object-cover rounded-md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{item.product.name}</p>
                      <p className="text-sm font-bold text-primary">{CURRENCY}{Number(item.product.price).toLocaleString()}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm w-6 text-center">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive ml-auto" onClick={() => removeFromCart(item.product.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-primary/10 pt-4 space-y-3">
              <div className="flex justify-between font-display text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">{CURRENCY}{total.toLocaleString()}</span>
              </div>
              <Link to="/checkout" onClick={onClose}>
                <Button className="w-full glow-green-sm font-display" size="lg">Ir al Checkout</Button>
              </Link>
              <Button variant="outline" size="sm" className="w-full" onClick={() => clearCart()}>Vaciar Carrito</Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
