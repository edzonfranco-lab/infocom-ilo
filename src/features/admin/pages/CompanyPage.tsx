import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, MapPin, Award, Users, Plus, Trash2, Save, ExternalLink, Eye, EyeOff, Phone, Globe } from "lucide-react";
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
      title: item.title, content: item.content, is_visible: item.is_visible,
    }).eq("id", item.id);
    if (error) toast.error("Error al guardar"); else toast.success("Guardado");
  };

  // --- Location CRUD ---
  const addLocation = async () => {
    const { error } = await supabase.from("company_locations").insert({ name: "Nueva Sede", address: "Dirección", sort_order: locations.length });
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
    if (!confirm("¿Eliminar esta sede?")) return;
    await supabase.from("company_locations").delete().eq("id", id);
    toast.success("Eliminado"); fetchAll();
  };

  // --- Certification CRUD ---
  const addCertification = async () => {
    const { error } = await supabase.from("company_certifications").insert({ name: "Nueva Certificación", sort_order: certifications.length });
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
    if (!confirm("¿Eliminar esta certificación?")) return;
    await supabase.from("company_certifications").delete().eq("id", id);
    toast.success("Eliminado"); fetchAll();
  };

  // --- Team CRUD ---
  const addTeamMember = async () => {
    const { error } = await supabase.from("company_team").insert({ full_name: "Nuevo Miembro", role: "Cargo", sort_order: team.length });
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
    if (!confirm("¿Eliminar este miembro?")) return;
    await supabase.from("company_team").delete().eq("id", id);
    toast.success("Eliminado"); fetchAll();
  };

  if (loading) return <div className="flex justify-center py-12"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Building2 className="h-6 w-6 text-primary" /> Gestión de Empresa
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Administra la información que se muestra en "Sobre Nosotros"</p>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-lg">
          <TabsTrigger value="info" className="gap-1.5"><Building2 className="h-3 w-3" /> Info</TabsTrigger>
          <TabsTrigger value="locations" className="gap-1.5"><MapPin className="h-3 w-3" /> Sedes</TabsTrigger>
          <TabsTrigger value="certifications" className="gap-1.5"><Award className="h-3 w-3" /> Certificaciones</TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5"><Users className="h-3 w-3" /> Equipo</TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-4">
          {info.map((item, idx) => (
            <Card key={item.id} className="border-primary/10">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-primary">{item.section_key}</CardTitle>
                  <div className="flex items-center gap-2">
                    {item.is_visible ? <Badge className="bg-primary/20 text-primary text-[10px]">Visible</Badge> : <Badge variant="secondary" className="text-[10px]">Oculto</Badge>}
                    <Switch checked={item.is_visible} onCheckedChange={(v) => {
                      const updated = [...info]; updated[idx] = { ...item, is_visible: v }; setInfo(updated);
                    }} />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Título</Label>
                  <Input value={item.title} onChange={(e) => {
                    const updated = [...info]; updated[idx] = { ...item, title: e.target.value }; setInfo(updated);
                  }} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Contenido</Label>
                  <Textarea value={item.content || ""} onChange={(e) => {
                    const updated = [...info]; updated[idx] = { ...item, content: e.target.value }; setInfo(updated);
                  }} rows={3} />
                </div>
                <Button size="sm" onClick={() => saveInfo(item)} className="gap-1.5">
                  <Save className="h-3.5 w-3.5" /> Guardar
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Locations Tab */}
        <TabsContent value="locations" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{locations.length} sede(s) registrada(s)</p>
            <Button onClick={addLocation} className="gap-1.5"><Plus className="h-4 w-4" /> Agregar Sede</Button>
          </div>
          {locations.length === 0 ? (
            <Card className="border-dashed border-2 border-primary/20">
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <MapPin className="h-12 w-12 mb-3 opacity-30" />
                <p className="font-medium">No hay sedes registradas</p>
                <p className="text-sm">Agrega las ubicaciones de tu empresa</p>
              </CardContent>
            </Card>
          ) : (
            locations.map((loc, idx) => (
              <Card key={loc.id} className="border-primary/10">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm">{loc.name || "Sin nombre"}</CardTitle>
                      {loc.is_main && <Badge className="bg-primary/20 text-primary text-[10px]">Principal</Badge>}
                      {!loc.is_active && <Badge variant="secondary" className="text-[10px]">Inactiva</Badge>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteLocation(loc.id)} className="text-destructive h-7 w-7"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2"><Switch checked={loc.is_active} onCheckedChange={(v) => { const u = [...locations]; u[idx] = { ...loc, is_active: v }; setLocations(u); }} /><Label className="text-xs">Activa</Label></div>
                    <div className="flex items-center gap-2"><Switch checked={loc.is_main} onCheckedChange={(v) => { const u = [...locations]; u[idx] = { ...loc, is_main: v }; setLocations(u); }} /><Label className="text-xs">Principal</Label></div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-xs text-muted-foreground">Nombre</Label><Input value={loc.name} onChange={(e) => { const u = [...locations]; u[idx] = { ...loc, name: e.target.value }; setLocations(u); }} /></div>
                    <div className="space-y-1"><Label className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> Teléfono</Label><Input value={loc.phone || ""} onChange={(e) => { const u = [...locations]; u[idx] = { ...loc, phone: e.target.value }; setLocations(u); }} /></div>
                    <div className="space-y-1 sm:col-span-2"><Label className="text-xs text-muted-foreground">Dirección</Label><Input value={loc.address} onChange={(e) => { const u = [...locations]; u[idx] = { ...loc, address: e.target.value }; setLocations(u); }} /></div>
                    <div className="space-y-1"><Label className="text-xs text-muted-foreground">Ciudad</Label><Input value={loc.city || ""} onChange={(e) => { const u = [...locations]; u[idx] = { ...loc, city: e.target.value }; setLocations(u); }} /></div>
                    <div className="space-y-1"><Label className="text-xs text-muted-foreground">Departamento</Label><Input value={loc.department || ""} onChange={(e) => { const u = [...locations]; u[idx] = { ...loc, department: e.target.value }; setLocations(u); }} /></div>
                    <div className="space-y-1 sm:col-span-2">
                      <Label className="text-xs text-muted-foreground flex items-center gap-1"><Globe className="h-3 w-3" /> Link Google Maps</Label>
                      <div className="flex gap-2">
                        <Input value={loc.gmaps_url || ""} onChange={(e) => { const u = [...locations]; u[idx] = { ...loc, gmaps_url: e.target.value }; setLocations(u); }} placeholder="https://maps.google.com/..." className="flex-1" />
                        {loc.gmaps_url && <a href={loc.gmaps_url} target="_blank" rel="noopener noreferrer"><Button variant="outline" size="icon" className="h-9 w-9 shrink-0"><ExternalLink className="h-3.5 w-3.5" /></Button></a>}
                      </div>
                    </div>
                  </div>
                  <Button size="sm" onClick={() => saveLocation(loc)} className="gap-1.5"><Save className="h-3.5 w-3.5" /> Guardar</Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Certifications Tab */}
        <TabsContent value="certifications" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{certifications.length} certificación(es)</p>
            <Button onClick={addCertification} className="gap-1.5"><Plus className="h-4 w-4" /> Agregar Certificación</Button>
          </div>
          {certifications.length === 0 ? (
            <Card className="border-dashed border-2 border-primary/20">
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Award className="h-12 w-12 mb-3 opacity-30" />
                <p className="font-medium">No hay certificaciones</p>
                <p className="text-sm">Agrega las certificaciones de tu empresa</p>
              </CardContent>
            </Card>
          ) : (
            certifications.map((cert, idx) => (
              <Card key={cert.id} className="border-primary/10">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="h-4 w-4 text-primary" />
                      <CardTitle className="text-sm">{cert.name}</CardTitle>
                      {cert.year && <Badge variant="outline" className="text-[10px]">{cert.year}</Badge>}
                      {!cert.is_active && <Badge variant="secondary" className="text-[10px]">Inactiva</Badge>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteCertification(cert.id)} className="text-destructive h-7 w-7"><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2"><Switch checked={cert.is_active} onCheckedChange={(v) => { const u = [...certifications]; u[idx] = { ...cert, is_active: v }; setCertifications(u); }} /><Label className="text-xs">Activa</Label></div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="space-y-1"><Label className="text-xs text-muted-foreground">Nombre</Label><Input value={cert.name} onChange={(e) => { const u = [...certifications]; u[idx] = { ...cert, name: e.target.value }; setCertifications(u); }} /></div>
                    <div className="space-y-1"><Label className="text-xs text-muted-foreground">Emitido por</Label><Input value={cert.issued_by || ""} onChange={(e) => { const u = [...certifications]; u[idx] = { ...cert, issued_by: e.target.value }; setCertifications(u); }} /></div>
                    <div className="space-y-1"><Label className="text-xs text-muted-foreground">Año</Label><Input type="number" value={cert.year?.toString() || ""} onChange={(e) => { const u = [...certifications]; u[idx] = { ...cert, year: parseInt(e.target.value) || null }; setCertifications(u); }} /></div>
                    <div className="space-y-1"><Label className="text-xs text-muted-foreground">URL de imagen</Label><Input value={cert.image_url || ""} onChange={(e) => { const u = [...certifications]; u[idx] = { ...cert, image_url: e.target.value }; setCertifications(u); }} /></div>
                  </div>
                  <div className="space-y-1"><Label className="text-xs text-muted-foreground">Descripción</Label><Textarea value={cert.description || ""} onChange={(e) => { const u = [...certifications]; u[idx] = { ...cert, description: e.target.value }; setCertifications(u); }} rows={2} /></div>
                  <Button size="sm" onClick={() => saveCertification(cert)} className="gap-1.5"><Save className="h-3.5 w-3.5" /> Guardar</Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{team.length} miembro(s) del equipo</p>
            <Button onClick={addTeamMember} className="gap-1.5"><Plus className="h-4 w-4" /> Agregar Miembro</Button>
          </div>
          {team.length === 0 ? (
            <Card className="border-dashed border-2 border-primary/20">
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mb-3 opacity-30" />
                <p className="font-medium">No hay miembros del equipo</p>
                <p className="text-sm">Agrega los perfiles de tu equipo de trabajo</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {team.map((member, idx) => (
                <Card key={member.id} className="border-primary/10">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {member.photo_url ? (
                          <img src={member.photo_url} alt={member.full_name} className="h-12 w-12 rounded-full object-cover border-2 border-primary/20" />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                            {member.full_name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm">{member.full_name}</p>
                          <p className="text-xs text-primary">{member.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {member.is_visible ? <Eye className="h-3 w-3 text-primary" /> : <EyeOff className="h-3 w-3 text-muted-foreground" />}
                        <Button variant="ghost" size="icon" onClick={() => deleteTeamMember(member.id)} className="text-destructive h-7 w-7"><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2"><Switch checked={member.is_visible} onCheckedChange={(v) => { const u = [...team]; u[idx] = { ...member, is_visible: v }; setTeam(u); }} /><Label className="text-xs">Visible en la web</Label></div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1"><Label className="text-xs text-muted-foreground">Nombre</Label><Input value={member.full_name} onChange={(e) => { const u = [...team]; u[idx] = { ...member, full_name: e.target.value }; setTeam(u); }} className="text-sm" /></div>
                      <div className="space-y-1"><Label className="text-xs text-muted-foreground">Cargo</Label><Input value={member.role} onChange={(e) => { const u = [...team]; u[idx] = { ...member, role: e.target.value }; setTeam(u); }} className="text-sm" /></div>
                    </div>
                    <div className="space-y-1"><Label className="text-xs text-muted-foreground">URL de foto</Label><Input value={member.photo_url || ""} onChange={(e) => { const u = [...team]; u[idx] = { ...member, photo_url: e.target.value }; setTeam(u); }} className="text-sm" placeholder="https://..." /></div>
                    <div className="space-y-1"><Label className="text-xs text-muted-foreground">Biografía</Label><Textarea value={member.bio || ""} onChange={(e) => { const u = [...team]; u[idx] = { ...member, bio: e.target.value }; setTeam(u); }} rows={2} className="text-sm" /></div>
                    <Button size="sm" onClick={() => saveTeamMember(member)} className="gap-1.5 w-full"><Save className="h-3.5 w-3.5" /> Guardar</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompanyPage;
