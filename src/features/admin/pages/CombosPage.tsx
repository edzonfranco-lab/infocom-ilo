import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sparkles, Plus, Pencil, Trash2, Search, Package, Tag, ChevronsUpDown, Check, Box, Layers, Calendar, TrendingDown } from "lucide-react";
import { toast } from "sonner";

interface ComboItemDraft {
  id?: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
}

const emptyForm = {
  name: "",
  description: "",
  image_url: "",
  combo_type: "virtual" as "virtual" | "stock",
  stock: "0",
  min_stock: "1",
  promo_price: "",
  is_active: true,
  valid_from: "",
  valid_until: "",
  notes: "",
};

const CombosPage = () => {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [items, setItems] = useState<ComboItemDraft[]>([]);
  const [search, setSearch] = useState("");

  const { data: combos = [], isLoading } = useQuery({
    queryKey: ["combos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("combos")
        .select("*, combo_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products_for_combos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, price, stock, sku")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("El nombre es obligatorio");
      if (items.length === 0) throw new Error("Agrega al menos un producto al combo");
      if (!form.promo_price || Number(form.promo_price) <= 0) throw new Error("Define el precio promocional");

      const payload = {
        name: form.name.trim(),
        description: form.description || null,
        image_url: form.image_url || null,
        combo_type: form.combo_type,
        stock: form.combo_type === "stock" ? Number(form.stock) : 0,
        min_stock: Number(form.min_stock) || 1,
        promo_price: Number(form.promo_price),
        is_active: form.is_active,
        valid_from: form.valid_from || null,
        valid_until: form.valid_until || null,
        notes: form.notes || null,
      };

      let comboId = editingId;
      if (editingId) {
        const { error } = await supabase.from("combos").update(payload).eq("id", editingId);
        if (error) throw error;
        await supabase.from("combo_items").delete().eq("combo_id", editingId);
      } else {
        const { data, error } = await supabase.from("combos").insert(payload).select("id").single();
        if (error) throw error;
        comboId = data.id;
      }

      const itemPayload = items.map(it => ({
        combo_id: comboId,
        product_id: it.product_id || null,
        product_name: it.product_name,
        quantity: it.quantity,
        unit_price: it.unit_price,
      }));
      const { error: ie } = await supabase.from("combo_items").insert(itemPayload);
      if (ie) throw ie;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["combos"] });
      qc.invalidateQueries({ queryKey: ["combos_for_accounting"] });
      toast.success(editingId ? "Combo actualizado" : "Combo creado");
      closeDialog();
    },
    onError: (e: any) => toast.error(e.message || "Error al guardar"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("combos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["combos"] });
      toast.success("Combo eliminado");
    },
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setItems([]);
  };

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setItems([]);
    setDialogOpen(true);
  };

  const openEdit = (combo: any) => {
    setEditingId(combo.id);
    setForm({
      name: combo.name,
      description: combo.description || "",
      image_url: combo.image_url || "",
      combo_type: combo.combo_type,
      stock: String(combo.stock || 0),
      min_stock: String(combo.min_stock || 1),
      promo_price: String(combo.promo_price),
      is_active: combo.is_active,
      valid_from: combo.valid_from || "",
      valid_until: combo.valid_until || "",
      notes: combo.notes || "",
    });
    setItems((combo.combo_items || []).map((ci: any) => ({
      id: ci.id,
      product_id: ci.product_id,
      product_name: ci.product_name,
      quantity: ci.quantity,
      unit_price: Number(ci.unit_price),
    })));
    setDialogOpen(true);
  };

  const addItem = () => {
    setItems([...items, { product_id: null, product_name: "", quantity: 1, unit_price: 0 }]);
  };

  const updateItem = (idx: number, partial: Partial<ComboItemDraft>) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, ...partial } : it));
  };

  const removeItem = (idx: number) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const totals = useMemo(() => {
    const realPrice = items.reduce((a, it) => a + (it.quantity * it.unit_price), 0);
    const promoPrice = Number(form.promo_price) || 0;
    const savings = Math.max(0, realPrice - promoPrice);
    const savingsPct = realPrice > 0 ? (savings / realPrice) * 100 : 0;
    return { realPrice, promoPrice, savings, savingsPct };
  }, [items, form.promo_price]);

  const filtered = combos.filter((c: any) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  const activeCombos = combos.filter((c: any) => c.is_active).length;
  const virtualCombos = combos.filter((c: any) => c.combo_type === "virtual").length;
  const stockCombos = combos.filter((c: any) => c.combo_type === "stock").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" /> Combos & Promociones
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Arma paquetes de productos a precio especial para boletas, cotizaciones y campañas
          </p>
        </div>
        <Button className="gap-2" onClick={openNew}>
          <Plus className="h-4 w-4" /> Nuevo Combo
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-primary/20"><CardContent className="p-4 text-center">
          <Sparkles className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-bold">{combos.length}</p>
          <p className="text-xs text-muted-foreground">Total combos</p>
        </CardContent></Card>
        <Card className="border-success/20"><CardContent className="p-4 text-center">
          <Tag className="h-5 w-5 text-success mx-auto mb-1" />
          <p className="text-2xl font-bold text-success">{activeCombos}</p>
          <p className="text-xs text-muted-foreground">Activos</p>
        </CardContent></Card>
        <Card className="border-info/20"><CardContent className="p-4 text-center">
          <Layers className="h-5 w-5 text-info mx-auto mb-1" />
          <p className="text-2xl font-bold text-info">{virtualCombos}</p>
          <p className="text-xs text-muted-foreground">Virtuales</p>
        </CardContent></Card>
        <Card className="border-amber-500/20"><CardContent className="p-4 text-center">
          <Box className="h-5 w-5 text-amber-500 mx-auto mb-1" />
          <p className="text-2xl font-bold text-amber-500">{stockCombos}</p>
          <p className="text-xs text-muted-foreground">Con stock propio</p>
        </CardContent></Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar combo por nombre..."
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Aún no hay combos creados</p>
            <p className="text-xs mt-1">Crea tu primer combo para ofrecer paquetes a precio especial</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((c: any) => {
            const realPrice = (c.combo_items || []).reduce(
              (a: number, ci: any) => a + (ci.quantity * Number(ci.unit_price)),
              0
            );
            const promo = Number(c.promo_price);
            const savings = Math.max(0, realPrice - promo);
            const savingsPct = realPrice > 0 ? Math.round((savings / realPrice) * 100) : 0;

            return (
              <Card key={c.id} className={`border-primary/10 hover:border-primary/40 transition-all ${!c.is_active ? "opacity-60" : ""}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {c.image_url ? (
                        <img src={c.image_url} alt={c.name} className="w-16 h-16 rounded-lg object-cover border border-border" />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <Sparkles className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-lg">{c.name}</h3>
                          {!c.is_active && <Badge variant="secondary">Inactivo</Badge>}
                          <Badge variant={c.combo_type === "virtual" ? "default" : "outline"} className="text-[10px]">
                            {c.combo_type === "virtual" ? "Virtual" : "Stock propio"}
                          </Badge>
                          {savingsPct > 0 && (
                            <Badge className="bg-success/20 text-success border-success/30 text-[10px]">
                              <TrendingDown className="h-2.5 w-2.5 mr-0.5" /> -{savingsPct}%
                            </Badge>
                          )}
                        </div>
                        {c.description && <p className="text-xs text-muted-foreground mt-1">{c.description}</p>}
                        <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
                          <span className="text-muted-foreground line-through">S/. {realPrice.toFixed(2)}</span>
                          <span className="font-bold text-lg text-primary">S/. {promo.toFixed(2)}</span>
                          {savings > 0 && <span className="text-success font-medium">Ahorro S/. {savings.toFixed(2)}</span>}
                        </div>
                        {c.combo_items && c.combo_items.length > 0 && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            <span className="font-medium">Incluye:</span>{" "}
                            {c.combo_items.map((ci: any) => `${ci.quantity}× ${ci.product_name}`).join(" • ")}
                          </div>
                        )}
                        {c.combo_type === "stock" && (
                          <div className="text-xs mt-1">
                            <Badge variant={c.stock > 0 ? "default" : "destructive"} className="text-[10px]">
                              Stock: {c.stock}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => openEdit(c)} className="gap-1">
                        <Pencil className="h-3 w-3" /> Editar
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => {
                        if (confirm(`¿Eliminar el combo "${c.name}"?`)) deleteMutation.mutate(c.id);
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) closeDialog(); else setDialogOpen(true); }}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {editingId ? "Editar Combo" : "Nuevo Combo / Promoción"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-5">
            {/* Datos básicos */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                <Tag className="h-4 w-4" /> Datos del combo
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <Label>Nombre del combo *</Label>
                  <Input
                    required
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej: COMBO ESTUDIANTE TEROS"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label>Descripción comercial</Label>
                  <Textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    placeholder="Ideal para estudiantes universitarios. Incluye laptop + accesorios..."
                    rows={2}
                  />
                </div>
                <div>
                  <Label>Tipo de combo</Label>
                  <Select value={form.combo_type} onValueChange={(v: "virtual" | "stock") => setForm({ ...form, combo_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="virtual">Virtual (descuenta cada componente)</SelectItem>
                      <SelectItem value="stock">Con stock propio (armado físicamente)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {form.combo_type === "virtual"
                      ? "Al vender, descuenta el stock de cada producto incluido."
                      : "Lleva su propio inventario independiente."}
                  </p>
                </div>
                <div>
                  <Label>URL imagen (opcional)</Label>
                  <Input
                    value={form.image_url}
                    onChange={e => setForm({ ...form, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                {form.combo_type === "stock" && (
                  <>
                    <div>
                      <Label>Stock disponible</Label>
                      <Input type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} />
                    </div>
                    <div>
                      <Label>Stock mínimo</Label>
                      <Input type="number" min="0" value={form.min_stock} onChange={e => setForm({ ...form, min_stock: e.target.value })} />
                    </div>
                  </>
                )}

                <div>
                  <Label>Vigente desde (opcional)</Label>
                  <Input type="date" value={form.valid_from} onChange={e => setForm({ ...form, valid_from: e.target.value })} />
                </div>
                <div>
                  <Label>Vigente hasta (opcional)</Label>
                  <Input type="date" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })} />
                </div>
              </div>
            </div>

            {/* Productos del combo */}
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                  <Package className="h-4 w-4" /> Productos incluidos
                </h3>
                <Button type="button" variant="outline" size="sm" className="gap-1" onClick={addItem}>
                  <Plus className="h-3 w-3" /> Agregar producto
                </Button>
              </div>

              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-lg">
                  Aún no hay productos en este combo
                </p>
              ) : (
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <div key={idx} className="border border-border rounded-lg p-3 grid grid-cols-1 sm:grid-cols-[1fr_70px_100px_100px_40px] gap-2 items-end">
                      <div>
                        <Label className="text-xs">Producto</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="h-9 w-full justify-between font-normal text-xs">
                              {item.product_name || "Buscar..."}
                              <ChevronsUpDown className="h-3 w-3 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[350px] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Buscar producto..." />
                              <CommandList className="max-h-[220px]">
                                <CommandEmpty>No encontrado</CommandEmpty>
                                <CommandGroup heading="Inventario">
                                  {products.map((p: any) => (
                                    <CommandItem
                                      key={p.id}
                                      value={`${p.name} ${p.sku || ""}`}
                                      onSelect={() => updateItem(idx, {
                                        product_id: p.id,
                                        product_name: p.name,
                                        unit_price: Number(p.price),
                                      })}
                                    >
                                      <Check className={`h-3 w-3 mr-2 ${item.product_id === p.id ? "opacity-100" : "opacity-0"}`} />
                                      <div className="flex-1 min-w-0">
                                        <span className="text-xs font-medium block truncate">{p.name}</span>
                                        {p.sku && <span className="text-[10px] text-muted-foreground">{p.sku}</span>}
                                      </div>
                                      <span className="text-xs font-bold text-primary ml-2">S/.{Number(p.price).toFixed(2)}</span>
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                                <CommandGroup heading="Manual">
                                  <CommandItem onSelect={() => updateItem(idx, { product_id: null })}>
                                    <Package className="h-3 w-3 mr-2" /> Escribir manualmente
                                  </CommandItem>
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {!item.product_id && (
                          <Input
                            value={item.product_name}
                            onChange={e => updateItem(idx, { product_name: e.target.value })}
                            placeholder="Nombre del producto"
                            className="h-8 text-xs mt-1"
                          />
                        )}
                      </div>
                      <div>
                        <Label className="text-xs">Cant.</Label>
                        <Input
                          type="number" min="1"
                          value={item.quantity}
                          onChange={e => updateItem(idx, { quantity: parseInt(e.target.value) || 1 })}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Precio real</Label>
                        <Input
                          type="number" step="0.01" min="0"
                          value={item.unit_price}
                          onChange={e => updateItem(idx, { unit_price: parseFloat(e.target.value) || 0 })}
                          className="h-9"
                        />
                      </div>
                      <div className="text-right">
                        <Label className="text-xs text-muted-foreground">Subtotal</Label>
                        <p className="h-9 flex items-center justify-end font-bold text-sm">
                          S/. {(item.quantity * item.unit_price).toFixed(2)}
                        </p>
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="text-destructive h-9 w-9" onClick={() => removeItem(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Precio promocional */}
            <div className="space-y-3 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-primary flex items-center gap-2">
                <TrendingDown className="h-4 w-4" /> Precio promocional
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label>Precio real (suma)</Label>
                  <Input value={`S/. ${totals.realPrice.toFixed(2)}`} disabled />
                </div>
                <div>
                  <Label>Precio promo *</Label>
                  <Input
                    type="number" step="0.01" min="0" required
                    value={form.promo_price}
                    onChange={e => setForm({ ...form, promo_price: e.target.value })}
                    placeholder="0.00"
                    className="font-bold text-primary"
                  />
                </div>
                <div>
                  <Label>Ahorro del cliente</Label>
                  <Input
                    value={`S/. ${totals.savings.toFixed(2)} (${totals.savingsPct.toFixed(0)}%)`}
                    disabled
                    className={totals.savings > 0 ? "text-success font-bold" : ""}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>Notas internas</Label>
              <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Para campañas, días de la madre, navidad..." />
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
              <Label>Combo activo (visible para venta)</Label>
            </div>

            <div className="flex gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" className="flex-1" onClick={closeDialog}>Cancelar</Button>
              <Button type="submit" className="flex-1" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Guardando..." : (editingId ? "Guardar Cambios" : "Crear Combo")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CombosPage;
