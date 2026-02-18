import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const BrandsPage = () => {
  const [brands, setBrands] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", slug: "", logo_url: "", sort_order: "0" });

  const fetchAll = async () => {
    const { data } = await supabase.from("brands").select("*").order("sort_order");
    setBrands(data || []);
  };

  useEffect(() => { fetchAll(); }, []);
  const resetForm = () => { setForm({ name: "", slug: "", logo_url: "", sort_order: "0" }); setEditing(null); };
  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const openEdit = (b: any) => {
    setEditing(b);
    setForm({ name: b.name, slug: b.slug, logo_url: b.logo_url || "", sort_order: String(b.sort_order || 0) });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = { name: form.name, slug: form.slug || generateSlug(form.name), logo_url: form.logo_url || null, sort_order: Number(form.sort_order) };
    if (editing) {
      await supabase.from("brands").update(payload as any).eq("id", editing.id);
      toast.success("Marca actualizada");
    } else {
      await supabase.from("brands").insert(payload as any);
      toast.success("Marca creada");
    }
    setDialogOpen(false); resetForm(); fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta marca?")) return;
    await supabase.from("brands").delete().eq("id", id);
    toast.success("Marca eliminada"); fetchAll();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Marcas ({brands.length})</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button className="glow-green-sm gap-2"><Plus className="h-4 w-4" /> Nueva</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar" : "Nueva"} Marca</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nombre *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
              <div className="space-y-2"><Label>Logo URL</Label><Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." /></div>
              <div className="space-y-2"><Label>Orden</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
              <Button onClick={handleSave} className="w-full">{editing ? "Guardar" : "Crear"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-2">
        {brands.map(b => (
          <Card key={b.id} className="border-primary/10">
            <CardContent className="p-4 flex items-center gap-4 justify-between">
              <div className="flex items-center gap-3">
                {b.logo_url && <img src={b.logo_url} alt={b.name} className="h-8 w-16 object-contain" />}
                <p className="font-medium text-sm">{b.name}</p>
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

export default BrandsPage;
