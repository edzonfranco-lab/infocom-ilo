import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
  bucket?: string;
}

const ImageUpload = ({ value, onChange, label = "Imagen", placeholder = "URL de imagen o subir archivo", bucket = "product-images" }: ImageUploadProps) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Solo se permiten imágenes");
      return;
    }
    setLoading(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(urlData.publicUrl);
      toast.success("Imagen subida correctamente");
    } catch (err: any) {
      toast.error("Error al subir imagen: " + err.message);
    } finally {
      setLoading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value?.startsWith("data:") ? "(imagen subida)" : value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
          readOnly={value?.startsWith("data:")}
        />
        <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={() => fileRef.current?.click()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
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
