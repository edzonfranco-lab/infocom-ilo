import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Printer, Settings2, FileText } from "lucide-react";

const PAPER_SIZES: Record<string, { label: string; width: string }> = {
  "50mm": { label: "Ticket 50mm", width: "180px" },
  "58mm": { label: "Ticket 58mm", width: "210px" },
  "80mm": { label: "Ticket 80mm", width: "300px" },
  A4: { label: "A4 (210mm)", width: "700px" },
};

interface ReceiptTemplate {
  // General
  paperSize: string;
  fontSize: string;
  companyName: string;
  companySubtitle: string;
  footerText: string;
  // Header mode: 'text' = company name text, 'logo' = logo image
  headerMode: "text" | "logo";
  logoUrl: string;
  // Reception
  receptionTitle: string;
  receptionSectionClient: string;
  receptionSectionDevice: string;
  receptionSectionIssueLabel: string;
  receptionConditionsText: string;
  showEstimatedCost: boolean;
  showConditions: boolean;
  showSignatures: boolean;
  signatureLeft: string;
  signatureRight: string;
  // Sale
  saleTitle: string;
  // Service
  serviceTitle: string;
}

const DEFAULT_TEMPLATE: ReceiptTemplate = {
  paperSize: "58mm",
  fontSize: "12",
  companyName: "INFOCOM",
  companySubtitle: "ESPECIALISTAS EN TECNOLOGIA\nSoporte Tecnico Especializado",
  headerMode: "text",
  logoUrl: "",
  footerText: "Gracias por confiar en INFOCOM\nConserve este ticket para recoger su equipo",
  receptionTitle: "TICKET DE RECEPCION",
  receptionSectionClient: "DATOS DEL CLIENTE",
  receptionSectionDevice: "EQUIPO RECIBIDO",
  receptionSectionIssueLabel: "FALLA REPORTADA",
  receptionConditionsText: "NOTA: Todo equipo dejado para revision debera ser retirado en un plazo maximo e improrrogable de 15 dias calendario. Vencido este lapso, la empresa no asume responsabilidad alguna por perdidas, danos, deterioros o fallas posteriores que pudieran presentarse. Asimismo, a partir del dia 16 se generara automaticamente un cargo por concepto de almacenamiento de S/ 1.00 (un sol) por dia, el cual sera obligatorio y debera ser cancelado integramente al momento del retiro del equipo.",
  showEstimatedCost: true,
  showConditions: true,
  showSignatures: true,
  signatureLeft: "Firma del Cliente",
  signatureRight: "Firma del Tecnico",
  saleTitle: "BOLETA DE VENTA",
  serviceTitle: "TICKET DE SERVICIO",
};

const TEMPLATE_KEY = "receipt_template_v2";

const loadTemplate = (): ReceiptTemplate => {
  try {
    const saved = localStorage.getItem(TEMPLATE_KEY);
    return saved ? { ...DEFAULT_TEMPLATE, ...JSON.parse(saved) } : DEFAULT_TEMPLATE;
  } catch { return DEFAULT_TEMPLATE; }
};

const saveTemplate = (t: ReceiptTemplate) => localStorage.setItem(TEMPLATE_KEY, JSON.stringify(t));

// Per-order overrides stored in localStorage
interface OrderOverrides {
  issueLabel?: string; // e.g. "SERVICIO SOLICITADO" instead of "FALLA REPORTADA"
}

const loadOrderOverrides = (orderId: string): OrderOverrides => {
  try {
    const saved = localStorage.getItem(`receipt_overrides_${orderId}`);
    return saved ? JSON.parse(saved) : {};
  } catch { return {}; }
};

const saveOrderOverrides = (orderId: string, o: OrderOverrides) => {
  localStorage.setItem(`receipt_overrides_${orderId}`, JSON.stringify(o));
};

interface PrintReceiptProps {
  order: any;
  type?: "reception" | "sale" | "service";
}

