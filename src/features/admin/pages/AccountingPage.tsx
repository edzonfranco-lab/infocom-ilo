import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Receipt, Plus, ShoppingCart, Wrench, TrendingUp, ChevronLeft, ChevronRight,
  Trash2, Pencil, Printer, FileText, Ban, Eye, Package, Settings2, List
} from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import DataImportExport from "@/features/admin/components/DataImportExport";
import PrintReceipt from "@/features/admin/components/PrintReceipt";

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

// ─── Types ──────────────────────────────────────────────────────
interface TransactionItem {
  id?: string;
  item_type: "producto" | "servicio";
  referencia_id?: string | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  // Service-specific fields
  responsable?: string;
  tipo_equipo?: string;
  diagnostico?: string;
}

interface Transaction {
  id: string;
  fecha: string;
  cliente_nombre: string | null;
  cliente_telefono: string | null;
  estado: "borrador" | "emitido" | "anulado";
  tipo_general: "venta" | "servicio" | "mixto";
  subtotal_productos: number;
  subtotal_servicios: number;
  impuestos: number;
  total: number;
  notas: string | null;
  emitido_por: string | null;
  emitido_en: string | null;
  anulado_en: string | null;
  anulado_por: string | null;
  motivo_anulacion: string | null;
  created_at: string;
  items?: TransactionItem[];
}

// ─── Constants ──────────────────────────────────────────────────
const IMPORT_COLUMNS = [
  { key: "item_type", label: "Tipo (producto/servicio)" },
  { key: "descripcion", label: "Descripcion" },
  { key: "cantidad", label: "Cantidad" },
  { key: "precio_unitario", label: "Precio Unitario" },
];

const STATUS_MAP: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  borrador: { label: "Borrador", variant: "secondary" },
  emitido: { label: "Emitido", variant: "default" },
  anulado: { label: "Anulado", variant: "destructive" },
};

const TYPE_MAP: Record<string, { label: string; icon: React.ReactNode }> = {
  venta: { label: "Venta", icon: <ShoppingCart className="h-3 w-3" /> },
  servicio: { label: "Servicio", icon: <Wrench className="h-3 w-3" /> },
  mixto: { label: "Mixto", icon: <List className="h-3 w-3" /> },
};

