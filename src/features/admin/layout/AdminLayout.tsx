import { Outlet, Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Package, FolderTree, Tags, ShoppingBag, Image, CreditCard, Settings,
  ArrowLeft, Menu, Building2, ClipboardList, Shield, Users, CalendarDays, DollarSign,
  Wrench, ChevronDown, ShoppingCart, Store, LayoutGrid, UserCheck, CalendarClock, Bell
} from "lucide-react";
import NotificationBell from "@/features/admin/components/NotificationBell";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import logoDark from "@/assets/logo-dark-theme.png";

interface NavItem {
  to: string;
  icon: any;
  label: string;
  end?: boolean;
  roles: string[];
  children?: NavItem[];
}

const allNavItems: NavItem[] = [
  { to: "/admin", icon: LayoutDashboard, label: "Dashboard", end: true, roles: ["admin", "moderator"] },
  { to: "/admin/recepcion", icon: ClipboardList, label: "Recepción Técnica", roles: ["admin", "moderator"] },
  { to: "/admin/soporte", icon: Wrench, label: "Soporte Técnico", roles: ["admin", "moderator"] },
  {
    to: "/admin/productos", icon: Package, label: "Productos", roles: ["admin", "moderator"],
    children: [
      { to: "/admin/productos", icon: Package, label: "Inventario", end: true, roles: ["admin", "moderator"] },
      { to: "/admin/vitrinas", icon: LayoutGrid, label: "Vitrinas", roles: ["admin"] },
      { to: "/admin/categorias", icon: FolderTree, label: "Categorías", roles: ["admin"] },
      { to: "/admin/marcas", icon: Tags, label: "Marcas", roles: ["admin"] },
    ],
  },
  {
    to: "/admin/ventas", icon: Store, label: "Ventas", roles: ["admin", "moderator"],
    children: [
      { to: "/admin/ventas/pos", icon: ShoppingCart, label: "Punto de Venta", roles: ["admin", "moderator"] },
      { to: "/admin/pedidos", icon: ShoppingBag, label: "Pedidos Online", roles: ["admin", "moderator"] },
    ],
  },
  { to: "/admin/contabilidad", icon: DollarSign, label: "Contabilidad", roles: ["admin"] },
  {
    to: "/admin/clientes", icon: UserCheck, label: "Clientes", roles: ["admin", "moderator"],
    children: [
      { to: "/admin/clientes", icon: UserCheck, label: "Directorio", end: true, roles: ["admin", "moderator"] },
      { to: "/admin/agenda", icon: CalendarClock, label: "Agenda / Citas", roles: ["admin", "moderator"] },
    ],
  },
  { to: "/admin/banners", icon: Image, label: "Banners", roles: ["admin"] },
  { to: "/admin/pagos", icon: CreditCard, label: "Cuentas de Pago", roles: ["admin"] },
  { to: "/admin/empresa", icon: Building2, label: "Empresa", roles: ["admin"] },
  {
    to: "/admin/personal", icon: Users, label: "Personal", roles: ["admin"],
    children: [
      { to: "/admin/personal", icon: Users, label: "Gestión", end: true, roles: ["admin"] },
      { to: "/admin/asistencias", icon: CalendarDays, label: "Asistencias", roles: ["admin", "moderator"] },
    ],
  },
  { to: "/admin/roles", icon: Shield, label: "Roles", roles: ["admin"] },
  { to: "/admin/configuracion", icon: Settings, label: "Configuración", roles: ["admin"] },
];

const AdminLayout = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const { roles } = useAuth();

  const isActive = (path: string, end?: boolean) => {
    if (end) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const toggleSection = (label: string) => {
    setExpandedSections(prev =>
      prev.includes(label) ? prev.filter(s => s !== label) : [...prev, label]
    );
  };

  // Auto-expand sections that contain the current route
  const isChildActive = (item: NavItem) => {
    return item.children?.some(c => isActive(c.to, c.end));
  };

  const navItems = allNavItems.filter(item =>
    item.roles.some(r => roles.includes(r as any))
  );

  const renderNavItem = (item: NavItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const childrenFiltered = item.children?.filter(c => c.roles.some(r => roles.includes(r as any)));
    const expanded = expandedSections.includes(item.label) || isChildActive(item);

    if (hasChildren && childrenFiltered && childrenFiltered.length > 0) {
      return (
        <div key={item.label}>
          <button
            onClick={() => toggleSection(item.label)}
            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isChildActive(item)
                ? "bg-primary/10 text-primary"
                : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-4 w-4" />
              {item.label}
            </div>
            <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>
          {expanded && (
            <div className="ml-4 mt-1 space-y-0.5 border-l border-primary/10 pl-3">
              {childrenFiltered.map(child => (
                <Link
                  key={child.to}
                  to={child.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive(child.to, child.end)
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <child.icon className="h-3.5 w-3.5" />
                  {child.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
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
    );
  };

  const roleLabel = roles.includes("admin" as any) ? "ADMIN" : "PERSONAL";

  const sidebar = (
    <div className="h-full flex flex-col bg-card border-r border-primary/10">
      <div className="p-4 border-b border-primary/10">
        <Link to="/" className="flex items-center gap-3">
          <img src={logoDark} alt="INFOCOM" className="h-8 object-contain" />
          <div>
            <span className="font-display font-bold text-sm text-primary">{roleLabel}</span>
          </div>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(renderNavItem)}
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
        <header className="sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-primary/10 px-4 py-3 flex items-center justify-between lg:hidden">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </Button>
            <span className="font-display font-bold text-primary">INFOCOM {roleLabel}</span>
          </div>
          <NotificationBell />
        </header>
        {/* Desktop notification bell */}
        <div className="hidden lg:flex sticky top-0 z-40 bg-card/95 backdrop-blur-xl border-b border-primary/10 px-6 py-2 justify-end">
          <NotificationBell />
        </div>
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
