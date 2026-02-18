import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, ShoppingCart, User, Menu, X, ChevronDown, MessageCircle, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { COMPANY_NAME, WHATSAPP_NUMBER, COMPANY_PHONE } from "@/lib/types";
import { useCart } from "@/hooks/use-cart";
import { useTheme } from "@/features/theme/ThemeProvider";
import { useAuth } from "@/features/auth/hooks/useAuth";
import logoDark from "@/assets/logo-dark-theme.png";
import logoLight from "@/assets/logo-light-theme.png";
import CartDrawer from "@/features/cart/components/CartDrawer";
import { useCategories } from "@/features/shop/hooks/useCategories";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const { count } = useCart();
  const { theme, toggleTheme } = useTheme();
  const { user, isAdmin } = useAuth();
  const { categories } = useCategories();

  const logo = theme === "dark" ? logoDark : logoLight;

  return (
    <>
      <header className="sticky top-0 z-50 w-full">
        {/* Top bar */}
        <div className="bg-primary text-primary-foreground text-xs py-1.5">
          <div className="container flex items-center justify-between">
            <span className="hidden sm:inline">📍 Ilo, Moquegua - Perú</span>
            <div className="flex items-center gap-4">
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
                <MessageCircle className="h-3 w-3" /> Contáctanos
              </a>
              <span className="hidden sm:inline">📞 {COMPANY_PHONE}</span>
              {user && isAdmin && (
                <Link to="/admin" className="hover:underline font-bold">🛠 Admin</Link>
              )}
            </div>
          </div>
        </div>

        {/* Main header */}
        <div className="bg-card/95 backdrop-blur-xl border-b border-primary/20 shadow-lg shadow-primary/5">
          <div className="container flex items-center justify-between gap-4 py-3">
            <Link to="/" className="flex items-center gap-3 shrink-0">
              <img src={logo} alt="INFOCOM" className="h-10 object-contain" />
            </Link>

            {/* Search bar */}
            <div className="hidden md:flex flex-1 max-w-xl relative">
              <Input placeholder="Buscar productos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-10 bg-secondary/50 border-primary/20 focus:border-primary/50" />
              <Link to={searchQuery ? `/catalogo?q=${encodeURIComponent(searchQuery)}` : "/catalogo"}>
                <Button size="icon" variant="ghost" className="absolute right-0 top-0 h-full text-primary">
                  <Search className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="hover:text-primary">
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Link to={user ? "/cuenta" : "/login"}>
                <Button variant="ghost" size="icon" className="hover:text-primary">
                  <User className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" className="hover:text-primary relative" onClick={() => setCartOpen(true)}>
                <ShoppingCart className="h-5 w-5" />
                {count > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-primary text-primary-foreground glow-green-sm">
                    {count}
                  </Badge>
                )}
              </Button>
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="bg-card/80 backdrop-blur-xl border-b border-primary/10 hidden md:block">
          <div className="container flex items-center gap-1 py-0">
            <Link to="/" className="px-4 py-3 text-sm font-medium hover:text-primary transition-colors">Inicio</Link>
            <div className="relative group">
              <button className="flex items-center gap-1 px-4 py-3 text-sm font-medium hover:text-primary transition-colors">
                Catálogo <ChevronDown className="h-3 w-3" />
              </button>
              <div className="absolute top-full left-0 bg-card/95 backdrop-blur-xl border border-primary/20 rounded-lg shadow-lg shadow-primary/10 p-4 min-w-[280px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <Link to="/catalogo" className="block px-3 py-2 font-medium text-sm hover:bg-primary/10 hover:text-primary rounded transition-colors mb-2">
                  Ver Todo
                </Link>
                {categories.map((cat) => (
                  <div key={cat.id} className="mb-1 last:mb-0">
                    <Link to={`/catalogo?cat=${cat.slug}`} className="block px-3 py-2 font-medium text-sm hover:bg-primary/10 hover:text-primary rounded transition-colors">
                      {cat.name}
                    </Link>
                    {cat.children?.map((sub) => (
                      <Link key={sub.id} to={`/catalogo?cat=${sub.slug}`} className="block px-6 py-1.5 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 rounded transition-colors">
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>
            <Link to="/contacto" className="px-4 py-3 text-sm font-medium hover:text-primary transition-colors">Contacto</Link>
            <Link to="/nosotros" className="px-4 py-3 text-sm font-medium hover:text-primary transition-colors">Sobre Nosotros</Link>
          </div>
        </nav>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-card/95 backdrop-blur-xl border-b border-primary/20 p-4 space-y-2">
            <div className="relative mb-3">
              <Input placeholder="Buscar productos..." className="pr-10 bg-secondary/50 border-primary/20" />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <Link to="/" className="block py-2 text-sm font-medium hover:text-primary" onClick={() => setIsMenuOpen(false)}>Inicio</Link>
            <Link to="/catalogo" className="block py-2 text-sm font-medium hover:text-primary" onClick={() => setIsMenuOpen(false)}>Catálogo</Link>
            {categories.map((cat) => (
              <Link key={cat.id} to={`/catalogo?cat=${cat.slug}`} className="block py-2 pl-4 text-sm hover:text-primary" onClick={() => setIsMenuOpen(false)}>
                {cat.name}
              </Link>
            ))}
            <Link to="/contacto" className="block py-2 text-sm font-medium hover:text-primary" onClick={() => setIsMenuOpen(false)}>Contacto</Link>
            <Link to="/nosotros" className="block py-2 text-sm font-medium hover:text-primary" onClick={() => setIsMenuOpen(false)}>Sobre Nosotros</Link>
          </div>
        )}
      </header>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
};

export default Header;
