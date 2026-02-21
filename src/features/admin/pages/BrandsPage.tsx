import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Tags, Sun, Moon } from "lucide-react";
import { toast } from "sonner";

const BrandsPage = () => {
  const [brands, setBrands] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", slug: "", logo_url: "", logo_url_dark: "", sort_order: "0", is_active: true });

  const fetchAll = async () => {
    const { data } = await supabase.from("brands").select("*").order("sort_order");
    setBrands(data || []);
  };

  useEffect(() => { fetchAll(); }, []);
  const resetForm = () => { setForm({ name: "", slug: "", logo_url: "", logo_url_dark: "", sort_order: "0", is_active: true }); setEditing(null); };
  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const openEdit = (b: any) => {
    setEditing(b);
    setForm({ name: b.name, slug: b.slug, logo_url: b.logo_url || "", logo_url_dark: (b as any).logo_url_dark || "", sort_order: String(b.sort_order || 0), is_active: b.is_active ?? true });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name) { toast.error("El nombre es obligatorio"); return; }
    const payload: any = { name: form.name, slug: form.slug || generateSlug(form.name), logo_url: form.logo_url || null, sort_order: Number(form.sort_order), is_active: form.is_active };
    if (editing) {
      await supabase.from("brands").update(payload).eq("id", editing.id);
      toast.success("Marca actualizada");
    } else {
      await supabase.from("brands").insert(payload);
      toast.success("Marca creada");
    }
    setDialogOpen(false); resetForm(); fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta marca?")) return;
    await supabase.from("brands").delete().eq("id", id);
    toast.success("Marca eliminada"); fetchAll();
  };

  const toggleActive = async (b: any) => {
    await supabase.from("brands").update({ is_active: !b.is_active } as any).eq("id", b.id);
    fetchAll();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Tags className="h-6 w-6 text-primary" /> Marcas
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Gestiona las marcas que se muestran en el carrusel de la tienda</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" /> Nueva Marca</Button></DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editing ? "Editar" : "Nueva"} Marca</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Nombre *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })} /></div>
              <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="font-mono text-xs" /></div>
              <div className="space-y-3 p-3 rounded-lg bg-secondary/30 border border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Logos</p>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs"><Sun className="h-3 w-3" /> Logo modo claro (URL)</Label>
                  <Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." />
                  {form.logo_url && <div className="bg-white p-2 rounded border border-border"><img src={form.logo_url} alt="Preview" className="h-8 object-contain mx-auto" /></div>}
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs"><Moon className="h-3 w-3" /> Logo modo oscuro (URL)</Label>
                  <Input value={form.logo_url_dark} onChange={(e) => setForm({ ...form, logo_url_dark: e.target.value })} placeholder="https://... (opcional, usa el claro si no se indica)" />
                  {form.logo_url_dark && <div className="bg-background p-2 rounded border border-border"><img src={form.logo_url_dark} alt="Preview" className="h-8 object-contain mx-auto" /></div>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Orden</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
                <div className="flex items-center gap-2 pt-6"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Activa</Label></div>
              </div>
              <Button onClick={handleSave} className="w-full">{editing ? "Guardar Cambios" : "Crear Marca"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {brands.length === 0 ? (
        <Card className="border-dashed border-2 border-primary/20">
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Tags className="h-12 w-12 mb-3 opacity-30" />
            <p className="font-medium">No hay marcas</p>
            <p className="text-sm">Agrega marcas para mostrar en el carrusel</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/30">
                <TableHead className="w-[60px]">Orden</TableHead>
                <TableHead className="w-[80px]">Logo</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="w-[100px]">Slug</TableHead>
                <TableHead className="w-[80px] text-center">Estado</TableHead>
                <TableHead className="w-[100px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.map(b => (
                <TableRow key={b.id} className="hover:bg-secondary/20">
                  <TableCell className="text-center font-mono text-xs">{b.sort_order}</TableCell>
                  <TableCell>
                    {b.logo_url ? <img src={b.logo_url} alt={b.name} className="h-8 w-16 object-contain" /> : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell><p className="font-medium text-sm">{b.name}</p></TableCell>
                  <TableCell><code className="text-[10px] text-muted-foreground">{b.slug}</code></TableCell>
                  <TableCell className="text-center">
                    <button onClick={() => toggleActive(b)}>
                      {b.is_active ? <Badge className="bg-primary/20 text-primary text-[10px]">Activa</Badge> : <Badge variant="secondary" className="text-[10px]">Inactiva</Badge>}
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

export default BrandsPage;