// ─── Component ──────────────────────────────────────────────────
const AccountingPage = () => {
  const qc = useQueryClient();
  const { isAdmin, user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [activeTab, setActiveTab] = useState("todos");

  // Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [anularOpen, setAnularOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingTx, setViewingTx] = useState<Transaction | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState("");

  // Form state
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split("T")[0],
    cliente_nombre: "",
    cliente_telefono: "",
    notas: "",
    emitido_por: "",
  });
  const [items, setItems] = useState<TransactionItem[]>([]);

  // ─── Date range ───────────────────────────────────────────────
  const startDate = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const endDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

  // ─── Queries ──────────────────────────────────────────────────
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["transactions", month, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .gte("fecha", startDate)
        .lte("fecha", endDate)
        .order("fecha", { ascending: false });
      if (error) throw error;
      return data as Transaction[];
    },
  });

  // ─── Filtered views ───────────────────────────────────────────
  const filtered = useMemo(() => {
    if (activeTab === "ventas") return transactions.filter(t => t.tipo_general === "venta" || t.tipo_general === "mixto");
    if (activeTab === "servicios") return transactions.filter(t => t.tipo_general === "servicio" || t.tipo_general === "mixto");
    return transactions;
  }, [transactions, activeTab]);

  // ─── Metrics (only emitido) ───────────────────────────────────
  const emitidos = transactions.filter(t => t.estado === "emitido");
  const totalProductos = emitidos.reduce((a, t) => a + Number(t.subtotal_productos || 0), 0);
  const totalServicios = emitidos.reduce((a, t) => a + Number(t.subtotal_servicios || 0), 0);
  const totalGeneral = emitidos.reduce((a, t) => a + Number(t.total || 0), 0);

  // ─── Mutations ────────────────────────────────────────────────
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (items.length === 0) throw new Error("Agrega al menos un item");

      if (editingId) {
        // Update existing transaction
        const { error } = await supabase.from("transactions").update({
          fecha: form.fecha,
          cliente_nombre: form.cliente_nombre || null,
          cliente_telefono: form.cliente_telefono || null,
          notas: form.notas || null,
          emitido_por: form.emitido_por || null,
        }).eq("id", editingId);
        if (error) throw error;

        // Delete old items, insert new
        await supabase.from("transaction_items").delete().eq("transaction_id", editingId);
        const itemPayload = items.map(it => ({
          transaction_id: editingId,
          item_type: it.item_type,
          referencia_id: it.referencia_id || null,
          descripcion: it.descripcion,
          cantidad: it.cantidad,
          precio_unitario: it.precio_unitario,
          subtotal: it.cantidad * it.precio_unitario,
        }));
        const { error: ie } = await supabase.from("transaction_items").insert(itemPayload);
        if (ie) throw ie;

        // Log history
        await supabase.from("transaction_history").insert({
          transaction_id: editingId,
          accion: "editado",
          detalles: { items: itemPayload },
          usuario_id: user?.id || null,
        });
      } else {
        // Create new transaction
        const { data: tx, error } = await supabase.from("transactions").insert({
          fecha: form.fecha,
          cliente_nombre: form.cliente_nombre || null,
          cliente_telefono: form.cliente_telefono || null,
          notas: form.notas || null,
          emitido_por: form.emitido_por || null,
          created_by: user?.id || null,
        }).select("id").single();
        if (error) throw error;

        const itemPayload = items.map(it => ({
          transaction_id: tx.id,
          item_type: it.item_type,
          referencia_id: it.referencia_id || null,
          descripcion: it.descripcion,
          cantidad: it.cantidad,
          precio_unitario: it.precio_unitario,
          subtotal: it.cantidad * it.precio_unitario,
        }));
        const { error: ie } = await supabase.from("transaction_items").insert(itemPayload);
        if (ie) throw ie;

        await supabase.from("transaction_history").insert({
          transaction_id: tx.id,
          accion: "creado",
          detalles: { items: itemPayload },
          usuario_id: user?.id || null,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions", month, year] });
      toast.success(editingId ? "Transaccion actualizada" : "Transaccion guardada");
      closeForm();
    },
    onError: (e: any) => toast.error(e.message || "Error al guardar"),
  });

  const emitirMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").update({
        estado: "emitido" as any,
        emitido_en: new Date().toISOString(),
        emitido_por: form.emitido_por || user?.email || "Admin",
      }).eq("id", id);
      if (error) throw error;
      await supabase.from("transaction_history").insert({
        transaction_id: id, accion: "emitido", usuario_id: user?.id || null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions", month, year] });
      toast.success("Transaccion emitida");
    },
  });

  const anularMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").update({
        estado: "anulado" as any,
        anulado_en: new Date().toISOString(),
        anulado_por: user?.email || "Admin",
        motivo_anulacion: motivoAnulacion || null,
      }).eq("id", id);
      if (error) throw error;
      await supabase.from("transaction_history").insert({
        transaction_id: id, accion: "anulado",
        detalles: { motivo: motivoAnulacion },
        usuario_id: user?.id || null,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions", month, year] });
      toast.success("Transaccion anulada");
      setAnularOpen(false);
      setMotivoAnulacion("");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transactions", month, year] });
      toast.success("Borrador eliminado");
    },
  });

  // ─── Helpers ──────────────────────────────────────────────────
  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm({ fecha: new Date().toISOString().split("T")[0], cliente_nombre: "", cliente_telefono: "", notas: "", emitido_por: "" });
    setItems([]);
  };

  const openEdit = async (tx: Transaction) => {
    setForm({
      fecha: tx.fecha,
      cliente_nombre: tx.cliente_nombre || "",
      cliente_telefono: tx.cliente_telefono || "",
      notas: tx.notas || "",
      emitido_por: tx.emitido_por || "",
    });
    setEditingId(tx.id);
    // Load items
    const { data } = await supabase.from("transaction_items").select("*").eq("transaction_id", tx.id);
    setItems((data || []).map((d: any) => ({
      id: d.id, item_type: d.item_type, referencia_id: d.referencia_id,
      descripcion: d.descripcion, cantidad: d.cantidad,
      precio_unitario: Number(d.precio_unitario), subtotal: Number(d.subtotal),
    })));
    setFormOpen(true);
  };

  const openDetail = async (tx: Transaction) => {
    const { data } = await supabase.from("transaction_items").select("*").eq("transaction_id", tx.id);
    setViewingTx({
      ...tx,
      items: (data || []).map((d: any) => ({
        id: d.id, item_type: d.item_type, referencia_id: d.referencia_id,
        descripcion: d.descripcion, cantidad: d.cantidad,
        precio_unitario: Number(d.precio_unitario), subtotal: Number(d.subtotal),
      })),
    });
    setDetailOpen(true);
  };

  const addItem = (type: "producto" | "servicio") => {
    setItems([...items, { item_type: type, descripcion: "", cantidad: 1, precio_unitario: 0, subtotal: 0 }]);
  };

  const updateItem = (index: number, partial: Partial<TransactionItem>) => {
    setItems(prev => prev.map((it, i) => {
      if (i !== index) return it;
      const updated = { ...it, ...partial };
      updated.subtotal = updated.cantidad * updated.precio_unitario;
      return updated;
    }));
  };

  const removeItem = (index: number) => setItems(prev => prev.filter((_, i) => i !== index));

  const itemTotals = useMemo(() => {
    const productos = items.filter(i => i.item_type === "producto").reduce((a, i) => a + i.cantidad * i.precio_unitario, 0);
    const servicios = items.filter(i => i.item_type === "servicio").reduce((a, i) => a + i.cantidad * i.precio_unitario, 0);
    return { productos, servicios, total: productos + servicios };
  }, [items]);

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  // ─── Export data ──────────────────────────────────────────────
  const exportColumns = [
    { key: "fecha", label: "Fecha" },
    { key: "tipo_general", label: "Tipo" },
    { key: "cliente_nombre", label: "Cliente" },
    { key: "estado", label: "Estado" },
    { key: "subtotal_productos", label: "Subtotal Productos" },
    { key: "subtotal_servicios", label: "Subtotal Servicios" },
    { key: "total", label: "Total" },
    { key: "emitido_por", label: "Emitido Por" },
    { key: "notas", label: "Notas" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Receipt className="h-6 w-6 text-primary" /> Contabilidad
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
          <span className="font-semibold text-sm min-w-[160px] text-center">{MONTHS[month]} {year}</span>
          <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="border-success/20">
          <CardContent className="p-4 text-center">
            <ShoppingCart className="h-5 w-5 mx-auto mb-1 text-success" />
            <p className="text-2xl font-bold text-success">S/. {totalProductos.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Ventas del Mes</p>
          </CardContent>
        </Card>
        <Card className="border-info/20">
          <CardContent className="p-4 text-center">
            <Wrench className="h-5 w-5 mx-auto mb-1 text-info" />
            <p className="text-2xl font-bold text-info">S/. {totalServicios.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Servicios del Mes</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold text-primary">S/. {totalGeneral.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">Total del Mes</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="todos" className="gap-1"><List className="h-4 w-4" /> Todos ({transactions.length})</TabsTrigger>
          <TabsTrigger value="ventas" className="gap-1"><ShoppingCart className="h-4 w-4" /> Ventas</TabsTrigger>
          <TabsTrigger value="servicios" className="gap-1"><Wrench className="h-4 w-4" /> Servicios</TabsTrigger>
        </TabsList>

        {/* Shared content for all tabs */}
        <div className="mt-4 space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <DataImportExport
              columns={IMPORT_COLUMNS}
              data={filtered}
              filenamePrefix={`contabilidad_${MONTHS[month]}_${year}`}
              templateDescription="Cada fila es un item. Tipo: 'producto' o 'servicio'."
              onImport={async (rows) => {
                // Create a single transaction from imported items
                const { data: tx, error } = await supabase.from("transactions").insert({
                  fecha: new Date().toISOString().split("T")[0],
                  notas: "Importado desde CSV",
                  created_by: user?.id || null,
                }).select("id").single();
                if (error) throw error;
                const payload = rows.map(r => ({
                  transaction_id: tx.id,
                  item_type: (r.item_type?.toLowerCase() === "servicio" ? "servicio" : "producto") as any,
                  descripcion: r.descripcion || r["Descripcion"] || "",
                  cantidad: parseInt(r.cantidad || r["Cantidad"]) || 1,
                  precio_unitario: parseFloat(r.precio_unitario || r["Precio Unitario"]) || 0,
                  subtotal: (parseInt(r.cantidad) || 1) * (parseFloat(r.precio_unitario) || 0),
                }));
                const { error: ie } = await supabase.from("transaction_items").insert(payload);
                if (ie) throw ie;
                qc.invalidateQueries({ queryKey: ["transactions", month, year] });
              }}
            />
            <Button size="sm" className="gap-2" onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" /> Nueva Transaccion
            </Button>
          </div>

          {/* Transactions table */}
          <div className="border border-border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Productos</TableHead>
                  <TableHead className="text-right">Servicios</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      {isLoading ? "Cargando..." : "No hay transacciones este mes"}
                    </TableCell>
                  </TableRow>
                ) : filtered.map((tx) => {
                  const st = STATUS_MAP[tx.estado];
                  const tp = TYPE_MAP[tx.tipo_general];
                  return (
                    <TableRow key={tx.id} className={tx.estado === "anulado" ? "opacity-50" : ""}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(tx.fecha + "T12:00:00").toLocaleDateString("es-PE")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1 text-xs">
                          {tp?.icon} {tp?.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">{tx.cliente_nombre || "—"}</TableCell>
                      <TableCell>
                        <Badge variant={st?.variant}>{st?.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">S/. {Number(tx.subtotal_productos).toFixed(2)}</TableCell>
                      <TableCell className="text-right">S/. {Number(tx.subtotal_servicios).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-bold">S/. {Number(tx.total).toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDetail(tx)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          {tx.estado === "borrador" && (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(tx)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-success" onClick={() => emitirMutation.mutate(tx.id)}>
                                <FileText className="h-3 w-3" />
                              </Button>
                              {isAdmin && (
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { if (confirm("Eliminar borrador?")) deleteMutation.mutate(tx.id); }}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </>
                          )}
                          {tx.estado === "emitido" && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => { setViewingTx(tx); setAnularOpen(true); }}>
                              <Ban className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      </Tabs>

      {/* ─── NEW/EDIT TRANSACTION DIALOG ─── */}
      <Dialog open={formOpen} onOpenChange={(o) => { if (!o && document.activeElement?.tagName !== "BODY") return; if (!o) closeForm(); else setFormOpen(true); }} modal={false}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-primary" />
              {editingId ? "Editar Transaccion" : "Nueva Transaccion"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
            {/* Basic info */}
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Fecha *</Label><Input type="date" required value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} /></div>
              <div><Label>Emitido Por</Label><Input value={form.emitido_por} onChange={e => setForm({ ...form, emitido_por: e.target.value })} placeholder="EDZON, JERSON..." /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Cliente</Label><Input value={form.cliente_nombre} onChange={e => setForm({ ...form, cliente_nombre: e.target.value })} placeholder="Nombre del cliente" /></div>
              <div><Label>Telefono</Label><Input value={form.cliente_telefono} onChange={e => setForm({ ...form, cliente_telefono: e.target.value })} placeholder="999 999 999" /></div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-base font-bold">Items</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => addItem("producto")}>
                    <Package className="h-3 w-3" /> Producto
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => addItem("servicio")}>
                    <Wrench className="h-3 w-3" /> Servicio
                  </Button>
                </div>
              </div>

              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border rounded-lg">
                  Agrega productos o servicios a esta transaccion
                </p>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[80px]">Tipo</TableHead>
                        <TableHead>Descripcion</TableHead>
                        <TableHead className="w-[80px]">Cant.</TableHead>
                        <TableHead className="w-[110px]">P. Unit.</TableHead>
                        <TableHead className="w-[100px] text-right">Subtotal</TableHead>
                        <TableHead className="w-[40px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Badge variant={item.item_type === "producto" ? "default" : "secondary"} className="text-xs">
                              {item.item_type === "producto" ? "Prod." : "Serv."}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.descripcion}
                              onChange={e => updateItem(idx, { descripcion: e.target.value })}
                              placeholder={item.item_type === "producto" ? "PC RYZEN 7..." : "MANTENIMIENTO..."}
                              className="h-8 text-xs"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number" min="1"
                              value={item.cantidad}
                              onChange={e => updateItem(idx, { cantidad: parseInt(e.target.value) || 1 })}
                              className="h-8 text-xs w-16"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number" step="0.01" min="0"
                              value={item.precio_unitario}
                              onChange={e => updateItem(idx, { precio_unitario: parseFloat(e.target.value) || 0 })}
                              className="h-8 text-xs"
                            />
                          </TableCell>
                          <TableCell className="text-right font-bold text-xs">
                            S/. {(item.cantidad * item.precio_unitario).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeItem(idx)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Totals */}
              {items.length > 0 && (
                <div className="bg-secondary/30 rounded-lg p-3 space-y-1 text-sm">
                  <div className="flex justify-between"><span>Subtotal Productos:</span><span className="font-bold">S/. {itemTotals.productos.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>Subtotal Servicios:</span><span className="font-bold">S/. {itemTotals.servicios.toFixed(2)}</span></div>
                  <div className="flex justify-between text-base border-t border-border pt-1 mt-1">
                    <span className="font-bold">Total:</span>
                    <span className="font-bold text-primary">S/. {itemTotals.total.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            <div><Label>Notas</Label><Input value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} /></div>

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={saveMutation.isPending || items.length === 0}>
                {editingId ? "Guardar Cambios" : "Guardar como Borrador"}
              </Button>
              {!editingId && (
                <Button type="button" variant="secondary" className="flex-1 gap-1" disabled={saveMutation.isPending || items.length === 0}
                  onClick={async () => {
                    if (items.length === 0) return;
                    // Save then emit
                    try {
                      const { data: tx, error } = await supabase.from("transactions").insert({
                        fecha: form.fecha,
                        cliente_nombre: form.cliente_nombre || null,
                        cliente_telefono: form.cliente_telefono || null,
                        notas: form.notas || null,
                        emitido_por: form.emitido_por || user?.email || "Admin",
                        estado: "emitido" as any,
                        emitido_en: new Date().toISOString(),
                        created_by: user?.id || null,
                      }).select("id").single();
                      if (error) throw error;
                      const payload = items.map(it => ({
                        transaction_id: tx.id,
                        item_type: it.item_type,
                        descripcion: it.descripcion,
                        cantidad: it.cantidad,
                        precio_unitario: it.precio_unitario,
                        subtotal: it.cantidad * it.precio_unitario,
                      }));
                      await supabase.from("transaction_items").insert(payload);
                      await supabase.from("transaction_history").insert({
                        transaction_id: tx.id, accion: "creado_y_emitido", usuario_id: user?.id || null,
                      });
                      qc.invalidateQueries({ queryKey: ["transactions", month, year] });
                      toast.success("Transaccion emitida");
                      closeForm();
                    } catch (err: any) {
                      toast.error(err.message || "Error");
                    }
                  }}
                >
                  <FileText className="h-4 w-4" /> Emitir Comprobante
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── DETAIL DIALOG ─── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" /> Detalle de Transaccion
            </DialogTitle>
          </DialogHeader>
          {viewingTx && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Fecha:</span> <span className="font-bold">{viewingTx.fecha}</span></div>
                <div><span className="text-muted-foreground">Estado:</span> <Badge variant={STATUS_MAP[viewingTx.estado]?.variant}>{STATUS_MAP[viewingTx.estado]?.label}</Badge></div>
                <div><span className="text-muted-foreground">Tipo:</span> <span className="font-bold capitalize">{viewingTx.tipo_general}</span></div>
                <div><span className="text-muted-foreground">Emitido por:</span> <span className="font-bold">{viewingTx.emitido_por || "—"}</span></div>
                {viewingTx.cliente_nombre && <div className="col-span-2"><span className="text-muted-foreground">Cliente:</span> <span className="font-bold">{viewingTx.cliente_nombre}</span></div>}
              </div>

              {viewingTx.items && viewingTx.items.length > 0 && (
                <div className="border border-border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descripcion</TableHead>
                        <TableHead className="text-right">Cant.</TableHead>
                        <TableHead className="text-right">P. Unit.</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {viewingTx.items.map((it, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Badge variant={it.item_type === "producto" ? "default" : "secondary"} className="text-xs">
                              {it.item_type === "producto" ? "Prod." : "Serv."}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{it.descripcion}</TableCell>
                          <TableCell className="text-right">{it.cantidad}</TableCell>
                          <TableCell className="text-right">S/. {Number(it.precio_unitario).toFixed(2)}</TableCell>
                          <TableCell className="text-right font-bold">S/. {Number(it.subtotal).toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <div className="bg-secondary/30 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal Productos:</span><span className="font-bold">S/. {Number(viewingTx.subtotal_productos).toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Subtotal Servicios:</span><span className="font-bold">S/. {Number(viewingTx.subtotal_servicios).toFixed(2)}</span></div>
                <div className="flex justify-between text-base border-t border-border pt-1 mt-1">
                  <span className="font-bold">Total:</span>
                  <span className="font-bold text-primary">S/. {Number(viewingTx.total).toFixed(2)}</span>
                </div>
              </div>

              {viewingTx.notas && <p className="text-sm text-muted-foreground"><span className="font-bold">Notas:</span> {viewingTx.notas}</p>}

              {viewingTx.estado === "anulado" && viewingTx.motivo_anulacion && (
                <p className="text-sm text-destructive"><span className="font-bold">Motivo anulacion:</span> {viewingTx.motivo_anulacion}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── ANULAR DIALOG ─── */}
      <Dialog open={anularOpen} onOpenChange={setAnularOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Ban className="h-5 w-5" /> Anular Transaccion
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Esta accion no puede deshacerse. La transaccion quedara registrada como anulada.</p>
            <div>
              <Label>Motivo de Anulacion</Label>
              <Input value={motivoAnulacion} onChange={e => setMotivoAnulacion(e.target.value)} placeholder="Motivo..." />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setAnularOpen(false)}>Cancelar</Button>
              <Button variant="destructive" className="flex-1" onClick={() => viewingTx && anularMutation.mutate(viewingTx.id)} disabled={anularMutation.isPending}>
                Confirmar Anulacion
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountingPage;
