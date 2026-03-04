import { Outlet, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Package, FolderTree, Tags, ShoppingBag, Image, CreditCard, Settings, ArrowLeft, Menu, Building2, ClipboardList, Shield, Users, CalendarDays, DollarSign, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import logoDark from "@/assets/logo-dark-theme.png";

// Role-based nav: owner (admin) sees everything, moderator sees limited
const allNavItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true, roles: ["admin", "moderator"] },
  { to: "/admin/recepcion", icon: ClipboardList, label: "Recepción Técnica", roles: ["admin", "moderator"] },
  { to: "/admin/soporte", icon: Wrench, label: "Soporte Técnico", roles: ["admin", "moderator"] },
  { to: "/admin/contabilidad", icon: DollarSign, label: "Contabilidad", roles: ["admin"] },
  { to: "/admin/productos", icon: Package, label: "Productos", roles: ["admin", "moderator"] },
  { to: "/admin/categorias", icon: FolderTree, label: "Categorías", roles: ["admin"] },
  { to: "/admin/marcas", icon: Tags, label: "Marcas", roles: ["admin"] },
  { to: "/admin/pedidos", icon: ShoppingBag, label: "Pedidos", roles: ["admin", "moderator"] },
  { to: "/admin/banners", icon: Image, label: "Banners", roles: ["admin"] },
  { to: "/admin/pagos", icon: CreditCard, label: "Cuentas de Pago", roles: ["admin"] },
  { to: "/admin/empresa", icon: Building2, label: "Empresa", roles: ["admin"] },
  { to: "/admin/personal", icon: Users, label: "Personal", roles: ["admin"] },
  { to: "/admin/asistencias", icon: CalendarDays, label: "Asistencias", roles: ["admin"] },
  { to: "/admin/roles", icon: Shield, label: "Roles", roles: ["admin"] },
  { to: "/admin/configuracion", icon: Settings, label: "Configuración", roles: ["admin"] },
];

const AdminLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { roles } = useAuth();

  const isActive = (path: string, end?: boolean) => {
    if (end) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  // Filter nav items based on user roles
  const navItems = allNavItems.filter(item =>
    item.roles.some(r => roles.includes(r as any))
  );

  const sidebar = (
    <div className="h-full flex flex-col bg-card border-r border-primary/10">
      <div className="p-4 border-b border-primary/10">
        <Link to="/" className="flex items-center gap-3">
          <img src={logoDark} alt="INFOCOM" className="h-8 object-contain" />
          <div>
            <span className="font-display font-bold text-sm text-primary">ADMIN</span>
          </div>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive(item.to, item.end)
                ? "bg-primary/10 text-primary border border-primary/20"
                : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-primary/10">
        <Link to="/">
          <Button variant="ghost" size="sm" className="w-full justify-start gap-2">
            <ArrowLeft className="h-4 w-4" /> Volver a la tienda
          </Button>
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden lg:block w-64 shrink-0 sticky top-0 h-screen">
        {sidebar}
      </aside>
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 z-50">{sidebar}</div>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-primary/10 px-4 py-3 flex items-center gap-3 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-display font-bold text-primary">INFOCOM Admin</span>
        </header>
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
