import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
    if (!confirm("¿Eliminar?")) return;
    await supabase.from("banners").delete().eq("id", id);
    toast.success("Eliminado"); fetchAll();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Banners ({banners.length})</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button className="glow-green-sm gap-2"><Plus className="h-4 w-4" /> Nuevo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar" : "Nuevo"} Banner</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="space-y-2"><Label>Subtítulo</Label><Input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} /></div>
              <div className="space-y-2"><Label>Imagen Escritorio (URL) *</Label><Input value={form.image_desktop} onChange={(e) => setForm({ ...form, image_desktop: e.target.value })} /></div>
              <div className="space-y-2"><Label>Imagen Móvil (URL)</Label><Input value={form.image_mobile} onChange={(e) => setForm({ ...form, image_mobile: e.target.value })} /></div>
              <div className="space-y-2"><Label>Enlace</Label><Input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} /></div>
              <div className="space-y-2"><Label>Texto CTA</Label><Input value={form.cta_text} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} /></div>
              <div className="space-y-2"><Label>Orden</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Activo</Label></div>
              <Button onClick={handleSave} className="w-full">{editing ? "Guardar" : "Crear"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-2">
        {banners.map(b => (
          <Card key={b.id} className="border-primary/10">
            <CardContent className="p-4 flex items-center gap-4 justify-between">
              <div className="flex items-center gap-3">
                <img src={b.image_desktop} alt="" className="h-12 w-20 object-cover rounded" />
                <div>
                  <p className="font-medium text-sm">{b.title}</p>
                  <p className="text-xs text-muted-foreground">{b.is_active ? "Activo" : "Inactivo"}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(b)}><Pencil className="h-3 w-3" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(b.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BannersPage;
