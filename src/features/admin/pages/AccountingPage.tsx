import React, { useState, useMemo, useCallback } from "react";
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
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import {
  Receipt, Plus, ShoppingCart, Wrench, TrendingUp, ChevronLeft, ChevronRight,
  Trash2, Pencil, Printer, FileText, Ban, Eye, Package, Settings2, List, Search, ChevronsUpDown, Check
} from "lucide-react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import DataImportExport from "@/features/admin/components/DataImportExport";
import PrintReceipt from "@/features/admin/components/PrintReceipt";
import { notifyAllStaff } from "@/lib/notifications";

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
  const [activeTab, setActiveTab] = useState<"todos" | "ventas" | "servicios">("todos");
  const [searchClient, setSearchClient] = useState("");

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
    emitido_por: "Personal de Infocom",
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

  // Products from inventory
  const { data: products = [] } = useQuery({
    queryKey: ["products_for_accounting"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name, price, stock, sku").eq("is_active", true).order("name");
      if (error) throw error;
      return data;
    },
  });

  // Staff members for dropdowns
  const { data: staffMembers = [] } = useQuery({
    queryKey: ["staff_for_accounting"],
    queryFn: async () => {
      const { data, error } = await supabase.from("staff_members").select("id, full_name, position").eq("is_active", true).order("full_name");
      if (error) throw error;
      return data;
    },
  });

  // Service types (categories that represent services)
  const SERVICE_TYPES = [
    "Mantenimiento preventivo",
    "Mantenimiento correctivo", 
    "Formateo e instalación de S.O.",
    "Reparación de hardware",
    "Reparación de impresora",
    "Cambio de pantalla",
    "Cambio de teclado",
    "Cambio de batería",
    "Limpieza interna",
    "Instalación de software",
    "Recuperación de datos",
    "Diagnóstico técnico",
    "Configuración de red",
    "Ensamblaje de PC",
    "Otro servicio",
  ];

  // ─── Filtered views ───────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = transactions;
    if (activeTab === "ventas") list = list.filter(t => Number(t.subtotal_productos || 0) > 0);
    if (activeTab === "servicios") list = list.filter(t => Number(t.subtotal_servicios || 0) > 0);
    if (searchClient.trim()) {
      const q = searchClient.toLowerCase();
      list = list.filter(t => t.cliente_nombre?.toLowerCase().includes(q));
    }
    return list;
  }, [transactions, activeTab, searchClient]);

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
          responsable: it.responsable || null,
          tipo_equipo: it.tipo_equipo || null,
          diagnostico: it.diagnostico || null,
        }));
        const { error: ie } = await supabase.from("transaction_items").insert(itemPayload as any);
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
          responsable: it.responsable || null,
          tipo_equipo: it.tipo_equipo || null,
          diagnostico: it.diagnostico || null,
        }));
        const { error: ie } = await supabase.from("transaction_items").insert(itemPayload as any);
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
      if (!editingId) {
        const hasService = items.some(i => i.item_type === "servicio");
        const tipo = hasService ? "servicio" : "venta";
        notifyAllStaff({
          title: `Nueva ${tipo === "servicio" ? "orden de servicio" : "venta"} registrada`,
          message: `${form.cliente_nombre || "Sin cliente"} — S/. ${itemTotals.total.toFixed(2)}`,
          type: tipo === "servicio" ? "service" : "sale",
          link: "/admin/contabilidad",
          excludeUserId: user?.id,
        });
      }
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
    setForm({ fecha: new Date().toISOString().split("T")[0], cliente_nombre: "", cliente_telefono: "", notas: "", emitido_por: "Personal de Infocom" });
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
      responsable: d.responsable || "", tipo_equipo: d.tipo_equipo || "", diagnostico: d.diagnostico || "",
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
        responsable: d.responsable || "", tipo_equipo: d.tipo_equipo || "", diagnostico: d.diagnostico || "",
      })),
    });
    setDetailOpen(true);
  };

  const addItem = (type: "producto" | "servicio") => {
    setItems([...items, { item_type: type, descripcion: "", cantidad: 1, precio_unitario: 0, subtotal: 0, responsable: "", tipo_equipo: "", diagnostico: "" }]);
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

  const getDisplayedAmounts = (tx: Transaction) => {
    const productos = Number(tx.subtotal_productos || 0);
    const servicios = Number(tx.subtotal_servicios || 0);

    if (activeTab === "ventas") {
      return { productos, servicios: 0, total: productos };
    }

    if (activeTab === "servicios") {
      return { productos: 0, servicios, total: servicios };
    }

    return { productos, servicios, total: Number(tx.total || 0) };
  };

  // ─── Export data ──────────────────────────────────────────────
  const exportColumns = [
    { key: "fecha", label: "Fecha" },
    { key: "tipo_general", label: "Tipo" },
    { key: "cliente_nombre", label: "Cliente" },
    { key: "cliente_telefono", label: "Teléfono" },
    { key: "estado", label: "Estado" },
    { key: "subtotal_productos", label: "Subtotal Productos" },
    { key: "subtotal_servicios", label: "Subtotal Servicios" },
    { key: "total", label: "Total" },
    { key: "emitido_por", label: "Emitido Por" },
    { key: "notas", label: "Notas" },
  ];

  const buildDetailedExport = async (): Promise<{ headers: string[]; rows: string[][] }> => {
    const headers = [
      "Código", "Fecha", "Tipo Transacción", "Estado", "Cliente", "Teléfono",
      "Tipo Item", "Descripción", "Cant.", "P. Unitario", "Subtotal",
      "Responsable", "Tipo Equipo", "Diagnóstico",
      "Total Productos", "Total Servicios", "TOTAL",
      "Emitido Por", "Notas"
    ];
    const rows: string[][] = [];

    // Sort by created_at for consistent code ordering
    const sorted = [...filtered].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    // Fetch all items for filtered transactions
    const txIds = sorted.map(t => t.id);
    const { data: allItems } = await supabase
      .from("transaction_items")
      .select("*")
      .in("transaction_id", txIds);
    const itemsByTx = new Map<string, any[]>();
    (allItems || []).forEach((it: any) => {
      const list = itemsByTx.get(it.transaction_id) || [];
      list.push(it);
      itemsByTx.set(it.transaction_id, list);
    });

    sorted.forEach((tx, txIdx) => {
      const code = `TX-${String(txIdx + 1).padStart(4, "0")}`;
      const fecha = new Date(tx.fecha + "T12:00:00").toLocaleDateString("es-PE");
      const tipo = tx.tipo_general === "venta" ? "Venta" : tx.tipo_general === "servicio" ? "Servicio" : "Mixto";
      const estado = tx.estado === "emitido" ? "Emitido" : tx.estado === "anulado" ? "Anulado" : "Borrador";
      const txItems = itemsByTx.get(tx.id) || [];

      if (txItems.length === 0) {
        rows.push([
          code, fecha, tipo, estado, tx.cliente_nombre || "", tx.cliente_telefono || "",
          "", "", "", "", "", "", "", "",
          String(Number(tx.subtotal_productos || 0).toFixed(2)),
          String(Number(tx.subtotal_servicios || 0).toFixed(2)),
          String(Number(tx.total || 0).toFixed(2)),
          tx.emitido_por || "", tx.notas || "",
        ]);
      } else {
        txItems.forEach((item: any, idx: number) => {
          rows.push([
            idx === 0 ? code : "",
            idx === 0 ? fecha : "",
            idx === 0 ? tipo : "",
            idx === 0 ? estado : "",
            idx === 0 ? (tx.cliente_nombre || "") : "",
            idx === 0 ? (tx.cliente_telefono || "") : "",
            item.item_type === "producto" ? "Producto" : "Servicio",
            item.descripcion || "",
            String(item.cantidad || 1),
            String(Number(item.precio_unitario || 0).toFixed(2)),
            String(Number(item.subtotal || 0).toFixed(2)),
            item.responsable || "",
            item.tipo_equipo || "",
            item.diagnostico || "",
            idx === 0 ? String(Number(tx.subtotal_productos || 0).toFixed(2)) : "",
            idx === 0 ? String(Number(tx.subtotal_servicios || 0).toFixed(2)) : "",
            idx === 0 ? String(Number(tx.total || 0).toFixed(2)) : "",
            idx === 0 ? (tx.emitido_por || "") : "",
            idx === 0 ? (tx.notas || "") : "",
          ]);
        });
      }
    });

    // Summary row
    const totalProd = filtered.filter(t => t.estado === "emitido").reduce((a, t) => a + Number(t.subtotal_productos || 0), 0);
    const totalServ = filtered.filter(t => t.estado === "emitido").reduce((a, t) => a + Number(t.subtotal_servicios || 0), 0);
    const totalAll = filtered.filter(t => t.estado === "emitido").reduce((a, t) => a + Number(t.total || 0), 0);
    rows.push([]);
    rows.push([
      "", "", "", "", "", "", "", "", "", "", "",
      "", "", "",
      String(totalProd.toFixed(2)),
      String(totalServ.toFixed(2)),
      String(totalAll.toFixed(2)),
      "TOTALES (Emitidos)", ""
    ]);

    return { headers, rows };
  };

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
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "todos" | "ventas" | "servicios")}> 
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="todos" className="gap-1"><List className="h-4 w-4" /> Todos ({transactions.length})</TabsTrigger>
          <TabsTrigger value="ventas" className="gap-1"><ShoppingCart className="h-4 w-4" /> Ventas</TabsTrigger>
          <TabsTrigger value="servicios" className="gap-1"><Wrench className="h-4 w-4" /> Servicios</TabsTrigger>
        </TabsList>

        {/* Shared content for all tabs */}
        <div className="mt-4 space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <Input
              placeholder="Buscar por cliente..."
              value={searchClient}
              onChange={(e) => setSearchClient(e.target.value)}
              className="max-w-[200px] h-8 text-xs bg-secondary/50 border-primary/20"
            />
            <DataImportExport
              columns={IMPORT_COLUMNS}
              exportColumns={exportColumns}
              data={filtered}
              filenamePrefix={`contabilidad_${MONTHS[month]}_${year}`}
              templateDescription="Cada fila es un item. Tipo: 'producto' o 'servicio'."
              detailedExportFn={buildDetailedExport}
              onImport={async (rows) => {
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
                  const displayedAmounts = getDisplayedAmounts(tx);

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
                      <TableCell className="text-right">S/. {displayedAmounts.productos.toFixed(2)}</TableCell>
                      <TableCell className="text-right">S/. {displayedAmounts.servicios.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-bold">S/. {displayedAmounts.total.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openDetail(tx)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                          {tx.estado !== "anulado" && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(tx)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                          )}
                          {tx.estado === "borrador" && (
                            <>
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
      <Dialog open={formOpen} onOpenChange={(o) => { if (!o) closeForm(); else setFormOpen(true); }}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
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
              <div>
                <Label>Atendido Por</Label>
                <Select value={form.emitido_por} onValueChange={v => setForm({ ...form, emitido_por: v })}>
                  <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar personal" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Personal de Infocom">Personal de Infocom</SelectItem>
                    {staffMembers.map((s: any) => <SelectItem key={s.id} value={s.full_name}>{s.full_name} — {s.position}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
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
                        <React.Fragment key={idx}>
                          <TableRow>
                            <TableCell>
                              <Badge variant={item.item_type === "producto" ? "default" : "secondary"} className="text-xs">
                                {item.item_type === "producto" ? "Prod." : "Serv."}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {item.item_type === "producto" ? (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant="outline" className="h-8 text-xs w-full justify-between font-normal">
                                      {item.descripcion || "Seleccionar producto..."}
                                      <ChevronsUpDown className="h-3 w-3 ml-1 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-[300px] p-0" align="start">
                                    <Command>
                                      <CommandInput placeholder="Buscar producto..." className="h-8 text-xs" />
                                      <CommandList>
                                        <CommandEmpty>No encontrado</CommandEmpty>
                                        <CommandGroup heading="Inventario">
                                          {products.map((p: any) => (
                                            <CommandItem key={p.id} value={p.name} onSelect={() => {
                                              updateItem(idx, { descripcion: p.name, precio_unitario: Number(p.price), referencia_id: p.id });
                                            }}>
                                              <Check className={`h-3 w-3 mr-2 ${item.referencia_id === p.id ? "opacity-100" : "opacity-0"}`} />
                                              <div className="flex-1">
                                                <span className="text-xs font-medium">{p.name}</span>
                                                {p.sku && <span className="text-[10px] text-muted-foreground ml-2">SKU: {p.sku}</span>}
                                              </div>
                                              <span className="text-xs font-bold text-primary">S/.{Number(p.price).toFixed(2)}</span>
                                              <span className="text-[10px] text-muted-foreground ml-1">({p.stock} uds)</span>
                                            </CommandItem>
                                          ))}
                                        </CommandGroup>
                                        <CommandGroup heading="Personalizado">
                                          <CommandItem onSelect={() => updateItem(idx, { referencia_id: null })}>
                                            <Package className="h-3 w-3 mr-2" /> Escribir manualmente
                                          </CommandItem>
                                        </CommandGroup>
                                      </CommandList>
                                    </Command>
                                  </PopoverContent>
                                </Popover>
                              ) : (
                                <Select value={item.descripcion} onValueChange={v => updateItem(idx, { descripcion: v })}>
                                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Tipo de servicio..." /></SelectTrigger>
                                  <SelectContent>
                                    {SERVICE_TYPES.map(st => <SelectItem key={st} value={st}>{st}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              )}
                              {item.item_type === "producto" && !item.referencia_id && (
                                <Input
                                  value={item.descripcion}
                                  onChange={e => updateItem(idx, { descripcion: e.target.value })}
                                  placeholder="Escribir nombre del producto..."
                                  className="h-7 text-xs mt-1"
                                />
                              )}
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
                          {/* Extra fields for services */}
                          {item.item_type === "servicio" && (
                            <TableRow className="bg-secondary/10">
                              <TableCell colSpan={6}>
                                <div className="grid grid-cols-3 gap-2 py-1">
                                  <div>
                                    <Label className="text-[10px] text-muted-foreground">Responsable</Label>
                                    <Select value={item.responsable || ""} onValueChange={v => updateItem(idx, { responsable: v })}>
                                      <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                                      <SelectContent>
                                        {staffMembers.map((s: any) => <SelectItem key={s.id} value={s.full_name}>{s.full_name}</SelectItem>)}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label className="text-[10px] text-muted-foreground">Tipo de Equipo</Label>
                                    <Input value={item.tipo_equipo || ""} onChange={e => updateItem(idx, { tipo_equipo: e.target.value })} placeholder="LAPTOP, IMPRESORA..." className="h-7 text-xs" />
                                  </div>
                                  <div>
                                    <Label className="text-[10px] text-muted-foreground">Diagnóstico</Label>
                                    <Input value={item.diagnostico || ""} onChange={e => updateItem(idx, { diagnostico: e.target.value })} placeholder="FALLA FISICA..." className="h-7 text-xs" />
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
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
                        responsable: it.responsable || null,
                        tipo_equipo: it.tipo_equipo || null,
                        diagnostico: it.diagnostico || null,
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
        <DialogContent className="max-w-2xl w-[90vw] max-h-[85vh] overflow-y-auto">
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
                {viewingTx.cliente_telefono && <div><span className="text-muted-foreground">Teléfono:</span> <span className="font-bold">{viewingTx.cliente_telefono}</span></div>}
                {(() => {
                  const notas = viewingTx.notas || "";
                  const dniMatch = notas.match(/DNI:\s*(\d+)/);
                  const pagoMatch = notas.match(/Pago:\s*([^|]+)/);
                  return (<>
                    {dniMatch && <div><span className="text-muted-foreground">DNI:</span> <span className="font-bold">{dniMatch[1]}</span></div>}
                    {pagoMatch && <div><span className="text-muted-foreground">Método Pago:</span> <span className="font-bold">{pagoMatch[1].trim()}</span></div>}
                  </>);
                })()}
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
                        <React.Fragment key={i}>
                          <TableRow>
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
                          {it.item_type === "servicio" && (it.responsable || it.tipo_equipo || it.diagnostico) && (
                            <TableRow className="bg-secondary/10">
                              <TableCell colSpan={5} className="text-xs text-muted-foreground py-1">
                                {it.responsable && <span className="mr-3">👷 {it.responsable}</span>}
                                {it.tipo_equipo && <span className="mr-3">💻 {it.tipo_equipo}</span>}
                                {it.diagnostico && <span>🔧 {it.diagnostico}</span>}
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
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

              {/* Print button for transactions */}
              {viewingTx.estado !== "anulado" && viewingTx.items && viewingTx.items.length > 0 && (
                <div className="pt-2 border-t border-border">
                  <PrintReceipt
                    order={(() => {
                      const notas = viewingTx.notas || "";
                      const dniMatch = notas.match(/DNI:\s*(\d+)/);
                      const pagoMatch = notas.match(/Pago:\s*([^|]+)/);
                      const montoMatch = notas.match(/Recibido:\s*S\/\.\s*([\d.]+)/);
                      const equipoMatch = notas.match(/Equipo:\s*([^|]+)/);
                      const customerDni = dniMatch ? dniMatch[1] : "";
                      const paymentMethod = pagoMatch ? pagoMatch[1].trim() : "";
                      const amountGiven = montoMatch ? montoMatch[1].trim() : "";
                      const equipoInfo = equipoMatch ? equipoMatch[1].trim() : "";

                      return {
                        id: viewingTx.id,
                        date: viewingTx.fecha,
                        customer_name: viewingTx.cliente_nombre || "",
                        customer_phone: viewingTx.cliente_telefono || "",
                        customer_dni: customerDni,
                        payment_method: paymentMethod,
                        amount_given: amountGiven,
                        seller: viewingTx.emitido_por || "Admin",
                        equipo: equipoInfo,
                        items: viewingTx.items!.map(it => ({
                          descripcion: it.descripcion,
                          cantidad: it.cantidad,
                          precio_unitario: it.precio_unitario,
                          subtotal: it.subtotal,
                          item_type: it.item_type,
                          responsable: it.responsable,
                          tipo_equipo: it.tipo_equipo,
                          diagnostico: it.diagnostico,
                        })),
                        subtotal_productos: viewingTx.subtotal_productos,
                        subtotal_servicios: viewingTx.subtotal_servicios,
                        total: viewingTx.total,
                        // Legacy fields for service-only
                        description: viewingTx.items!.filter(it => it.item_type === "servicio").map(it => it.descripcion).join(", "),
                        responsible: viewingTx.items!.find(it => it.responsable)?.responsable || viewingTx.emitido_por || "",
                        device_type: viewingTx.items!.find(it => it.tipo_equipo)?.tipo_equipo || "",
                        diagnosis: viewingTx.items!.find(it => it.diagnostico)?.diagnostico || "",
                        price: viewingTx.total,
                        product_description: viewingTx.items!.map(it => `${it.cantidad}x ${it.descripcion}`).join(", "),
                        quantity: viewingTx.items!.reduce((a, it) => a + it.cantidad, 0),
                        unit_price: viewingTx.total,
                      };
                    })()}
                    type={viewingTx.tipo_general === "servicio" ? "service" : "sale"}
                  />
                </div>
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
