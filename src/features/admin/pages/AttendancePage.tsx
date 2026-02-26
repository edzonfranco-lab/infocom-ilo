import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CalendarDays, ChevronLeft, ChevronRight, Download } from "lucide-react";

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const STATUS_LABELS: Record<string,{ label: string; color: string }> = {
  A: { label: "A", color: "bg-success/20 text-success" },
  F: { label: "F", color: "bg-destructive/20 text-destructive" },
  T: { label: "T", color: "bg-warning/20 text-warning" },
  J: { label: "J", color: "bg-info/20 text-info" },
};

const AttendancePage = () => {
  const qc = useQueryClient();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

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

  const recordMap = useMemo(() => {
    const m: Record<string, Record<string, any>> = {};
    records.forEach((r: any) => {
      if (!m[r.staff_id]) m[r.staff_id] = {};
      m[r.staff_id][r.date] = r;
    });
    return m;
  }, [records]);

  const toggleMutation = useMutation({
    mutationFn: async ({ staffId, date, status }: { staffId: string; date: string; status: string }) => {
      const existing = recordMap[staffId]?.[date];
      if (existing) {
        const { error } = await supabase.from("attendance_records").update({ status }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("attendance_records").insert({ staff_id: staffId, date, status });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["attendance_records", month, year] }),
    onError: () => toast.error("Error al marcar asistencia"),
  });

  const cycleStatus = (staffId: string, day: number) => {
    const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const current = recordMap[staffId]?.[date]?.status;
    const order = ["A", "T", "J", "F"];
    const next = order[(order.indexOf(current || "") + 1) % order.length];
    toggleMutation.mutate({ staffId, date, status: next });
  };

  const getStats = (staffId: string) => {
    const recs = Object.values(recordMap[staffId] || {});
    const a = recs.filter((r: any) => r.status === "A").length;
    const f = recs.filter((r: any) => r.status === "F").length;
    const t = recs.filter((r: any) => r.status === "T").length;
    const j = recs.filter((r: any) => r.status === "J").length;
    const total = a + f + t + j;
    const pct = total > 0 ? Math.round((a / total) * 100) : 0;
    return { a, f, t, j, pct };
  };

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  // Day of week labels for header
  const getDayOfWeek = (day: number) => {
    const d = new Date(year, month, day);
    return ["D","L","M","M","J","V","S"][d.getDay()];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" /> Control de Asistencias
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-2" onClick={() => {
            const rows = [["Personal", ...days.map(d => String(d)), "F", "T", "J", "A", "%"].join(",")];
            staff.forEach((s: any) => {
              const st = getStats(s.id);
              const dayCols = days.map(d => {
                const date = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                return recordMap[s.id]?.[date]?.status || "";
              });
              rows.push([`"${s.full_name}"`, ...dayCols, st.f, st.t, st.j, st.a, st.pct + "%"].join(","));
            });
            const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a"); a.href = url; a.download = `asistencias_${MONTHS[month]}_${year}.csv`; a.click();
            URL.revokeObjectURL(url);
          }}>
            <Download className="h-4 w-4" /> CSV
          </Button>
          <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="font-semibold text-sm min-w-[160px] text-center">{MONTHS[month]} {year}</span>
          <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
          <Badge key={k} variant="outline" className={`${v.color} text-xs`}>{v.label} = {k === "A" ? "Asistencia" : k === "F" ? "Falta" : k === "T" ? "Tardanza" : "Justificada"}</Badge>
        ))}
      </div>

      {staff.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-12 text-center text-muted-foreground"><CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>Registra personal primero en "Gestión de Personal"</p></CardContent></Card>
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
                <th className="px-2 py-2 text-center">F</th>
                <th className="px-2 py-2 text-center">T</th>
                <th className="px-2 py-2 text-center">J</th>
                <th className="px-2 py-2 text-center">A</th>
                <th className="px-2 py-2 text-center">%</th>
              </tr>
            </thead>
            <tbody>
              {staff.map((s: any) => {
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
                    <td className="px-2 py-2 text-center font-bold text-destructive">{stats.f || ""}</td>
                    <td className="px-2 py-2 text-center font-bold text-warning">{stats.t || ""}</td>
                    <td className="px-2 py-2 text-center font-bold text-info">{stats.j || ""}</td>
                    <td className="px-2 py-2 text-center font-bold text-success">{stats.a || ""}</td>
                    <td className={`px-2 py-2 text-center font-bold ${stats.pct >= 80 ? "text-success" : stats.pct >= 50 ? "text-warning" : "text-destructive"}`}>
                      {stats.pct > 0 ? `${stats.pct}%` : ""}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
