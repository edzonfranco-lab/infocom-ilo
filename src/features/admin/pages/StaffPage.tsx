import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Users, Plus, Search, UserCheck, UserX, Briefcase, Phone, Mail, IdCard, Clock, Trash2, CalendarClock } from "lucide-react";

const DAY_NAMES = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const DAY_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const emptyForm = {
  full_name: "", position: "Practicante", phone: "", email: "", document_number: "", user_id: "", institution: "",
};

const emptyScheduleForm = {
  days: [] as number[], shift_name: "Turno Completo", start_time: "09:00", end_time: "18:00",
};

const StaffPage = () => {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleStaffId, setScheduleStaffId] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState(emptyScheduleForm);
  const [activeTab, setActiveTab] = useState("staff");

  const { data: staff = [], isLoading } = useQuery({
    queryKey: ["staff_members"],
    queryFn: async () => {
      const { data, error } = await supabase.from("staff_members").select("*").order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ["staff_schedules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("staff_schedules").select("*").order("day_of_week");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (f: typeof emptyForm) => {
      const payload: any = {
        full_name: f.full_name, position: f.position,
        phone: f.phone || null, email: f.email || null,
        document_number: f.document_number || null, user_id: f.user_id || null,
        institution: f.institution || null,
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
      setForm(emptyForm); setEditingId(null); setDialogOpen(false);
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

  const saveScheduleMutation = useMutation({
    mutationFn: async () => {
      if (!scheduleStaffId) return;
      const { error } = await supabase.from("staff_schedules").insert({
        staff_id: scheduleStaffId,
        day_of_week: Number(scheduleForm.day_of_week),
        shift_name: scheduleForm.shift_name,
        start_time: scheduleForm.start_time,
        end_time: scheduleForm.end_time,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff_schedules"] });
      toast.success("Horario asignado");
      setScheduleForm(emptyScheduleForm);
    },
    onError: (e: any) => toast.error(e.message?.includes("unique") ? "Ya existe ese turno para ese día" : "Error al guardar horario"),
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("staff_schedules").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["staff_schedules"] });
      toast.success("Horario eliminado");
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
    setEditingId(s.id); setDialogOpen(true);
  };

  const openScheduleDialog = (staffId: string) => {
    setScheduleStaffId(staffId);
    setScheduleForm(emptyScheduleForm);
    setScheduleDialogOpen(true);
  };

  const getStaffSchedules = (staffId: string) => schedules.filter((s: any) => s.staff_id === staffId);

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
                    <SelectItem value="Limpieza">🧹 Limpieza</SelectItem>
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
        <Card className="border-green-500/20"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-green-400">{activeCount}</p><p className="text-xs text-muted-foreground">Activos</p></CardContent></Card>
        <Card className="border-primary/20"><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">{staff.length}</p><p className="text-xs text-muted-foreground">Total</p></CardContent></Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar personal..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="staff">👥 Personal</TabsTrigger>
          <TabsTrigger value="schedules">📅 Horarios</TabsTrigger>
        </TabsList>

        <TabsContent value="staff">
          {isLoading ? (
            <div className="flex justify-center py-12"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground"><Users className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>No hay personal registrado</p></CardContent></Card>
          ) : (
            <div className="grid gap-3">
              {filtered.map((s: any) => {
                const staffScheds = getStaffSchedules(s.id);
                return (
                  <Card key={s.id} className={`border-primary/10 ${!s.is_active ? "opacity-50" : ""}`}>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
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
                          <Button variant="outline" size="sm" onClick={() => openScheduleDialog(s.id)} className="gap-1">
                            <CalendarClock className="h-3.5 w-3.5" /> Horario
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openEdit(s)}>Editar</Button>
                          <Button variant="ghost" size="icon" className={`h-8 w-8 ${s.is_active ? "text-destructive" : "text-green-400"}`}
                            onClick={() => toggleActiveMutation.mutate({ id: s.id, is_active: !s.is_active })}>
                            {s.is_active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      {/* Show assigned schedules */}
                      {staffScheds.length > 0 && (
                        <div className="flex gap-1 flex-wrap ml-13">
                          {staffScheds.map((sc: any) => (
                            <Badge key={sc.id} variant="secondary" className="text-[10px] gap-1">
                              <Clock className="h-2.5 w-2.5" />
                              {DAY_SHORT[sc.day_of_week]}: {sc.start_time?.slice(0,5)}-{sc.end_time?.slice(0,5)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="schedules">
          <div className="space-y-4">
            {staff.filter((s: any) => s.is_active).map((s: any) => {
              const staffScheds = getStaffSchedules(s.id);
              return (
                <Card key={s.id} className="border-primary/10">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-primary" />
                        {s.full_name}
                        <Badge variant="outline" className="text-xs">{s.position}</Badge>
                      </span>
                      <Button size="sm" variant="outline" onClick={() => openScheduleDialog(s.id)} className="gap-1">
                        <Plus className="h-3 w-3" /> Agregar
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {staffScheds.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-3">Sin horario asignado</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {staffScheds.map((sc: any) => (
                          <div key={sc.id} className="flex items-center justify-between bg-secondary/30 rounded-lg px-3 py-2">
                            <div>
                              <p className="text-xs font-semibold">{DAY_NAMES[sc.day_of_week]}</p>
                              <p className="text-xs text-muted-foreground">{sc.start_time?.slice(0,5)} - {sc.end_time?.slice(0,5)}</p>
                              <p className="text-[10px] text-muted-foreground">{sc.shift_name}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                              onClick={() => deleteScheduleMutation.mutate(sc.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Schedule assignment dialog */}
      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Horario — {staff.find((s: any) => s.id === scheduleStaffId)?.full_name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); saveScheduleMutation.mutate(); }} className="space-y-4">
            <div>
              <Label>Día de la Semana</Label>
              <Select value={scheduleForm.day_of_week} onValueChange={v => setScheduleForm({ ...scheduleForm, day_of_week: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAY_NAMES.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nombre del Turno</Label>
              <Select value={scheduleForm.shift_name} onValueChange={v => setScheduleForm({ ...scheduleForm, shift_name: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Turno 1">Turno 1 (Mañana)</SelectItem>
                  <SelectItem value="Turno 2">Turno 2 (Tarde)</SelectItem>
                  <SelectItem value="Turno 3">Turno 3 (Noche)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Hora Entrada</Label>
                <Input type="time" value={scheduleForm.start_time} onChange={e => setScheduleForm({ ...scheduleForm, start_time: e.target.value })} />
              </div>
              <div>
                <Label>Hora Salida</Label>
                <Input type="time" value={scheduleForm.end_time} onChange={e => setScheduleForm({ ...scheduleForm, end_time: e.target.value })} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={saveScheduleMutation.isPending}>Asignar Horario</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffPage;
