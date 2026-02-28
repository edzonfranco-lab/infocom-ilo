import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Printer, Settings2 } from "lucide-react";

const PAPER_SIZES: Record<string, { label: string; width: string }> = {
  "50mm": { label: "Ticket 50mm", width: "180px" },
  "58mm": { label: "Ticket 58mm", width: "210px" },
  "80mm": { label: "Ticket 80mm", width: "300px" },
  A4: { label: "A4 (210mm)", width: "700px" },
};
.receipt-title{
  font-size:12px;
  font-weight:900;
  margin-bottom:6px;
  letter-spacing:1px;
}

interface ReceiptConfig {
  paperSize: string;
  fontSize: string;
  showEstimatedCost: boolean;
  showConditions: boolean;
  showSignatures: boolean;
  companyName: string;
  companySubtitle: string;
  footerText: string;
}

const DEFAULT_CONFIG: ReceiptConfig = {
  paperSize: "58mm",
  fontSize: "12",
  showEstimatedCost: true,
  showConditions: true,
  showSignatures: true,
  companyName: "INFOCOM",
  companySubtitle: "ESPECIALISTAS EN TECNOLOGIA\nSoporte Tecnico Especializado",
  footerText: "Gracias por confiar en INFOCOM\nConserve este TICKET para recoger su equipo",
};

const loadConfig = (): ReceiptConfig => {
  try {
    const saved = localStorage.getItem("receipt_config");
    return saved ? { ...DEFAULT_CONFIG, ...JSON.parse(saved) } : DEFAULT_CONFIG;
  } catch { return DEFAULT_CONFIG; }
};

const saveConfig = (c: ReceiptConfig) => localStorage.setItem("receipt_config", JSON.stringify(c));

interface PrintReceiptProps {
  order: any;
  type?: "reception" | "sale" | "service";
}

