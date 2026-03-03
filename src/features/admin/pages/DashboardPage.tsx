import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CURRENCY } from "@/lib/types";
import { Package, ShoppingBag, TrendingUp, AlertTriangle, Wrench, CalendarDays, Receipt } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const MONTHS_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--info, 200 80% 55%))", "hsl(var(--success, 142 71% 45%))", "hsl(var(--warning, 38 92% 50%))"];

const DashboardPage = () => {
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, lowStock: 0, pendingServices: 0, attendancePct: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [serviceStatusData, setServiceStatusData] = useState<any[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const now = new Date();
      const year = now.getFullYear();

      const [{ count: prodCount }, { count: orderCount }, { data: orders }, { count: lowStockCount }, { data: serviceOrders }] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("products").select("*", { count: "exact", head: true }).lt("stock", 5),
        supabase.from("service_orders").select("status"),
      ]);

      const revenue = (orders || []).reduce((sum: number, o: any) => sum + Number(o.total), 0);
      const pendingServices = (serviceOrders || []).filter((s: any) => s.status === "pending" || s.status === "in_progress").length;

      // Service status pie chart
      const statusCounts: Record<string, number> = {};
      (serviceOrders || []).forEach((s: any) => { statusCounts[s.status] = (statusCounts[s.status] || 0) + 1; });
      const statusLabels: Record<string, string> = { pending: "Pendiente", in_progress: "En Proceso", completed: "Completado", delivered: "Entregado", cancelled: "Cancelado", waiting_parts: "Esp. Repuestos" };
      setServiceStatusData(Object.entries(statusCounts).map(([k, v]) => ({ name: statusLabels[k] || k, value: v })));

      // Monthly data from NEW transactions table
      const monthlyArr: any[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(year, now.getMonth() - i, 1);
        const m = d.getMonth();
        const y = d.getFullYear();
        const start = `${y}-${String(m + 1).padStart(2, "0")}-01`;
        const end = `${y}-${String(m + 1).padStart(2, "0")}-${String(new Date(y, m + 1, 0).getDate()).padStart(2, "0")}`;

        const { data: txData } = await supabase
          .from("transactions")
          .select("subtotal_productos, subtotal_servicios")
          .eq("estado", "emitido")
          .gte("fecha", start)
          .lte("fecha", end);

        const salesTotal = (txData || []).reduce((s: number, r: any) => s + Number(r.subtotal_productos || 0), 0);
        const servicesTotal = (txData || []).reduce((s: number, r: any) => s + Number(r.subtotal_servicios || 0), 0);
        monthlyArr.push({ month: MONTHS_SHORT[m], ventas: salesTotal, servicios: servicesTotal });
      }
      setMonthlyData(monthlyArr);

      // Attendance % current month
      const mStart = `${year}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const mEnd = `${year}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(new Date(year, now.getMonth() + 1, 0).getDate()).padStart(2, "0")}`;
      const { data: attendanceData } = await supabase.from("attendance_records").select("status").gte("date", mStart).lte("date", mEnd);
      const totalRecs = (attendanceData || []).length;
      const presentRecs = (attendanceData || []).filter((r: any) => r.status === "A").length;
      const attPct = totalRecs > 0 ? Math.round((presentRecs / totalRecs) * 100) : 0;

      setStats({ products: prodCount || 0, orders: orderCount || 0, revenue, lowStock: lowStockCount || 0, pendingServices, attendancePct: attPct });
      setRecentOrders(orders || []);
    };
    fetchAll();
  }, []);

  const cards = [
    { title: "Productos", value: stats.products, icon: Package, color: "text-blue-400" },
    { title: "Pedidos", value: stats.orders, icon: ShoppingBag, color: "text-green-400" },
    { title: "Ingresos", value: `${CURRENCY}${stats.revenue.toLocaleString()}`, icon: Receipt, color: "text-yellow-400" },
    { title: "Stock Bajo", value: stats.lowStock, icon: AlertTriangle, color: "text-red-400" },
    { title: "Serv. Pendientes", value: stats.pendingServices, icon: Wrench, color: "text-purple-400" },
    { title: "Asistencia Mes", value: `${stats.attendancePct}%`, icon: CalendarDays, color: "text-cyan-400" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary" /> Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {cards.map((card) => (
          <Card key={card.title} className="border-primary/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{card.title}</p>
                  <p className="text-xl font-bold mt-1">{card.value}</p>
                </div>
                <card.icon className={`h-7 w-7 ${card.color} opacity-70`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-primary/10">
          <CardHeader><CardTitle className="text-lg">Ventas vs Servicios (últimos 6 meses)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `S/${v}`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [`S/ ${value.toFixed(2)}`, undefined]}
                />
                <Bar dataKey="ventas" fill={CHART_COLORS[0]} radius={[4,4,0,0]} name="Ventas" />
                <Bar dataKey="servicios" fill={CHART_COLORS[1]} radius={[4,4,0,0]} name="Servicios" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-primary/10">
          <CardHeader><CardTitle className="text-lg">Estado de Órdenes de Servicio</CardTitle></CardHeader>
          <CardContent>
            {serviceStatusData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No hay órdenes de servicio</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={serviceStatusData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {serviceStatusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/10">
        <CardHeader><CardTitle className="text-lg">Pedidos Recientes</CardTitle></CardHeader>
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
