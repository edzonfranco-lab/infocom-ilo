import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Link2 } from "lucide-react";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
}

const ImageUpload = ({ value, onChange, label = "Imagen", placeholder = "URL de imagen o subir archivo" }: ImageUploadProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { return; }
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      onChange(ev.target?.result as string);
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value.startsWith("data:") ? "(imagen subida)" : value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
          readOnly={value.startsWith("data:")}
        />
        <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => fileRef.current?.click()} disabled={loading}>
          <Upload className="h-4 w-4" />
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="icon" className="shrink-0 text-destructive" onClick={() => onChange("")}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml" className="hidden" onChange={handleFile} />
      {value && (
        <img src={value} alt="Preview" className="h-16 w-full object-cover rounded border border-border" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
      )}
    </div>
  );
};

export default ImageUpload;
