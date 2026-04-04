import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CalendarDays, ChevronLeft, ChevronRight, Download, Clock, UserCheck, Filter, AlertTriangle, UserPlus } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const STATUS_LABELS: Record<string,{ label: string; color: string; full: string }> = {
  A: { label: "A", color: "bg-green-500/20 text-green-400", full: "Asistencia" },
  F: { label: "F", color: "bg-red-500/20 text-red-400", full: "Falta" },
  T: { label: "T", color: "bg-yellow-500/20 text-yellow-400", full: "Tardanza" },
  J: { label: "J", color: "bg-blue-500/20 text-blue-400", full: "Justificada" },
};

const DAY_NAMES = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];

const AttendancePage = () => {
  const qc = useQueryClient();
  const { isAdmin, user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [filterStaff, setFilterStaff] = useState("all");
  const [activeTab, setActiveTab] = useState("grid");

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  const { data: staff = [] } = useQuery({
    queryKey: ["staff_members_active"],
    queryFn: async () => {
      const { data, error } = await supabase.from("staff_members").select("*").eq("is_active", true).order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: records = [] } = useQuery({
    queryKey: ["attendance_records", month, year],
    queryFn: async () => {
      const { data, error } = await supabase.from("attendance_records").select("*")
        .gte("date", startDate).lte("date", endDate);
      if (error) throw error;
      return data;
    },
  });

  // Fetch schedules
  const { data: schedules = [] } = useQuery({
    queryKey: ["staff_schedules"],
    queryFn: async () => {
      const { data, error } = await supabase.from("staff_schedules").select("*").eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const scheduleMap = useMemo(() => {
    const m: Record<string, any[]> = {};
    schedules.forEach((s: any) => {
      if (!m[s.staff_id]) m[s.staff_id] = [];
      m[s.staff_id].push(s);
    });
    return m;
  }, [schedules]);

  const getScheduleForDay = (staffId: string, dayOfWeek: number) => {
    return (scheduleMap[staffId] || []).filter((s: any) => s.day_of_week === dayOfWeek);
  };

  const getScheduledHours = (staffId: string, dayOfWeek: number) => {
    const scheds = getScheduleForDay(staffId, dayOfWeek);
    return scheds.reduce((sum: number, s: any) => {
      const [sH, sM] = s.start_time.split(":").map(Number);
      const [eH, eM] = s.end_time.split(":").map(Number);
      return sum + (eH + eM / 60) - (sH + sM / 60);
    }, 0);
  };

  const recordMap = useMemo(() => {
    const m: Record<string, Record<string, any>> = {};
    records.forEach((r: any) => {
      if (!m[r.staff_id]) m[r.staff_id] = {};
      m[r.staff_id][r.date] = r;
    });
    return m;
  }, [records]);

  const toggleMutation = useMutation({
    mutationFn: async ({ staffId, date, status, check_in, check_out }: { staffId: string; date: string; status: string; check_in?: string; check_out?: string }) => {
      const existing = recordMap[staffId]?.[date];
      const payload: any = { status };
      if (check_in !== undefined) payload.check_in_time = check_in || null;
      if (check_out !== undefined) payload.check_out_time = check_out || null;

      if (existing) {
        const { error } = await supabase.from("attendance_records").update(payload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("attendance_records").insert({ staff_id: staffId, date, ...payload });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance_records", month, year] }),
    onError: () => toast.error("Error al marcar asistencia"),
  });

  const cycleStatus = (staffId: string, day: number) => {
    if (!isAdmin) return;
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const current = recordMap[staffId]?.[date]?.status;
    const order = ["A", "T", "J", "F"];
    const next = order[(order.indexOf(current || "") + 1) % order.length];
    toggleMutation.mutate({ staffId, date, status: next });
  };

  const updateTime = (staffId: string, day: number, field: "check_in" | "check_out", value: string) => {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const existing = recordMap[staffId]?.[date];
    const status = existing?.status || "A";
    toggleMutation.mutate({
      staffId, date, status,
      check_in: field === "check_in" ? value : existing?.check_in_time || undefined,
      check_out: field === "check_out" ? value : existing?.check_out_time || undefined,
    });
  };

  const getActualHours = (rec: any) => {
    if (rec?.check_in_time && rec?.check_out_time) {
      const [inH, inM] = rec.check_in_time.split(":").map(Number);
      const [outH, outM] = rec.check_out_time.split(":").map(Number);
      return (outH + outM / 60) - (inH + inM / 60);
    }
    return 0;
  };

  const getStats = (staffId: string) => {
    const recs = Object.values(recordMap[staffId] || {});
    const a = recs.filter((r: any) => r.status === "A").length;
    const f = recs.filter((r: any) => r.status === "F").length;
    const t = recs.filter((r: any) => r.status === "T").length;
    const j = recs.filter((r: any) => r.status === "J").length;
    const total = a + f + t + j;
    const pct = total > 0 ? Math.round((a / total) * 100) : 0;

    let totalWorked = 0;
    let totalScheduled = 0;
    recs.forEach((r: any) => {
      const actualH = getActualHours(r);
      totalWorked += actualH;
      const d = new Date(r.date);
      const scheduledH = getScheduledHours(staffId, d.getDay());
      totalScheduled += scheduledH;
    });

    const overtime = Math.max(0, totalWorked - totalScheduled);

    return {
      a, f, t, j, pct,
      totalHours: Math.round(totalWorked * 10) / 10,
      scheduledHours: Math.round(totalScheduled * 10) / 10,
      overtime: Math.round(overtime * 10) / 10,
    };
  };

  const getWeeklyStats = (staffId: string) => {
    const weeks: { week: number; worked: number; scheduled: number; overtime: number; days: number }[] = [];
    const recs = recordMap[staffId] || {};
    for (let w = 0; w < 5; w++) {
      let worked = 0, scheduled = 0, daysCount = 0;
      for (let d = w * 7 + 1; d <= Math.min((w + 1) * 7, daysInMonth); d++) {
        const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const rec = recs[date];
        const dayOfWeek = new Date(year, month, d).getDay();
        const schedH = getScheduledHours(staffId, dayOfWeek);
        if (rec?.status === "A" || rec?.status === "T") {
          daysCount++;
          const actualH = getActualHours(rec);
          worked += actualH;
          scheduled += schedH;
        }
      }
      if (daysCount > 0) {
        const ot = Math.max(0, worked - scheduled);
        weeks.push({ week: w + 1, worked: Math.round(worked * 10) / 10, scheduled: Math.round(scheduled * 10) / 10, overtime: Math.round(ot * 10) / 10, days: daysCount });
      }
    }
    return weeks;
  };

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const getDayOfWeek = (day: number) => ["D","L","M","M","J","V","S"][new Date(year, month, day).getDay()];

  const filteredStaff = filterStaff === "all" ? staff : staff.filter((s: any) => s.id === filterStaff);

  const exportCSV = () => {
    const rows = [["Personal","Cargo",...days.map(d => String(d)),"A","F","T","J","%","Horas Trabajadas","Horas Programadas","Horas Extra"].join(",")];
    filteredStaff.forEach((s: any) => {
      const st = getStats(s.id);
      const dayCols = days.map(d => {
        const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const rec = recordMap[s.id]?.[date];
        let val = rec?.status || "";
        if (rec?.check_in_time) val += ` ${rec.check_in_time}`;
        if (rec?.check_out_time) val += `-${rec.check_out_time}`;
        return `"${val}"`;
      });
      rows.push([`"${s.full_name}"`,`"${s.position}"`, ...dayCols, st.a, st.f, st.t, st.j, st.pct + "%", st.totalHours + "h", st.scheduledHours + "h", st.overtime + "h"].join(","));
    });
    const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `asistencias_${MONTHS[month]}_${year}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const selfCheckIn = async () => {
    const today = new Date().toISOString().split("T")[0];
    const nowTime = `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`;

    const { data: session } = await supabase.auth.getSession();
    if (!session.session?.user) { toast.error("Debes iniciar sesión"); return; }

    const currentStaff = staff.find((s: any) => s.user_id === session.session!.user.id);
    if (!currentStaff) { toast.error("Tu usuario no está vinculado a un registro de personal"); return; }

    const existing = recordMap[currentStaff.id]?.[today];
    if (existing?.check_in_time && !existing?.check_out_time) {
      toggleMutation.mutate({ staffId: currentStaff.id, date: today, status: "A", check_out: nowTime });
      toast.success(`Salida registrada: ${nowTime}`);
    } else if (!existing?.check_in_time) {
      // Check if late based on schedule
      const dayOfWeek = new Date().getDay();
      const todaySchedules = getScheduleForDay(currentStaff.id, dayOfWeek);
      let isLate = false;
      if (todaySchedules.length > 0) {
        const earliest = todaySchedules.reduce((min: string, s: any) => s.start_time < min ? s.start_time : min, todaySchedules[0].start_time);
        isLate = nowTime > earliest;
      }
      const status = isLate ? "T" : "A";
      toggleMutation.mutate({ staffId: currentStaff.id, date: today, status, check_in: nowTime });
      toast.success(`Entrada registrada: ${nowTime}${isLate ? " (Tardanza)" : ""}`);
    } else {
      // Already has check-in and check-out - this could be a double shift
      toast.info("Ya registraste entrada y salida. Contacta al administrador para registrar doble turno.");
    }
  };

  // Find current user's staff record and today's status
  const myStaff = staff.find((s: any) => s.user_id === user?.id);
  const today = new Date().toISOString().split("T")[0];
  const myRecord = myStaff ? recordMap[myStaff.id]?.[today] : null;
  const myCheckedIn = !!myRecord?.check_in_time;
  const myCheckedOut = !!myRecord?.check_out_time;

  return (
    <div className="space-y-6">
      {/* Self check-in card for staff users (not admin) */}
      {!isAdmin && myStaff && (
        <Card className={`border-2 ${myCheckedIn && !myCheckedOut ? "border-primary/50 bg-primary/5" : myCheckedOut ? "border-success/50 bg-success/5" : "border-warning/50 bg-warning/5"}`}>
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${myCheckedIn && !myCheckedOut ? "bg-primary/20" : myCheckedOut ? "bg-success/20" : "bg-warning/20"}`}>
                {myCheckedOut ? <Clock className="h-6 w-6 text-success" /> : myCheckedIn ? <UserCheck className="h-6 w-6 text-primary" /> : <AlertTriangle className="h-6 w-6 text-warning" />}
              </div>
              <div>
                <p className="font-semibold">{myStaff.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {myCheckedOut
                    ? `✅ Jornada completada — Entrada: ${myRecord?.check_in_time} | Salida: ${myRecord?.check_out_time}`
                    : myCheckedIn
                    ? `🟢 En turno desde las ${myRecord?.check_in_time} — Presiona para marcar salida`
                    : "⚠️ Aún no has marcado tu entrada hoy"}
                </p>
              </div>
            </div>
            <Button
              size="lg"
              className="gap-2 min-w-[200px]"
              variant={myCheckedOut ? "outline" : "default"}
              onClick={selfCheckIn}
              disabled={myCheckedOut}
            >
              <UserCheck className="h-5 w-5" />
              {myCheckedOut ? "Asistencia Completada" : myCheckedIn ? "Marcar Salida" : "Marcar Entrada"}
            </Button>
          </CardContent>
        </Card>
      )}

      {!isAdmin && !myStaff && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
            <p className="text-sm">Tu cuenta no está vinculada a un registro de personal. Solicita al administrador que te vincule para poder marcar asistencia.</p>
          </CardContent>
        </Card>
      )}

      {/* ─── Personal view (moderators): read-only summary ──── */}
      {!isAdmin && myStaff && (() => {
        const myStats = getStats(myStaff.id);
        const mySchedules = scheduleMap[myStaff.id] || [];
        return (
          <>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h1 className="text-2xl font-display font-bold flex items-center gap-2">
                <CalendarDays className="h-6 w-6 text-primary" /> Mi Asistencia
              </h1>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
                <span className="font-semibold text-sm min-w-[160px] text-center">{MONTHS[month]} {year}</span>
                <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
              </div>
            </div>

            {/* My stats cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <Card className="border-success/20"><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-success">{myStats.a}</p><p className="text-[10px] text-muted-foreground">Asistencias</p></CardContent></Card>
              <Card className="border-destructive/20"><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-destructive">{myStats.f}</p><p className="text-[10px] text-muted-foreground">Faltas</p></CardContent></Card>
              <Card className="border-warning/20"><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-warning">{myStats.t}</p><p className="text-[10px] text-muted-foreground">Tardanzas</p></CardContent></Card>
              <Card className="border-info/20"><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-info">{myStats.j}</p><p className="text-[10px] text-muted-foreground">Justificadas</p></CardContent></Card>
              <Card className="border-primary/20"><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-primary">{myStats.totalHours}h</p><p className="text-[10px] text-muted-foreground">Horas Trabajadas</p></CardContent></Card>
              <Card className={`border-2 ${myStats.pct >= 80 ? "border-success/30" : myStats.pct >= 50 ? "border-warning/30" : "border-destructive/30"}`}>
                <CardContent className="p-3 text-center">
                  <p className={`text-2xl font-bold ${myStats.pct >= 80 ? "text-success" : myStats.pct >= 50 ? "text-warning" : "text-destructive"}`}>{myStats.pct}%</p>
                  <p className="text-[10px] text-muted-foreground">Puntualidad</p>
                </CardContent>
              </Card>
            </div>

            {myStats.overtime > 0 && (
              <Card className="border-orange-500/20 bg-orange-500/5">
                <CardContent className="p-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-400" />
                  <span className="text-sm font-medium">Horas extras acumuladas: <strong className="text-orange-400">{myStats.overtime}h</strong></span>
                  <span className="text-xs text-muted-foreground ml-2">(Programadas: {myStats.scheduledHours}h)</span>
                </CardContent>
              </Card>
            )}

            {/* My schedule */}
            {mySchedules.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Mi Horario Asignado</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {mySchedules
                      .sort((a: any, b: any) => a.day_of_week - b.day_of_week)
                      .map((sc: any) => (
                        <div key={sc.id} className="bg-secondary/30 rounded-lg p-3 text-center">
                          <p className="text-xs font-semibold text-primary">{DAY_NAMES[sc.day_of_week]}</p>
                          <p className="text-sm font-mono mt-1">{sc.start_time?.slice(0, 5)} - {sc.end_time?.slice(0, 5)}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{sc.shift_name}</p>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* My daily log (read-only) */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" /> Registro Diario — {MONTHS[month]} {year}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto border border-border rounded-lg">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="px-3 py-2 text-left">Día</th>
                        <th className="px-3 py-2 text-center">Estado</th>
                        <th className="px-3 py-2 text-center">Entrada</th>
                        <th className="px-3 py-2 text-center">Salida</th>
                        <th className="px-3 py-2 text-center">Horas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {days.map(d => {
                        const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                        const rec = recordMap[myStaff.id]?.[date];
                        const dayName = DAY_NAMES[new Date(year, month, d).getDay()];
                        const isWeekend = [0, 6].includes(new Date(year, month, d).getDay());
                        const isFuture = new Date(year, month, d) > new Date();
                        if (isFuture && !rec) return null;
                        const st = rec ? STATUS_LABELS[rec.status] : null;
                        const hours = getActualHours(rec);
                        return (
                          <tr key={d} className={`border-t border-border/50 ${isWeekend ? "bg-muted/20" : ""}`}>
                            <td className="px-3 py-2 font-medium">
                              <span className="text-muted-foreground mr-1">{dayName.slice(0, 3)}</span> {d}
                            </td>
                            <td className="px-3 py-2 text-center">
                              {st ? (
                                <Badge variant="outline" className={`${st.color} text-[10px]`}>{st.full}</Badge>
                              ) : (
                                <span className="text-muted-foreground/50">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2 text-center font-mono">{rec?.check_in_time?.slice(0, 5) || "—"}</td>
                            <td className="px-3 py-2 text-center font-mono">{rec?.check_out_time?.slice(0, 5) || "—"}</td>
                            <td className="px-3 py-2 text-center font-mono font-semibold text-primary">
                              {hours > 0 ? `${Math.round(hours * 10) / 10}h` : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-muted-foreground mt-3 italic">
                  📌 Si notas algún error en tu asistencia, comunícate con tu supervisor o administrador para corregirlo.
                </p>
              </CardContent>
            </Card>
          </>
        );
      })()}

      {/* ─── Admin view: full control ──────────────────────── */}
      {isAdmin && (
        <>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <h1 className="text-2xl font-display font-bold flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-primary" /> Control de Asistencias
            </h1>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="gap-2" onClick={exportCSV}>
                <Download className="h-4 w-4" /> CSV
              </Button>
              <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="font-semibold text-sm min-w-[160px] text-center">{MONTHS[month]} {year}</span>
              <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>

          {/* Admin quick check-in for any staff */}
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <UserPlus className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-sm">Marcar Asistencia Rápida</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                {staff.map((s: any) => {
                  const todayDate = new Date().toISOString().split("T")[0];
                  const rec = recordMap[s.id]?.[todayDate];
                  const hasIn = !!rec?.check_in_time;
                  const hasOut = !!rec?.check_out_time;
                  const nowTime = `${String(new Date().getHours()).padStart(2, "0")}:${String(new Date().getMinutes()).padStart(2, "0")}`;
                  
                  return (
                    <div key={s.id} className={`rounded-lg p-3 text-center border transition-colors ${hasOut ? "bg-success/10 border-success/30" : hasIn ? "bg-primary/10 border-primary/30" : "bg-secondary/30 border-border"}`}>
                      <p className="text-xs font-semibold truncate">{s.full_name}</p>
                      <p className="text-[10px] text-muted-foreground">{s.position}</p>
                      {hasIn && <p className="text-[10px] font-mono mt-1">🕐 {rec?.check_in_time?.slice(0,5)}{hasOut ? ` → ${rec?.check_out_time?.slice(0,5)}` : ""}</p>}
                      <Button
                        size="sm"
                        variant={hasOut ? "outline" : hasIn ? "secondary" : "default"}
                        className="mt-2 h-7 text-[10px] w-full"
                        disabled={hasOut}
                        onClick={() => {
                          const dayOfWeek = new Date().getDay();
                          const todaySchedules = getScheduleForDay(s.id, dayOfWeek);
                          if (hasIn && !hasOut) {
                            toggleMutation.mutate({ staffId: s.id, date: todayDate, status: "A", check_out: nowTime });
                            toast.success(`Salida de ${s.full_name}: ${nowTime}`);
                          } else if (!hasIn) {
                            let isLate = false;
                            if (todaySchedules.length > 0) {
                              const earliest = todaySchedules.reduce((min: string, sc: any) => sc.start_time < min ? sc.start_time : min, todaySchedules[0].start_time);
                              isLate = nowTime > earliest;
                            }
                            toggleMutation.mutate({ staffId: s.id, date: todayDate, status: isLate ? "T" : "A", check_in: nowTime });
                            toast.success(`Entrada de ${s.full_name}: ${nowTime}${isLate ? " (Tardanza)" : ""}`);
                          }
                        }}
                      >
                        {hasOut ? "✅ Completo" : hasIn ? "Marcar Salida" : "Marcar Entrada"}
                      </Button>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 p-2 bg-secondary/30 rounded-lg">
                <p className="text-[10px] text-muted-foreground text-center">
                  🏢 Horario de la empresa: <strong>9:00 AM - 1:00 PM</strong> y <strong>3:00 PM - 8:00 PM</strong> · Haz clic en cada personal para registrar entrada/salida
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <div className="flex gap-3 flex-wrap items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterStaff} onValueChange={setFilterStaff}>
                <SelectTrigger className="w-[200px] h-8 text-xs"><SelectValue placeholder="Filtrar personal" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo el personal</SelectItem>
                  {staff.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <Badge key={k} variant="outline" className={`${v.color} text-xs`}>{v.label} = {v.full}</Badge>
              ))}
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="grid">📅 Cuadrícula</TabsTrigger>
              <TabsTrigger value="hours">⏱️ Horas</TabsTrigger>
              <TabsTrigger value="summary">📊 Resumen</TabsTrigger>
            </TabsList>

            {/* Grid View */}
            <TabsContent value="grid">
              {filteredStaff.length === 0 ? (
                <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground"><CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>Registra personal primero</p></CardContent></Card>
              ) : (
                <div className="overflow-x-auto border border-border rounded-lg">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="sticky left-0 bg-muted/50 z-10 px-3 py-2 text-left font-semibold min-w-[150px]">Personal</th>
                        {days.map(d => (
                          <th key={d} className="px-1 py-1 text-center min-w-[32px]">
                            <div className="text-muted-foreground">{getDayOfWeek(d)}</div>
                            <div>{d}</div>
                          </th>
                        ))}
                        <th className="px-2 py-2 text-center">A</th>
                        <th className="px-2 py-2 text-center">F</th>
                        <th className="px-2 py-2 text-center">T</th>
                        <th className="px-2 py-2 text-center">J</th>
                        <th className="px-2 py-2 text-center">%</th>
                        <th className="px-2 py-2 text-center">Extra</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStaff.map((s: any) => {
                        const stats = getStats(s.id);
                        return (
                          <tr key={s.id} className="border-t border-border hover:bg-muted/30">
                            <td className="sticky left-0 bg-card z-10 px-3 py-2 font-medium truncate max-w-[150px]">{s.full_name}</td>
                            {days.map(d => {
                              const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                              const rec = recordMap[s.id]?.[date];
                              const st = rec ? STATUS_LABELS[rec.status] : null;
                              const isWeekend = [0, 6].includes(new Date(year, month, d).getDay());
                              return (
                                <td key={d} className={`px-1 py-1 text-center cursor-pointer hover:bg-primary/10 transition-colors ${isWeekend ? "bg-muted/30" : ""}`}
                                  onClick={() => cycleStatus(s.id, d)}>
                                  {st ? <span className={`inline-flex items-center justify-center h-6 w-6 rounded text-[10px] font-bold ${st.color}`}>{st.label}</span> : <span className="text-muted-foreground/30">·</span>}
                                </td>
                              );
                            })}
                            <td className="px-2 py-2 text-center font-bold text-success">{stats.a || ""}</td>
                            <td className="px-2 py-2 text-center font-bold text-destructive">{stats.f || ""}</td>
                            <td className="px-2 py-2 text-center font-bold text-warning">{stats.t || ""}</td>
                            <td className="px-2 py-2 text-center font-bold text-info">{stats.j || ""}</td>
                            <td className={`px-2 py-2 text-center font-bold ${stats.pct >= 80 ? "text-success" : stats.pct >= 50 ? "text-warning" : "text-destructive"}`}>
                              {stats.pct > 0 ? `${stats.pct}%` : ""}
                            </td>
                            <td className="px-2 py-2 text-center font-bold text-orange-400">
                              {stats.overtime > 0 ? `${stats.overtime}h` : ""}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* Hours View */}
            <TabsContent value="hours">
              <div className="space-y-4">
                {filteredStaff.map((s: any) => {
                  const stats = getStats(s.id);
                  const weeks = getWeeklyStats(s.id);
                  const staffSchedules = scheduleMap[s.id] || [];
                  return (
                    <Card key={s.id} className="border-primary/10">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center justify-between flex-wrap gap-2">
                          <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" />{s.full_name}</span>
                          <div className="flex gap-2">
                            <Badge variant="outline" className="text-xs">{stats.totalHours}h trabajadas</Badge>
                            <Badge variant="outline" className="text-xs bg-muted">{stats.scheduledHours}h programadas</Badge>
                            {stats.overtime > 0 && (
                              <Badge variant="outline" className="text-xs bg-orange-500/20 text-orange-400">
                                <AlertTriangle className="h-3 w-3 mr-1" />{stats.overtime}h extras
                              </Badge>
                            )}
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {staffSchedules.length > 0 && (
                          <div className="bg-secondary/30 rounded-lg p-2">
                            <p className="text-[10px] font-semibold text-muted-foreground mb-1">📋 Horario Asignado:</p>
                            <div className="flex gap-2 flex-wrap">
                              {staffSchedules.map((sc: any) => (
                                <Badge key={sc.id} variant="outline" className="text-[10px]">
                                  {DAY_NAMES[sc.day_of_week]?.slice(0, 3)}: {sc.start_time?.slice(0,5)}-{sc.end_time?.slice(0,5)} ({sc.shift_name})
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                          {weeks.map(w => (
                            <div key={w.week} className="bg-secondary/30 rounded-lg p-2 text-center">
                              <p className="text-[10px] text-muted-foreground">Semana {w.week}</p>
                              <p className="text-sm font-bold text-primary">{w.worked}h</p>
                              <p className="text-[10px] text-muted-foreground">{w.scheduled}h prog.</p>
                              {w.overtime > 0 && <p className="text-[10px] font-bold text-orange-400">+{w.overtime}h extra</p>}
                              <p className="text-[10px] text-muted-foreground">{w.days} días</p>
                            </div>
                          ))}
                        </div>

                        <div className="overflow-x-auto">
                          <div className="flex gap-1">
                            {days.map(d => {
                              const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                              const rec = recordMap[s.id]?.[date];
                              const isWeekend = [0, 6].includes(new Date(year, month, d).getDay());
                              return (
                                <div key={d} className={`flex flex-col items-center min-w-[50px] p-1 rounded text-[10px] ${isWeekend ? "bg-muted/30" : ""}`}>
                                  <span className="text-muted-foreground">{getDayOfWeek(d)} {d}</span>
                                  {rec?.status === "A" || rec?.status === "T" ? (
                                    <>
                                      <Input
                                        type="time"
                                        value={rec?.check_in_time || ""}
                                        onChange={e => updateTime(s.id, d, "check_in", e.target.value)}
                                        className="h-5 w-full text-[10px] p-0.5 text-center border-primary/20"
                                      />
                                      <Input
                                        type="time"
                                        value={rec?.check_out_time || ""}
                                        onChange={e => updateTime(s.id, d, "check_out", e.target.value)}
                                        className="h-5 w-full text-[10px] p-0.5 text-center border-primary/20"
                                      />
                                    </>
                                  ) : (
                                    <span className="text-muted-foreground/30 py-2">—</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* Summary View */}
            <TabsContent value="summary">
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="px-4 py-3 text-left font-semibold">Personal</th>
                      <th className="px-3 py-3 text-center">Cargo</th>
                      <th className="px-3 py-3 text-center text-success">A</th>
                      <th className="px-3 py-3 text-center text-destructive">F</th>
                      <th className="px-3 py-3 text-center text-warning">T</th>
                      <th className="px-3 py-3 text-center text-info">J</th>
                      <th className="px-3 py-3 text-center">%</th>
                      <th className="px-3 py-3 text-center">Trabajadas</th>
                      <th className="px-3 py-3 text-center">Programadas</th>
                      <th className="px-3 py-3 text-center text-orange-400">Extras</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStaff.map((s: any) => {
                      const stats = getStats(s.id);
                      return (
                        <tr key={s.id} className="border-t border-border hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">{s.full_name}</td>
                          <td className="px-3 py-3 text-center text-xs text-muted-foreground">{s.position}</td>
                          <td className="px-3 py-3 text-center font-bold text-success">{stats.a}</td>
                          <td className="px-3 py-3 text-center font-bold text-destructive">{stats.f}</td>
                          <td className="px-3 py-3 text-center font-bold text-warning">{stats.t}</td>
                          <td className="px-3 py-3 text-center font-bold text-info">{stats.j}</td>
                          <td className={`px-3 py-3 text-center font-bold ${stats.pct >= 80 ? "text-success" : stats.pct >= 50 ? "text-warning" : "text-destructive"}`}>
                            {stats.pct}%
                          </td>
                          <td className="px-3 py-3 text-center font-bold text-primary">{stats.totalHours}h</td>
                          <td className="px-3 py-3 text-center text-muted-foreground">{stats.scheduledHours}h</td>
                          <td className="px-3 py-3 text-center font-bold text-orange-400">{stats.overtime > 0 ? `${stats.overtime}h` : "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default AttendancePage;
