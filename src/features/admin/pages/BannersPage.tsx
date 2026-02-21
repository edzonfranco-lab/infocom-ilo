import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Image, Eye, EyeOff, GripVertical, Monitor, Smartphone } from "lucide-react";
import { toast } from "sonner";

const BannersPage = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: "", subtitle: "", image_desktop: "", image_mobile: "", link_url: "", cta_text: "", sort_order: "0", is_active: true });

  const fetchAll = async () => {
    const { data } = await supabase.from("banners").select("*").order("sort_order");
    setBanners(data || []);
  };

  useEffect(() => { fetchAll(); }, []);
  const resetForm = () => { setForm({ title: "", subtitle: "", image_desktop: "", image_mobile: "", link_url: "", cta_text: "", sort_order: "0", is_active: true }); setEditing(null); };

  const openEdit = (b: any) => {
    setEditing(b);
    setForm({ title: b.title, subtitle: b.subtitle || "", image_desktop: b.image_desktop, image_mobile: b.image_mobile || "", link_url: b.link_url || "", cta_text: b.cta_text || "", sort_order: String(b.sort_order || 0), is_active: b.is_active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title || !form.image_desktop) { toast.error("Título e imagen de escritorio son obligatorios"); return; }
    const payload = { title: form.title, subtitle: form.subtitle || null, image_desktop: form.image_desktop, image_mobile: form.image_mobile || null, link_url: form.link_url || null, cta_text: form.cta_text || null, sort_order: Number(form.sort_order), is_active: form.is_active };
    if (editing) {
      await supabase.from("banners").update(payload as any).eq("id", editing.id);
      toast.success("Banner actualizado");
    } else {
      await supabase.from("banners").insert(payload as any);
      toast.success("Banner creado");
    }
    setDialogOpen(false); resetForm(); fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este banner?")) return;
    await supabase.from("banners").delete().eq("id", id);
    toast.success("Eliminado"); fetchAll();
  };

  const toggleActive = async (b: any) => {
    await supabase.from("banners").update({ is_active: !b.is_active } as any).eq("id", b.id);
    fetchAll();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Image className="h-6 w-6 text-primary" /> Banners / Slides
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gestiona los slides del carrusel principal de la tienda</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Nuevo Banner</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Editar" : "Nuevo"} Banner</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2 col-span-2"><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                <div className="space-y-2 col-span-2"><Label>Subtítulo</Label><Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></div>
              </div>
              <div className="space-y-3 p-3 rounded-lg bg-secondary/30 border border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Imágenes</p>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs"><Monitor className="h-3 w-3" /> Escritorio (URL) *</Label>
                  <Input value={form.image_desktop} onChange={(e) => setForm({ ...form, image_desktop: e.target.value })} placeholder="https://..." />
                  {form.image_desktop && <img src={form.image_desktop} alt="Preview" className="h-20 w-full object-cover rounded border border-border" />}
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs"><Smartphone className="h-3 w-3" /> Móvil (URL)</Label>
                  <Input value={form.image_mobile} onChange={(e) => setForm({ ...form, image_mobile: e.target.value })} placeholder="https://..." />
                  {form.image_mobile && <img src={form.image_mobile} alt="Preview" className="h-20 w-full object-cover rounded border border-border" />}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Enlace</Label><Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="/catalogo" /></div>
                <div className="space-y-2"><Label>Texto CTA</Label><Input value={form.cta_text} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} placeholder="Ver más" /></div>
                <div className="space-y-2"><Label>Orden</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
                <div className="flex items-center gap-2 pt-6"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Activo</Label></div>
              </div>
              <Button onClick={handleSave} className="w-full">{editing ? "Guardar Cambios" : "Crear Banner"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {banners.length === 0 ? (
        <Card className="border-dashed border-2 border-primary/20">
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Image className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-medium">No hay banners</p>
            <p className="text-sm">Crea tu primer banner para el carrusel principal</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/30">
                <TableHead className="w-[60px]">Orden</TableHead>
                <TableHead className="w-[100px]">Preview</TableHead>
                <TableHead>Título</TableHead>
                <TableHead className="w-[80px] text-center">Móvil</TableHead>
                <TableHead className="w-[80px] text-center">Estado</TableHead>
                <TableHead className="w-[100px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.map(b => (
                <TableRow key={b.id} className="hover:bg-secondary/20">
                  <TableCell className="text-center font-mono text-xs">{b.sort_order}</TableCell>
                  <TableCell>
                    <img src={b.image_desktop} alt="" className="h-10 w-20 object-cover rounded border border-border" />
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-sm">{b.title}</p>
                    {b.subtitle && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{b.subtitle}</p>}
                  </TableCell>
                  <TableCell className="text-center">
                    {b.image_mobile ? <Badge variant="outline" className="text-[10px]">Sí</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    <button onClick={() => toggleActive(b)}>
                      {b.is_active ? <Badge className="bg-primary/20 text-primary text-[10px]">Activo</Badge> : <Badge variant="secondary" className="text-[10px]">Inactivo</Badge>}
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(b)}><Pencil className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(b.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default BannersPage;
