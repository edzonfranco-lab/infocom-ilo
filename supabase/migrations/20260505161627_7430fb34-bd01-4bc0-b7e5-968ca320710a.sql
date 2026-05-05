
INSERT INTO public.staff_positions (name, base_role, description, sort_order) VALUES
  ('Administrador',     'admin',     'Acceso total al sistema',                   10),
  ('Gerente',           'admin',     'Mismo nivel que administrador',             20),
  ('Recepcionista',     'moderator', 'Atención al cliente y recepción técnica',   30),
  ('Técnico',           'moderator', 'Soporte técnico y reparaciones',            40),
  ('Vendedor',          'moderator', 'Punto de venta y cobros',                   50),
  ('Asistente',         'asistente', 'Marca asistencia de otros, no edita',       60),
  ('Practicante',       'user',      'Acceso limitado, marca solo su asistencia', 70)
ON CONFLICT (name) DO NOTHING;

-- Default permissions for asistente role
INSERT INTO public.role_permissions (role, module, can_access) VALUES
  ('asistente','dashboard',true),
  ('asistente','asistencias',true),
  ('asistente','recepcion',true),
  ('asistente','soporte',true),
  ('asistente','pos',true),
  ('asistente','clientes',true),
  ('asistente','agenda',true)
ON CONFLICT (role, module) DO UPDATE SET can_access = EXCLUDED.can_access;
