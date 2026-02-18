import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CURRENCY, ORDER_STATUS_LABELS } from "@/lib/types";
import type { OrderStatus } from "@/lib/types";
import { toast } from "sonner";
import { Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400",
  confirmed: "bg-blue-500/20 text-blue-400",
  processing: "bg-purple-500/20 text-purple-400",
  shipped: "bg-orange-500/20 text-orange-400",
  delivered: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
};

const OrdersPage = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [filter, setFilter] = useState("all");

  const fetchAll = async () => {
    let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter as any);
    const { data } = await query;
    setOrders(data || []);
  };

  useEffect(() => { fetchAll(); }, [filter]);

  const viewOrder = async (order: any) => {
    setSelectedOrder(order);
    const { data } = await supabase.from("order_items").select("*").eq("order_id", order.id);
    setOrderItems(data || []);
  };

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    await supabase.from("orders").update({ status } as any).eq("id", orderId);
    toast.success("Estado actualizado");
    fetchAll();
    if (selectedOrder?.id === orderId) setSelectedOrder({ ...selectedOrder, status });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Pedidos ({orders.length})</h1>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {orders.map(o => (
          <Card key={o.id} className="border-primary/10">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="font-medium text-sm">{o.order_number}</p>
                <p className="text-xs text-muted-foreground">{o.customer_name} • {new Date(o.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={statusColors[o.status]}>{ORDER_STATUS_LABELS[o.status as OrderStatus]}</Badge>
                <span className="font-bold text-primary text-sm">{CURRENCY}{Number(o.total).toLocaleString()}</span>
                <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v as OrderStatus)}>
                  <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(ORDER_STATUS_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => viewOrder(o)}><Eye className="h-3 w-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {orders.length === 0 && <p className="text-center text-muted-foreground py-8">No hay pedidos</p>}
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Pedido {selectedOrder?.order_number}</DialogTitle></DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Cliente:</span> {selectedOrder.customer_name}</div>
                <div><span className="text-muted-foreground">Email:</span> {selectedOrder.customer_email}</div>
                <div><span className="text-muted-foreground">Teléfono:</span> {selectedOrder.customer_phone}</div>
                <div><span className="text-muted-foreground">Método:</span> {selectedOrder.payment_method}</div>
                <div className="col-span-2"><span className="text-muted-foreground">Dirección:</span> {selectedOrder.shipping_address}, {selectedOrder.shipping_city}</div>
              </div>
              <div className="border-t border-primary/10 pt-3">
                <p className="font-medium mb-2">Productos:</p>
                {orderItems.map(item => (
                  <div key={item.id} className="flex justify-between py-1">
                    <span>{item.product_name} x{item.quantity}</span>
                    <span className="font-medium">{CURRENCY}{Number(item.total_price).toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t border-primary/10 mt-2 pt-2 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-primary">{CURRENCY}{Number(selectedOrder.total).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersPage;
