import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { DollarSign, Plus, ShoppingCart, Wrench, TrendingUp, ChevronLeft, ChevronRight, Trash2, Pencil, Download } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const emptySaleForm = { date: new Date().toISOString().split("T")[0], product_description: "", seller: "", quantity: "1", unit_price: "", notes: "" };
const emptyServiceForm = { date: new Date().toISOString().split("T")[0], description: "", responsible: "", device_type: "", diagnosis: "", price: "", notes: "" };

const exportCSV = (data: any[], filename: string, headers: string[], keys: string[]) => {
  const rows = [headers.join(","), ...data.map(r => keys.map(k => `"${String(r[k] ?? "").replace(/"/g, '""')}"`).join(","))];
  const blob = new Blob(["\uFEFF" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

const AccountingPage = () => {
  const qc = useQueryClient();
  const { isAdmin } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [saleDialog, setSaleDialog] = useState(false);
  const [serviceDialog, setServiceDialog] = useState(false);
  const [saleForm, setSaleForm] = useState(emptySaleForm);
  const [serviceForm, setServiceForm] = useState(emptyServiceForm);
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  const { data: sales = [] } = useQuery({
    queryKey: ["accounting_sales", month, year],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounting_sales").select("*")
        .gte("date", startDate).lte("date", endDate).order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: services = [] } = useQuery({
    queryKey: ["accounting_services", month, year],
    queryFn: async () => {
      const { data, error } = await supabase.from("accounting_services").select("*")
        .gte("date", startDate).lte("date", endDate).order("date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const saveSaleMutation = useMutation({
    mutationFn: async (f: typeof emptySaleForm) => {
      const qty = parseInt(f.quantity) || 1;
      const price = parseFloat(f.unit_price) || 0;
      const payload = { date: f.date, product_description: f.product_description, seller: f.seller, quantity: qty, unit_price: price, total: qty * price, notes: f.notes || null };
      if (editingSaleId) {
        const { error } = await supabase.from("accounting_sales").update(payload).eq("id", editingSaleId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("accounting_sales").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounting_sales", month, year] });
      toast.success(editingSaleId ? "Venta actualizada" : "Venta registrada");
      setSaleForm(emptySaleForm); setEditingSaleId(null); setSaleDialog(false);
    },
    onError: () => toast.error("Error al guardar"),
  });

  const saveServiceMutation = useMutation({
    mutationFn: async (f: typeof emptyServiceForm) => {
      const payload = { date: f.date, description: f.description, responsible: f.responsible, device_type: f.device_type || null, diagnosis: f.diagnosis || null, price: parseFloat(f.price) || 0, notes: f.notes || null };
      if (editingServiceId) {
        const { error } = await supabase.from("accounting_services").update(payload).eq("id", editingServiceId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("accounting_services").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["accounting_services", month, year] });
      toast.success(editingServiceId ? "Servicio actualizado" : "Servicio registrado");
      setServiceForm(emptyServiceForm); setEditingServiceId(null); setServiceDialog(false);
    },
    onError: () => toast.error("Error al guardar"),
  });

  const deleteSaleMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("accounting_sales").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["accounting_sales", month, year] }); toast.success("Eliminado"); },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("accounting_services").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["accounting_services", month, year] }); toast.success("Eliminado"); },
  });

  const openEditSale = (s: any) => {
    setSaleForm({ date: s.date, product_description: s.product_description, seller: s.seller, quantity: String(s.quantity), unit_price: String(s.unit_price), notes: s.notes || "" });
    setEditingSaleId(s.id); setSaleDialog(true);
  };
  const openEditService = (s: any) => {
    setServiceForm({ date: s.date, description: s.description, responsible: s.responsible, device_type: s.device_type || "", diagnosis: s.diagnosis || "", price: String(s.price), notes: s.notes || "" });
    setEditingServiceId(s.id); setServiceDialog(true);
  };

  const totalSales = sales.reduce((acc: number, s: any) => acc + Number(s.total || 0), 0);
  const totalServices = services.reduce((acc: number, s: any) => acc + Number(s.price || 0), 0);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <DollarSign className="h-6 w-6 text-primary" /> Contabilidad
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="font-semibold text-sm min-w-[160px] text-center">{MONTHS[month]} {year}</span>
          <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-success/20"><CardContent className="p-4 text-center"><ShoppingCart className="h-5 w-5 mx-auto mb-1 text-success" /><p className="text-2xl font-bold text-success">S/. {totalSales.toFixed(2)}</p><p className="text-xs text-muted-foreground">Ventas del Mes</p></CardContent></Card>
        <Card className="border-info/20"><CardContent className="p-4 text-center"><Wrench className="h-5 w-5 mx-auto mb-1 text-info" /><p className="text-2xl font-bold text-info">S/. {totalServices.toFixed(2)}</p><p className="text-xs text-muted-foreground">Servicios del Mes</p></CardContent></Card>
        <Card className="border-primary/20"><CardContent className="p-4 text-center"><TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" /><p className="text-2xl font-bold text-primary">S/. {(totalSales + totalServices).toFixed(2)}</p><p className="text-xs text-muted-foreground">Total del Mes</p></CardContent></Card>
      </div>

      <Tabs defaultValue="sales">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="sales" className="gap-2"><ShoppingCart className="h-4 w-4" /> Ventas ({sales.length})</TabsTrigger>
          <TabsTrigger value="services" className="gap-2"><Wrench className="h-4 w-4" /> Servicios ({services.length})</TabsTrigger>
        </TabsList>

        {/* SALES TAB */}
        <TabsContent value="sales" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => exportCSV(sales, `ventas_${MONTHS[month]}_${year}.csv`, ["Fecha","Descripción","Vendedor","Cant.","P.Unit.","Total","Notas"], ["date","product_description","seller","quantity","unit_price","total","notes"])}>
              <Download className="h-4 w-4" /> Exportar CSV
            </Button>
            <Dialog open={saleDialog} onOpenChange={(o) => { setSaleDialog(o); if (!o) { setEditingSaleId(null); setSaleForm(emptySaleForm); } }}>
              <DialogTrigger asChild><Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Registrar Venta</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editingSaleId ? "Editar Venta" : "Registrar Venta"}</DialogTitle></DialogHeader>
                <form onSubmit={e => { e.preventDefault(); saveSaleMutation.mutate(saleForm); }} className="space-y-3">
                  <div><Label>Fecha *</Label><Input type="date" required value={saleForm.date} onChange={e => setSaleForm({ ...saleForm, date: e.target.value })} /></div>
                  <div><Label>Descripción del Producto *</Label><Input required value={saleForm.product_description} onChange={e => setSaleForm({ ...saleForm, product_description: e.target.value })} placeholder="PC PROFESIONAL RYZEN7..." /></div>
                  <div><Label>Vendedor *</Label><Input required value={saleForm.seller} onChange={e => setSaleForm({ ...saleForm, seller: e.target.value })} placeholder="EDZON, JERSON..." /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Cantidad</Label><Input type="number" min="1" value={saleForm.quantity} onChange={e => setSaleForm({ ...saleForm, quantity: e.target.value })} /></div>
                    <div><Label>Precio Unitario (S/.)</Label><Input type="number" step="0.01" required value={saleForm.unit_price} onChange={e => setSaleForm({ ...saleForm, unit_price: e.target.value })} /></div>
                  </div>
                  <div><Label>Notas</Label><Input value={saleForm.notes} onChange={e => setSaleForm({ ...saleForm, notes: e.target.value })} /></div>
                  <Button type="submit" className="w-full" disabled={saveSaleMutation.isPending}>{editingSaleId ? "Guardar Cambios" : "Registrar"}</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="border border-border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead><TableHead>Descripción</TableHead><TableHead>Vendedor</TableHead>
                  <TableHead className="text-right">Cant.</TableHead><TableHead className="text-right">P. Unit.</TableHead><TableHead className="text-right">Total</TableHead><TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No hay ventas registradas este mes</TableCell></TableRow>
                ) : sales.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="whitespace-nowrap">{new Date(s.date + "T12:00:00").toLocaleDateString("es-PE")}</TableCell>
                    <TableCell className="font-medium max-w-[250px] truncate">{s.product_description}</TableCell>
                    <TableCell>{s.seller}</TableCell>
                    <TableCell className="text-right">{s.quantity}</TableCell>
                    <TableCell className="text-right">S/. {Number(s.unit_price).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-bold">S/. {Number(s.total).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditSale(s)}><Pencil className="h-3 w-3" /></Button>
                        {isAdmin && <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if(confirm("¿Eliminar?")) deleteSaleMutation.mutate(s.id); }}><Trash2 className="h-3 w-3" /></Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* SERVICES TAB */}
        <TabsContent value="services" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => exportCSV(services, `servicios_${MONTHS[month]}_${year}.csv`, ["Fecha","Descripción","Responsable","T.Equipo","Diagnóstico","Precio","Notas"], ["date","description","responsible","device_type","diagnosis","price","notes"])}>
              <Download className="h-4 w-4" /> Exportar CSV
            </Button>
            <Dialog open={serviceDialog} onOpenChange={(o) => { setServiceDialog(o); if (!o) { setEditingServiceId(null); setServiceForm(emptyServiceForm); } }}>
              <DialogTrigger asChild><Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Registrar Servicio</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editingServiceId ? "Editar Servicio" : "Registrar Servicio Técnico"}</DialogTitle></DialogHeader>
                <form onSubmit={e => { e.preventDefault(); saveServiceMutation.mutate(serviceForm); }} className="space-y-3">
                  <div><Label>Fecha *</Label><Input type="date" required value={serviceForm.date} onChange={e => setServiceForm({ ...serviceForm, date: e.target.value })} /></div>
                  <div><Label>Descripción del Servicio *</Label><Input required value={serviceForm.description} onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })} placeholder="MANTENIMIENTO DE IMPRESORA..." /></div>
                  <div><Label>Responsable *</Label><Input required value={serviceForm.responsible} onChange={e => setServiceForm({ ...serviceForm, responsible: e.target.value })} placeholder="JERSON, EDZON..." /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Tipo de Equipo</Label><Input value={serviceForm.device_type} onChange={e => setServiceForm({ ...serviceForm, device_type: e.target.value })} placeholder="LAPTOP, IMPRESORA..." /></div>
                    <div><Label>Diagnóstico</Label><Input value={serviceForm.diagnosis} onChange={e => setServiceForm({ ...serviceForm, diagnosis: e.target.value })} placeholder="FALLA FISICA..." /></div>
                  </div>
                  <div><Label>Precio (S/.) *</Label><Input type="number" step="0.01" required value={serviceForm.price} onChange={e => setServiceForm({ ...serviceForm, price: e.target.value })} /></div>
                  <div><Label>Notas</Label><Input value={serviceForm.notes} onChange={e => setServiceForm({ ...serviceForm, notes: e.target.value })} /></div>
                  <Button type="submit" className="w-full" disabled={saveServiceMutation.isPending}>{editingServiceId ? "Guardar Cambios" : "Registrar"}</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="border border-border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead><TableHead>Descripción</TableHead><TableHead>Responsable</TableHead>
                  <TableHead>T. Equipo</TableHead><TableHead>Diagnóstico</TableHead><TableHead className="text-right">Precio</TableHead><TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No hay servicios registrados este mes</TableCell></TableRow>
                ) : services.map((s: any) => (
                  <TableRow key={s.id}>
                    <TableCell className="whitespace-nowrap">{new Date(s.date + "T12:00:00").toLocaleDateString("es-PE")}</TableCell>
                    <TableCell className="font-medium max-w-[250px] truncate">{s.description}</TableCell>
                    <TableCell>{s.responsible}</TableCell>
                    <TableCell>{s.device_type || "—"}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{s.diagnosis || "—"}</TableCell>
                    <TableCell className="text-right font-bold">S/. {Number(s.price).toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditService(s)}><Pencil className="h-3 w-3" /></Button>
                        {isAdmin && <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if(confirm("¿Eliminar?")) deleteServiceMutation.mutate(s.id); }}><Trash2 className="h-3 w-3" /></Button>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AccountingPage;
