import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ChevronsUpDown, Check, UserPlus, Search, Star, Phone, IdCard, Mail } from "lucide-react";
import { toast } from "sonner";

export interface CustomerLite {
  id?: string;
  full_name: string;
  phone?: string | null;
  email?: string | null;
  document_number?: string | null;
  address?: string | null;
  is_vip?: boolean;
}

interface Props {
  value?: CustomerLite | null;
  onChange: (c: CustomerLite | null) => void;
  label?: string;
  required?: boolean;
  className?: string;
}

const emptyForm: CustomerLite = { full_name: "", phone: "", email: "", document_number: "", address: "" };

export const CustomerSelector = ({ value, onChange, label = "Cliente", required, className }: Props) => {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [form, setForm] = useState<CustomerLite>(emptyForm);
  const [saving, setSaving] = useState(false);

  const { data: customers = [] } = useQuery({
    queryKey: ["customers_selector"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, full_name, phone, email, document_number, address, is_vip")
        .order("full_name");
      if (error) throw error;
      return data as CustomerLite[];
    },
  });

  const handleCreate = async () => {
    if (!form.full_name?.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("customers")
        .insert({
          full_name: form.full_name.trim(),
          phone: form.phone || null,
          email: form.email || null,
          document_number: form.document_number || null,
          address: form.address || null,
        })
        .select("id, full_name, phone, email, document_number, address, is_vip")
        .single();
      if (error) throw error;
      toast.success("Cliente registrado");
      qc.invalidateQueries({ queryKey: ["customers_selector"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      onChange(data as CustomerLite);
      setNewOpen(false);
      setForm(emptyForm);
    } catch (e: any) {
      toast.error(e.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={className}>
      {label && <Label>{label}{required && " *"}</Label>}
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              className="flex-1 h-9 justify-between font-normal text-xs"
            >
              <span className="flex items-center gap-2 truncate">
                {value?.is_vip && <Star className="h-3 w-3 text-yellow-500 shrink-0" />}
                {value?.full_name || "Seleccionar cliente del directorio..."}
              </span>
              <ChevronsUpDown className="h-3 w-3 ml-1 opacity-50 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[380px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Buscar por nombre, DNI, teléfono..." className="h-9" />
              <CommandList className="max-h-[260px]">
                <CommandEmpty>
                  <div className="text-center py-3 space-y-2">
                    <p className="text-xs text-muted-foreground">No se encontró el cliente</p>
                    <Button
                      type="button"
                      size="sm"
                      variant="default"
                      className="gap-1 h-7 text-xs"
                      onClick={() => { setOpen(false); setNewOpen(true); }}
                    >
                      <UserPlus className="h-3 w-3" /> Crear nuevo
                    </Button>
                  </div>
                </CommandEmpty>
                <CommandGroup heading={`Directorio (${customers.length})`}>
                  {customers.map((c) => (
                    <CommandItem
                      key={c.id}
                      value={`${c.full_name} ${c.phone || ""} ${c.document_number || ""} ${c.email || ""}`}
                      onSelect={() => {
                        onChange(c);
                        setOpen(false);
                      }}
                    >
                      <Check className={`h-3 w-3 mr-2 ${value?.id === c.id ? "opacity-100" : "opacity-0"}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-medium truncate">{c.full_name}</span>
                          {c.is_vip && <Badge className="bg-yellow-500/20 text-yellow-600 text-[9px] px-1 py-0">VIP</Badge>}
                        </div>
                        <div className="text-[10px] text-muted-foreground flex gap-2 mt-0.5">
                          {c.phone && <span className="flex items-center gap-0.5"><Phone className="h-2.5 w-2.5" />{c.phone}</span>}
                          {c.document_number && <span className="flex items-center gap-0.5"><IdCard className="h-2.5 w-2.5" />{c.document_number}</span>}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
              <div className="border-t border-border p-2">
                <Button
                  type="button"
                  size="sm"
                  variant="default"
                  className="w-full gap-1 h-7 text-xs"
                  onClick={() => { setOpen(false); setNewOpen(true); }}
                >
                  <UserPlus className="h-3 w-3" /> Nuevo cliente
                </Button>
              </div>
            </Command>
          </PopoverContent>
        </Popover>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 px-2 text-xs text-muted-foreground"
            onClick={() => onChange(null)}
          >
            Limpiar
          </Button>
        )}
      </div>

      {/* New customer dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Nuevo cliente
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nombre completo *</Label>
              <Input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Juan Pérez"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Teléfono</Label>
                <Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="999 999 999" />
              </div>
              <div>
                <Label>DNI / RUC</Label>
                <Input value={form.document_number || ""} onChange={(e) => setForm({ ...form, document_number: e.target.value })} placeholder="12345678" />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="cliente@email.com" />
            </div>
            <div>
              <Label>Dirección</Label>
              <Input value={form.address || ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setNewOpen(false)} disabled={saving}>Cancelar</Button>
              <Button className="flex-1 gap-1" onClick={handleCreate} disabled={saving}>
                <UserPlus className="h-4 w-4" /> {saving ? "Guardando..." : "Crear y seleccionar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerSelector;
