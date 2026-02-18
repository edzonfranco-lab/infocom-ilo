import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/features/theme/ThemeProvider";
import { Settings } from "lucide-react";

const SettingsPage = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold flex items-center gap-2"><Settings className="h-6 w-6 text-primary" /> Configuración</h1>
      <Card className="border-primary/10">
        <CardHeader><CardTitle className="text-lg">Apariencia</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Modo Oscuro por defecto</Label>
            <Switch checked={theme === "dark"} onCheckedChange={(v) => setTheme(v ? "dark" : "light")} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;
