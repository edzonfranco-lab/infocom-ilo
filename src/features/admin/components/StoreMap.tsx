import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Eye, EyeOff, LayoutGrid } from "lucide-react";

interface Vitrina {
  id: string;
  name: string;
  code: string;
  location?: string;
  floors: number;
  is_active: boolean;
}

interface StoreMapProps {
  vitrinas: Vitrina[];
  productCounts: Record<string, number>;
  onVitrinaClick?: (id: string) => void;
  selectedVitrina?: string | null;
}

const StoreMap = ({ vitrinas, productCounts, onVitrinaClick, selectedVitrina }: StoreMapProps) => {
  const [visible, setVisible] = useState(false);

  if (!visible) {
    return (
      <Button variant="outline" size="sm" onClick={() => setVisible(true)} className="gap-2">
        <Eye className="h-4 w-4" /> Mostrar Mapa de Tienda
      </Button>
    );
  }

  // Group vitrinas by location for layout
  const locationGroups: Record<string, Vitrina[]> = {};
  vitrinas.forEach(v => {
    const loc = v.location || "Sin ubicación";
    if (!locationGroups[loc]) locationGroups[loc] = [];
    locationGroups[loc].push(v);
  });

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> Mapa Visual de la Tienda
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => setVisible(false)} className="gap-1">
            <EyeOff className="h-3.5 w-3.5" /> Ocultar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative bg-secondary/20 rounded-xl border-2 border-dashed border-primary/10 p-4 min-h-[200px]">
          {/* Store outline */}
          <div className="absolute top-2 left-3 text-[10px] text-muted-foreground font-mono">🏪 PLANO DE TIENDA</div>
          
          <div className="mt-4 space-y-4">
            {Object.entries(locationGroups).map(([location, vits]) => (
              <div key={location}>
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {location}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                  {vits.map(v => {
                    const count = productCounts[v.id] || 0;
                    const isSelected = selectedVitrina === v.id;
                    return (
                      <div
                        key={v.id}
                        onClick={() => onVitrinaClick?.(v.id)}
                        className={`cursor-pointer rounded-lg border-2 p-2 text-center transition-all hover:scale-105 ${
                          isSelected
                            ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                            : v.is_active
                            ? "border-primary/20 bg-card hover:border-primary/40"
                            : "border-muted bg-muted/30 opacity-50"
                        }`}
                      >
                        <LayoutGrid className={`h-5 w-5 mx-auto mb-1 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                        <p className="font-mono text-xs font-bold">{v.code}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{v.name}</p>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <Badge variant="secondary" className="text-[9px] px-1">{v.floors}P</Badge>
                          <Badge variant={count > 0 ? "default" : "outline"} className="text-[9px] px-1">{count}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1"><div className="h-2 w-2 rounded bg-primary" /> Seleccionada</span>
            <span className="flex items-center gap-1"><div className="h-2 w-2 rounded bg-primary/20 border border-primary/40" /> Activa</span>
            <span className="flex items-center gap-1"><div className="h-2 w-2 rounded bg-muted" /> Inactiva</span>
            <span>P = Pisos</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StoreMap;
