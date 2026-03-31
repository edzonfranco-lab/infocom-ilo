import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Search, Package, Upload, X, Loader2, GripVertical } from "lucide-react";
import { CURRENCY } from "@/lib/types";
import { toast } from "sonner";

const BUCKET = "product-images";

const ProductImageUploader = ({ images, onChange }: { images: string[]; onChange: (imgs: string[]) => void }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    const newUrls: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith("image/")) continue;
        const ext = file.name.split(".").pop() || "png";
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true });
        if (error) throw error;
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        newUrls.push(data.publicUrl);
      }
      onChange([...images, ...newUrls]);
      toast.success(`${newUrls.length} imagen(es) subida(s)`);
    } catch (err: any) {
      toast.error("Error al subir: " + err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const removeImage = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  const moveImage = (idx: number, direction: -1 | 1) => {
    const newImgs = [...images];
    const target = idx + direction;
    if (target < 0 || target >= newImgs.length) return;
    [newImgs[idx], newImgs[target]] = [newImgs[target], newImgs[idx]];
    onChange(newImgs);
  };

  return (
    <div className="space-y-3">
      <Label className="font-bold">Imágenes del Producto</Label>
      
      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {images.map((img, i) => (
            <div key={i} className="relative group rounded-lg border border-border overflow-hidden aspect-square bg-secondary/30">
              <img src={img} alt={`Imagen ${i + 1}`} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = "/placeholder.svg"; }} />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                {i > 0 && (
                  <Button type="button" variant="secondary" size="icon" className="h-6 w-6" onClick={() => moveImage(i, -1)}>
                    ←
                  </Button>
                )}
                <Button type="button" variant="destructive" size="icon" className="h-6 w-6" onClick={() => removeImage(i)}>
                  <X className="h-3 w-3" />
                </Button>
                {i < images.length - 1 && (
                  <Button type="button" variant="secondary" size="icon" className="h-6 w-6" onClick={() => moveImage(i, 1)}>
                    →
                  </Button>
                )}
              </div>
              {i === 0 && (
                <Badge className="absolute top-1 left-1 text-[9px] px-1 py-0">Principal</Badge>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      <div className="flex gap-2">
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
        <Button
          type="button"
          variant="outline"
          className="w-full gap-2"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? "Subiendo..." : "Agregar Imágenes"}
        </Button>
      </div>

      {/* URL input */}
      <div className="flex gap-2">
        <Input
          placeholder="O pegar URL de imagen..."
          className="text-xs"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const val = (e.target as HTMLInputElement).value.trim();
              if (val) {
                onChange([...images, val]);
                (e.target as HTMLInputElement).value = "";
              }
              e.preventDefault();
            }
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground">La primera imagen será la principal. Puedes subir varias a la vez o pegar URLs.</p>
    </div>
  );
};

const ProductsPage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [vitrinas, setVitrinas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filterVitrina, setFilterVitrina] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterCategory, setFilterCategory] = useState("");

  // Form
  const [form, setForm] = useState({
    name: "", slug: "", description: "", short_description: "", sku: "",
    price: "", original_price: "", cost_price: "", stock: "0", min_stock: "5",
    category_id: "", brand_id: "", images: [] as string[],
    is_active: true, is_featured: false, is_new: false, discount_percent: "0",
    vitrina_id: "", vitrina_floor: "",
  });

  const fetchAll = async () => {
    const [{ data: prods }, { data: cats }, { data: brs }, { data: vits }] = await Promise.all([
      supabase.from("products").select("*, categories(*), brands(*), vitrinas(*)").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
      supabase.from("brands").select("*").order("name"),
      supabase.from("vitrinas").select("*").eq("is_active", true).order("sort_order"),
    ]);
    setProducts(prods || []);
    setCategories(cats || []);
    setBrands(brs || []);
    setVitrinas(vits || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const resetForm = () => {
    setForm({ name: "", slug: "", description: "", short_description: "", sku: "", price: "", original_price: "", cost_price: "", stock: "0", min_stock: "5", category_id: "", brand_id: "", images: [], is_active: true, is_featured: false, is_new: false, discount_percent: "0", vitrina_id: "", vitrina_floor: "" });
    setEditing(null);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      name: p.name, slug: p.slug, description: p.description || "", short_description: p.short_description || "", sku: p.sku || "",
      price: String(p.price), original_price: p.original_price ? String(p.original_price) : "", cost_price: p.cost_price ? String(p.cost_price) : "",
      stock: String(p.stock), min_stock: String(p.min_stock || 5), category_id: p.category_id || "", brand_id: p.brand_id || "",
      images: p.images || [],
      is_active: p.is_active, is_featured: p.is_featured, is_new: p.is_new, discount_percent: String(p.discount_percent || 0),
      vitrina_id: p.vitrina_id || "", vitrina_floor: p.vitrina_floor ? String(p.vitrina_floor) : "",
    });
    setDialogOpen(true);
  };

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const handleSave = async () => {
    const slug = form.slug || generateSlug(form.name);
    const payload = {
      name: form.name, slug, description: form.description || null, short_description: form.short_description || null,
      sku: form.sku || null, price: Number(form.price), original_price: form.original_price ? Number(form.original_price) : null,
      cost_price: form.cost_price ? Number(form.cost_price) : null, stock: Number(form.stock), min_stock: Number(form.min_stock),
      category_id: form.category_id || null, brand_id: form.brand_id || null,
      images: form.images,
      is_active: form.is_active, is_featured: form.is_featured, is_new: form.is_new, discount_percent: Number(form.discount_percent),
      vitrina_id: form.vitrina_id || null, vitrina_floor: form.vitrina_floor ? Number(form.vitrina_floor) : null,
    };

    if (editing) {
      const { error } = await supabase.from("products").update(payload as any).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("Producto actualizado");
    } else {
      const { error } = await supabase.from("products").insert(payload as any);
      if (error) { toast.error(error.message); return; }
      toast.success("Producto creado");
    }
    setDialogOpen(false);
    resetForm();
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este producto?")) return;
    await supabase.from("products").delete().eq("id", id);
    toast.success("Producto eliminado");
    fetchAll();
  };

  const filtered = products.filter(p => {
    if (!p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterVitrina && p.vitrina_id !== filterVitrina) return false;
    if (filterVitrina === "none" && p.vitrina_id) return false;
    if (filterBrand && p.brand_id !== filterBrand) return false;
    if (filterCategory && p.category_id !== filterCategory) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-display font-bold">Productos ({products.length})</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="glow-green-sm gap-2"><Plus className="h-4 w-4" /> Nuevo Producto</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar Producto" : "Nuevo Producto"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Nombre *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })} /></div>
                <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
                <div className="space-y-2"><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
                <div className="space-y-2"><Label>Precio *</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                <div className="space-y-2"><Label>Precio Original</Label><Input type="number" value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} /></div>
                <div className="space-y-2"><Label>Precio Costo</Label><Input type="number" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} /></div>
                <div className="space-y-2"><Label>Stock</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
                <div className="space-y-2"><Label>Stock Mínimo</Label><Input type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} /></div>
                <div className="space-y-2"><Label>% Descuento</Label><Input type="number" value={form.discount_percent} onChange={(e) => setForm({ ...form, discount_percent: e.target.value })} /></div>
                <div className="space-y-2">
                  <Label>Categoría</Label>
                  <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Marca</Label>
                  <Select value={form.brand_id} onValueChange={(v) => setForm({ ...form, brand_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                    <SelectContent>{brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {/* Vitrina assignment */}
                <div className="space-y-2">
                  <Label>Vitrina</Label>
                  <Select value={form.vitrina_id} onValueChange={(v) => setForm({ ...form, vitrina_id: v === "none" ? "" : v, vitrina_floor: "" })}>
                    <SelectTrigger><SelectValue placeholder="Sin asignar" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      {vitrinas.map(v => <SelectItem key={v.id} value={v.id}>{v.code} — {v.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {form.vitrina_id && (
                  <div className="space-y-2">
                    <Label>Piso</Label>
                    <Select value={form.vitrina_floor} onValueChange={(v) => setForm({ ...form, vitrina_floor: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar piso" /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: vitrinas.find(v => v.id === form.vitrina_id)?.floors || 1 }, (_, i) => (
                          <SelectItem key={i + 1} value={String(i + 1)}>Piso {i + 1}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="space-y-2"><Label>Descripción corta</Label><Input value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} /></div>
              <div className="space-y-2"><Label>Descripción</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
              
              {/* Multi-image uploader */}
              <ProductImageUploader
                images={form.images}
                onChange={(imgs) => setForm({ ...form, images: imgs })}
              />

              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Activo</Label></div>
                <div className="flex items-center gap-2"><Switch checked={form.is_featured} onCheckedChange={(v) => setForm({ ...form, is_featured: v })} /><Label>Destacado</Label></div>
                <div className="flex items-center gap-2"><Switch checked={form.is_new} onCheckedChange={(v) => setForm({ ...form, is_new: v })} /><Label>Nuevo</Label></div>
              </div>
              <Button onClick={handleSave} className="w-full">{editing ? "Guardar Cambios" : "Crear Producto"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-2">
        <Input placeholder="Buscar productos..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-[200px] bg-secondary/50 border-primary/20" />
        <Select value={filterVitrina} onValueChange={setFilterVitrina}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Vitrina" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="none">Sin asignar</SelectItem>
            {vitrinas.map(v => <SelectItem key={v.id} value={v.id}>{v.code} — {v.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterBrand} onValueChange={setFilterBrand}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Marca" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Categoría" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? <p>Cargando...</p> : (
        <div className="space-y-2">
          {filtered.map((p) => (
            <Card key={p.id} className="border-primary/10">
              <CardContent className="p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                <div className="flex gap-1 shrink-0">
                  <img src={p.images?.[0] || "/placeholder.svg"} alt="" className="h-12 w-12 sm:h-14 sm:w-14 object-cover rounded-lg" />
                  {(p.images?.length || 0) > 1 && (
                    <Badge variant="secondary" className="self-end text-[9px] px-1 py-0 -ml-3 mb-0.5">+{p.images.length - 1}</Badge>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-1">{p.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-primary">{CURRENCY}{Number(p.price).toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">Stock: {p.stock}</span>
                    {p.stock < (p.min_stock || 5) && <Badge variant="destructive" className="text-[10px]">Bajo</Badge>}
                    {!p.is_active && <Badge variant="secondary" className="text-[10px]">Inactivo</Badge>}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(p)}><Pencil className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No se encontraron productos</p>}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
