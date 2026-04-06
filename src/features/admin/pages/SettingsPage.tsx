import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/features/theme/ThemeProvider";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Settings, PartyPopper, Sun } from "lucide-react";
import { toast } from "sonner";

const THEME_EMOJIS: Record<string, string> = {
  default: "🎮", san_valentin: "❤️", halloween: "🎃", navidad: "🎄",
  dia_madre: "🌸", dia_padre: "👔", año_nuevo: "🎆", dia_niño: "🎈", custom: "🎨",
};

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();
  const queryClient = useQueryClient();

  const { data: themeSettings = [] } = useQuery({
    queryKey: ["theme_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("theme_settings").select("*").order("key");
      if (error) throw error;
      return data;
    },
  });

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold flex items-center gap-2">
        <Settings className="h-6 w-6 text-primary" /> Configuración
      </h1>

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

      <Card className="border-primary/10">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><PartyPopper className="h-5 w-5" /> Temas Estacionales</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Activa un tema festivo para toda la tienda.
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
                    isActive ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" : "border-border hover:border-primary/30 hover:bg-secondary/30"
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
                  {isActive && <Badge className="absolute top-2 right-2 text-[10px]">Activo</Badge>}
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
