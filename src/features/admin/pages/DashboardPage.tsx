import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CURRENCY } from "@/lib/types";
import { Package, ShoppingBag, TrendingUp, AlertTriangle, Wrench, CalendarDays, Receipt, DollarSign, Users, ShoppingCart } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";

const MONTHS_SHORT = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const CHART_COLORS = ["hsl(var(--primary))", "hsl(142 71% 45%)", "hsl(200 80% 55%)", "hsl(38 92% 50%)", "hsl(280 65% 60%)", "hsl(0 72% 51%)"];

const DashboardPage = () => {
  const [stats, setStats] = useState({
    products: 0, orders: 0, revenue: 0, lowStock: 0, pendingServices: 0,
    attendancePct: 0, monthSales: 0, monthServices: 0, monthTotal: 0,
    totalTransactions: 0, activeStaff: 0, todaySales: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [serviceStatusData, setServiceStatusData] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  useEffect(() => {
    const fetchAll = async () => {
      const now = new Date();
      const year = now.getFullYear();
      const mStr = String(now.getMonth() + 1).padStart(2, "0");
      const today = now.toISOString().split("T")[0];
      const mStart = `${year}-${mStr}-01`;
      const mEnd = `${year}-${mStr}-${String(new Date(year, now.getMonth() + 1, 0).getDate()).padStart(2, "0")}`;

      const [
        { count: prodCount },
        { count: orderCount },
        { data: orders },
        { count: lowStockCount },
        { data: serviceOrders },
        { data: txMonth },
        { data: txToday },
        { count: staffCount },
        { data: recentTx },
        { data: attendanceData },
      ] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(5),
        supabase.from("products").select("*", { count: "exact", head: true }).lt("stock", 5),
        supabase.from("service_orders").select("status"),
        supabase.from("transactions").select("subtotal_productos, subtotal_servicios, total").eq("estado", "emitido").gte("fecha", mStart).lte("fecha", mEnd),
        supabase.from("transactions").select("total").eq("estado", "emitido").eq("fecha", today),
        supabase.from("staff_members").select("*", { count: "exact", head: true }).eq("is_active", true),
        supabase.from("transactions").select("*").eq("estado", "emitido").order("fecha", { ascending: false }).limit(10),
        supabase.from("attendance_records").select("status").gte("date", mStart).lte("date", mEnd),
      ]);

      const revenue = (orders || []).reduce((sum: number, o: any) => sum + Number(o.total), 0);
      const pendingServices = (serviceOrders || []).filter((s: any) => s.status === "pending" || s.status === "in_progress").length;

      // Service status pie chart
      const statusCounts: Record<string, number> = {};
      (serviceOrders || []).forEach((s: any) => { statusCounts[s.status] = (statusCounts[s.status] || 0) + 1; });
      const statusLabels: Record<string, string> = { pending: "Pendiente", in_progress: "En Proceso", completed: "Completado", delivered: "Entregado", cancelled: "Cancelado", waiting_parts: "Esp. Repuestos" };
      setServiceStatusData(Object.entries(statusCounts).map(([k, v]) => ({ name: statusLabels[k] || k, value: v })));

      // Monthly data
      const monthlyArr: any[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(year, now.getMonth() - i, 1);
        const m = d.getMonth(); const y = d.getFullYear();
        const start = `${y}-${String(m + 1).padStart(2, "0")}-01`;
        const end = `${y}-${String(m + 1).padStart(2, "0")}-${String(new Date(y, m + 1, 0).getDate()).padStart(2, "0")}`;
        const { data: txData } = await supabase.from("transactions").select("subtotal_productos, subtotal_servicios")
          .eq("estado", "emitido").gte("fecha", start).lte("fecha", end);
        const salesTotal = (txData || []).reduce((s: number, r: any) => s + Number(r.subtotal_productos || 0), 0);
        const servicesTotal = (txData || []).reduce((s: number, r: any) => s + Number(r.subtotal_servicios || 0), 0);
        monthlyArr.push({ month: MONTHS_SHORT[m], ventas: salesTotal, servicios: servicesTotal, total: salesTotal + servicesTotal });
      }
      setMonthlyData(monthlyArr);

      // Attendance
      const totalRecs = (attendanceData || []).length;
      const presentRecs = (attendanceData || []).filter((r: any) => r.status === "A").length;
      const attPct = totalRecs > 0 ? Math.round((presentRecs / totalRecs) * 100) : 0;

      // Month accounting
      const monthSales = (txMonth || []).reduce((a: number, t: any) => a + Number(t.subtotal_productos || 0), 0);
      const monthServices = (txMonth || []).reduce((a: number, t: any) => a + Number(t.subtotal_servicios || 0), 0);
      const monthTotal = (txMonth || []).reduce((a: number, t: any) => a + Number(t.total || 0), 0);
      const todaySales = (txToday || []).reduce((a: number, t: any) => a + Number(t.total || 0), 0);

      setStats({
        products: prodCount || 0, orders: orderCount || 0, revenue, lowStock: lowStockCount || 0,
        pendingServices, attendancePct: attPct, monthSales, monthServices, monthTotal,
        totalTransactions: (txMonth || []).length, activeStaff: staffCount || 0, todaySales,
      });
      setRecentOrders(orders || []);
      setRecentTransactions(recentTx || []);
    };
    fetchAll();
  }, []);

  const cards = [
    { title: "Ventas Hoy", value: `${CURRENCY}${stats.todaySales.toLocaleString()}`, icon: ShoppingCart, color: "text-green-400" },
    { title: "Ventas del Mes", value: `${CURRENCY}${stats.monthSales.toLocaleString()}`, icon: DollarSign, color: "text-emerald-400" },
    { title: "Servicios del Mes", value: `${CURRENCY}${stats.monthServices.toLocaleString()}`, icon: Wrench, color: "text-blue-400" },
    { title: "Total del Mes", value: `${CURRENCY}${stats.monthTotal.toLocaleString()}`, icon: TrendingUp, color: "text-primary" },
    { title: "Productos", value: stats.products, icon: Package, color: "text-cyan-400" },
    { title: "Stock Bajo", value: stats.lowStock, icon: AlertTriangle, color: "text-red-400" },
    { title: "Serv. Pendientes", value: stats.pendingServices, icon: Wrench, color: "text-purple-400" },
    { title: "Personal Activo", value: stats.activeStaff, icon: Users, color: "text-orange-400" },
    { title: "Asistencia Mes", value: `${stats.attendancePct}%`, icon: CalendarDays, color: "text-cyan-400" },
    { title: "Pedidos Online", value: stats.orders, icon: ShoppingBag, color: "text-indigo-400" },
    { title: "Transacciones Mes", value: stats.totalTransactions, icon: Receipt, color: "text-yellow-400" },
    { title: "Ingresos Online", value: `${CURRENCY}${stats.revenue.toLocaleString()}`, icon: Receipt, color: "text-pink-400" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold flex items-center gap-2"><TrendingUp className="h-6 w-6 text-primary" /> Dashboard</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {cards.map((card) => (
          <Card key={card.title} className="border-primary/10">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{card.title}</p>
                  <p className="text-lg font-bold mt-0.5">{card.value}</p>
                </div>
                <card.icon className={`h-6 w-6 ${card.color} opacity-70`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card className="border-primary/10">
          <CardHeader className="pb-2"><CardTitle className="text-base">Ingresos (6 meses)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `S/${v}`} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} formatter={(value: number) => [`S/ ${value.toFixed(2)}`, undefined]} />
                <Bar dataKey="ventas" fill={CHART_COLORS[0]} radius={[4,4,0,0]} name="Ventas" />
                <Bar dataKey="servicios" fill={CHART_COLORS[2]} radius={[4,4,0,0]} name="Servicios" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trend Line */}
        <Card className="border-primary/10">
          <CardHeader className="pb-2"><CardTitle className="text-base">Tendencia Total</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v) => `S/${v}`} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} formatter={(value: number) => [`S/ ${value.toFixed(2)}`, undefined]} />
                <Line type="monotone" dataKey="total" stroke={CHART_COLORS[0]} strokeWidth={3} dot={{ r: 5 }} name="Total" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Service Pie */}
        <Card className="border-primary/10">
          <CardHeader className="pb-2"><CardTitle className="text-base">Órdenes de Servicio</CardTitle></CardHeader>
          <CardContent>
            {serviceStatusData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">No hay órdenes</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={serviceStatusData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {serviceStatusData.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Legend />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card className="border-primary/10">
          <CardHeader className="pb-2"><CardTitle className="text-base">Últimas Transacciones</CardTitle></CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No hay transacciones</p>
            ) : (
              <div className="space-y-2">
                {recentTransactions.slice(0, 8).map((tx: any) => (
                  <div key={tx.id} className="flex items-center justify-between p-2 bg-secondary/30 rounded-lg text-xs">
                    <div>
                      <p className="font-medium">{tx.cliente_nombre || "Sin cliente"}</p>
                      <p className="text-muted-foreground">{tx.fecha} • {tx.tipo_general === "venta" ? "🛒" : tx.tipo_general === "servicio" ? "🔧" : "📦"} {tx.tipo_general}</p>
                    </div>
                    <span className="font-bold text-primary">{CURRENCY}{Number(tx.total).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Online Orders */}
      <Card className="border-primary/10">
        <CardHeader className="pb-2"><CardTitle className="text-base">Pedidos Online Recientes</CardTitle></CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay pedidos</p>
          ) : (
            <div className="space-y-2">
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
