import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, Plus, Search, Star, Phone, Mail, IdCard, Gift, TrendingUp } from "lucide-react";
import { CURRENCY } from "@/lib/types";

const emptyForm = {
  full_name: "", phone: "", email: "", document_number: "", address: "", notes: "", is_vip: false,
};

const CustomersPage = () => {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [filterVip, setFilterVip] = useState(false);

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("customers").select("*").order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        full_name: form.full_name, phone: form.phone || null,
        email: form.email || null, document_number: form.document_number || null,
        address: form.address || null, notes: form.notes || null, is_vip: form.is_vip,
      };
      if (editingId) {
        const { error } = await supabase.from("customers").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("customers").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success(editingId ? "Cliente actualizado" : "Cliente registrado");
      setForm(emptyForm); setEditingId(null); setDialogOpen(false);
    },
    onError: () => toast.error("Error al guardar"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("customers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente eliminado");
    },
  });

  const openEdit = (c: any) => {
    setForm({
      full_name: c.full_name, phone: c.phone || "", email: c.email || "",
      document_number: c.document_number || "", address: c.address || "",
      notes: c.notes || "", is_vip: c.is_vip,
    });
    setEditingId(c.id); setDialogOpen(true);
  };

  const filtered = customers.filter((c: any) => {
    if (filterVip && !c.is_vip) return false;
    if (!search) return true;
    const s = search.toLowerCase();
    return c.full_name?.toLowerCase().includes(s) || c.phone?.includes(s) || c.document_number?.includes(s);
  });

  const vipCount = customers.filter((c: any) => c.is_vip).length;
  const totalSpent = customers.reduce((sum: number, c: any) => sum + Number(c.total_spent || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Clientes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gestiona tus clientes recurrentes para sorteos, regalos y fidelización</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditingId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Nuevo Cliente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Editar" : "Registrar"} Cliente</DialogTitle></DialogHeader>
            <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
              <div><Label>Nombre Completo *</Label><Input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Teléfono</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>DNI</Label><Input value={form.document_number} onChange={e => setForm({ ...form, document_number: e.target.value })} /></div>
              </div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label>Dirección</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              <div><Label>Notas</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Preferencias, cumpleaños, etc." /></div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_vip} onCheckedChange={v => setForm({ ...form, is_vip: v })} />
                <Label className="flex items-center gap-1"><Star className="h-4 w-4 text-yellow-500" /> Cliente VIP</Label>
              </div>
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>{editingId ? "Guardar" : "Registrar"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-primary/20"><CardContent className="p-4 text-center"><Users className="h-5 w-5 text-primary mx-auto mb-1" /><p className="text-2xl font-bold">{customers.length}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
        <Card className="border-yellow-500/20"><CardContent className="p-4 text-center"><Star className="h-5 w-5 text-yellow-500 mx-auto mb-1" /><p className="text-2xl font-bold">{vipCount}</p><p className="text-xs text-muted-foreground">VIP</p></CardContent></Card>
        <Card className="border-green-500/20"><CardContent className="p-4 text-center"><TrendingUp className="h-5 w-5 text-green-500 mx-auto mb-1" /><p className="text-2xl font-bold">{CURRENCY}{totalSpent.toLocaleString()}</p><p className="text-xs text-muted-foreground">Total comprado</p></CardContent></Card>
        <Card className="border-pink-500/20"><CardContent className="p-4 text-center"><Gift className="h-5 w-5 text-pink-500 mx-auto mb-1" /><p className="text-2xl font-bold">{customers.filter((c: any) => c.total_purchases >= 5).length}</p><p className="text-xs text-muted-foreground">Fieles (5+ compras)</p></CardContent></Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre, teléfono, DNI..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Button variant={filterVip ? "default" : "outline"} size="sm" onClick={() => setFilterVip(!filterVip)} className="gap-1">
          <Star className="h-3.5 w-3.5" /> Solo VIP
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground"><Users className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>No hay clientes registrados</p></CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((c: any) => (
            <Card key={c.id} className="border-primary/10 hover:border-primary/30 transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${c.is_vip ? "bg-yellow-500/20" : "bg-primary/10"}`}>
                      {c.is_vip ? <Star className="h-5 w-5 text-yellow-500" /> : <Users className="h-5 w-5 text-primary" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">{c.full_name}</p>
                        {c.is_vip && <Badge className="bg-yellow-500/20 text-yellow-600 text-[10px]">VIP</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {c.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone}</span>}
                        {c.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{c.email}</span>}
                        {c.document_number && <span className="flex items-center gap-1"><IdCard className="h-3 w-3" />{c.document_number}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="secondary">{c.total_purchases || 0} compras</Badge>
                    <Badge variant="outline">{CURRENCY}{Number(c.total_spent || 0).toLocaleString()}</Badge>
                    <Button variant="outline" size="sm" onClick={() => openEdit(c)}>Editar</Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => { if (confirm("¿Eliminar este cliente?")) deleteMutation.mutate(c.id); }}>✕</Button>
                  </div>
                </div>
                {c.notes && <p className="text-xs text-muted-foreground mt-2 ml-13 italic">📝 {c.notes}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomersPage;
