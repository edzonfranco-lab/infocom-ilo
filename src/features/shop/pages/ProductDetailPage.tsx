import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/features/shop/components/Header";
import Footer from "@/features/shop/components/Footer";
import WhatsAppButton from "@/features/shop/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CURRENCY, WHATSAPP_NUMBER } from "@/lib/types";
import type { Product } from "@/lib/types";
import { addToCart } from "@/lib/cart";
import { toast } from "sonner";
import { ShoppingCart, MessageCircle, ArrowLeft, Minus, Plus, Truck, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const ProductDetailPage = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("products")
        .select("*, categories(*), brands(*)")
        .eq("slug", slug)
        .single();
      if (data) {
        setProduct({ ...data, category: data.categories, brand: data.brands } as any);
      }
      setLoading(false);
    };
    if (slug) fetch();
  }, [slug]);

  const handleAddToCart = () => {
    if (!product) return;
    for (let i = 0; i < quantity; i++) addToCart(product as any);
    toast.success(`${product.name} (x${quantity}) agregado al carrito`);
  };

  const handleWhatsApp = () => {
    if (!product) return;
    const msg = `Hola! Me interesa: ${product.name} - ${CURRENCY}${Number(product.price).toLocaleString()}`;
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <Skeleton className="aspect-square rounded-xl" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-10 w-1/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          <p className="text-lg text-muted-foreground mb-4">Producto no encontrado</p>
          <Link to="/catalogo"><Button>Ver Catálogo</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const images = product.images?.length ? product.images : ["https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=600"];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 sm:py-8">
        <Link to="/catalogo" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-6">
          <ArrowLeft className="h-4 w-4" /> Volver al catálogo
        </Link>

        <div className="grid md:grid-cols-2 gap-6 lg:gap-10">
          {/* Images */}
          <div className="space-y-3">
            <div className="aspect-square rounded-xl overflow-hidden bg-secondary border border-primary/10">
              <img src={images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setSelectedImage(i)} className={`shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 transition-all ${i === selectedImage ? "border-primary glow-green-sm" : "border-transparent opacity-60 hover:opacity-100"}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              {product.brand && <p className="text-sm text-primary font-semibold uppercase tracking-wide">{product.brand.name}</p>}
              <h1 className="text-2xl sm:text-3xl font-display font-bold mt-1">{product.name}</h1>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-primary">{CURRENCY}{Number(product.price).toLocaleString()}</span>
              {product.original_price && <span className="text-lg text-muted-foreground line-through">{CURRENCY}{Number(product.original_price).toLocaleString()}</span>}
              {product.discount_percent && product.discount_percent > 0 && (
                <Badge className="bg-destructive text-destructive-foreground">-{product.discount_percent}%</Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${product.stock > 0 ? "text-green-500" : "text-destructive"}`}>
                {product.stock > 0 ? `${product.stock} en stock` : "Agotado"}
              </span>
              {product.sku && <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>}
            </div>

            {product.short_description && <p className="text-muted-foreground">{product.short_description}</p>}

            {/* Quantity + Add to Cart */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center border border-primary/20 rounded-lg">
                <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-10 text-center font-medium">{quantity}</span>
                <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button className="flex-1 glow-green-sm gap-2" size="lg" onClick={handleAddToCart} disabled={product.stock === 0}>
                <ShoppingCart className="h-5 w-5" />
                {product.stock === 0 ? "Agotado" : "Agregar al Carrito"}
              </Button>
            </div>

            <Button variant="outline" className="w-full gap-2" onClick={handleWhatsApp}>
              <MessageCircle className="h-5 w-5" /> Consultar por WhatsApp
            </Button>

            <div className="grid grid-cols-2 gap-3 pt-4">
              <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg text-sm">
                <Truck className="h-4 w-4 text-primary" /> Envío a todo Perú
              </div>
              <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg text-sm">
                <Shield className="h-4 w-4 text-primary" /> Garantía incluida
              </div>
            </div>

            {/* Specs */}
            {product.specifications && Object.keys(product.specifications).length > 0 && (
              <div className="pt-4">
                <h3 className="font-display font-semibold mb-3">Especificaciones</h3>
                <div className="space-y-2">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-primary/5 text-sm">
                      <span className="text-muted-foreground">{key}</span>
                      <span className="font-medium">{value as string}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {product.description && (
              <div className="pt-4">
                <h3 className="font-display font-semibold mb-2">Descripción</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default ProductDetailPage;
