import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Truck, Building2, Phone, Mail, MapPin, User, FileText, Package, Eye } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";

interface Supplier {
  id: string;
  name: string;
  company: string | null;
  ruc: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  contact_person: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
}

const emptyForm = {
  name: "", company: "", ruc: "", phone: "", email: "", address: "", contact_person: "", notes: "", is_active: true,
};

const SuppliersPage = () => {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [filterActive, setFilterActive] = useState("all");

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*").order("name");
      if (error) throw error;
      return data as Supplier[];
    },
  });

  // Purchase history for selected supplier
  const { data: purchaseHistory = [] } = useQuery({
    queryKey: ["supplier_purchases", selectedSupplier?.id],
    enabled: !!selectedSupplier,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("*, purchase_items(*)")
        .eq("supplier_id", selectedSupplier!.id)
        .order("order_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        company: form.company || null,
        ruc: form.ruc || null,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
        contact_person: form.contact_person || null,
        notes: form.notes || null,
        is_active: form.is_active,
      };
      if (editing) {
        const { error } = await supabase.from("suppliers").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("suppliers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success(editing ? "Proveedor actualizado" : "Proveedor creado");
      closeDialog();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("suppliers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Proveedor eliminado");
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditing(null);
    setForm(emptyForm);
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({
      name: s.name, company: s.company || "", ruc: s.ruc || "", phone: s.phone || "",
      email: s.email || "", address: s.address || "", contact_person: s.contact_person || "",
      notes: s.notes || "", is_active: s.is_active,
    });
    setDialogOpen(true);
  };

  const openHistory = (s: Supplier) => {
    setSelectedSupplier(s);
    setHistoryOpen(true);
  };

  const filtered = suppliers.filter(s => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.company?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterActive === "active" && !s.is_active) return false;
    if (filterActive === "inactive" && s.is_active) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Truck className="h-6 w-6 text-primary" /> Proveedores ({suppliers.length})
        </h1>
        {isAdmin && (
          <Button className="gap-2" onClick={() => { setForm(emptyForm); setEditing(null); setDialogOpen(true); }}>
            <Plus className="h-4 w-4" /> Nuevo Proveedor
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 max-w-[220px] bg-secondary/50" />
        </div>
        <div className="flex gap-1">
          {["all", "active", "inactive"].map(v => (
            <Button key={v} variant={filterActive === v ? "default" : "outline"} size="sm" onClick={() => setFilterActive(v)}>
              {v === "all" ? "Todos" : v === "active" ? "Activos" : "Inactivos"}
            </Button>
          ))}
        </div>
      </div>

      {/* Suppliers list */}
      {isLoading ? <p>Cargando...</p> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map(s => (
            <Card key={s.id} className={`border-primary/10 ${!s.is_active ? "opacity-60" : ""}`}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm">{s.name}</h3>
                    {s.company && <p className="text-xs text-muted-foreground flex items-center gap-1"><Building2 className="h-3 w-3" /> {s.company}</p>}
                  </div>
                  <Badge variant={s.is_active ? "default" : "secondary"}>{s.is_active ? "Activo" : "Inactivo"}</Badge>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {s.ruc && <p>RUC: {s.ruc}</p>}
                  {s.phone && <p className="flex items-center gap-1"><Phone className="h-3 w-3" /> {s.phone}</p>}
                  {s.email && <p className="flex items-center gap-1"><Mail className="h-3 w-3" /> {s.email}</p>}
                  {s.contact_person && <p className="flex items-center gap-1"><User className="h-3 w-3" /> {s.contact_person}</p>}
                  {s.address && <p className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {s.address}</p>}
                </div>
                <div className="flex gap-1 pt-2 border-t border-border">
                  <Button variant="outline" size="sm" className="gap-1 text-xs flex-1" onClick={() => openHistory(s)}>
                    <Eye className="h-3 w-3" /> Historial
                  </Button>
                  {isAdmin && (
                    <>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { if (confirm("¿Eliminar proveedor?")) deleteMutation.mutate(s.id); }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8 col-span-full">No se encontraron proveedores</p>}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={o => { if (!o) closeDialog(); else setDialogOpen(true); }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar Proveedor" : "Nuevo Proveedor"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Nombre *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
              <div className="space-y-1"><Label>Empresa</Label><Input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
              <div className="space-y-1"><Label>RUC</Label><Input value={form.ruc} onChange={e => setForm({ ...form, ruc: e.target.value })} /></div>
              <div className="space-y-1"><Label>Teléfono</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
              <div className="space-y-1"><Label>Correo</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div className="space-y-1"><Label>Contacto</Label><Input value={form.contact_person} onChange={e => setForm({ ...form, contact_person: e.target.value })} /></div>
            </div>
            <div className="space-y-1"><Label>Dirección</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div className="space-y-1"><Label>Notas</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
            <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} /><Label>Activo</Label></div>
            <Button onClick={() => saveMutation.mutate()} disabled={!form.name || saveMutation.isPending} className="w-full">
              {editing ? "Guardar Cambios" : "Crear Proveedor"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Purchase History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Historial — {selectedSupplier?.name}
            </DialogTitle>
          </DialogHeader>
          {purchaseHistory.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No hay compras registradas para este proveedor</p>
          ) : (
            <div className="space-y-3">
              {purchaseHistory.map((p: any) => (
                <Card key={p.id} className="border-primary/10">
                  <CardContent className="p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="text-sm">
                        <span className="font-bold">Pedido: {new Date(p.order_date + "T12:00:00").toLocaleDateString("es-PE")}</span>
                        {p.arrival_date && <span className="text-muted-foreground ml-2">→ Llegada: {new Date(p.arrival_date + "T12:00:00").toLocaleDateString("es-PE")}</span>}
                      </div>
                      <Badge variant={p.status === "recibido" ? "default" : p.status === "cancelado" ? "destructive" : "secondary"}>
                        {p.status}
                      </Badge>
                    </div>
                    {p.purchase_items?.length > 0 && (
                      <div className="text-xs space-y-1">
                        {p.purchase_items.map((it: any) => (
                          <div key={it.id} className="flex justify-between">
                            <span>{it.product_name} × {it.quantity}</span>
                            <span className="font-bold">S/. {Number(it.subtotal).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="text-right font-bold text-sm text-primary">Total: S/. {Number(p.total).toFixed(2)}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuppliersPage;
