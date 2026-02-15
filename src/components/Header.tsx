import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, ShoppingCart, User, Menu, X, ChevronDown, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { COMPANY_NAME, WHATSAPP_NUMBER, MOCK_CATEGORIES } from "@/lib/constants";
import { useCart } from "@/hooks/use-cart";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top bar */}
      <div className="bg-primary text-primary-foreground text-xs py-1.5">
        <div className="container flex items-center justify-between">
          <span>📍 Ilo, Moquegua - Perú</span>
          <div className="flex items-center gap-4">
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:underline"
            >
              <MessageCircle className="h-3 w-3" />
              Contáctanos
            </a>
            <span>📞 +51 999 999 999</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-card border-b border-border shadow-sm">
        <div className="container flex items-center justify-between gap-4 py-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="bg-primary text-primary-foreground font-display font-bold text-xl px-3 py-1.5 rounded">
              INFOCOM
            </div>
            <span className="hidden sm:block text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Tecnology
            </span>
          </Link>

          {/* Search bar */}
          <div className="hidden md:flex flex-1 max-w-xl relative">
            <Input
              placeholder="Buscar productos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10 bg-secondary border-border"
            />
            <Button size="icon" variant="ghost" className="absolute right-0 top-0 h-full">
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link to="/cuenta">
              <Button variant="ghost" size="icon">
                <User className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/carrito" className="relative">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-5 w-5" />
                {count > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-accent text-accent-foreground">
                    {count}
                  </Badge>
                )}
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-card/95 backdrop-blur border-b border-border hidden md:block">
        <div className="container flex items-center gap-1 py-0">
          <Link to="/" className="px-4 py-3 text-sm font-medium hover:text-primary transition-colors">
            Inicio
          </Link>
          <div className="relative group">
            <button className="flex items-center gap-1 px-4 py-3 text-sm font-medium hover:text-primary transition-colors">
              Catálogo <ChevronDown className="h-3 w-3" />
            </button>
            <div className="absolute top-full left-0 bg-card border border-border rounded-lg shadow-lg p-4 min-w-[280px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              {MOCK_CATEGORIES.map((cat) => (
                <div key={cat.id} className="mb-2 last:mb-0">
                  <Link
                    to={`/catalogo/${cat.slug}`}
                    className="block px-3 py-2 font-medium text-sm hover:bg-secondary rounded transition-colors"
                  >
                    {cat.name}
                  </Link>
                  {cat.subcategories?.map((sub) => (
                    <Link
                      key={sub.id}
                      to={`/catalogo/${sub.slug}`}
                      className="block px-6 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-secondary rounded transition-colors"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <Link to="/contacto" className="px-4 py-3 text-sm font-medium hover:text-primary transition-colors">
            Contacto
          </Link>
          <Link to="/nosotros" className="px-4 py-3 text-sm font-medium hover:text-primary transition-colors">
            Sobre Nosotros
          </Link>
        </div>
      </nav>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-card border-b border-border p-4 space-y-2">
          <div className="relative mb-3">
            <Input placeholder="Buscar productos..." className="pr-10 bg-secondary" />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          <Link to="/" className="block py-2 text-sm font-medium" onClick={() => setIsMenuOpen(false)}>Inicio</Link>
          {MOCK_CATEGORIES.map((cat) => (
            <Link key={cat.id} to={`/catalogo/${cat.slug}`} className="block py-2 text-sm" onClick={() => setIsMenuOpen(false)}>
              {cat.name}
            </Link>
          ))}
          <Link to="/contacto" className="block py-2 text-sm font-medium" onClick={() => setIsMenuOpen(false)}>Contacto</Link>
          <Link to="/nosotros" className="block py-2 text-sm font-medium" onClick={() => setIsMenuOpen(false)}>Sobre Nosotros</Link>
        </div>
      )}
    </header>
  );
};

export default Header;
