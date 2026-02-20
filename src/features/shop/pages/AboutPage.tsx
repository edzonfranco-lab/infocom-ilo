import Header from "@/features/shop/components/Header";
import Footer from "@/features/shop/components/Footer";
import WhatsAppButton from "@/features/shop/components/WhatsAppButton";
import { COMPANY_NAME, COMPANY_INFO } from "@/lib/types";
import { useCompanyInfo } from "@/features/shop/hooks/useCompanyInfo";
import { Target, Eye, MapPin, Clock, Award, Users, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const AboutPage = () => {
  const { info, locations, certifications, team, loading, getSection } = useCompanyInfo();

  const description = getSection("description")?.content || COMPANY_INFO.description;
  const mission = getSection("mission")?.content || COMPANY_INFO.mission;
  const vision = getSection("vision")?.content || COMPANY_INFO.vision;
  const yearsExp = getSection("years_experience")?.content || "11";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero */}
        <section className="py-16 sm:py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
          <div className="container relative">
            <div className="text-center mb-4">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wider uppercase mb-4">
                +{yearsExp} años de experiencia
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-display font-bold text-center mb-4 text-gradient">
              Sobre Nosotros
            </h1>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
              {description}
            </p>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-12 sm:py-16">
          <div className="container">
            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <Card className="border-primary/10 hover:border-primary/30 transition-all hover:glow-green-sm bg-card/80 backdrop-blur overflow-hidden group">
                <div className="h-1 bg-gradient-to-r from-primary to-accent" />
                <CardContent className="p-6 sm:p-8">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Target className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-xl font-display font-bold mb-3 text-primary">Misión</h2>
                  <p className="text-muted-foreground leading-relaxed text-sm">{mission}</p>
                </CardContent>
              </Card>
              <Card className="border-primary/10 hover:border-primary/30 transition-all hover:glow-green-sm bg-card/80 backdrop-blur overflow-hidden group">
                <div className="h-1 bg-gradient-to-r from-accent to-primary" />
                <CardContent className="p-6 sm:p-8">
                  <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                    <Eye className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-xl font-display font-bold mb-3 text-primary">Visión</h2>
                  <p className="text-muted-foreground leading-relaxed text-sm">{vision}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Locations */}
        {locations.length > 0 && (
          <section className="py-12 sm:py-16 bg-secondary/20 relative">
            <div className="absolute inset-0 bg-cyber-lines" />
            <div className="container relative">
              <h2 className="text-2xl font-display font-bold text-center mb-2">Nuestras Sedes</h2>
              <p className="text-center text-muted-foreground text-sm mb-8">Encuéntranos en las siguientes ubicaciones</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {locations.map((loc) => (
                  <Card key={loc.id} className="border-primary/10 hover:border-primary/30 transition-all hover:glow-green-sm">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{loc.name}</h3>
                          {loc.is_main && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">Sede Principal</span>}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{loc.address}</p>
                      <p className="text-xs text-muted-foreground mb-2">{[loc.city, loc.department].filter(Boolean).join(", ")}</p>
                      {loc.phone && <p className="text-xs text-muted-foreground mb-2">📞 {loc.phone}</p>}
                      {loc.gmaps_url && (
                        <a href={loc.gmaps_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="w-full gap-2 text-xs mt-1">
                            <ExternalLink className="h-3 w-3" /> Ver en Google Maps
                          </Button>
                        </a>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <section className="py-12 sm:py-16">
            <div className="container">
              <h2 className="text-2xl font-display font-bold text-center mb-2">Certificaciones</h2>
              <p className="text-center text-muted-foreground text-sm mb-8">Respaldados por las mejores marcas y estándares</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {certifications.map((cert) => (
                  <Card key={cert.id} className="border-primary/10 hover:border-primary/30 transition-all">
                    <CardContent className="p-5 flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        {cert.image_url ? (
                          <img src={cert.image_url} alt={cert.name} className="h-8 w-8 object-contain" />
                        ) : (
                          <Award className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{cert.name}</h3>
                        {cert.issued_by && <p className="text-xs text-muted-foreground">{cert.issued_by}</p>}
                        {cert.year && <p className="text-xs text-primary font-medium">{cert.year}</p>}
                        {cert.description && <p className="text-xs text-muted-foreground mt-1">{cert.description}</p>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Team */}
        {team.length > 0 && (
          <section className="py-12 sm:py-16 bg-secondary/20 relative">
            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            <div className="container relative">
              <h2 className="text-2xl font-display font-bold text-center mb-2">Nuestro Equipo</h2>
              <p className="text-center text-muted-foreground text-sm mb-8">Las personas detrás de INFOCOM</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-5xl mx-auto">
                {team.map((member) => (
                  <Card key={member.id} className="border-primary/10 hover:border-primary/30 transition-all text-center overflow-hidden group">
                    <div className="h-1 bg-gradient-to-r from-primary to-accent" />
                    <CardContent className="p-5">
                      <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 overflow-hidden">
                        {member.photo_url ? (
                          <img src={member.photo_url} alt={member.full_name} className="h-full w-full object-cover" />
                        ) : (
                          <Users className="h-8 w-8 text-primary" />
                        )}
                      </div>
                      <h3 className="font-semibold text-sm">{member.full_name}</h3>
                      <p className="text-xs text-primary font-medium">{member.role}</p>
                      {member.bio && <p className="text-xs text-muted-foreground mt-2">{member.bio}</p>}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Stats bar */}
        <section className="py-10 bg-primary/5">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto text-center">
              <div>
                <p className="text-3xl font-display font-bold text-primary">+{yearsExp}</p>
                <p className="text-xs text-muted-foreground mt-1">Años de experiencia</p>
              </div>
              <div>
                <p className="text-3xl font-display font-bold text-primary">{locations.length || 1}</p>
                <p className="text-xs text-muted-foreground mt-1">{locations.length > 1 ? 'Sedes' : 'Sede'}</p>
              </div>
              <div>
                <p className="text-3xl font-display font-bold text-primary">{certifications.length > 0 ? certifications.length : '—'}</p>
                <p className="text-xs text-muted-foreground mt-1">Certificaciones</p>
              </div>
              <div>
                <p className="text-3xl font-display font-bold text-primary">{team.length > 0 ? team.length : '—'}</p>
                <p className="text-xs text-muted-foreground mt-1">Profesionales</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default AboutPage;
