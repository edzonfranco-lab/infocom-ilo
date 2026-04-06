import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowDownCircle, ArrowUpCircle, RotateCcw, XCircle, Search, History } from "lucide-react";

const MOVEMENT_CONFIG: Record<string, { label: string; icon: any; color: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  entrada: { label: "Entrada", icon: ArrowDownCircle, color: "text-success", variant: "default" },
  salida: { label: "Salida", icon: ArrowUpCircle, color: "text-destructive", variant: "destructive" },
  anulacion: { label: "Anulación", icon: XCircle, color: "text-amber-500", variant: "secondary" },
  devolucion: { label: "Devolución", icon: RotateCcw, color: "text-info", variant: "outline" },
};

const KardexPage = () => {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");

  const { data: movements = [], isLoading } = useQuery({
    queryKey: ["inventory_movements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_movements")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  const filtered = movements.filter((m: any) => {
    if (search && !m.product_name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType !== "all" && m.movement_type !== filterType) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold flex items-center gap-2">
        <History className="h-6 w-6 text-primary" /> Kardex — Historial de Inventario
      </h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {["entrada", "salida", "anulacion", "devolucion"].map(type => {
          const cfg = MOVEMENT_CONFIG[type];
          const count = movements.filter((m: any) => m.movement_type === type).length;
          const Icon = cfg.icon;
          return (
            <Card key={type} className="border-primary/10">
              <CardContent className="p-3 text-center">
                <Icon className={`h-5 w-5 mx-auto mb-1 ${cfg.color}`} />
                <p className="text-xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">{cfg.label}s</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar producto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 max-w-[220px] bg-secondary/50" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="entrada">Entradas</SelectItem>
            <SelectItem value="salida">Salidas</SelectItem>
            <SelectItem value="anulacion">Anulaciones</SelectItem>
            <SelectItem value="devolucion">Devoluciones</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border border-border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
              <TableHead className="text-right">Stock Antes</TableHead>
              <TableHead className="text-right">Stock Después</TableHead>
              <TableHead>Referencia</TableHead>
              <TableHead>Notas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8">Cargando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No hay movimientos registrados</TableCell></TableRow>
            ) : filtered.map((m: any) => {
              const cfg = MOVEMENT_CONFIG[m.movement_type] || MOVEMENT_CONFIG.entrada;
              const Icon = cfg.icon;
              return (
                <TableRow key={m.id}>
                  <TableCell className="whitespace-nowrap text-xs">{new Date(m.created_at).toLocaleString("es-PE", { dateStyle: "short", timeStyle: "short" })}</TableCell>
                  <TableCell>
                    <Badge variant={cfg.variant} className="gap-1 text-xs">
                      <Icon className="h-3 w-3" /> {cfg.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-sm">{m.product_name}</TableCell>
                  <TableCell className={`text-right font-bold ${m.movement_type === "entrada" || m.movement_type === "devolucion" ? "text-success" : "text-destructive"}`}>
                    {m.movement_type === "entrada" || m.movement_type === "devolucion" ? "+" : "-"}{m.quantity}
                  </TableCell>
                  <TableCell className="text-right">{m.stock_before ?? "—"}</TableCell>
                  <TableCell className="text-right">{m.stock_after ?? "—"}</TableCell>
                  <TableCell className="text-xs capitalize">{m.reference_type || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{m.notes || "—"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default KardexPage;
