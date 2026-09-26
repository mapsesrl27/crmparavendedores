-- =====================================================================
-- PASO 2: CONVERTIR TU USUARIO EN ADMINISTRADOR
-- =====================================================================
-- Antes de correr esto:
-- 1. Ve a Supabase > Authentication > Users > "Add user"
-- 2. Crea un usuario con el correo y contraseña que tú definas.
-- 3. Copia el "User UID" que aparece en esa fila (un texto largo con guiones).
-- 4. Reemplaza los 3 valores de abajo (UID, correo y nombre) y ejecuta.
-- =====================================================================

insert into profiles (id, full_name, email, role, active)
values (
  'PEGA-AQUI-EL-USER-UID',      -- User UID copiado de Authentication
  'Nombre del Administrador',    -- Nombre que verás en el sistema
  'correo@tuempresa.com',        -- El mismo correo que usaste en Authentication
  'admin',
  true
);
