import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, LayoutGrid, MapPin, Layers, Package, Search } from "lucide-react";
import { toast } from "sonner";
import { CURRENCY } from "@/lib/types";

const VitrinasPage = () => {
  const [vitrinas, setVitrinas] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [selectedVitrina, setSelectedVitrina] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "", code: "", description: "", location: "", floors: "1", is_active: true
  });

  const fetchAll = async () => {
    const [{ data: vits }, { data: prods }] = await Promise.all([
      supabase.from("vitrinas").select("*").order("sort_order"),
      supabase.from("products").select("*, categories(name), brands(name), vitrinas(name, code)").order("name"),
    ]);
    setVitrinas(vits || []);
    setProducts(prods || []);
  };

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => {
    setForm({ name: "", code: "", description: "", location: "", floors: "1", is_active: true });
    setEditing(null);
  };

  const openEdit = (v: any) => {
    setEditing(v);
    setForm({
      name: v.name, code: v.code, description: v.description || "", location: v.location || "",
      floors: String(v.floors), is_active: v.is_active
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code) { toast.error("Nombre y código son obligatorios"); return; }
    const payload: any = {
      name: form.name, code: form.code.toUpperCase(), description: form.description || null,
      location: form.location || null, floors: Number(form.floors) || 1,
      is_active: form.is_active,
    };
    if (!editing) payload.sort_order = vitrinas.length;
    if (editing) {
      const { error } = await supabase.from("vitrinas").update(payload as any).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Vitrina actualizada");
    } else {
      const { error } = await supabase.from("vitrinas").insert(payload as any);
      if (error) { toast.error(error.message); return; }
      toast.success("Vitrina creada");
    }
    setDialogOpen(false); resetForm(); fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta vitrina? Los productos se desasignarán.")) return;
    await supabase.from("vitrinas").delete().eq("id", id);
    toast.success("Vitrina eliminada"); fetchAll();
  };

  const getProductsInVitrina = (vitrinaId: string) =>
    products.filter(p => p.vitrina_id === vitrinaId);

  const getProductsInFloor = (vitrinaId: string, floor: number) =>
    products.filter(p => p.vitrina_id === vitrinaId && p.vitrina_floor === floor);

  const selectedV = vitrinas.find(v => v.id === selectedVitrina);

  const filteredProducts = selectedVitrina
    ? getProductsInVitrina(selectedVitrina).filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    : [];

  const unassignedProducts = products.filter(p => !p.vitrina_id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <LayoutGrid className="h-6 w-6 text-primary" /> Vitrinas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona las vitrinas de tu tienda física y ubica tus productos
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="glow-green-sm gap-2"><Plus className="h-4 w-4" /> Nueva Vitrina</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar" : "Nueva"} Vitrina</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Vitrina Principal" />
                </div>
                <div className="space-y-2">
                  <Label>Código *</Label>
                  <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="V-01" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Ubicación</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Entrada principal, Pasillo 2..." />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label>N° Pisos</Label>
                  <Input type="number" min="1" max="20" value={form.floors} onChange={(e) => setForm({ ...form, floors: e.target.value })} />
                </div>
                <div className="flex items-center gap-2 pt-6">
                <div className="flex items-center gap-2 pt-6">
                  <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                  <Label>Activa</Label>
                </div>
              </div>
              <Button onClick={handleSave} className="w-full">{editing ? "Guardar" : "Crear Vitrina"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-primary/20">
          <CardContent className="p-4 text-center">
            <LayoutGrid className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{vitrinas.length}</p>
            <p className="text-xs text-muted-foreground">Vitrinas</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardContent className="p-4 text-center">
            <Layers className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{vitrinas.reduce((s, v) => s + v.floors, 0)}</p>
            <p className="text-xs text-muted-foreground">Pisos totales</p>
          </CardContent>
        </Card>
        <Card className="border-primary/20">
          <CardContent className="p-4 text-center">
            <Package className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{products.filter(p => p.vitrina_id).length}</p>
            <p className="text-xs text-muted-foreground">Productos ubicados</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/20">
          <CardContent className="p-4 text-center">
            <Package className="h-5 w-5 text-destructive mx-auto mb-1" />
            <p className="text-2xl font-bold">{unassignedProducts.length}</p>
            <p className="text-xs text-muted-foreground">Sin ubicación</p>
          </CardContent>
        </Card>
      </div>

      {/* Vitrinas grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {vitrinas.map(v => {
          const prodsInV = getProductsInVitrina(v.id);
          const isSelected = selectedVitrina === v.id;
          return (
            <Card
              key={v.id}
              className={`cursor-pointer transition-all hover:border-primary/40 ${isSelected ? "ring-2 ring-primary border-primary" : "border-primary/10"} ${!v.is_active ? "opacity-50" : ""}`}
              onClick={() => setSelectedVitrina(isSelected ? null : v.id)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge variant="outline" className="mb-2 font-mono text-xs">{v.code}</Badge>
                    <CardTitle className="text-base">{v.name}</CardTitle>
                    {v.location && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3" /> {v.location}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(v); }}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(v.id); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {/* Visual floor representation */}
                <div className="space-y-1 mb-3">
                  {Array.from({ length: v.floors }, (_, i) => {
                    const floor = v.floors - i;
                    const prodsInFloor = getProductsInFloor(v.id, floor);
                    return (
                      <div key={floor} className={`flex items-center gap-2 px-2 py-1 rounded text-xs ${prodsInFloor.length > 0 ? "bg-primary/10 border border-primary/20" : "bg-secondary/30 border border-border"}`}>
                        <span className="font-mono font-bold w-6 text-center text-muted-foreground">P{floor}</span>
                        <div className="flex-1 flex flex-wrap gap-1">
                          {prodsInFloor.length > 0
                            ? prodsInFloor.map(p => (
                                <span key={p.id} className="px-1.5 py-0.5 bg-primary/20 text-primary rounded text-[10px] truncate max-w-[100px]" title={p.name}>
                                  {p.name}
                                </span>
                              ))
                            : <span className="text-muted-foreground italic">vacío</span>
                          }
                        </div>
                        <span className="text-muted-foreground font-mono">{prodsInFloor.length}</span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground border-t border-border pt-2">
                  <span>{v.floors} pisos</span>
                  <span className="font-medium text-foreground">{prodsInV.length} productos</span>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {vitrinas.length === 0 && (
          <Card className="col-span-full border-dashed border-2 border-primary/20">
            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <LayoutGrid className="h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium">No hay vitrinas</p>
              <p className="text-sm">Crea tu primera vitrina para organizar tus productos</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Selected vitrina detail */}
      {selectedV && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LayoutGrid className="h-5 w-5 text-primary" />
              {selectedV.code} — {selectedV.name}
              <Badge variant="outline" className="ml-2">{getProductsInVitrina(selectedV.id).length} productos</Badge>
            </CardTitle>
            {selectedV.description && <p className="text-sm text-muted-foreground">{selectedV.description}</p>}
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Input placeholder="Buscar en esta vitrina..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: selectedV.floors }, (_, i) => {
                const floor = selectedV.floors - i;
                const prodsInFloor = filteredProducts.filter(p => p.vitrina_floor === floor);
                return (
                  <div key={floor} className="rounded-lg border border-border overflow-hidden">
                    <div className="bg-secondary/30 px-4 py-2 flex items-center justify-between">
                      <span className="font-mono font-bold text-sm">Piso {floor}</span>
                      <Badge variant="secondary" className="text-xs">{prodsInFloor.length} items</Badge>
                    </div>
                    {prodsInFloor.length > 0 ? (
                      <div className="divide-y divide-border">
                        {prodsInFloor.map(p => (
                          <div key={p.id} className="px-4 py-2 flex items-center gap-3 text-sm">
                            <img src={p.images?.[0] || "/placeholder.svg"} className="h-8 w-8 rounded object-cover" alt="" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{p.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {p.brands?.name || "Sin marca"} • {p.categories?.name || "Sin categoría"}
                              </p>
                            </div>
                            <span className="font-bold text-primary text-xs">{CURRENCY}{Number(p.price).toLocaleString()}</span>
                            <Badge variant={p.stock > 0 ? "secondary" : "destructive"} className="text-[10px]">
                              Stock: {p.stock}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="px-4 py-3 text-xs text-muted-foreground italic">Sin productos en este piso</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VitrinasPage;
