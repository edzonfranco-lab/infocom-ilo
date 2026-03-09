import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ShoppingCart, Search, Plus, Minus, X, Trash2, Receipt, User, Loader2 } from "lucide-react";
import { CURRENCY, PAYMENT_METHOD_LABELS } from "@/lib/types";
import type { PaymentMethod } from "@/lib/types";
import { useAuth } from "@/features/auth/hooks/useAuth";

interface CartItem {
  product_id: string;
  name: string;
  image: string;
  price: number;
  stock: number;
  quantity: number;
}

const SalesPage = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [dniLoading, setDniLoading] = useState(false);

  const [customerForm, setCustomerForm] = useState({
    dni: "",
    nombre: "",
    direccion: "",
    telefono: "",
    email: "",
    metodo_pago: "" as string,
  });

  const { data: products = [] } = useQuery({
    queryKey: ["pos_products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, stock, images, short_description, is_active")
        .eq("is_active", true)
        .gt("stock", 0)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.short_description || "").toLowerCase().includes(q)
    );
  }, [products, search]);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(c => c.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          toast.error("Stock insuficiente");
          return prev;
        }
        return prev.map(c => c.product_id === product.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, {
        product_id: product.id,
        name: product.name,
        image: product.images?.[0] || "",
        price: product.price,
        stock: product.stock,
        quantity: 1,
      }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.product_id !== productId) return c;
      const newQty = c.quantity + delta;
      if (newQty <= 0) return c;
      if (newQty > c.stock) { toast.error("Stock insuficiente"); return c; }
      return { ...c, quantity: newQty };
    }));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(c => c.product_id !== productId));
  };

  const subtotal = cart.reduce((a, c) => a + c.price * c.quantity, 0);
  const total = subtotal;

  const lookupDNI = async () => {
    if (customerForm.dni.length !== 8) {
      toast.error("DNI debe tener 8 dígitos");
      return;
    }
    setDniLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("dni-lookup", {
        body: { dni: customerForm.dni },
      });
      if (error) throw error;
      if (data?.nombre) {
        setCustomerForm(prev => ({ ...prev, nombre: data.nombre }));
        toast.success("Datos encontrados");
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch {
      toast.error("Error al consultar DNI");
    }
    setDniLoading(false);
  };

  const handleCheckout = async () => {
    if (!customerForm.nombre) { toast.error("Nombre es requerido"); return; }
    if (!customerForm.metodo_pago) { toast.error("Selecciona método de pago"); return; }
    setProcessing(true);

    try {
      // Create transaction in accounting
      const { data: tx, error: txErr } = await supabase.from("transactions").insert({
        fecha: new Date().toISOString().split("T")[0],
        cliente_nombre: customerForm.nombre,
        cliente_telefono: customerForm.telefono || null,
        notas: `DNI: ${customerForm.dni || "N/A"} | Dir: ${customerForm.direccion || "N/A"} | Email: ${customerForm.email || "N/A"} | Pago: ${PAYMENT_METHOD_LABELS[customerForm.metodo_pago as PaymentMethod] || customerForm.metodo_pago}`,
        estado: "emitido" as any,
        emitido_en: new Date().toISOString(),
        emitido_por: user?.email || "POS",
        created_by: user?.id || null,
      }).select("id").single();
      if (txErr) throw txErr;

      // Create transaction items
      const itemPayload = cart.map(c => ({
        transaction_id: tx.id,
        item_type: "producto" as const,
        descripcion: c.name,
        referencia_id: c.product_id,
        cantidad: c.quantity,
        precio_unitario: c.price,
        subtotal: c.price * c.quantity,
      }));
      const { error: itemErr } = await supabase.from("transaction_items").insert(itemPayload as any);
      if (itemErr) throw itemErr;

      // Log history
      await supabase.from("transaction_history").insert({
        transaction_id: tx.id,
        accion: "venta_pos",
        detalles: { items: itemPayload, cliente: customerForm } as any,
        usuario_id: user?.id || null,
      });

      // Reduce stock
      for (const c of cart) {
        await supabase.from("products").update({ stock: c.stock - c.quantity } as any).eq("id", c.product_id);
      }

      toast.success("¡Venta registrada exitosamente!");
      setCart([]);
      setCheckoutOpen(false);
      setCustomerForm({ dni: "", nombre: "", direccion: "", telefono: "", email: "", metodo_pago: "" });
    } catch (e: any) {
      toast.error(e.message || "Error al procesar venta");
    }
    setProcessing(false);
  };

  return (
    <div className="flex gap-4 h-[calc(100vh-120px)]">
      {/* Left - Products */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-4">
          <h1 className="text-2xl font-display font-bold flex items-center gap-2 mb-3">
            <ShoppingCart className="h-6 w-6 text-primary" /> Punto de Venta
          </h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar producto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map(p => (
              <Card
                key={p.id}
                className="border-primary/10 cursor-pointer hover:border-primary/30 hover:shadow-md transition-all"
                onClick={() => addToCart(p)}
              >
                <CardContent className="p-3">
                  <div className="aspect-square bg-secondary/30 rounded-lg mb-2 overflow-hidden">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                        <ShoppingCart className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <p className="font-medium text-xs line-clamp-2 mb-1">{p.name}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary text-sm">{CURRENCY}{p.price.toLocaleString()}</span>
                    <Badge variant="outline" className="text-[10px]">Stock: {p.stock}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-12 text-muted-foreground">
                No se encontraron productos
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right - Cart */}
      <Card className="w-80 xl:w-96 shrink-0 flex flex-col border-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" /> Detalle de Venta
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col overflow-hidden p-4 pt-0">
          <div className="flex-1 overflow-y-auto space-y-2">
            {cart.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Selecciona productos</p>
              </div>
            )}
            {cart.map(c => (
              <div key={c.product_id} className="flex items-center gap-2 p-2 bg-secondary/30 rounded-lg">
                <div className="h-10 w-10 rounded bg-background overflow-hidden shrink-0">
                  {c.image ? <img src={c.image} alt="" className="w-full h-full object-cover" /> : <ShoppingCart className="w-full h-full p-2 text-muted-foreground/30" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{c.name}</p>
                  <p className="text-xs text-primary font-bold">{CURRENCY}{(c.price * c.quantity).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQty(c.product_id, -1)}>
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-xs font-bold w-6 text-center">{c.quantity}</span>
                  <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateQty(c.product_id, 1)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeFromCart(c.product_id)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-3 mt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{CURRENCY}{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">{CURRENCY}{total.toLocaleString()}</span>
            </div>
            <Button
              className="w-full gap-2"
              size="lg"
              disabled={cart.length === 0}
              onClick={() => setCheckoutOpen(true)}
            >
              <Receipt className="h-4 w-4" /> Generar Venta
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> Datos del Comprador
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>DNI</Label>
              <div className="flex gap-2">
                <Input
                  value={customerForm.dni}
                  onChange={e => setCustomerForm(prev => ({ ...prev, dni: e.target.value.replace(/\D/g, "").slice(0, 8) }))}
                  placeholder="12345678"
                  maxLength={8}
                />
                <Button
                  variant="outline"
                  onClick={lookupDNI}
                  disabled={dniLoading || customerForm.dni.length !== 8}
                  className="shrink-0"
                >
                  {dniLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nombre completo *</Label>
              <Input value={customerForm.nombre} onChange={e => setCustomerForm(prev => ({ ...prev, nombre: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input value={customerForm.direccion} onChange={e => setCustomerForm(prev => ({ ...prev, direccion: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Teléfono *</Label>
              <Input value={customerForm.telefono} onChange={e => setCustomerForm(prev => ({ ...prev, telefono: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Correo (opcional)</Label>
              <Input value={customerForm.email} onChange={e => setCustomerForm(prev => ({ ...prev, email: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Método de pago *</Label>
              <Select value={customerForm.metodo_pago} onValueChange={v => setCustomerForm(prev => ({ ...prev, metodo_pago: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccione una opción" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="bg-secondary/30 p-3 rounded-lg">
              <div className="flex justify-between font-bold text-lg">
                <span>TOTAL:</span>
                <span className="text-primary">{CURRENCY}{total.toLocaleString()}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{cart.length} producto(s)</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCheckoutOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleCheckout} disabled={processing} className="flex-1">
                {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Generar Venta
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesPage;
