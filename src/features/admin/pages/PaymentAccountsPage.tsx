import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PAYMENT_METHOD_LABELS } from "@/lib/types";
import type { PaymentMethod } from "@/lib/types";
import { toast } from "sonner";

const PaymentAccountsPage = () => {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ method: "yape" as PaymentMethod, label: "", account_number: "", account_holder: "", bank_name: "", qr_image_url: "", instructions: "", is_active: true, sort_order: "0" });

  const fetchAll = async () => { const { data } = await supabase.from("payment_accounts").select("*").order("sort_order"); setAccounts(data || []); };
  useEffect(() => { fetchAll(); }, []);
  const resetForm = () => { setForm({ method: "yape", label: "", account_number: "", account_holder: "", bank_name: "", qr_image_url: "", instructions: "", is_active: true, sort_order: "0" }); setEditing(null); };

  const openEdit = (a: any) => {
    setEditing(a);
    setForm({ method: a.method, label: a.label, account_number: a.account_number || "", account_holder: a.account_holder || "", bank_name: a.bank_name || "", qr_image_url: a.qr_image_url || "", instructions: a.instructions || "", is_active: a.is_active, sort_order: String(a.sort_order || 0) });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload = { ...form, sort_order: Number(form.sort_order), account_number: form.account_number || null, account_holder: form.account_holder || null, bank_name: form.bank_name || null, qr_image_url: form.qr_image_url || null, instructions: form.instructions || null };
    if (editing) { await supabase.from("payment_accounts").update(payload as any).eq("id", editing.id); toast.success("Actualizado"); }
    else { await supabase.from("payment_accounts").insert(payload as any); toast.success("Creado"); }
    setDialogOpen(false); resetForm(); fetchAll();
  };

  const handleDelete = async (id: string) => { if (!confirm("¿Eliminar?")) return; await supabase.from("payment_accounts").delete().eq("id", id); toast.success("Eliminado"); fetchAll(); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Cuentas de Pago ({accounts.length})</h1>
        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild><Button className="glow-green-sm gap-2"><Plus className="h-4 w-4" /> Nueva</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Editar" : "Nueva"} Cuenta</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Método *</Label>
                <Select value={form.method} onValueChange={(v) => setForm({ ...form, method: v as PaymentMethod })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Etiqueta *</Label><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Ej: Yape Personal" /></div>
              <div className="space-y-2"><Label>N° de cuenta</Label><Input value={form.account_number} onChange={(e) => setForm({ ...form, account_number: e.target.value })} /></div>
              <div className="space-y-2"><Label>Titular</Label><Input value={form.account_holder} onChange={(e) => setForm({ ...form, account_holder: e.target.value })} /></div>
              <div className="space-y-2"><Label>Banco</Label><Input value={form.bank_name} onChange={(e) => setForm({ ...form, bank_name: e.target.value })} /></div>
              <div className="space-y-2"><Label>QR (URL imagen)</Label><Input value={form.qr_image_url} onChange={(e) => setForm({ ...form, qr_image_url: e.target.value })} /></div>
              <div className="space-y-2"><Label>Instrucciones</Label><Textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} rows={2} /></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Activa</Label></div>
              <Button onClick={handleSave} className="w-full">{editing ? "Guardar" : "Crear"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="space-y-2">
        {accounts.map(a => (
          <Card key={a.id} className="border-primary/10">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{a.label}</p>
                <p className="text-xs text-muted-foreground">{PAYMENT_METHOD_LABELS[a.method as PaymentMethod]} {a.account_number ? `• ${a.account_number}` : ""}</p>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(a)}><Pencil className="h-3 w-3" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(a.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default PaymentAccountsPage;
