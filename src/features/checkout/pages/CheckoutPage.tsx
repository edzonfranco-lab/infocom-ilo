import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/features/shop/components/Header";
import Footer from "@/features/shop/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { clearCart } from "@/lib/cart";
import { CURRENCY, WHATSAPP_NUMBER, PAYMENT_METHOD_LABELS } from "@/lib/types";
import type { PaymentMethod } from "@/lib/types";
import { toast } from "sonner";
import { CreditCard, MessageCircle, Building2, Smartphone, ShoppingBag } from "lucide-react";

const paymentMethods: { value: PaymentMethod; label: string; icon: any }[] = [
  { value: "yape", label: "Yape", icon: Smartphone },
  { value: "plin", label: "Plin", icon: Smartphone },
  { value: "bank_transfer", label: "Transferencia Bancaria", icon: Building2 },
  { value: "mercadopago", label: "MercadoPago", icon: CreditCard },
  { value: "whatsapp", label: "Pedido por WhatsApp", icon: MessageCircle },
];

const CheckoutPage = () => {
  const { items, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Ilo");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("yape");

  const shipping = total >= 800 ? 0 : 20;
  const grandTotal = total + shipping;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (paymentMethod === "whatsapp") {
      const productList = items.map(i => `• ${i.product.name} x${i.quantity} - ${CURRENCY}${(Number(i.product.price) * i.quantity).toLocaleString()}`).join("\n");
      const msg = `¡Hola! Quiero hacer un pedido:\n\n${productList}\n\nTotal: ${CURRENCY}${grandTotal.toLocaleString()}\n\nNombre: ${name}\nTeléfono: ${phone}\nDirección: ${address}, ${city}`;
      window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
      clearCart();
      toast.success("Redirigiendo a WhatsApp...");
      navigate("/");
      return;
    }

    if (!user) {
      toast.error("Debes iniciar sesión para completar la compra");
      navigate("/login");
      return;
    }

    setLoading(true);
    const { data: order, error } = await supabase.from("orders").insert({
      user_id: user.id,
      customer_name: name,
      customer_email: email,
      customer_phone: phone,
      shipping_address: address,
      shipping_city: city,
      notes,
      payment_method: paymentMethod,
      subtotal: total,
      shipping_cost: shipping,
      total: grandTotal,
    } as any).select().single();

    if (error || !order) {
      toast.error("Error al crear el pedido");
      setLoading(false);
      return;
    }

    const orderItems = items.map(i => ({
      order_id: order.id,
      product_id: i.product.id,
      product_name: i.product.name,
      product_image: (i.product as any).images?.[0] || (i.product as any).image || "",
      quantity: i.quantity,
      unit_price: Number(i.product.price),
      total_price: Number(i.product.price) * i.quantity,
    }));

    await supabase.from("order_items").insert(orderItems as any);

    clearCart();
    setLoading(false);
    toast.success(`¡Pedido #${order.order_number} creado!`);
    navigate("/cuenta");
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-lg text-muted-foreground mb-4">Tu carrito está vacío</p>
          <Button onClick={() => navigate("/catalogo")}>Ver Catálogo</Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-display font-bold mb-6">Checkout</h1>
        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="p-6 bg-card rounded-xl border border-primary/10 space-y-4">
              <h2 className="font-display font-bold">Datos de Envío</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nombre completo *</Label><Input value={name} onChange={(e) => setName(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                <div className="space-y-2"><Label>Teléfono *</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} required /></div>
                <div className="space-y-2"><Label>Ciudad</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label>Dirección de envío *</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} required /></div>
              <div className="space-y-2"><Label>Notas</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Instrucciones adicionales..." rows={2} /></div>
            </div>

            <div className="p-6 bg-card rounded-xl border border-primary/10 space-y-4">
              <h2 className="font-display font-bold">Método de Pago</h2>
              <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                {paymentMethods.map((pm) => (
                  <div key={pm.value} className="flex items-center gap-3 p-3 rounded-lg border border-primary/10 hover:border-primary/30 transition-all">
                    <RadioGroupItem value={pm.value} id={pm.value} />
                    <Label htmlFor={pm.value} className="flex items-center gap-2 cursor-pointer flex-1">
                      <pm.icon className="h-4 w-4 text-primary" /> {pm.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="p-6 bg-card rounded-xl border border-primary/10 sticky top-24 space-y-4">
              <h2 className="font-display font-bold">Resumen del Pedido</h2>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {items.map((item) => (
                  <div key={item.product.id} className="flex justify-between text-sm">
                    <span className="line-clamp-1 flex-1">{item.product.name} x{item.quantity}</span>
                    <span className="font-medium ml-2">{CURRENCY}{(Number(item.product.price) * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-primary/10 pt-3 space-y-2">
                <div className="flex justify-between text-sm"><span>Subtotal</span><span>{CURRENCY}{total.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm"><span>Envío</span><span>{shipping === 0 ? "Gratis" : `${CURRENCY}${shipping}`}</span></div>
                <div className="flex justify-between font-display font-bold text-lg border-t border-primary/10 pt-2">
                  <span>Total</span><span className="text-primary">{CURRENCY}{grandTotal.toLocaleString()}</span>
                </div>
              </div>
              <Button type="submit" className="w-full glow-green-sm" size="lg" disabled={loading}>
                {loading ? "Procesando..." : "Confirmar Pedido"}
              </Button>
            </div>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default CheckoutPage;
