import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CURRENCY } from "@/lib/types";
import { Package, ShoppingBag, DollarSign, Users, TrendingUp, AlertTriangle } from "lucide-react";

const DashboardPage = () => {
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, lowStock: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const [{ count: prodCount }, { count: orderCount }, { data: orders }, { count: lowStockCount }] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("products").select("*", { count: "exact", head: true }).lt("stock", 5),
      ]);

      const revenue = (orders || []).reduce((sum: number, o: any) => sum + Number(o.total), 0);
      setStats({ products: prodCount || 0, orders: orderCount || 0, revenue, lowStock: lowStockCount || 0 });
      setRecentOrders(orders || []);
    };
    fetch();
  }, []);

  const cards = [
    { title: "Productos", value: stats.products, icon: Package, color: "text-blue-400" },
    { title: "Pedidos", value: stats.orders, icon: ShoppingBag, color: "text-green-400" },
    { title: "Ingresos", value: `${CURRENCY}${stats.revenue.toLocaleString()}`, icon: DollarSign, color: "text-yellow-400" },
    { title: "Stock Bajo", value: stats.lowStock, icon: AlertTriangle, color: "text-red-400" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.title} className="border-primary/10">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-xl sm:text-2xl font-bold mt-1">{card.value}</p>
                </div>
                <card.icon className={`h-8 w-8 ${card.color} opacity-70`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle className="text-lg">Pedidos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay pedidos aún</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg text-sm">
                  <div>
                    <p className="font-medium">{order.order_number}</p>
                    <p className="text-xs text-muted-foreground">{order.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{CURRENCY}{Number(order.total).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground capitalize">{order.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
