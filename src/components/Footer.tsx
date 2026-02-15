import { Link } from "react-router-dom";
import { Facebook, Instagram, Mail, MapPin, Phone } from "lucide-react";
import { COMPANY_NAME } from "@/lib/constants";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border">
      <div className="container py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company */}
          <div>
            <div className="bg-primary text-primary-foreground font-display font-bold text-lg px-3 py-1.5 rounded inline-block mb-4">
              INFOCOM
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Tu tienda de tecnología de confianza en Ilo, Moquegua. Los mejores productos al mejor precio.
            </p>
            <div className="flex gap-3">
              <a href="#" className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors">
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-4">Enlaces</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground transition-colors">Inicio</Link></li>
              <li><Link to="/catalogo" className="hover:text-foreground transition-colors">Catálogo</Link></li>
              <li><Link to="/nosotros" className="hover:text-foreground transition-colors">Sobre Nosotros</Link></li>
              <li><Link to="/contacto" className="hover:text-foreground transition-colors">Contacto</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="font-semibold mb-4">Categorías</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/catalogo/laptops" className="hover:text-foreground transition-colors">Laptops</Link></li>
              <li><Link to="/catalogo/monitores" className="hover:text-foreground transition-colors">Monitores</Link></li>
              <li><Link to="/catalogo/perifericos" className="hover:text-foreground transition-colors">Periféricos</Link></li>
              <li><Link to="/catalogo/impresoras" className="hover:text-foreground transition-colors">Impresoras</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contacto</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                Ilo, Moquegua, Perú
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                +51 999 999 999
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                ventas@infocom.pe
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-border py-4">
        <div className="container text-center text-xs text-muted-foreground">
          © 2026 {COMPANY_NAME}. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
