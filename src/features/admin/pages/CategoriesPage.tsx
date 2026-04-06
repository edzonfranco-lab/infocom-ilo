import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, FileUp, FileText, ExternalLink, X, Loader2,
  Laptop, Monitor, Keyboard, Projector, Printer, Package, Camera,
  Cpu, HardDrive, Headphones, Mouse, Wifi, Shield, Server,
  Smartphone, Tablet, Watch, Usb, Cable, Plug, Battery,
  MonitorSmartphone, Tv, Speaker, Gamepad2, ScanLine, Router,
  MemoryStick, CircuitBoard, Fan, Wrench, ShoppingBag, Zap,
  Globe, Lock, Microchip, Radio, Disc, MonitorSpeaker,
  Armchair, PcCase, Droplets, PenTool, BookOpen, FileKey,
  Webcam, Pipette, Box, Inbox, SquareStack, Network,
  Power, Maximize, MonitorDown, VolumeX, Volume2, Ratio,
  Flashlight, BatteryCharging, Hash, Link2, ScreenShare,
  Clapperboard, Podcast, Music, Glasses, Ruler, Compass,
  Thermometer, ScrollText, Layers, Settings, Timer, ClipboardList
} from "lucide-react";
import { toast } from "sonner";
import { usePersistentDraft } from "@/hooks/use-persistent-draft";

const ICON_OPTIONS: { key: string; label: string; icon: any }[] = [
  // Computadoras y laptops
  { key: "laptop", label: "Laptop", icon: Laptop },
  { key: "monitor", label: "Monitor", icon: Monitor },
  { key: "pc-case", label: "PC/Case", icon: PcCase },
  { key: "monitor-smartphone", label: "Todo en Uno", icon: MonitorSmartphone },
  { key: "server", label: "Servidor", icon: Server },
  // Periféricos
  { key: "keyboard", label: "Teclado", icon: Keyboard },
  { key: "mouse", label: "Mouse", icon: Mouse },
  { key: "headphones", label: "Audífonos", icon: Headphones },
  { key: "webcam", label: "Webcam", icon: Webcam },
  { key: "speaker", label: "Parlante", icon: Speaker },
  { key: "scanner", label: "Escáner", icon: ScanLine },
  // Impresión y tintas
  { key: "printer", label: "Impresora", icon: Printer },
  { key: "droplets", label: "Tintas", icon: Droplets },
  { key: "pen-tool", label: "Tóner", icon: PenTool },
  // Componentes internos
  { key: "cpu", label: "Procesador", icon: Cpu },
  { key: "memory", label: "Memoria RAM", icon: MemoryStick },
  { key: "hard-drive", label: "Disco/SSD", icon: HardDrive },
  { key: "circuit", label: "Placa/Tarjeta", icon: CircuitBoard },
  { key: "microchip", label: "Chip/GPU", icon: Microchip },
  { key: "fan", label: "Ventilador/Cooler", icon: Fan },
  { key: "battery", label: "Batería", icon: Battery },
  { key: "battery-charging", label: "Cargador", icon: BatteryCharging },
  // Cables y conectores
  { key: "cable", label: "Cable General", icon: Cable },
  { key: "usb", label: "Cable USB", icon: Usb },
  { key: "link2", label: "Cable HDMI", icon: Link2 },
  { key: "ratio", label: "Cable VGA", icon: Ratio },
  { key: "hash", label: "Hub/Adaptador", icon: Hash },
  { key: "plug", label: "Energía/UPS", icon: Plug },
  { key: "power", label: "Extensión", icon: Power },
  // Redes
  { key: "wifi", label: "WiFi/Redes", icon: Wifi },
  { key: "router", label: "Router", icon: Router },
  { key: "network", label: "Switch/Red", icon: Network },
  { key: "globe", label: "Internet", icon: Globe },
  // Dispositivos móviles
  { key: "smartphone", label: "Celular", icon: Smartphone },
  { key: "tablet", label: "Tablet", icon: Tablet },
  { key: "watch", label: "Smartwatch", icon: Watch },
  // Audio y video
  { key: "camera", label: "Cámara", icon: Camera },
  { key: "projector", label: "Proyector", icon: Projector },
  { key: "tv", label: "TV/Pantalla", icon: Tv },
  { key: "radio", label: "Radio", icon: Radio },
  { key: "music", label: "Audio", icon: Music },
  { key: "podcast", label: "Micrófono", icon: Podcast },
  // Gaming
  { key: "gamepad", label: "Gaming", icon: Gamepad2 },
  { key: "armchair", label: "Silla Gamer", icon: Armchair },
  // Mobiliario oficina
  { key: "maximize", label: "Escritorio", icon: Maximize },
  { key: "layers", label: "Mueble", icon: Layers },
  // Software y licencias
  { key: "file-key", label: "Licencia", icon: FileKey },
  { key: "book-open", label: "Software", icon: BookOpen },
  { key: "shield", label: "Antivirus", icon: Shield },
  { key: "lock", label: "Seguridad", icon: Lock },
  // Almacenamiento
  { key: "disc", label: "CD/DVD", icon: Disc },
  { key: "inbox", label: "Almacenamiento", icon: Inbox },
  { key: "box", label: "NAS/Backup", icon: Box },
  // Herramientas y accesorios
  { key: "wrench", label: "Herramientas", icon: Wrench },
  { key: "shopping", label: "Accesorios", icon: ShoppingBag },
  { key: "flashlight", label: "Linterna/LED", icon: Flashlight },
  { key: "glasses", label: "Lentes/VR", icon: Glasses },
  { key: "ruler", label: "Medición", icon: Ruler },
  { key: "thermometer", label: "Temperatura", icon: Thermometer },
  // Servicios y otros
  { key: "clipboard", label: "Servicios", icon: ClipboardList },
  { key: "settings", label: "Configuración", icon: Settings },
  { key: "timer", label: "Mantenimiento", icon: Timer },
  { key: "zap", label: "Eléctrico", icon: Zap },
  { key: "screen-share", label: "Pantalla Comp.", icon: ScreenShare },
  { key: "scroll-text", label: "Documentos", icon: ScrollText },
  { key: "package", label: "Genérico", icon: Package },
];