const PrintReceipt = ({ order, type = "reception" }: PrintReceiptProps) => {
  const [configOpen, setConfigOpen] = useState(false);
  const [config, setConfig] = useState<ReceiptConfig>(loadConfig);

  const handlePrint = () => {
    const c = config;
    const sz = PAPER_SIZES[c.paperSize] || PAPER_SIZES["58mm"];
    const fs = parseInt(c.fontSize) || 12;
    const w = window.open("", "_blank", `width=500,height=700`);
    if (!w) return;

    let bodyContent = "";

    if (type === "reception") {
      bodyContent = `
<div class="center"><div class="title">${c.companyName}</div>
<div class="subtitle">${c.companySubtitle.replace(/\n/g, "<br>")}</div></div>
<div class="line"></div>
<div class="center big">#${order.order_number}</div>
<div class="center receipt-title">TICKET DE RECEPCION</div>
<div class="row"><span>Fecha Recepcion:</span><span>${new Date(order.received_at).toLocaleString("es-PE")}</span></div>

<div class="line"></div>
<h3>DATOS DEL CLIENTE</h3>
<div class="row"><span>Nombre:</span><span class="bold">${order.customer_name}</span></div>
${order.customer_phone ? `<div class="row"><span>Telefono:</span><span>${order.customer_phone}</span></div>` : ""}
${order.customer_email ? `<div class="row"><span>Email:</span><span>${order.customer_email}</span></div>` : ""}
<div class="line"></div>
<h3>EQUIPO RECIBIDO</h3>
<div class="row"><span>Tipo:</span><span class="bold">${order.device_type}</span></div>
${order.device_brand ? `<div class="row"><span>Marca:</span><span>${order.device_brand}</span></div>` : ""}
${order.device_model ? `<div class="row"><span>Modelo:</span><span>${order.device_model}</span></div>` : ""}
<div class="row"><span>Accesorios:</span><span>${order.accessories || "Ninguno"}</span></div>
<div class="line"></div>
<h3>FALLA REPORTADA</h3>
<p style="margin:4px 0">${order.reported_issue}</p>
<div class="line"></div>
${c.showEstimatedCost && order.estimated_cost ? `<div class="row"><span>Costo Estimado:</span><span class="bold">S/. ${Number(order.estimated_cost).toFixed(2)}</span></div>` : ""}
${c.showConditions ? `<div class="line"></div><div class="center" style="margin:8px 0"><p style="font-size:${Math.max(fs - 3, 8)}px">CONDICIONES: El equipo sera revisado en un plazo estimado de 24-72 horas. El costo final puede variar segun el diagnostico tecnico. ${c.companyName} no se responsabiliza por datos no respaldados.</p></div>` : ""}
${c.showSignatures ? `<div class="line"></div><div class="row" style="margin-top:20px"><div style="flex:1;text-align:center;border-top:1px solid #000;margin:0 6px;padding-top:3px"><span style="font-size:${Math.max(fs - 3, 8)}px">Firma del Cliente</span></div><div style="flex:1;text-align:center;border-top:1px solid #000;margin:0 6px;padding-top:3px"><span style="font-size:${Math.max(fs - 3, 8)}px">Firma del Tecnico</span></div></div>` : ""}`;
    } else if (type === "sale") {
      bodyContent = `
<div class="center"><div class="title">${c.companyName}</div>
<div class="subtitle">${c.companySubtitle.replace(/\n/g, "<br>")}</div></div>
<div class="line"></div>
<div class="center big">BOLETA DE VENTA</div>
<div class="line"></div>
<div class="row"><span>Fecha:</span><span>${order.date}</span></div>
<div class="row"><span>Vendedor:</span><span class="bold">${order.seller}</span></div>
<div class="line"></div>
<div class="row"><span>Producto:</span><span class="bold">${order.product_description}</span></div>
<div class="row"><span>Cantidad:</span><span>${order.quantity}</span></div>
<div class="row"><span>P. Unitario:</span><span>S/. ${Number(order.unit_price).toFixed(2)}</span></div>
<div class="line"></div>
<div class="row"><span class="bold">TOTAL:</span><span class="bold big">S/. ${Number(order.total).toFixed(2)}</span></div>`;
    } else {
      bodyContent = `
<div class="center"><div class="title">${c.companyName}</div>
<div class="subtitle">${c.companySubtitle.replace(/\n/g, "<br>")}</div></div>
<div class="line"></div>
<div class="center big">TICKET DE SERVICIO</div>
<div class="line"></div>
<div class="row"><span>Fecha:</span><span>${order.date}</span></div>
<div class="row"><span>Responsable:</span><span class="bold">${order.responsible}</span></div>
<div class="line"></div>
<div class="row"><span>Servicio:</span><span class="bold">${order.description}</span></div>
${order.device_type ? `<div class="row"><span>Equipo:</span><span>${order.device_type}</span></div>` : ""}
${order.diagnosis ? `<div class="row"><span>Diagnostico:</span><span>${order.diagnosis}</span></div>` : ""}
<div class="line"></div>
<div class="row"><span class="bold">TOTAL:</span><span class="bold big">S/. ${Number(order.price).toFixed(2)}</span></div>`;
    }

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>TICKET</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Courier New',monospace;font-size:${fs}px;font-weight:600;padding:8px;max-width:${sz.width};margin:0 auto;color:#000}
  .center{text-align:center}
  .bold{font-weight:900}
  .line{border-top:1px dashed #000;margin:6px 0}
  .row{display:flex;justify-content:space-between;margin:2px 0;gap:4px}
  .title{font-size:${fs + 4}px;font-weight:900;margin-bottom:2px}
  .subtitle{font-size:${Math.max(fs - 2, 8)}px;margin-bottom:6px}
  h3{font-size:${fs}px;margin:4px 0 2px;text-transform:uppercase;letter-spacing:1px;font-weight:900}
  .footer{margin-top:12px;font-size:${Math.max(fs - 3, 8)}px;text-align:center}
  .big{font-size:${fs + 6}px;font-weight:900}
  @media print{body{padding:4px}@page{margin:2mm}}
</style></head><body>
${bodyContent}
<div class="footer"><p>${c.footerText.replace(/\n/g, "<br>")}</p></div>
</body></html>`;

    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.print(); }, 300);
  };

  const updateConfig = (partial: Partial<ReceiptConfig>) => {
    const next = { ...config, ...partial };
    setConfig(next);
    saveConfig(next);
  };

  return (
    <div className="flex gap-1">
      <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
        <Printer className="h-4 w-4" /> Imprimir
      </Button>
      <Dialog open={configOpen} onOpenChange={setConfigOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Settings2 className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Configurar TICKET</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tamaño de Papel</Label>
              <Select value={config.paperSize} onValueChange={v => updateConfig({ paperSize: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(PAPER_SIZES).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tamaño de Fuente (px)</Label>
              <Input type="number" min="8" max="20" value={config.fontSize} onChange={e => updateConfig({ fontSize: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Nombre de Empresa</Label>
              <Input value={config.companyName} onChange={e => updateConfig({ companyName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Subtitulo</Label>
              <Input value={config.companySubtitle} onChange={e => updateConfig({ companySubtitle: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Texto del Pie</Label>
              <Input value={config.footerText} onChange={e => updateConfig({ footerText: e.target.value })} />
            </div>
            {type === "reception" && (
              <>
                <div className="flex items-center gap-2">
                  <Switch checked={config.showEstimatedCost} onCheckedChange={v => updateConfig({ showEstimatedCost: v })} />
                  <Label>Mostrar Costo Estimado</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={config.showConditions} onCheckedChange={v => updateConfig({ showConditions: v })} />
                  <Label>Mostrar Condiciones</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={config.showSignatures} onCheckedChange={v => updateConfig({ showSignatures: v })} />
                  <Label>Mostrar Firmas</Label>
                </div>
              </>
            )}
            <p className="text-xs text-muted-foreground">La configuracion se guarda automaticamente en tu navegador.</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrintReceipt;
