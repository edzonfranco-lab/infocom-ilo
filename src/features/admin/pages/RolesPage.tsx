import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Shield, Plus, Search, UserCheck, UserX, Crown } from "lucide-react";

const ROLE_MAP: Record<string, { label: string; color: string; icon: any }> = {
  admin: { label: "Administrador", color: "bg-destructive/20 text-destructive border-destructive/30", icon: Crown },
  moderator: { label: "Moderador", color: "bg-warning/20 text-warning border-warning/30", icon: Shield },
  user: { label: "Usuario", color: "bg-primary/20 text-primary border-primary/30", icon: UserCheck },
};

const RolesPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newUserId, setNewUserId] = useState("");
  const [newRole, setNewRole] = useState("moderator");

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["user_roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: role as any });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_roles"] });
      toast.success("Rol asignado correctamente");
      setDialogOpen(false);
      setNewUserId("");
    },
    onError: (e: any) => toast.error(e.message?.includes("duplicate") ? "Este usuario ya tiene ese rol" : "Error al asignar rol"),
  });

  const removeRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("user_roles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_roles"] });
      toast.success("Rol removido");
    },
  });

  const filtered = roles.filter((r: any) =>
    !search || r.user_id?.toLowerCase().includes(search.toLowerCase()) || r.role?.includes(search.toLowerCase())
  );

  const adminCount = roles.filter((r: any) => r.role === "admin").length;
  const modCount = roles.filter((r: any) => r.role === "moderator").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-display font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" /> Gestión de Roles
        </h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" /> Asignar Rol</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Asignar Rol a Usuario</DialogTitle></DialogHeader>
            <form onSubmit={e => { e.preventDefault(); addRoleMutation.mutate({ userId: newUserId, role: newRole }); }} className="space-y-4">
              <div>
                <Label>ID del Usuario (UUID)</Label>
                <Input required value={newUserId} onChange={e => setNewUserId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="font-mono text-xs" />
                <p className="text-xs text-muted-foreground mt-1">Copia el ID del usuario desde la lista de usuarios registrados</p>
              </div>
              <div>
                <Label>Rol</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">👑 Administrador</SelectItem>
                    <SelectItem value="moderator">🛡️ Moderador (Recepcionista/Técnico)</SelectItem>
                    <SelectItem value="user">👤 Usuario</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" disabled={addRoleMutation.isPending}>Asignar Rol</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-destructive/20"><CardContent className="p-4 text-center"><Crown className="h-5 w-5 mx-auto mb-1 text-destructive" /><p className="text-2xl font-bold">{adminCount}</p><p className="text-xs text-muted-foreground">Admins</p></CardContent></Card>
        <Card className="border-warning/20"><CardContent className="p-4 text-center"><Shield className="h-5 w-5 mx-auto mb-1 text-warning" /><p className="text-2xl font-bold">{modCount}</p><p className="text-xs text-muted-foreground">Moderadores</p></CardContent></Card>
        <Card className="border-primary/20"><CardContent className="p-4 text-center"><UserCheck className="h-5 w-5 mx-auto mb-1 text-primary" /><p className="text-2xl font-bold">{roles.length}</p><p className="text-xs text-muted-foreground">Total Roles</p></CardContent></Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por ID de usuario o rol..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Roles list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-primary/20"><CardContent className="py-12 text-center text-muted-foreground"><Shield className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>No hay roles asignados</p></CardContent></Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((r: any) => {
            const rm = ROLE_MAP[r.role] || ROLE_MAP.user;
            const RIcon = rm.icon;
            return (
              <Card key={r.id} className="border-primary/10">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <RIcon className="h-5 w-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="font-mono text-xs truncate">{r.user_id}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("es-PE")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${rm.color}`}>{rm.label}</Badge>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8" onClick={() => removeRoleMutation.mutate(r.id)}>
                      <UserX className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RolesPage;
