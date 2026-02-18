import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const CategoriesPage = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", slug: "", icon: "", parent_id: "", sort_order: "0", is_active: true });

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
              <div className="space-y-2"><Label>Ícono</Label><Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="laptop, monitor, camera..." /></div>
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
        {categories.map(c => (
          <Card key={c.id} className="border-primary/10">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{c.parent_id ? "↳ " : ""}{c.name}</p>
                <p className="text-xs text-muted-foreground">/{c.slug} • Orden: {c.sort_order}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}><Pencil className="h-3 w-3" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CategoriesPage;
