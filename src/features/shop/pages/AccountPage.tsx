import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/features/shop/components/Header";
import Footer from "@/features/shop/components/Footer";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CURRENCY, ORDER_STATUS_LABELS } from "@/lib/types";
import type { Order } from "@/lib/types";
import { User, Package, LogOut, Settings } from "lucide-react";
import { toast } from "sonner";

const AccountPage = () => {
  const { user, signOut, isAdmin } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setOrders((data || []) as Order[]);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast.success("Sesión cerrada");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container py-20 text-center">
          <p className="mb-4">Debes iniciar sesión</p>
          <Link to="/login"><Button>Iniciar Sesión</Button></Link>
        </div>
        <Footer />
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400",
    confirmed: "bg-blue-500/20 text-blue-400",
    processing: "bg-purple-500/20 text-purple-400",
    shipped: "bg-orange-500/20 text-orange-400",
    delivered: "bg-green-500/20 text-green-400",
    cancelled: "bg-red-500/20 text-red-400",
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 sm:py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold">Mi Cuenta</h1>
          <div className="flex gap-2">
            {isAdmin && <Link to="/admin"><Button variant="outline" size="sm"><Settings className="h-4 w-4 mr-1" /> Admin</Button></Link>}
            <Button variant="outline" size="sm" onClick={handleSignOut}><LogOut className="h-4 w-4 mr-1" /> Salir</Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg"><User className="h-5 w-5 text-primary" /> Perfil</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p><span className="text-muted-foreground">Email:</span> {user.email}</p>
              <p><span className="text-muted-foreground">Miembro desde:</span> {new Date(user.created_at).toLocaleDateString()}</p>
            </CardContent>
          </Card>

          <div className="md:col-span-2">
            <h2 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" /> Mis Pedidos
            </h2>
            {loading ? (
              <p className="text-muted-foreground">Cargando...</p>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No tienes pedidos aún</p>
                <Link to="/catalogo"><Button variant="outline" className="mt-4">Ver Catálogo</Button></Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <Card key={order.id} className="border-primary/10">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">{new Date(order.created_at!).toLocaleDateString()}</p>
                      </div>
                      <Badge className={statusColors[order.status] || ""}>{ORDER_STATUS_LABELS[order.status]}</Badge>
                      <span className="font-bold text-primary">{CURRENCY}{Number(order.total).toLocaleString()}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AccountPage;
