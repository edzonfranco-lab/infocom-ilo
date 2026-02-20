import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, MapPin, Award, Users, Plus, Trash2, Save, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import type { CompanyInfo, CompanyLocation, CompanyCertification, CompanyTeamMember } from "@/features/shop/hooks/useCompanyInfo";

const CompanyPage = () => {
  const [info, setInfo] = useState<CompanyInfo[]>([]);
  const [locations, setLocations] = useState<CompanyLocation[]>([]);
  const [certifications, setCertifications] = useState<CompanyCertification[]>([]);
  const [team, setTeam] = useState<CompanyTeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const [i, l, c, t] = await Promise.all([
      supabase.from("company_info").select("*").order("sort_order"),
      supabase.from("company_locations").select("*").order("sort_order"),
      supabase.from("company_certifications").select("*").order("sort_order"),
      supabase.from("company_team").select("*").order("sort_order"),
    ]);
    setInfo((i.data || []) as CompanyInfo[]);
    setLocations((l.data || []) as CompanyLocation[]);
    setCertifications((c.data || []) as CompanyCertification[]);
    setTeam((t.data || []) as CompanyTeamMember[]);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  // --- Info CRUD ---
  const saveInfo = async (item: CompanyInfo) => {
    const { error } = await supabase.from("company_info").update({
      title: item.title,
      content: item.content,
      is_visible: item.is_visible,
    }).eq("id", item.id);
    if (error) toast.error("Error al guardar"); else toast.success("Guardado");
  };

  // --- Location CRUD ---
  const addLocation = async () => {
    const { error } = await supabase.from("company_locations").insert({ name: "Nueva Sede", address: "Dirección" });
    if (error) toast.error("Error"); else { toast.success("Sede agregada"); fetchAll(); }
  };
  const saveLocation = async (loc: CompanyLocation) => {
    const { error } = await supabase.from("company_locations").update({
      name: loc.name, address: loc.address, city: loc.city, department: loc.department,
      gmaps_url: loc.gmaps_url, phone: loc.phone, is_main: loc.is_main, is_active: loc.is_active,
    }).eq("id", loc.id);
    if (error) toast.error("Error"); else toast.success("Guardado");
  };
  const deleteLocation = async (id: string) => {
    await supabase.from("company_locations").delete().eq("id", id);
    toast.success("Eliminado"); fetchAll();
  };

  // --- Certification CRUD ---
  const addCertification = async () => {
    const { error } = await supabase.from("company_certifications").insert({ name: "Nueva Certificación" });
    if (error) toast.error("Error"); else { toast.success("Certificación agregada"); fetchAll(); }
  };
  const saveCertification = async (cert: CompanyCertification) => {
    const { error } = await supabase.from("company_certifications").update({
      name: cert.name, description: cert.description, image_url: cert.image_url,
      issued_by: cert.issued_by, year: cert.year, is_active: cert.is_active,
    }).eq("id", cert.id);
    if (error) toast.error("Error"); else toast.success("Guardado");
  };
  const deleteCertification = async (id: string) => {
    await supabase.from("company_certifications").delete().eq("id", id);
    toast.success("Eliminado"); fetchAll();
  };

  // --- Team CRUD ---
  const addTeamMember = async () => {
    const { error } = await supabase.from("company_team").insert({ full_name: "Nuevo Miembro", role: "Cargo" });
    if (error) toast.error("Error"); else { toast.success("Miembro agregado"); fetchAll(); }
  };
  const saveTeamMember = async (member: CompanyTeamMember) => {
    const { error } = await supabase.from("company_team").update({
      full_name: member.full_name, role: member.role, bio: member.bio,
      photo_url: member.photo_url, is_visible: member.is_visible,
    }).eq("id", member.id);
    if (error) toast.error("Error"); else toast.success("Guardado");
  };
  const deleteTeamMember = async (id: string) => {
    await supabase.from("company_team").delete().eq("id", id);
    toast.success("Eliminado"); fetchAll();
  };

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display font-bold flex items-center gap-2">
        <Building2 className="h-6 w-6 text-primary" /> Gestión de Empresa
      </h1>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="info">Info</TabsTrigger>
          <TabsTrigger value="locations">Sedes</TabsTrigger>
          <TabsTrigger value="certifications">Certificaciones</TabsTrigger>
          <TabsTrigger value="team">Equipo</TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-4">
          {info.map((item, idx) => (
            <Card key={item.id} className="border-primary/10">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">{item.section_key}</Label>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Visible</Label>
                    <Switch checked={item.is_visible} onCheckedChange={(v) => {
                      const updated = [...info]; updated[idx] = { ...item, is_visible: v }; setInfo(updated);
                    }} />
                  </div>
                </div>
                <Input value={item.title} onChange={(e) => {
                  const updated = [...info]; updated[idx] = { ...item, title: e.target.value }; setInfo(updated);
                }} placeholder="Título" />
                <Textarea value={item.content || ""} onChange={(e) => {
                  const updated = [...info]; updated[idx] = { ...item, content: e.target.value }; setInfo(updated);
                }} placeholder="Contenido" rows={3} />
                <Button size="sm" onClick={() => saveInfo(item)} className="gap-1">
                  <Save className="h-3 w-3" /> Guardar
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Locations Tab */}
        <TabsContent value="locations" className="space-y-4">
          <Button onClick={addLocation} className="gap-1"><Plus className="h-4 w-4" /> Agregar Sede</Button>
          {locations.map((loc, idx) => (
            <Card key={loc.id} className="border-primary/10">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch checked={loc.is_active} onCheckedChange={(v) => {
                      const u = [...locations]; u[idx] = { ...loc, is_active: v }; setLocations(u);
                    }} />
                    <Label className="text-xs">Activa</Label>
                    <Switch checked={loc.is_main} onCheckedChange={(v) => {
                      const u = [...locations]; u[idx] = { ...loc, is_main: v }; setLocations(u);
                    }} />
                    <Label className="text-xs">Principal</Label>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteLocation(loc.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input value={loc.name} onChange={(e) => { const u = [...locations]; u[idx] = { ...loc, name: e.target.value }; setLocations(u); }} placeholder="Nombre" />
                  <Input value={loc.phone || ""} onChange={(e) => { const u = [...locations]; u[idx] = { ...loc, phone: e.target.value }; setLocations(u); }} placeholder="Teléfono" />
                  <Input value={loc.address} onChange={(e) => { const u = [...locations]; u[idx] = { ...loc, address: e.target.value }; setLocations(u); }} placeholder="Dirección" className="sm:col-span-2" />
                  <Input value={loc.city || ""} onChange={(e) => { const u = [...locations]; u[idx] = { ...loc, city: e.target.value }; setLocations(u); }} placeholder="Ciudad" />
                  <Input value={loc.department || ""} onChange={(e) => { const u = [...locations]; u[idx] = { ...loc, department: e.target.value }; setLocations(u); }} placeholder="Departamento" />
                  <Input value={loc.gmaps_url || ""} onChange={(e) => { const u = [...locations]; u[idx] = { ...loc, gmaps_url: e.target.value }; setLocations(u); }} placeholder="Link Google Maps" className="sm:col-span-2" />
                </div>
                <Button size="sm" onClick={() => saveLocation(loc)} className="gap-1"><Save className="h-3 w-3" /> Guardar</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Certifications Tab */}
        <TabsContent value="certifications" className="space-y-4">
          <Button onClick={addCertification} className="gap-1"><Plus className="h-4 w-4" /> Agregar Certificación</Button>
          {certifications.map((cert, idx) => (
            <Card key={cert.id} className="border-primary/10">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch checked={cert.is_active} onCheckedChange={(v) => {
                      const u = [...certifications]; u[idx] = { ...cert, is_active: v }; setCertifications(u);
                    }} />
                    <Label className="text-xs">Activa</Label>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteCertification(cert.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input value={cert.name} onChange={(e) => { const u = [...certifications]; u[idx] = { ...cert, name: e.target.value }; setCertifications(u); }} placeholder="Nombre" />
                  <Input value={cert.issued_by || ""} onChange={(e) => { const u = [...certifications]; u[idx] = { ...cert, issued_by: e.target.value }; setCertifications(u); }} placeholder="Emitido por" />
                  <Input value={cert.year?.toString() || ""} onChange={(e) => { const u = [...certifications]; u[idx] = { ...cert, year: parseInt(e.target.value) || null }; setCertifications(u); }} placeholder="Año" type="number" />
                  <Input value={cert.image_url || ""} onChange={(e) => { const u = [...certifications]; u[idx] = { ...cert, image_url: e.target.value }; setCertifications(u); }} placeholder="URL de imagen" />
                </div>
                <Textarea value={cert.description || ""} onChange={(e) => { const u = [...certifications]; u[idx] = { ...cert, description: e.target.value }; setCertifications(u); }} placeholder="Descripción" rows={2} />
                <Button size="sm" onClick={() => saveCertification(cert)} className="gap-1"><Save className="h-3 w-3" /> Guardar</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-4">
          <Button onClick={addTeamMember} className="gap-1"><Plus className="h-4 w-4" /> Agregar Miembro</Button>
          {team.map((member, idx) => (
            <Card key={member.id} className="border-primary/10">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch checked={member.is_visible} onCheckedChange={(v) => {
                      const u = [...team]; u[idx] = { ...member, is_visible: v }; setTeam(u);
                    }} />
                    <Label className="text-xs">Visible</Label>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => deleteTeamMember(member.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input value={member.full_name} onChange={(e) => { const u = [...team]; u[idx] = { ...member, full_name: e.target.value }; setTeam(u); }} placeholder="Nombre completo" />
                  <Input value={member.role} onChange={(e) => { const u = [...team]; u[idx] = { ...member, role: e.target.value }; setTeam(u); }} placeholder="Cargo" />
                  <Input value={member.photo_url || ""} onChange={(e) => { const u = [...team]; u[idx] = { ...member, photo_url: e.target.value }; setTeam(u); }} placeholder="URL de foto" className="sm:col-span-2" />
                </div>
                <Textarea value={member.bio || ""} onChange={(e) => { const u = [...team]; u[idx] = { ...member, bio: e.target.value }; setTeam(u); }} placeholder="Biografía" rows={2} />
                <Button size="sm" onClick={() => saveTeamMember(member)} className="gap-1"><Save className="h-3 w-3" /> Guardar</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompanyPage;
