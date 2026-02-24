import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface PrintReceiptProps {
  order: any;
}

const PrintReceipt = ({ order }: PrintReceiptProps) => {
  const handlePrint = () => {
    const w = window.open("", "_blank", "width=400,height=600");
    if (!w) return;

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Comprobante #${order.order_number}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Courier New',monospace;font-size:12px;padding:16px;max-width:350px;margin:0 auto}
  .center{text-align:center}
  .bold{font-weight:bold}
  .line{border-top:1px dashed #000;margin:8px 0}
  .row{display:flex;justify-content:space-between;margin:2px 0}
  .title{font-size:16px;font-weight:bold;margin-bottom:2px}
  .subtitle{font-size:10px;color:#555;margin-bottom:8px}
  h3{font-size:12px;margin:6px 0 3px;text-transform:uppercase;letter-spacing:1px}
  .footer{margin-top:16px;font-size:9px;text-align:center;color:#777}
  .big{font-size:20px;font-weight:bold}
  @media print{body{padding:8px}}
</style></head><body>
<div class="center">
  <div class="title">INFOCOM</div>
  <div class="subtitle">ESPECIALISTAS EN TECNOLOGÍA<br>Soporte Técnico Especializado</div>
</div>
<div class="line"></div>
<div class="center big">#${order.order_number}</div>
<div class="center subtitle">COMPROBANTE DE RECEPCIÓN</div>
<div class="line"></div>

<h3>📋 Datos del Cliente</h3>
<div class="row"><span>Nombre:</span><span class="bold">${order.customer_name}</span></div>
${order.customer_phone ? `<div class="row"><span>Teléfono:</span><span>${order.customer_phone}</span></div>` : ""}
${order.customer_email ? `<div class="row"><span>Email:</span><span>${order.customer_email}</span></div>` : ""}

<div class="line"></div>
<h3>🖥️ Equipo Recibido</h3>
<div class="row"><span>Tipo:</span><span class="bold">${order.device_type}</span></div>
${order.device_brand ? `<div class="row"><span>Marca:</span><span>${order.device_brand}</span></div>` : ""}
${order.device_model ? `<div class="row"><span>Modelo:</span><span>${order.device_model}</span></div>` : ""}
${order.accessories ? `<div class="row"><span>Accesorios:</span><span>${order.accessories}</span></div>` : `<div class="row"><span>Accesorios:</span><span>Ninguno</span></div>`}

<div class="line"></div>
<h3>⚠️ Falla Reportada</h3>
<p style="margin:4px 0">${order.reported_issue}</p>

<div class="line"></div>
<div class="row"><span>Prioridad:</span><span class="bold">${order.priority === "urgent" ? "🔴 URGENTE" : order.priority === "high" ? "🟠 Alta" : order.priority === "normal" ? "🔵 Normal" : "🟢 Baja"}</span></div>
${order.estimated_cost ? `<div class="row"><span>Costo Estimado:</span><span class="bold">S/. ${Number(order.estimated_cost).toFixed(2)}</span></div>` : ""}
<div class="row"><span>Fecha Recepción:</span><span>${new Date(order.received_at).toLocaleString("es-PE")}</span></div>

<div class="line"></div>
<div class="center" style="margin:12px 0">
  <p style="font-size:10px">CONDICIONES: El equipo será revisado en un plazo<br>estimado de 24-72 horas. El costo final puede variar<br>según el diagnóstico técnico. INFOCOM no se<br>responsabiliza por datos no respaldados.</p>
</div>

<div class="line"></div>
<div class="row" style="margin-top:24px">
  <div style="flex:1;text-align:center;border-top:1px solid #000;margin:0 8px;padding-top:4px">
    <span style="font-size:9px">Firma del Cliente</span>
  </div>
  <div style="flex:1;text-align:center;border-top:1px solid #000;margin:0 8px;padding-top:4px">
    <span style="font-size:9px">Firma del Técnico</span>
  </div>
</div>

<div class="footer">
  <p>Gracias por confiar en INFOCOM</p>
  <p>Conserve este comprobante para recoger su equipo</p>
</div>
</body></html>`;

    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.print(); }, 300);
  };

  return (
    <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
      <Printer className="h-4 w-4" /> Imprimir Comprobante
    </Button>
  );
};

export default PrintReceipt;
