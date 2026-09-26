# CRM Vendedores de Campo

Sistema para administrar clientes, rutas, visitas, ventas, cobranzas, cuentas por cobrar, compromisos de pago, reservas de dinero y el embudo comercial de tu equipo de vendedores.

No necesitas saber programación para ponerlo en marcha. Sigue estos pasos en orden.

---

## PARTE 1 — Crear la base de datos en Supabase

1. Entra a [supabase.com](https://supabase.com), crea una cuenta (si no tienes) y crea un **proyecto nuevo**. Elige una contraseña de base de datos y guárdala en un lugar seguro (no la necesitarás para esta app, pero Supabase la pide).
2. Dentro de tu proyecto, ve al menú lateral y entra a **SQL Editor**.
3. Abre el archivo `supabase/1_schema.sql` de esta carpeta, copia **todo** su contenido y pégalo en el SQL Editor. Dale click a **Run**. Esto crea todas las tablas y las reglas de seguridad automáticamente.
4. Ve a **Authentication → Users → Add user** y crea el usuario administrador: el correo y la contraseña con la que tú vas a entrar al sistema. Después de crearlo, copia el **User UID** que aparece en esa fila.
5. Abre el archivo `supabase/2_crear_administrador.sql`, reemplaza el UID, el nombre y el correo por los datos reales, y pégalo en el SQL Editor. Dale **Run**. Con esto tu usuario queda como Administrador dentro del sistema.

## PARTE 2 — Crear el espacio para guardar fotos de comprobantes

1. Ve a **Storage** en el menú lateral de Supabase.
2. Dale click a **New bucket**.
3. Nombre exacto: `comprobantes-pago`
4. Márcalo como **Public** (público). Esto permite que las fotos de los comprobantes se puedan ver desde la app sin configuración adicional.
5. Guarda.

## PARTE 3 — Conectar la aplicación con tu proyecto de Supabase

1. En Supabase, ve a **Project Settings → API**.
2. Copia el valor de **Project URL**.
3. Copia el valor de **Project API keys → anon / public** (la clave pública).
4. Dentro de esta carpeta del proyecto, busca el archivo `.env.example`, haz una copia y renómbrala a `.env`.
5. Pega tus dos valores así:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-publica
```

Guarda el archivo. Esto es lo único que necesitas tocar para conectar la app a tu base de datos.

## PARTE 4 — Publicar en Netlify

1. Sube esta carpeta completa a un repositorio de GitHub (o arrastra el ZIP directamente en Netlify si prefieres "Deploy manually").
2. En [netlify.com](https://netlify.com), crea un nuevo sitio desde tu repositorio.
3. Netlify detectará automáticamente el comando de build (`npm run build`) y la carpeta `dist` gracias al archivo `netlify.toml` incluido.
4. Muy importante: en **Site settings → Environment variables**, agrega las mismas dos variables que pusiste en tu `.env`:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Dale a **Deploy site**. En unos minutos tu CRM estará en línea con un link tipo `tu-sitio.netlify.app`.

## PARTE 5 — Empezar a usar el sistema

1. Entra al link de tu sitio y haz login con el correo y contraseña del administrador que creaste en la Parte 1.
2. Ve a **Administración → Usuarios** y crea ahí mismo a tus 5 vendedores (o supervisores/cobradores), eligiendo su rol. Ya no necesitas volver a Supabase para esto.
3. Empieza cargando tu catálogo de **Productos**, luego tus **Clientes**, y desde ahí ya puedes crear rutas, visitas, ventas, cobranzas, compromisos y reservas.

---

## Notas importantes

- **Roles:** Administrador (control total), Supervisor (ve todo, no edita configuración), Vendedor y Cobrador (ven y trabajan solo con su propia cartera de clientes). Esto ya está resuelto con reglas de seguridad (RLS) dentro de la base de datos, no depende del código de la app.
- **Reservas de dinero → aplicación a ventas:** por ahora, "aplicar" una reserva descuenta su saldo disponible y queda un registro con una nota de referencia (por ejemplo, el número de venta). Es una versión simple; si más adelante quieres que se enlace automáticamente a una venta específica con un clic, es un ajuste pequeño sobre esta base.
- **Creación de usuarios desde la app:** al crear un usuario nuevo en Administración → Usuarios, el sistema no usa ninguna función avanzada de Supabase (ni Edge Functions ni Service Role Key), tal como pediste. Ten en cuenta que esto significa que la creación de usuarios debe hacerse solo por personas de confianza (tus administradores), igual que ocurriría con cualquier panel de administración.
- **Reportes:** se exportan directamente a Excel (.xlsx) desde la pantalla de Reportes.
- Este es un punto de partida sólido y funcional, no la versión "final" de un ERP. Con esta base ya puedes operar el día a día; luego se le pueden ir sumando validaciones más finas (por ejemplo, evitar pagos que superen el saldo con un mensaje de error más detallado, alarmas visuales de compromisos vencidos, etc.).
