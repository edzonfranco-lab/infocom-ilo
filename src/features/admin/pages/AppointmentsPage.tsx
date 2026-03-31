import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CalendarClock, Plus, Clock, User, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pendiente: { label: "Pendiente", color: "bg-yellow-500/20 text-yellow-600", icon: AlertCircle },
  confirmada: { label: "Confirmada", color: "bg-blue-500/20 text-blue-600", icon: CheckCircle },
  completada: { label: "Completada", color: "bg-green-500/20 text-green-600", icon: CheckCircle },
  cancelada: { label: "Cancelada", color: "bg-destructive/20 text-destructive", icon: XCircle },
};

const emptyForm = {
  staff_id: "", customer_id: "", title: "", description: "", scheduled_at: "", duration_minutes: "30", status: "pendiente",
};

const AppointmentsPage = () => {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("appointments").select("*").order("scheduled_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: staff = [] } = useQuery({
    queryKey: ["staff_members"],
    queryFn: async () => {
      const { data } = await supabase.from("staff_members").select("id, full_name, position").eq("is_active", true).order("full_name");
      return data || [];
    },
  });

  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data } = await supabase.from("customers").select("id, full_name, phone").order("full_name");
      return data || [];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        staff_id: form.staff_id || null, customer_id: form.customer_id || null,
        title: form.title, description: form.description || null,
        scheduled_at: form.scheduled_at, duration_minutes: Number(form.duration_minutes) || 30,
        status: form.status,
      };
      if (editingId) {
        const { error } = await supabase.from("appointments").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("appointments").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success(editingId ? "Cita actualizada" : "Cita creada");
      setForm(emptyForm); setEditingId(null); setDialogOpen(false);
    },
    onError: () => toast.error("Error al guardar"),
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("appointments").update({ status } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Estado actualizado");
    },
  });

  const openEdit = (a: any) => {
    setForm({
      staff_id: a.staff_id || "", customer_id: a.customer_id || "",
      title: a.title, description: a.description || "",
      scheduled_at: a.scheduled_at ? new Date(a.scheduled_at).toISOString().slice(0, 16) : "",
      duration_minutes: String(a.duration_minutes), status: a.status,
    });
    setEditingId(a.id); setDialogOpen(true);
  };

  const filtered = appointments.filter((a: any) => filterStatus === "all" || a.status === filterStatus);
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = appointments.filter((a: any) => a.scheduled_at?.slice(0, 10) === today).length;
  const pendingCount = appointments.filter((a: any) => a.status === "pendiente").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <CalendarClock className="h-6 w-6 text-primary" /> Agenda de Citas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Citas programadas para técnicos y dueño</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) { setEditingId(null); setForm(emptyForm); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Nueva Cita</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Editar" : "Nueva"} Cita</DialogTitle></DialogHeader>
            <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
              <div><Label>Título *</Label><Input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Revisión de laptop, Entrega de equipo..." /></div>
              <div>
                <Label>Asignar a</Label>
                <Select value={form.staff_id} onValueChange={v => setForm({ ...form, staff_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar personal" /></SelectTrigger>
                  <SelectContent>{staff.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.full_name} — {s.position}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cliente (opcional)</Label>
                <Select value={form.customer_id} onValueChange={v => setForm({ ...form, customer_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
                  <SelectContent>{customers.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.full_name} {c.phone ? `— ${c.phone}` : ""}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Fecha y Hora *</Label><Input required type="datetime-local" value={form.scheduled_at} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} /></div>
                <div><Label>Duración (min)</Label><Input type="number" min="5" value={form.duration_minutes} onChange={e => setForm({ ...form, duration_minutes: e.target.value })} /></div>
              </div>
              <div><Label>Descripción</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} /></div>
              <Button type="submit" className="w-full" disabled={saveMutation.isPending}>{editingId ? "Guardar" : "Crear Cita"}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border-primary/20"><CardContent className="p-4 text-center"><CalendarClock className="h-5 w-5 text-primary mx-auto mb-1" /><p className="text-2xl font-bold">{todayCount}</p><p className="text-xs text-muted-foreground">Hoy</p></CardContent></Card>
        <Card className="border-yellow-500/20"><CardContent className="p-4 text-center"><AlertCircle className="h-5 w-5 text-yellow-500 mx-auto mb-1" /><p className="text-2xl font-bold">{pendingCount}</p><p className="text-xs text-muted-foreground">Pendientes</p></CardContent></Card>
        <Card className="border-green-500/20"><CardContent className="p-4 text-center"><CheckCircle className="h-5 w-5 text-green-500 mx-auto mb-1" /><p className="text-2xl font-bold">{appointments.length}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
      </div>

      <div className="flex gap-2 flex-wrap">
        {["all", "pendiente", "confirmada", "completada", "cancelada"].map(s => (
          <Button key={s} variant={filterStatus === s ? "default" : "outline"} size="sm" onClick={() => setFilterStatus(s)}>
            {s === "all" ? "Todas" : STATUS_MAP[s]?.label || s}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground"><CalendarClock className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>No hay citas</p></CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((a: any) => {
            const st = STATUS_MAP[a.status] || STATUS_MAP.pendiente;
            const staffMember = staff.find((s: any) => s.id === a.staff_id);
            const customer = customers.find((c: any) => c.id === a.customer_id);
            const date = a.scheduled_at ? new Date(a.scheduled_at) : null;
            return (
              <Card key={a.id} className="border-primary/10 hover:border-primary/30 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`text-[10px] ${st.color}`}>{st.label}</Badge>
                        <p className="font-semibold">{a.title}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {date && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {format(date, "dd MMM yyyy HH:mm", { locale: es })} ({a.duration_minutes}min)
                          </span>
                        )}
                        {staffMember && <span className="flex items-center gap-1"><User className="h-3 w-3" />{staffMember.full_name}</span>}
                        {customer && <span className="flex items-center gap-1">👤 {customer.full_name}</span>}
                      </div>
                      {a.description && <p className="text-xs text-muted-foreground mt-1">{a.description}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      {a.status === "pendiente" && (
                        <Button size="sm" variant="outline" onClick={() => updateStatusMutation.mutate({ id: a.id, status: "confirmada" })}>Confirmar</Button>
                      )}
                      {a.status === "confirmada" && (
                        <Button size="sm" variant="outline" className="text-green-600" onClick={() => updateStatusMutation.mutate({ id: a.id, status: "completada" })}>Completar</Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => openEdit(a)}>Editar</Button>
                      {a.status !== "cancelada" && (
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => updateStatusMutation.mutate({ id: a.id, status: "cancelada" })}>✕</Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;
