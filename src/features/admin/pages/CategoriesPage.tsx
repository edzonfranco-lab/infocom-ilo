import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Pencil, Trash2,
  Laptop, Monitor, Keyboard, Projector, Printer, Package, Camera,
  Cpu, HardDrive, Headphones, Mouse, Wifi, Shield, Server,
  Smartphone, Tablet, Watch, Usb, Cable, Plug, Battery,
  MonitorSmartphone, Tv, Speaker, Gamepad2, ScanLine, Router,
  MemoryStick, CircuitBoard, Fan, Wrench, ShoppingBag, Zap,
  Globe, Lock, Microchip, Radio, Disc, MonitorSpeaker
} from "lucide-react";
import { toast } from "sonner";

const ICON_OPTIONS: { key: string; label: string; icon: any }[] = [
  { key: "laptop", label: "Laptop", icon: Laptop },
  { key: "monitor", label: "Monitor", icon: Monitor },
  { key: "keyboard", label: "Teclado", icon: Keyboard },
  { key: "camera", label: "Cámara", icon: Camera },
  { key: "projector", label: "Proyector", icon: Projector },
  { key: "printer", label: "Impresora", icon: Printer },
  { key: "cpu", label: "Procesador", icon: Cpu },
  { key: "hard-drive", label: "Disco/SSD", icon: HardDrive },
  { key: "headphones", label: "Audífonos", icon: Headphones },
  { key: "mouse", label: "Mouse", icon: Mouse },
  { key: "wifi", label: "WiFi/Redes", icon: Wifi },
  { key: "shield", label: "Seguridad", icon: Shield },
  { key: "server", label: "Servidor", icon: Server },
  { key: "smartphone", label: "Celular", icon: Smartphone },
  { key: "tablet", label: "Tablet", icon: Tablet },
  { key: "watch", label: "Smartwatch", icon: Watch },
  { key: "usb", label: "USB", icon: Usb },
  { key: "cable", label: "Cable", icon: Cable },
  { key: "plug", label: "Energía/UPS", icon: Plug },
  { key: "battery", label: "Batería", icon: Battery },
  { key: "monitor-smartphone", label: "Todo en Uno", icon: MonitorSmartphone },
  { key: "tv", label: "TV", icon: Tv },
  { key: "speaker", label: "Parlante", icon: Speaker },
  { key: "gamepad", label: "Gaming", icon: Gamepad2 },
  { key: "scanner", label: "Escáner", icon: ScanLine },
  { key: "router", label: "Router", icon: Router },
  { key: "memory", label: "Memoria RAM", icon: MemoryStick },
  { key: "circuit", label: "Placa/Tarjeta", icon: CircuitBoard },
  { key: "fan", label: "Ventilador", icon: Fan },
  { key: "wrench", label: "Herramientas", icon: Wrench },
  { key: "shopping", label: "Accesorios", icon: ShoppingBag },
  { key: "zap", label: "Eléctrico", icon: Zap },
  { key: "globe", label: "Internet", icon: Globe },
  { key: "lock", label: "Candado", icon: Lock },
  { key: "microchip", label: "Chip", icon: Microchip },
  { key: "radio", label: "Radio", icon: Radio },
  { key: "disc", label: "Disco", icon: Disc },
  { key: "package", label: "Genérico", icon: Package },
];

const getIconComponent = (key: string) => {
  const found = ICON_OPTIONS.find(o => o.key === key);
  return found?.icon || Package;
};

const CategoriesPage = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", slug: "", icon: "", parent_id: "", sort_order: "0", is_active: true });
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [iconSearch, setIconSearch] = useState("");

  const fetchAll = async () => {
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setCategories(data || []);
  };

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => { setForm({ name: "", slug: "", icon: "", parent_id: "", sort_order: "0", is_active: true }); setEditing(null); };

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, icon: c.icon || "", parent_id: c.parent_id || "", sort_order: String(c.sort_order || 0), is_active: c.is_active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = { name: form.name, slug: form.slug || generateSlug(form.name), icon: form.icon || null, parent_id: form.parent_id || null, sort_order: Number(form.sort_order), is_active: form.is_active };
    if (editing) {
      const { error } = await supabase.from("categories").update(payload as any).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Categoría actualizada");
    } else {
      const { error } = await supabase.from("categories").insert(payload as any);
      if (error) { toast.error(error.message); return; }
      toast.success("Categoría creada");
    }
    setDialogOpen(false); resetForm(); fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta categoría?")) return;
    await supabase.from("categories").delete().eq("id", id);
    toast.success("Categoría eliminada"); fetchAll();
  };

  const parents = categories.filter(c => !c.parent_id);
  const filteredIcons = ICON_OPTIONS.filter(o => 
    o.label.toLowerCase().includes(iconSearch.toLowerCase()) || o.key.includes(iconSearch.toLowerCase())
  );

  const SelectedIcon = form.icon ? getIconComponent(form.icon) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Categorías ({categories.length})</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button className="glow-green-sm gap-2"><Plus className="h-4 w-4" /> Nueva</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar" : "Nueva"} Categoría</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nombre *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
              
              <div className="space-y-2">
                <Label>Ícono</Label>
                <Popover open={iconPickerOpen} onOpenChange={setIconPickerOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      {SelectedIcon ? <SelectedIcon className="h-4 w-4 text-primary" /> : <Package className="h-4 w-4 text-muted-foreground" />}
                      {form.icon ? ICON_OPTIONS.find(o => o.key === form.icon)?.label || form.icon : "Seleccionar ícono..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 p-3" align="start">
                    <Input 
                      placeholder="Buscar ícono..." 
                      value={iconSearch} 
                      onChange={(e) => setIconSearch(e.target.value)} 
                      className="mb-2"
                    />
                    <div className="grid grid-cols-5 gap-1 max-h-[240px] overflow-y-auto">
                      {filteredIcons.map((opt) => {
                        const Icon = opt.icon;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => { setForm({ ...form, icon: opt.key }); setIconPickerOpen(false); setIconSearch(""); }}
                            className={`flex flex-col items-center gap-1 p-2 rounded-lg text-[10px] transition-all hover:bg-primary/20 ${form.icon === opt.key ? "bg-primary/20 ring-1 ring-primary" : ""}`}
                            title={opt.label}
                          >
                            <Icon className="h-5 w-5 text-primary" />
                            <span className="truncate w-full text-center text-muted-foreground">{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Categoría padre</Label>
                <Select value={form.parent_id} onValueChange={(v) => setForm({ ...form, parent_id: v === "none" ? "" : v })}>
                  <SelectTrigger><SelectValue placeholder="Ninguna (raíz)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Ninguna</SelectItem>
                    {parents.filter(p => p.id !== editing?.id).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Orden</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Activa</Label></div>
              <Button onClick={handleSave} className="w-full">{editing ? "Guardar" : "Crear"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-2">
        {categories.map(c => {
          const CatIcon = getIconComponent(c.icon);
          return (
            <Card key={c.id} className="border-primary/10">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CatIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{c.parent_id ? "↳ " : ""}{c.name}</p>
                    <p className="text-xs text-muted-foreground">/{c.slug} • Orden: {c.sort_order} • Ícono: {c.icon || "—"}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default CategoriesPage;
