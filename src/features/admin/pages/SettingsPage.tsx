import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/features/theme/ThemeProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Settings, Palette, PartyPopper, Sun, Moon, Wrench, Plus, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

const THEME_EMOJIS: Record<string, string> = {
  default: "🎮", san_valentin: "❤️", halloween: "🎃", navidad: "🎄",
  dia_madre: "🌸", dia_padre: "👔", año_nuevo: "🎆", dia_niño: "🎈", custom: "🎨",
};

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();
  const [newService, setNewService] = useState("");

  const { data: themeSettings = [] } = useQuery({
    queryKey: ["theme_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("theme_settings").select("*").order("key");
      if (error) throw error;
      return data;
    },
  });

  // ─── Service Types ─────────────────────────────────────────────
  const { data: serviceTypesRow } = useQuery({
    queryKey: ["store_settings", "service_types"],
    queryFn: async () => {
      const { data, error } = await supabase.from("store_settings").select("*").eq("key", "service_types").maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const serviceTypes: string[] = Array.isArray(serviceTypesRow?.value) ? (serviceTypesRow.value as string[]) : [];

  const saveServiceTypes = useMutation({
    mutationFn: async (types: string[]) => {
      const { error } = await supabase
        .from("store_settings")
        .upsert({ key: "service_types", value: types as any, updated_at: new Date().toISOString() }, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store_settings", "service_types"] });
      toast.success("Tipos de servicio actualizados");
    },
  });

  const addServiceType = () => {
    const name = newService.trim();
    if (!name) return;
    if (serviceTypes.includes(name)) { toast.error("Ya existe"); return; }
    saveServiceTypes.mutate([...serviceTypes, name]);
    setNewService("");
  };

  const removeServiceType = (idx: number) => {
    saveServiceTypes.mutate(serviceTypes.filter((_, i) => i !== idx));
  };

  const activateThemeMutation = useMutation({
    mutationFn: async (key: string) => {
      await supabase.from("theme_settings").update({ is_active: false }).neq("key", "___");
      const { error } = await supabase.from("theme_settings").update({ is_active: true }).eq("key", key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["theme_settings"] });
      toast.success("Tema actualizado");
    },
  });

  const activeTheme = themeSettings.find((t: any) => t.is_active);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold flex items-center gap-2">
        <Settings className="h-6 w-6 text-primary" /> Configuración
      </h1>

      {/* Appearance */}
      <Card className="border-primary/10">
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Sun className="h-5 w-5" /> Apariencia</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Modo Oscuro</Label>
              <p className="text-xs text-muted-foreground">Alterna entre modo claro y oscuro</p>
            </div>
            <Switch checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} />
          </div>
        </CardContent>
      </Card>

      {/* Service Types Management */}
      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Wrench className="h-5 w-5" /> Tipos de Servicio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Administra los tipos de servicio que aparecen en Contabilidad al registrar un servicio técnico.
          </p>

          {/* Add new */}
          <div className="flex gap-2">
            <Input
              placeholder="Nuevo tipo de servicio..."
              value={newService}
              onChange={e => setNewService(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addServiceType()}
              className="flex-1"
            />
            <Button onClick={addServiceType} size="sm" className="gap-1">
              <Plus className="h-4 w-4" /> Agregar
            </Button>
          </div>

          {/* List */}
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {serviceTypes.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No hay tipos de servicio configurados</p>
            )}
            {serviceTypes.map((st, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg border border-border/50 hover:bg-secondary/30 transition-colors group">
                <div className="flex items-center gap-2">
                  <Wrench className="h-3.5 w-3.5 text-primary/60" />
                  <span className="text-sm">{st}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                  onClick={() => removeServiceType(idx)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground">
            Total: {serviceTypes.length} tipos de servicio configurados
          </p>
        </CardContent>
      </Card>

      {/* Seasonal Themes */}
      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><PartyPopper className="h-5 w-5" /> Temas Estacionales</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Activa un tema festivo para toda la tienda. Incluye cambio de colores y efectos de partículas sutiles.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {themeSettings.map((t: any) => {
              const val = t.value as any;
              const emoji = THEME_EMOJIS[t.key] || "🎨";
              const isActive = t.is_active;
              return (
                <div
                  key={t.id}
                  className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                    isActive
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                      : "border-border hover:border-primary/30 hover:bg-secondary/30"
                  }`}
                  onClick={() => activateThemeMutation.mutate(t.key)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{emoji}</span>
                    <div>
                      <p className="font-semibold text-sm">{val.name || t.key}</p>
                      {val.particles && <p className="text-xs text-muted-foreground">Con partículas</p>}
                    </div>
                  </div>
                  {isActive && (
                    <Badge className="absolute top-2 right-2 text-[10px]">Activo</Badge>
                  )}
                  <div className="mt-2 flex gap-1">
                    <div className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: `hsl(${val.primary_hue}, 72%, 45%)` }} />
                    <div className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: `hsl(${val.accent_hue}, 90%, 50%)` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
