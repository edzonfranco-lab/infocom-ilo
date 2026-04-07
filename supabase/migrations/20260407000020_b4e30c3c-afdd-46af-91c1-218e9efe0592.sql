
-- Table for module-level permissions per role
CREATE TABLE public.role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role public.app_role NOT NULL,
  module TEXT NOT NULL,
  can_access BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(role, module)
);

ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Only admins can manage permissions
CREATE POLICY "Admins can manage permissions"
  ON public.role_permissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Authenticated users can read their own role permissions
CREATE POLICY "Users can read own role permissions"
  ON public.role_permissions FOR SELECT TO authenticated
  USING (true);

-- Seed default permissions for admin (all access)
INSERT INTO public.role_permissions (role, module, can_access) VALUES
  ('admin', 'dashboard', true),
  ('admin', 'recepcion', true),
  ('admin', 'soporte', true),
  ('admin', 'inventario', true),
  ('admin', 'vitrinas', true),
  ('admin', 'categorias', true),
  ('admin', 'marcas', true),
  ('admin', 'kardex', true),
  ('admin', 'compras', true),
  ('admin', 'proveedores', true),
  ('admin', 'pos', true),
  ('admin', 'pedidos', true),
  ('admin', 'contabilidad', true),
  ('admin', 'clientes', true),
  ('admin', 'agenda', true),
  ('admin', 'banners', true),
  ('admin', 'pagos', true),
  ('admin', 'empresa', true),
  ('admin', 'personal', true),
  ('admin', 'asistencias', true),
  ('admin', 'roles', true),
  ('admin', 'configuracion', true),
  -- Moderator defaults (basic access)
  ('moderator', 'dashboard', true),
  ('moderator', 'recepcion', true),
  ('moderator', 'soporte', true),
  ('moderator', 'inventario', true),
  ('moderator', 'kardex', true),
  ('moderator', 'pos', true),
  ('moderator', 'pedidos', true),
  ('moderator', 'clientes', true),
  ('moderator', 'agenda', true),
  ('moderator', 'asistencias', true),
  -- Moderator restricted
  ('moderator', 'vitrinas', false),
  ('moderator', 'categorias', false),
  ('moderator', 'marcas', false),
  ('moderator', 'compras', false),
  ('moderator', 'proveedores', false),
  ('moderator', 'contabilidad', false),
  ('moderator', 'banners', false),
  ('moderator', 'pagos', false),
  ('moderator', 'empresa', false),
  ('moderator', 'personal', false),
  ('moderator', 'roles', false),
  ('moderator', 'configuracion', false),
  -- User defaults (minimal)
  ('user', 'dashboard', true),
  ('user', 'asistencias', true),
  ('user', 'recepcion', false),
  ('user', 'soporte', false),
  ('user', 'inventario', false),
  ('user', 'vitrinas', false),
  ('user', 'categorias', false),
  ('user', 'marcas', false),
  ('user', 'kardex', false),
  ('user', 'compras', false),
  ('user', 'proveedores', false),
  ('user', 'pos', false),
  ('user', 'pedidos', false),
  ('user', 'contabilidad', false),
  ('user', 'clientes', false),
  ('user', 'agenda', false),
  ('user', 'banners', false),
  ('user', 'pagos', false),
  ('user', 'empresa', false),
  ('user', 'personal', false),
  ('user', 'roles', false),
  ('user', 'configuracion', false);

-- Add staff history tracking
ALTER TABLE public.staff_members 
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deactivated_reason TEXT;