const getIconComponent = (key: string) => {
  const found = ICON_OPTIONS.find(o => o.key === key);
  return found?.icon || Package;
};

const emptyCategoryForm = { name: "", slug: "", icon: "", parent_id: "", is_active: true, catalog_url: "" };

const CategoriesPage = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(emptyCategoryForm);
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const [iconSearch, setIconSearch] = useState("");
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const pdfRef = useRef<HTMLInputElement>(null);

  const restoreDraft = useCallback((draft: { editing: any; form: typeof emptyCategoryForm }) => {
    if (!draft?.form) return;
    setForm({ ...emptyCategoryForm, ...draft.form });
    setEditing(draft.editing ?? null);
    setDialogOpen(true);
    toast.info("Se restauró tu borrador de categoría");
  }, []);

  const { clearDraft } = usePersistentDraft({
    storageKey: "admin:categories:draft",
    enabled: dialogOpen,
    value: { form, editing },
    isEmpty: (draft) => !draft.editing && JSON.stringify(draft.form) === JSON.stringify(emptyCategoryForm),
    onRestore: restoreDraft,
  });

  const fetchAll = async () => {
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setCategories(data || []);
  };

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => { setForm(emptyCategoryForm); setEditing(null); };

  const openNew = () => {
    clearDraft();
    resetForm();
    setDialogOpen(true);
  };

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const openEdit = (c: any) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, icon: c.icon || "", parent_id: c.parent_id || "", is_active: c.is_active, catalog_url: c.catalog_url || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload: any = { name: form.name, slug: form.slug || generateSlug(form.name), icon: form.icon || null, parent_id: form.parent_id || null, is_active: form.is_active, catalog_url: form.catalog_url || null };
    if (!editing) payload.sort_order = categories.length;
    if (editing) {
      const { error } = await supabase.from("categories").update(payload as any).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Categoría actualizada");
    } else {
      const { error } = await supabase.from("categories").insert(payload as any);
      if (error) { toast.error(error.message); return; }
      toast.success("Categoría creada");
    }
    clearDraft();
    setDialogOpen(false); resetForm(); fetchAll();
  };
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") { toast.error("Solo se permiten archivos PDF"); return; }
    setUploadingPdf(true);
    try {
      const path = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
      const { error } = await supabase.storage.from("category-catalogs").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("category-catalogs").getPublicUrl(path);
      setForm({ ...form, catalog_url: data.publicUrl });
      toast.success("Catálogo PDF subido");
    } catch (err: any) {
      toast.error("Error al subir: " + err.message);
    } finally {
      setUploadingPdf(false);
      if (pdfRef.current) pdfRef.current.value = "";
    }
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
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button className="glow-green-sm gap-2" onClick={openNew}><Plus className="h-4 w-4" /> Nueva</Button></DialogTrigger>
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
                  <PopoverContent className="w-96 p-3" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
                    <Input 
                      placeholder="Buscar ícono..." 
                      value={iconSearch} 
                      onChange={(e) => setIconSearch(e.target.value)} 
                      className="mb-2"
                    />
                    <div 
                      className="grid grid-cols-6 gap-1 max-h-[320px] overflow-y-scroll pr-1"
                      onWheel={(e) => { e.stopPropagation(); }}
                      onTouchMove={(e) => { e.stopPropagation(); }}
                    >
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
              
              {/* Catálogo PDF */}
              <div className="space-y-2">
                <Label>Catálogo PDF</Label>
                <input ref={pdfRef} type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} />
                {form.catalog_url ? (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-secondary/30 border border-border">
                    <FileText className="h-4 w-4 text-primary shrink-0" />
                    <a href={form.catalog_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline truncate flex-1">
                      Ver catálogo
                    </a>
                    <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setForm({ ...form, catalog_url: "" })}>
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="outline" className="w-full gap-2 text-xs" onClick={() => pdfRef.current?.click()} disabled={uploadingPdf}>
                    {uploadingPdf ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileUp className="h-3 w-3" />}
                    {uploadingPdf ? "Subiendo..." : "Subir catálogo PDF"}
                  </Button>
                )}
              </div>

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
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{c.parent_id ? "↳ " : ""}{c.name}</p>
                      {c.catalog_url && (
                        <a href={c.catalog_url} target="_blank" rel="noopener noreferrer" title="Ver catálogo">
                          <Badge variant="outline" className="text-[10px] gap-1 cursor-pointer hover:bg-primary/10">
                            <FileText className="h-3 w-3" /> PDF
                          </Badge>
                        </a>
                      )}
                    </div>
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