const PrintReceipt = ({ order, type = "reception" }: PrintReceiptProps) => {
  const [configOpen, setConfigOpen] = useState(false);
  const [template, setTemplate] = useState<ReceiptTemplate>(loadTemplate);
  const [orderOverrides, setOrderOverrides] = useState<OrderOverrides>(() =>
    order?.id ? loadOrderOverrides(order.id) : {}
  );

  const handlePrint = () => {
    const t = template;
    const sz = PAPER_SIZES[t.paperSize] || PAPER_SIZES["58mm"];
    const fs = parseInt(t.fontSize) || 12;
    const w = window.open("", "_blank", `width=500,height=700`);
    if (!w) return;

    let bodyContent = "";
    const issueLabel = orderOverrides.issueLabel || t.receptionSectionIssueLabel;

    if (type === "reception") {
      bodyContent = `
<div class="center"><div class="title">${t.companyName}</div>
<div class="subtitle">${t.companySubtitle.replace(/\n/g, "<br>")}</div></div>
<div class="line"></div>
<div class="center big">#${order.order_number}</div>
<div class="center receipt-title">${t.receptionTitle}</div>
<div class="line"></div>
<div class="row"><span>Fecha Recepcion:</span><span>${new Date(order.received_at).toLocaleString("es-PE")}</span></div>
<div class="line"></div>
<h3>${t.receptionSectionClient}</h3>
<div class="row"><span>Nombre:</span><span class="bold">${order.customer_name}</span></div>
${order.customer_phone ? `<div class="row"><span>Telefono:</span><span>${order.customer_phone}</span></div>` : ""}
${order.customer_email ? `<div class="row"><span>Email:</span><span>${order.customer_email}</span></div>` : ""}
<div class="line"></div>
<h3>${t.receptionSectionDevice}</h3>
<div class="row"><span>Tipo:</span><span class="bold">${order.device_type}</span></div>
${order.device_brand ? `<div class="row"><span>Marca:</span><span>${order.device_brand}</span></div>` : ""}
${order.device_model ? `<div class="row"><span>Modelo:</span><span>${order.device_model}</span></div>` : ""}
<div class="row"><span>Accesorios:</span><span>${order.accessories || "no dejo"}</span></div>
<div class="line"></div>
<h3>${issueLabel}</h3>
<p style="margin:4px 0">${order.reported_issue}</p>
<div class="line"></div>
${t.showEstimatedCost && order.estimated_cost ? `<div class="row"><span>Costo Estimado:</span><span class="bold">S/. ${Number(order.estimated_cost).toFixed(2)}</span></div><div class="line"></div>` : ""}
${t.showConditions ? `<div class="center conditions"><p>${t.receptionConditionsText}</p></div>` : ""}
${t.showSignatures ? `<div class="line"></div><div class="row" style="margin-top:20px"><div style="flex:1;text-align:center;border-top:1px solid #000;margin:0 6px;padding-top:3px"><span style="font-size:${Math.max(fs - 3, 8)}px">${t.signatureLeft}</span></div><div style="flex:1;text-align:center;border-top:1px solid #000;margin:0 6px;padding-top:3px"><span style="font-size:${Math.max(fs - 3, 8)}px">${t.signatureRight}</span></div></div>` : ""}`;
    } else if (type === "sale") {
      bodyContent = `
<div class="center"><div class="title">${t.companyName}</div>
<div class="subtitle">${t.companySubtitle.replace(/\n/g, "<br>")}</div></div>
<div class="line"></div>
<div class="center big">${t.saleTitle}</div>
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
<div class="center"><div class="title">${t.companyName}</div>
<div class="subtitle">${t.companySubtitle.replace(/\n/g, "<br>")}</div></div>
<div class="line"></div>
<div class="center big">${t.serviceTitle}</div>
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
<html><head><meta charset="utf-8"><title>Ticket</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Courier New',monospace;font-size:${fs}px;font-weight:700;padding:8px;max-width:${sz.width};margin:0 auto;color:#000}
  .center{text-align:center}
  .bold{font-weight:900}
  .line{border-top:1px dashed #000;margin:6px 0}
  .row{display:flex;justify-content:space-between;margin:2px 0;gap:4px}
  .title{font-size:${fs + 4}px;font-weight:900;margin-bottom:2px}
  .receipt-title{font-size:${fs + 2}px;font-weight:900;margin:4px 0;letter-spacing:1px}
  .subtitle{font-size:${Math.max(fs - 2, 8)}px;margin-bottom:6px;font-weight:700}
  h3{font-size:${fs}px;margin:4px 0 2px;text-transform:uppercase;letter-spacing:1px;font-weight:900}
  .footer{margin-top:12px;font-size:${Math.max(fs - 3, 8)}px;text-align:center;font-weight:700}
  .big{font-size:${fs + 6}px;font-weight:900}
  .conditions{margin:8px 0;font-size:${Math.max(fs - 2, 8)}px;font-weight:700;text-align:center}
  @media print{body{padding:4px}@page{margin:2mm}}
</style></head><body>
${bodyContent}
<div class="footer"><p>${t.footerText.replace(/\n/g, "<br>")}</p></div>
</body></html>`;

    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.print(); }, 300);
  };

  const updateTemplate = (partial: Partial<ReceiptTemplate>) => {
    const next = { ...template, ...partial };
    setTemplate(next);
    saveTemplate(next);
  };

  const updateOrderOverride = (partial: Partial<OrderOverrides>) => {
    const next = { ...orderOverrides, ...partial };
    setOrderOverrides(next);
    if (order?.id) saveOrderOverrides(order.id, next);
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
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Configurar Ticket</DialogTitle></DialogHeader>
          
          <Tabs defaultValue="order" className="mt-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="order">Esta Orden</TabsTrigger>
              <TabsTrigger value="template">Plantilla General</TabsTrigger>
            </TabsList>

            {/* Per-order settings */}
            <TabsContent value="order" className="space-y-4 mt-3">
              {type === "reception" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="font-bold">Tipo de Ingreso</Label>
                    <Select
                      value={orderOverrides.issueLabel || template.receptionSectionIssueLabel}
                      onValueChange={v => updateOrderOverride({ issueLabel: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FALLA REPORTADA">FALLA REPORTADA (reparacion)</SelectItem>
                        <SelectItem value="SERVICIO SOLICITADO">SERVICIO SOLICITADO (instalacion, etc.)</SelectItem>
                        <SelectItem value="EQUIPO EN REVISION">EQUIPO EN REVISION</SelectItem>
                        <SelectItem value="MANTENIMIENTO">MANTENIMIENTO</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Cambia el titulo de la seccion en el ticket impreso. Ej: si el cliente deja para instalar juegos, selecciona "SERVICIO SOLICITADO".</p>
                  </div>
                </div>
              )}
              <p className="text-xs text-muted-foreground border-t border-border pt-3">Estas opciones solo afectan el ticket de esta orden especifica.</p>
            </TabsContent>

            {/* Global template */}
            <TabsContent value="template" className="space-y-4 mt-3">
              <div className="space-y-2">
                <Label className="font-bold">Tamano de Papel</Label>
                <Select value={template.paperSize} onValueChange={v => updateTemplate({ paperSize: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PAPER_SIZES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="font-bold">Tamano de Fuente (px)</Label>
                <Input type="number" min="8" max="20" value={template.fontSize} onChange={e => updateTemplate({ fontSize: e.target.value })} />
              </div>

              <div className="border-t border-border pt-3 space-y-3">
                <h4 className="font-bold text-sm text-primary">Encabezado</h4>
                <div className="space-y-2">
                  <Label>Nombre de Empresa</Label>
                  <Input value={template.companyName} onChange={e => updateTemplate({ companyName: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Subtitulo (usar \n para salto de linea)</Label>
                  <Textarea value={template.companySubtitle} onChange={e => updateTemplate({ companySubtitle: e.target.value })} rows={2} />
                </div>
              </div>

              <div className="border-t border-border pt-3 space-y-3">
                <h4 className="font-bold text-sm text-primary">Titulos de Ticket</h4>
                <div className="space-y-2">
                  <Label>Titulo - Recepcion Tecnica</Label>
                  <Input value={template.receptionTitle} onChange={e => updateTemplate({ receptionTitle: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Titulo - Boleta de Venta</Label>
                  <Input value={template.saleTitle} onChange={e => updateTemplate({ saleTitle: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Titulo - Ticket de Servicio</Label>
                  <Input value={template.serviceTitle} onChange={e => updateTemplate({ serviceTitle: e.target.value })} />
                </div>
              </div>

              {type === "reception" && (
                <div className="border-t border-border pt-3 space-y-3">
                  <h4 className="font-bold text-sm text-primary">Secciones del Ticket de Recepcion</h4>
                  <div className="space-y-2">
                    <Label>Seccion Cliente</Label>
                    <Input value={template.receptionSectionClient} onChange={e => updateTemplate({ receptionSectionClient: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Seccion Equipo</Label>
                    <Input value={template.receptionSectionDevice} onChange={e => updateTemplate({ receptionSectionDevice: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Seccion Falla/Servicio (por defecto)</Label>
                    <Input value={template.receptionSectionIssueLabel} onChange={e => updateTemplate({ receptionSectionIssueLabel: e.target.value })} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={template.showEstimatedCost} onCheckedChange={v => updateTemplate({ showEstimatedCost: v })} />
                    <Label>Mostrar Costo Estimado</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={template.showConditions} onCheckedChange={v => updateTemplate({ showConditions: v })} />
                    <Label>Mostrar Nota/Condiciones</Label>
                  </div>
                  {template.showConditions && (
                    <div className="space-y-2">
                      <Label>Texto de Nota/Condiciones</Label>
                      <Textarea value={template.receptionConditionsText} onChange={e => updateTemplate({ receptionConditionsText: e.target.value })} rows={6} className="text-xs" />
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Switch checked={template.showSignatures} onCheckedChange={v => updateTemplate({ showSignatures: v })} />
                    <Label>Mostrar Firmas</Label>
                  </div>
                  {template.showSignatures && (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Firma Izquierda</Label>
                        <Input value={template.signatureLeft} onChange={e => updateTemplate({ signatureLeft: e.target.value })} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Firma Derecha</Label>
                        <Input value={template.signatureRight} onChange={e => updateTemplate({ signatureRight: e.target.value })} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-border pt-3 space-y-2">
                <Label className="font-bold">Pie de Ticket (usar \n para salto de linea)</Label>
                <Textarea value={template.footerText} onChange={e => updateTemplate({ footerText: e.target.value })} rows={2} />
              </div>

              <p className="text-xs text-muted-foreground">Los cambios en la plantilla se guardan automaticamente y aplican a todos los tickets futuros.</p>
              <Button variant="outline" size="sm" className="w-full" onClick={() => { setTemplate(DEFAULT_TEMPLATE); saveTemplate(DEFAULT_TEMPLATE); }}>
                Restaurar Valores por Defecto
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrintReceipt;
