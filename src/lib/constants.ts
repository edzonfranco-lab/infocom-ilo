export const WHATSAPP_NUMBER = "51963326971";
export const COMPANY_NAME = "INFOCOM TECNOLOGY";
export const COMPANY_EMAIL = "infocomcotizaciones@gmail.com";
export const COMPANY_PHONE = "+51 963 326 971";
export const COMPANY_ADDRESS = "24 de Octubre Mz 53 Lt 03, casa, 18601 Ilo - Ilo, Moquegua - Perú";
export const CURRENCY = "S/";

export const SOCIAL_LINKS = {
  facebook: "https://www.facebook.com/InfocomILo",
  tiktok: "https://www.tiktok.com/@infocomsoluciones",
  youtube: "https://www.youtube.com/@infocomilo",
};

export const COMPANY_INFO = {
  mission: "Cubrir las necesidades en equipos de cómputo, suministros y reparaciones para nuestros clientes generando confianza, otorgándole un valor agregado al servicio teniendo la calidad y la atención personalizada que usted se merece.",
  vision: "En INFOCOM, visualizamos un futuro donde la tecnología empodera a cada hogar, empresa e institución en Ilo. Con 11 años de trayectoria, nos consolidamos como el socio tecnológico preferido, reconocido por nuestra capacidad de innovar y adaptarnos a las necesidades cambiantes de nuestros clientes.",
  description: "Empresa ileña brindando soluciones en equipos de Cómputo en general, equipos de Seguridad y de Telecomunicaciones, atendiendo a clientes hogar, pymes y corporativos, además de servicios especializados y un Soporte Técnico excepcional.",
};

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  isNew?: boolean;
  isFeatured?: boolean;
  stock: number;
  discount?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  subcategories?: Category[];
}

export const MOCK_CATEGORIES: Category[] = [
  { id: "1", name: "Laptops", slug: "laptops", subcategories: [
    { id: "1a", name: "Laptops Gamer", slug: "laptops-gamer" },
    { id: "1b", name: "Laptops Empresariales", slug: "laptops-empresariales" },
    { id: "1c", name: "Ultrabooks", slug: "ultrabooks" },
  ]},
  { id: "2", name: "Monitores", slug: "monitores", subcategories: [
    { id: "2a", name: "Monitores Gaming", slug: "monitores-gaming" },
    { id: "2b", name: "Monitores Oficina", slug: "monitores-oficina" },
  ]},
  { id: "3", name: "Periféricos", slug: "perifericos", subcategories: [
    { id: "3a", name: "Teclados", slug: "teclados" },
    { id: "3b", name: "Mouse", slug: "mouse" },
    { id: "3c", name: "Audífonos", slug: "audifonos" },
  ]},
  { id: "4", name: "Cámaras de Seguridad", slug: "camaras-seguridad" },
  { id: "5", name: "Impresoras", slug: "impresoras" },
  { id: "6", name: "Proyectores", slug: "proyectores" },
  { id: "7", name: "Accesorios", slug: "accesorios" },
];

export const MOCK_PRODUCTS: Product[] = [
  { id: "1", name: "Laptop Lenovo IdeaPad 3 15.6\" Ryzen 5 8GB 512GB SSD", brand: "Lenovo", price: 2299, originalPrice: 2699, image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=400&fit=crop", category: "laptops", isFeatured: true, stock: 15, discount: 15 },
  { id: "2", name: "Monitor MSI Optix G27C4X 27\" Curvo 250Hz", brand: "MSI", price: 1199, originalPrice: 1399, image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=400&fit=crop", category: "monitores", isFeatured: true, stock: 8, discount: 14 },
  { id: "3", name: "Teclado Mecánico Redragon Kumara K552 RGB", brand: "Redragon", price: 189, originalPrice: 229, image: "https://images.unsplash.com/photo-1541140532154-b024d1c0c78e?w=400&h=400&fit=crop", category: "perifericos", isFeatured: true, stock: 25, discount: 17 },
  { id: "4", name: "Laptop ASUS ROG Strix G15 Ryzen 7 RTX 4060", brand: "ASUS", price: 5499, originalPrice: 5999, image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=400&h=400&fit=crop", category: "laptops", isFeatured: true, stock: 5, discount: 8 },
  { id: "5", name: "Mouse Logitech G502 Hero Gaming 25600 DPI", brand: "Logitech", price: 249, originalPrice: 299, image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop", category: "perifericos", isFeatured: true, stock: 30, discount: 17 },
  { id: "6", name: "Cámara IP Hikvision 2MP Full HD WiFi", brand: "Hikvision", price: 189, image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=400&h=400&fit=crop", category: "camaras-seguridad", isNew: true, stock: 20 },
  { id: "7", name: "Audífonos HyperX Cloud III Wireless Gaming", brand: "HyperX", price: 549, originalPrice: 649, image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop", category: "perifericos", isNew: true, stock: 12, discount: 15 },
  { id: "8", name: "Impresora Epson EcoTank L3250 WiFi Multifuncional", brand: "Epson", price: 899, image: "https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=400&h=400&fit=crop", category: "impresoras", isNew: true, stock: 20 },
  { id: "9", name: "Monitor LG UltraGear 24GS60F 24\" 180Hz IPS", brand: "LG", price: 849, originalPrice: 999, image: "https://images.unsplash.com/photo-1593640408182-31c70c8268f5?w=400&h=400&fit=crop", category: "monitores", isNew: true, stock: 14, discount: 15 },
  { id: "10", name: "Laptop HP Victus 15 i5-12450H RTX 3050", brand: "HP", price: 3699, originalPrice: 4199, image: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=400&fit=crop", category: "laptops", isNew: true, stock: 7, discount: 12 },
];

export const MOCK_BRANDS = [
  { name: "Lenovo", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Lenovo_logo_2015.svg/200px-Lenovo_logo_2015.svg.png" },
  { name: "MSI", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/MSI_Logo.svg/200px-MSI_Logo.svg.png" },
  { name: "ASUS", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/ASUS_Logo.svg/200px-ASUS_Logo.svg.png" },
  { name: "HP", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/HP_logo_2012.svg/150px-HP_logo_2012.svg.png" },
  { name: "Epson", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Epson_logo.svg/200px-Epson_logo.svg.png" },
  { name: "Logitech", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Logitech_logo.svg/200px-Logitech_logo.svg.png" },
  { name: "LG", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/LG_logo_%282015%29.svg/200px-LG_logo_%282015%29.svg.png" },
  { name: "Hikvision", logo: "https://images.unsplash.com/photo-1618477388954-7852f32655ec?w=100&h=60&fit=crop" },
];
