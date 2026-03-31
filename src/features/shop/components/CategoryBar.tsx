import { Link } from "react-router-dom";
import { 
  Laptop, Monitor, Keyboard, Projector, Printer, Package, Camera, 
  Cpu, HardDrive, Headphones, Mouse, Wifi, Shield, Server, 
  Smartphone, Tablet, Watch, Usb, Cable, Plug, Battery,
  MonitorSmartphone, Tv, Speaker, Gamepad2, ScanLine, Router,
  MemoryStick, CircuitBoard, Fan, Wrench, ShoppingBag, Zap,
  Globe, Lock, Microchip, Radio, Disc
} from "lucide-react";
import { useCategories } from "@/features/shop/hooks/useCategories";
import { MOCK_CATEGORIES } from "@/lib/constants";

const iconMap: Record<string, any> = {
  laptop: Laptop, laptops: Laptop,
  monitor: Monitor, monitores: Monitor,
  keyboard: Keyboard, perifericos: Keyboard, teclado: Keyboard,
  camera: Camera, "camaras-seguridad": Camera, camaras: Camera, seguridad: Camera,
  projector: Projector, proyectores: Projector, proyector: Projector,
  printer: Printer, impresoras: Printer, impresora: Printer,
  cpu: Cpu, procesador: Cpu, componentes: Cpu,
  "hard-drive": HardDrive, almacenamiento: HardDrive, disco: HardDrive, ssd: HardDrive,
  headphones: Headphones, audifonos: Headphones, audio: Headphones,
  mouse: Mouse, raton: Mouse,
  wifi: Wifi, redes: Wifi, red: Wifi, networking: Wifi,
  shield: Shield, antivirus: Shield,
  server: Server, servidores: Server,
  smartphone: Smartphone, celulares: Smartphone, celular: Smartphone, telefono: Smartphone,
  tablet: Tablet, tablets: Tablet,
  watch: Watch, reloj: Watch, smartwatch: Watch,
  usb: Usb, pendrive: Usb,
  cable: Cable, cables: Cable,
  plug: Plug, energia: Plug, ups: Plug,
  battery: Battery, bateria: Battery,
  "monitor-smartphone": MonitorSmartphone, "todo-en-uno": MonitorSmartphone,
  tv: Tv, televisor: Tv, televisores: Tv,
  speaker: Speaker, parlante: Speaker, parlantes: Speaker,
  gamepad: Gamepad2, gaming: Gamepad2,
  scanner: ScanLine, escaner: ScanLine,
  router: Router, routers: Router,
  memory: MemoryStick, memoria: MemoryStick, ram: MemoryStick,
  circuit: CircuitBoard, placa: CircuitBoard, tarjeta: CircuitBoard, "placa-madre": CircuitBoard,
  fan: Fan, ventilador: Fan, cooler: Fan, refrigeracion: Fan,
  wrench: Wrench, herramientas: Wrench, herramienta: Wrench,
  shopping: ShoppingBag, accesorios: ShoppingBag,
  zap: Zap, electrico: Zap,
  globe: Globe, internet: Globe,
  lock: Lock, candado: Lock,
  microchip: Microchip, chip: Microchip,
  radio: Radio,
  disc: Disc,
  package: Package,
};

const CategoryBar = () => {
  const { categories, loading } = useCategories();

  const cats = categories.length > 0 ? categories : MOCK_CATEGORIES.map(c => ({ ...c, children: c.subcategories }));

  return (
    <section className="py-8 bg-secondary/20 relative">
      <div className="absolute inset-0 bg-cyber-lines" />
      <div className="container relative">
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {cats.map((cat) => {
            const iconKey = cat.icon?.toLowerCase() || cat.slug?.toLowerCase() || "";
            const Icon = iconMap[iconKey] || iconMap[cat.slug] || Package;
            return (
              <Link key={cat.id} to={`/catalogo?cat=${cat.slug}`} className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-card/80 border border-transparent hover:border-primary/20 transition-all group hover:glow-green-sm">
                <div className="h-12 w-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-all">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <span className="text-xs font-medium text-center">{cat.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoryBar;
