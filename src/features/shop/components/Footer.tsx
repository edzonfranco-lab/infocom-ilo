import { Link } from "react-router-dom";
import { Facebook, Mail, MapPin, Phone, Youtube } from "lucide-react";
import { COMPANY_NAME, COMPANY_EMAIL, COMPANY_PHONE, COMPANY_ADDRESS, SOCIAL_LINKS, COMPANY_INFO } from "@/lib/types";
import { useTheme } from "@/features/theme/ThemeProvider";
import logoDark from "@/assets/logo-dark-theme.png";
import logoLight from "@/assets/logo-light-theme.png";

const Footer = () => {
  const { theme } = useTheme();
  const logo = theme === "dark" ? logoDark : logoLight;

  return (
    <footer className="bg-card border-t border-primary/20 relative overflow-hidden">
      <div className="h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
      <div className="container py-8 sm:py-12 relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <img src={logo} alt="INFOCOM" className="h-12 object-contain" />
            </div>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{COMPANY_INFO.description}</p>
            <div className="flex gap-3">
              <a href={SOCIAL_LINKS.facebook} target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors hover:glow-green-sm">
                <Facebook className="h-4 w-4" />
              </a>
              <a href={SOCIAL_LINKS.youtube} target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors hover:glow-green-sm">
                <Youtube className="h-4 w-4" />
              </a>
              <a href={SOCIAL_LINKS.tiktok} target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors hover:glow-green-sm">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.19a8.16 8.16 0 004.76 1.53v-3.45a4.85 4.85 0 01-1-.58z"/></svg>
              </a>
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-display font-semibold mb-4 text-sm uppercase tracking-wider text-primary">Enlaces</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-primary transition-colors">Inicio</Link></li>
              <li><Link to="/catalogo" className="hover:text-primary transition-colors">Catálogo</Link></li>
              <li><Link to="/nosotros" className="hover:text-primary transition-colors">Sobre Nosotros</Link></li>
              <li><Link to="/contacto" className="hover:text-primary transition-colors">Contacto</Link></li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h3 className="font-display font-semibold mb-4 text-sm uppercase tracking-wider text-primary">Información</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/terminos" className="hover:text-primary transition-colors">Términos y Condiciones</Link></li>
              <li><Link to="/privacidad" className="hover:text-primary transition-colors">Política de Privacidad</Link></li>
              <li><Link to="/reembolso" className="hover:text-primary transition-colors">Política de Reembolso</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-display font-semibold mb-4 text-sm uppercase tracking-wider text-primary">Contacto</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2"><MapPin className="h-4 w-4 shrink-0 mt-0.5 text-primary" />{COMPANY_ADDRESS}</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-primary" />{COMPANY_PHONE}</li>
              <li className="flex items-center gap-2"><Mail className="h-4 w-4 shrink-0 text-primary" />{COMPANY_EMAIL}</li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-primary/10 py-4">
        <div className="container text-center text-xs text-muted-foreground">
          © 2026 {COMPANY_NAME}. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
