
# INFOCOM TECNOLOGY - Tienda Online Completa

## Visión General
Crear una tienda online profesional para INFOCOM TECNOLOGY, replicando el diseño y estructura de infocomilo.com pero con un sistema administrable completo, donde los productos, categorías y precios se gestionan desde un panel de administración.

---

## Fase 1: Página Principal y Diseño
- **Header**: Logo de INFOCOM, barra de búsqueda de productos, iconos de carrito, cuenta de usuario y enlace a WhatsApp
- **Menú de navegación**: Inicio, Catálogo de Productos (con subcategorías desplegables), Contacto, Sobre Nosotros
- **Banner/Slider** principal con imágenes promocionales rotativas
- **Productos Destacados**: Grilla de productos con imagen, nombre, marca, precio, descuento y botón de agregar al carrito
- **Recién Llegados**: Sección de productos nuevos
- **Beneficios**: Envío gratis (+S/800), pagos seguros, atención 24/7, garantía de calidad
- **Marcas asociadas**: Carrusel con logos de marcas (Lenovo, MSI, Epson, Teros, etc.)
- **Botón flotante de WhatsApp** para contacto directo
- **Footer** con información de la empresa, redes sociales y enlaces útiles

## Fase 2: Catálogo de Productos
- **Página de catálogo** con filtros por categoría, marca, rango de precio y búsqueda
- **Subcategorías**: Laptops, Monitores, Periféricos, Proyectores, Accesorios, etc.
- **Página de detalle de producto**: Galería de imágenes, descripción completa, especificaciones técnicas, precio, disponibilidad, productos relacionados y botón de agregar al carrito
- **Etiquetas visuales**: Descuentos (% OFF), "Nuevo", "Agotado"
- **Ordenamiento**: Por precio, nombre, más recientes, más vendidos

## Fase 3: Sistema de Usuarios y Carrito (Backend con Lovable Cloud)
- **Registro e inicio de sesión** de clientes (email/contraseña)
- **Carrito de compras**: Agregar, eliminar, modificar cantidades, ver total
- **Proceso de checkout**: Datos de envío, selección de método de pago, resumen del pedido
- **Historial de pedidos**: Los clientes pueden ver el estado de sus compras
- **Opción de comprar por WhatsApp**: Botón para enviar el pedido directamente a WhatsApp con los productos seleccionados

## Fase 4: Métodos de Pago
- **Consulta por WhatsApp**: Enviar resumen del pedido al WhatsApp de la empresa
- **Transferencia bancaria**: Mostrar datos de cuenta y subir comprobante de pago
- **Pasarela de pago online**: Integración con pasarela de pago para tarjetas de crédito/débito

## Fase 5: Panel de Administración
- **Dashboard** con estadísticas de ventas, pedidos recientes, productos más vendidos
- **Gestión de productos**: Crear, editar, eliminar productos con imágenes, precios, categorías, stock y descuentos
- **Importación masiva**: Cargar productos desde archivo Excel/CSV
- **Gestión de categorías y subcategorías**
- **Gestión de pedidos**: Ver pedidos, cambiar estados (pendiente, confirmado, enviado, entregado)
- **Gestión de banners**: Cambiar imágenes del slider principal
- **Gestión de marcas**: Agregar/editar logos de marcas asociadas

## Base de Datos (Lovable Cloud / Supabase)
- Tablas para: productos, categorías, marcas, usuarios, pedidos, ítems de pedido, banners, configuración de la tienda
- Almacenamiento de imágenes de productos
- Autenticación de usuarios y roles (admin/cliente)

## Diseño
- Estilo visual similar al sitio actual: fondo oscuro con acentos de color, diseño limpio y profesional
- Totalmente responsive (móvil, tablet, escritorio)
- Moneda en Soles peruanos (PEN)
