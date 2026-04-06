import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Plus, Trash2, PackagePlus, ChevronsUpDown, Check, ShoppingBag, PackageCheck, Eye } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";

interface PurchaseItem {
  product_id?: string | null;
  product_name: string;
  quantity: number;
  unit_cost: number;
  subtotal: number;
}

const PurchasesPage = () => {
  const qc = useQueryClient();
  const { isAdmin, user } = useAuth();
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [viewingPurchase, setViewingPurchase] = useState<any>(null);
  const [form, setForm] = useState({ supplier_id: "", order_date: new Date().toISOString().split("T")[0], arrival_date: "", notes: "" });
  const [items, setItems] = useState<PurchaseItem[]>([]);

  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ["purchases"],
    queryFn: async () => {
      const { data, error } = await supabase.from("purchases").select("*, suppliers(name), purchase_items(*)").order("order_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers_active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("id, name, company").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products_for_purchases"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name, cost_price, price, sku").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (items.length === 0) throw new Error("Agrega al menos un producto");
      const total = items.reduce((a, i) => a + i.subtotal, 0);
      const { data: purchase, error } = await supabase.from("purchases").insert({
        supplier_id: form.supplier_id || null,
        order_date: form.order_date,
        arrival_date: form.arrival_date || null,
        notes: form.notes || null,
        total,
        status: form.arrival_date ? "recibido" : "pendiente",
        created_by: user?.id || null,
      } as any).select("id").single();
      if (error) throw error;

      const itemPayload = items.map(it => ({
        purchase_id: purchase.id,
        product_id: it.product_id || null,
        product_name: it.product_name,
        quantity: it.quantity,
        unit_cost: it.unit_cost,
        subtotal: it.subtotal,
      }));
      const { error: ie } = await supabase.from("purchase_items").insert(itemPayload as any);
      if (ie) throw ie;

      // If arrival_date is set, increase stock + log kardex
      if (form.arrival_date) {
        for (const it of items) {
          if (it.product_id) {
            // Get current stock
            const { data: prod } = await supabase.from("products").select("stock").eq("id", it.product_id).single();
            const stockBefore = prod?.stock || 0;
            const stockAfter = stockBefore + it.quantity;
            await supabase.from("products").update({ stock: stockAfter } as any).eq("id", it.product_id);
            await supabase.from("inventory_movements").insert({
              product_id: it.product_id,
              product_name: it.product_name,
              movement_type: "entrada",
              quantity: it.quantity,
              reference_type: "compra",
              reference_id: purchase.id,
              stock_before: stockBefore,
              stock_after: stockAfter,
              created_by: user?.id || null,
            } as any);
          }
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchases"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Compra registrada");
      closeForm();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const receiveeMutation = useMutation({
    mutationFn: async (purchaseId: string) => {
      const purchase = purchases.find((p: any) => p.id === purchaseId);
      if (!purchase) throw new Error("Compra no encontrada");
      
      const { error } = await supabase.from("purchases").update({
        status: "recibido",
        arrival_date: new Date().toISOString().split("T")[0],
      } as any).eq("id", purchaseId);
      if (error) throw error;

      // Increase stock for each item
      for (const it of purchase.purchase_items || []) {
        if (it.product_id) {
          const { data: prod } = await supabase.from("products").select("stock").eq("id", it.product_id).single();
          const stockBefore = prod?.stock || 0;
          const stockAfter = stockBefore + it.quantity;
          await supabase.from("products").update({ stock: stockAfter } as any).eq("id", it.product_id);
          await supabase.from("inventory_movements").insert({
            product_id: it.product_id,
            product_name: it.product_name,
            movement_type: "entrada",
            quantity: it.quantity,
            reference_type: "compra",
            reference_id: purchaseId,
            stock_before: stockBefore,
            stock_after: stockAfter,
            created_by: user?.id || null,
          } as any);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchases"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Compra recibida — Stock actualizado");
    },
  });

  const closeForm = () => {
    setFormOpen(false);
    setForm({ supplier_id: "", order_date: new Date().toISOString().split("T")[0], arrival_date: "", notes: "" });
    setItems([]);
  };

  const addItem = () => setItems([...items, { product_name: "", quantity: 1, unit_cost: 0, subtotal: 0 }]);

  const updateItem = (idx: number, partial: Partial<PurchaseItem>) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== idx) return it;
      const updated = { ...it, ...partial };
      updated.subtotal = updated.quantity * updated.unit_cost;
      return updated;
    }));
  };

  const totalCompra = items.reduce((a, i) => a + i.subtotal, 0);

  const STATUS_COLORS: Record<string, "default" | "secondary" | "destructive"> = {
    recibido: "default", pendiente: "secondary", cancelado: "destructive",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-primary" /> Compras
        </h1>
        {isAdmin && (
          <Button className="gap-2" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" /> Nueva Compra
          </Button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-primary/20"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-primary">{purchases.length}</p>
          <p className="text-xs text-muted-foreground">Total Compras</p>
        </CardContent></Card>
        <Card className="border-success/20"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-success">{purchases.filter((p: any) => p.status === "recibido").length}</p>
          <p className="text-xs text-muted-foreground">Recibidas</p>
        </CardContent></Card>
        <Card className="border-warning/20"><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-amber-500">{purchases.filter((p: any) => p.status === "pendiente").length}</p>
          <p className="text-xs text-muted-foreground">Pendientes</p>
        </CardContent></Card>
      </div>

      {/* Purchases list */}
      <div className="border border-border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha Pedido</TableHead>
              <TableHead>Proveedor</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">Cargando...</TableCell></TableRow>
            ) : purchases.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No hay compras registradas</TableCell></TableRow>
            ) : purchases.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell className="whitespace-nowrap">{new Date(p.order_date + "T12:00:00").toLocaleDateString("es-PE")}</TableCell>
                <TableCell>{p.suppliers?.name || "—"}</TableCell>
                <TableCell>{p.purchase_items?.length || 0} items</TableCell>
                <TableCell><Badge variant={STATUS_COLORS[p.status] || "secondary"}>{p.status}</Badge></TableCell>
                <TableCell className="text-right font-bold">S/. {Number(p.total).toFixed(2)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setViewingPurchase(p); setDetailOpen(true); }}>
                      <Eye className="h-3 w-3" />
                    </Button>
                    {p.status === "pendiente" && isAdmin && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-success" onClick={() => { if (confirm("¿Marcar como recibido? Esto sumará stock.")) receiveeMutation.mutate(p.id); }}>
                        <PackageCheck className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* New Purchase Dialog */}
      <Dialog open={formOpen} onOpenChange={o => { if (!o) closeForm(); else setFormOpen(true); }}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><PackagePlus className="h-5 w-5 text-primary" /> Nueva Compra</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Proveedor</Label>
                <Select value={form.supplier_id} onValueChange={v => setForm({ ...form, supplier_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar proveedor" /></SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}{s.company ? ` — ${s.company}` : ""}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Fecha Pedido *</Label><Input type="date" value={form.order_date} onChange={e => setForm({ ...form, order_date: e.target.value })} /></div>
              <div><Label>Fecha Llegada</Label><Input type="date" value={form.arrival_date} onChange={e => setForm({ ...form, arrival_date: e.target.value })} /><p className="text-[10px] text-muted-foreground mt-1">Si pones fecha, se marca como recibido y suma stock</p></div>
              <div><Label>Notas</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            </div>

            {/* Items */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-base font-bold">Productos</Label>
                <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addItem}>
                  <Plus className="h-3 w-3" /> Agregar
                </Button>
              </div>
              {items.map((item, idx) => (
                <div key={idx} className="border border-border rounded-lg p-3 grid grid-cols-[1fr_80px_100px_90px_auto] gap-2 items-end">
                  <div>
                    <Label className="text-xs">Producto</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="h-9 text-xs w-full justify-between font-normal">
                          {item.product_name || "Seleccionar..."}<ChevronsUpDown className="h-3 w-3 ml-1 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Buscar..." className="h-9" />
                          <CommandList>
                            <CommandEmpty>No encontrado</CommandEmpty>
                            <CommandGroup>
                              {products.map((p: any) => (
                                <CommandItem key={p.id} value={`${p.name} ${p.sku || ""}`} onSelect={() => updateItem(idx, { product_id: p.id, product_name: p.name, unit_cost: Number(p.cost_price || p.price) || 0 })}>
                                  <Check className={`h-3 w-3 mr-2 ${item.product_id === p.id ? "opacity-100" : "opacity-0"}`} />
                                  <span className="text-xs">{p.name}</span>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                            <CommandGroup heading="Manual">
                              <CommandItem onSelect={() => updateItem(idx, { product_id: null, product_name: "" })}>Escribir manualmente</CommandItem>
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {!item.product_id && (
                      <Input value={item.product_name} onChange={e => updateItem(idx, { product_name: e.target.value })} placeholder="Nombre..." className="h-8 text-xs mt-1" />
                    )}
                  </div>
                  <div><Label className="text-xs">Cant.</Label><Input type="number" min="1" value={item.quantity} onChange={e => updateItem(idx, { quantity: parseInt(e.target.value) || 1 })} className="h-9 text-xs" /></div>
                  <div><Label className="text-xs">Costo Unit.</Label><Input type="number" step="0.01" value={item.unit_cost} onChange={e => updateItem(idx, { unit_cost: parseFloat(e.target.value) || 0 })} className="h-9 text-xs" /></div>
                  <div className="text-right"><Label className="text-xs">Subtotal</Label><p className="h-9 flex items-center justify-end font-bold text-sm text-primary">S/. {item.subtotal.toFixed(2)}</p></div>
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 text-destructive" onClick={() => setItems(items.filter((_, i) => i !== idx))}><Trash2 className="h-3 w-3" /></Button>
                </div>
              ))}
              {items.length > 0 && (
                <div className="text-right font-bold text-lg text-primary">Total: S/. {totalCompra.toFixed(2)}</div>
              )}
            </div>

            <Button onClick={() => saveMutation.mutate()} disabled={items.length === 0 || saveMutation.isPending} className="w-full">
              Registrar Compra
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Detalle de Compra</DialogTitle></DialogHeader>
          {viewingPurchase && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground">Proveedor:</span> <span className="font-bold">{viewingPurchase.suppliers?.name || "—"}</span></div>
                <div><span className="text-muted-foreground">Estado:</span> <Badge variant={STATUS_COLORS[viewingPurchase.status]}>{viewingPurchase.status}</Badge></div>
                <div><span className="text-muted-foreground">Pedido:</span> <span className="font-bold">{viewingPurchase.order_date}</span></div>
                {viewingPurchase.arrival_date && <div><span className="text-muted-foreground">Llegada:</span> <span className="font-bold">{viewingPurchase.arrival_date}</span></div>}
              </div>
              {viewingPurchase.purchase_items?.map((it: any) => (
                <div key={it.id} className="flex justify-between border-b border-border pb-1">
                  <span>{it.product_name} × {it.quantity}</span>
                  <span className="font-bold">S/. {Number(it.subtotal).toFixed(2)}</span>
                </div>
              ))}
              <div className="text-right font-bold text-primary text-lg">Total: S/. {Number(viewingPurchase.total).toFixed(2)}</div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PurchasesPage;
