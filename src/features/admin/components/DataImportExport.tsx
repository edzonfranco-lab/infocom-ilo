import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, Download, FileText } from "lucide-react";
import { toast } from "sonner";

interface Column {
  key: string;
  label: string;
}

interface DataImportExportProps {
  columns: Column[];
  data: any[];
  filenamePrefix: string;
  onImport: (rows: Record<string, string>[]) => Promise<void>;
  templateDescription?: string;
}

const parseCSV = (text: string): string[][] => {
  const rows: string[][] = [];
  let current = "";
  let inQuotes = false;
  let row: string[] = [];
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') inQuotes = false;
      else current += ch;
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") { row.push(current.trim()); current = ""; }
      else if (ch === "\n" || ch === "\r") {
        if (ch === "\r" && text[i + 1] === "\n") i++;
        row.push(current.trim()); current = "";
        if (row.some(c => c)) rows.push(row);
        row = [];
      } else current += ch;
    }
  }
  row.push(current.trim());
  if (row.some(c => c)) rows.push(row);
  return rows;
};

const escapeCSV = (val: string) => {
  if (val.includes(",") || val.includes('"') || val.includes("\n")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
};

const exportCSV = (data: any[], columns: Column[], filename: string) => {
  const header = columns.map(c => escapeCSV(c.label)).join(",");
  const lines = data.map(r =>
    columns.map(c => escapeCSV(String(r[c.key] ?? ""))).join(",")
  );
  const content = header + "\n" + lines.join("\n");
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename + ".csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const exportExcel = (data: any[], columns: Column[], filename: string) => {
  // Use tab-separated values with .xls extension - most compatible approach
  const header = columns.map(c => c.label).join("\t");
  const lines = data.map(r =>
    columns.map(c => String(r[c.key] ?? "").replace(/\t/g, " ").replace(/\n/g, " ")).join("\t")
  );
  const content = header + "\n" + lines.join("\n");
  const blob = new Blob(["\uFEFF" + content], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename + ".xls";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const DataImportExport = ({ columns, data, filenamePrefix, onImport, templateDescription }: DataImportExportProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<Record<string, string>[] | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length < 2) { toast.error("El archivo esta vacio o no tiene datos"); return; }
      const headers = rows[0].map(h => h.toLowerCase().trim());
      const mapped: Record<string, string>[] = [];
      for (let i = 1; i < rows.length; i++) {
        const obj: Record<string, string> = {};
        columns.forEach((col) => {
          const idx = headers.findIndex(h => h === col.label.toLowerCase() || h === col.key.toLowerCase());
          obj[col.key] = idx >= 0 ? rows[i][idx] || "" : "";
        });
        mapped.push(obj);
      }
      setPreview(mapped);
    };
    reader.readAsText(file);
  };

  const confirmImport = async () => {
    if (!preview) return;
    setImporting(true);
    try {
      await onImport(preview);
      toast.success(`${preview.length} registros importados`);
      setPreview(null);
      setImportOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Error al importar");
    }
    setImporting(false);
  };

  const handleExport = () => {
    if (data.length === 0) { toast.error("No hay datos para exportar"); return; }
    const ts = new Date().toISOString().split("T")[0];
    const fname = `${filenamePrefix}_${ts}`;
    if (exportFormat === "csv") exportCSV(data, columns, fname);
    else if (exportFormat === "excel") exportExcel(data, columns, fname);
    toast.success("Archivo exportado");
  };

  const downloadTemplate = () => {
    const header = columns.map(c => c.label).join(",");
    const example = columns.map(() => `"ejemplo"`).join(",");
    const blob = new Blob(["\uFEFF" + header + "\n" + example], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `plantilla_${filenamePrefix}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {/* Export */}
      <div className="flex gap-1 items-center">
        <Select value={exportFormat} onValueChange={setExportFormat}>
          <SelectTrigger className="h-8 w-[100px] text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="csv">CSV</SelectItem>
            <SelectItem value="excel">Excel</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={handleExport}>
          <Download className="h-3 w-3" /> Exportar
        </Button>
      </div>

      {/* Import */}
      <Dialog open={importOpen} onOpenChange={o => { setImportOpen(o); if (!o) setPreview(null); }}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1 text-xs">
            <Upload className="h-3 w-3" /> Importar
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Importar Datos</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-secondary/30 border border-border space-y-2">
              <p className="text-xs font-semibold">Formato requerido (CSV):</p>
              <p className="text-xs text-muted-foreground font-mono">{columns.map(c => c.label).join(", ")}</p>
              {templateDescription && <p className="text-xs text-muted-foreground">{templateDescription}</p>}
              <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={downloadTemplate}>
                <FileText className="h-3 w-3" /> Descargar Plantilla
              </Button>
            </div>
            <div>
              <Label>Seleccionar archivo CSV</Label>
              <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFileChange} className="block w-full text-sm mt-1 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:opacity-80" />
            </div>
            {preview && (
              <div className="space-y-2">
                <p className="text-sm font-semibold">{preview.length} registros encontrados</p>
                <div className="max-h-[200px] overflow-auto border rounded text-xs">
                  <table className="w-full">
                    <thead><tr className="bg-secondary/50">{columns.map(c => <th key={c.key} className="p-1 text-left font-semibold">{c.label}</th>)}</tr></thead>
                    <tbody>{preview.slice(0, 5).map((r, i) => <tr key={i} className="border-t">{columns.map(c => <td key={c.key} className="p-1 truncate max-w-[120px]">{r[c.key]}</td>)}</tr>)}</tbody>
                  </table>
                  {preview.length > 5 && <p className="p-1 text-center text-muted-foreground">...y {preview.length - 5} más</p>}
                </div>
                <Button className="w-full" onClick={confirmImport} disabled={importing}>
                  {importing ? "Importando..." : `Importar ${preview.length} registros`}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataImportExport;
