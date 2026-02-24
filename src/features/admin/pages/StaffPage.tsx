import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, Plus, Search, UserCheck, UserX, Briefcase, Phone, Mail, IdCard } from "lucide-react";

const emptyForm = {
  full_name: "", position: "Practicante", phone: "", email: "", document_number: "", user_id: "",
};

const StaffPage = () => {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ["staff_members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("staff_members").select("*").order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (f: typeof emptyForm) => {
      const payload: any = {
        full_name: f.full_name,
        position: f.position,
        phone: f.phone || null,
        email: f.email || null,
        document_number: f.document_number || null,
        user_id: f.user_id || null,
      };
      if (editingId) {
        const { error } = await supabase.from("staff_members").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("staff_members").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff_members"] });
      toast.success(editingId ? "Personal actualizado" : "Personal registrado");
      setForm(emptyForm);
      setEditingId(null);
      setDialogOpen(false);
    },
    onError: () => toast.error("Error al guardar"),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("staff_members").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff_members"] });
      toast.success("Estado actualizado");
    },
  });

  const filtered = staff.filter((s: any) =>
    !search || s.full_name?.toLowerCase().includes(search.toLowerCase()) || s.position?.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount = staff.filter((s: any) => s.is_active).length;

  const openEdit = (s: any) => {
    setForm({
      full_name: s.full_name, position: s.position, phone: s.phone || "",
      email: s.email || "", document_number: s.document_number || "", user_id: s.user_id || "",
    });
    setEditingId(s.id);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" /> Gestión de Personal
        </h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditingId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Agregar Personal</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Editar" : "Registrar"} Personal</DialogTitle></DialogHeader>
            <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form); }} className="space-y-4">
              <div><Label>Nombre Completo *</Label><Input required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
              <div>
                <Label>Cargo / Posición</Label>
                <Select value={form.position} onValueChange={v => setForm({ ...form, position: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Técnico">🔧 Técnico</SelectItem>
                    <SelectItem value="Recepcionista">📋 Recepcionista</SelectItem>
                    <SelectItem value="Vendedor">🛒 Vendedor</SelectItem>
                    <SelectItem value="Practicante">🎓 Practicante</SelectItem>
                    <SelectItem value="Administrador">👑 Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Teléfono</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                <div><Label>DNI / Documento</Label><Input value={form.document_number} onChange={e => setForm({ ...form, document_number: e.target.value })} /></div>
              </div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
              <div>
                <Label>ID de Usuario (opcional — vincular cuenta)</Label>
                <Input value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })} placeholder="UUID del usuario registrado" className="font-mono text-xs" />
                <p className="text-xs text-muted-foreground mt-1">Si tiene cuenta en el sistema, ingresa su UUID para vincularla</p>
              </div>
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>{editingId ? "Guardar Cambios" : "Registrar"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-success/20"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-success">{activeCount}</p><p className="text-xs text-muted-foreground">Activos</p></CardContent></Card>
        <Card className="border-primary/20"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{staff.length}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar personal..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground"><Users className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>No hay personal registrado</p></CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((s: any) => (
            <Card key={s.id} className={`border-primary/10 ${!s.is_active ? "opacity-50" : ""}`}>
              <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{s.full_name}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <Badge variant="outline" className="text-xs">{s.position}</Badge>
                      {s.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{s.phone}</span>}
                      {s.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{s.email}</span>}
                      {s.document_number && <span className="flex items-center gap-1"><IdCard className="h-3 w-3" />{s.document_number}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(s)}>Editar</Button>
                  <Button variant="ghost" size="icon" className={`h-8 w-8 ${s.is_active ? "text-destructive" : "text-success"}`}
                    onClick={() => toggleActiveMutation.mutate({ id: s.id, is_active: !s.is_active })}>
                    {s.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StaffPage;
