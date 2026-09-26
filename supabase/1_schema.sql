-- =====================================================================
-- CRM VENDEDORES DE CAMPO — SCRIPT UNICO DE BASE DE DATOS
-- Copia y pega TODO este archivo en Supabase > SQL Editor > Run
-- =====================================================================

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------
-- 1. PERFILES (usuarios del sistema: admin, supervisor, vendedor, cobrador)
-- ---------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null check (role in ('admin','supervisor','vendedor','cobrador')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. CLIENTES
-- ---------------------------------------------------------------------
create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  business_name text not null,
  tax_id text,
  phone text,
  whatsapp text,
  address text,
  customer_type text default 'regular',
  assigned_to uuid references profiles(id),
  status text not null default 'activo' check (status in ('activo','inactivo')),
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. PRODUCTOS / SERVICIOS
-- ---------------------------------------------------------------------
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  code text,
  description text,
  category text,
  price numeric(12,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 4. OPORTUNIDADES (embudo comercial)
-- ---------------------------------------------------------------------
create table if not exists opportunities (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references customers(id) on delete cascade,
  assigned_to uuid not null references profiles(id),
  product_id uuid references products(id),
  estimated_amount numeric(12,2),
  stage text not null default 'prospecto' check (stage in
    ('prospecto','contactado','interesado','cotizacion','negociacion','venta','postventa')),
  next_action text,
  follow_up_date date,
  probability int,
  notes text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 5. RUTAS Y PARADAS
-- ---------------------------------------------------------------------
create table if not exists routes (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  assigned_to uuid not null references profiles(id),
  route_date date not null,
  status text not null default 'planificada' check (status in ('planificada','en_curso','completada')),
  created_at timestamptz not null default now()
);

create table if not exists route_stops (
  id uuid primary key default uuid_generate_v4(),
  route_id uuid not null references routes(id) on delete cascade,
  customer_id uuid not null references customers(id),
  visit_order int not null default 1,
  planned_time time,
  reason text,
  status text not null default 'pendiente' check (status in ('pendiente','visitado','no_encontrado','reprogramado')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 6. VISITAS (historial permanente, no se borra aunque cambie la ruta)
-- ---------------------------------------------------------------------
create table if not exists visits (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references customers(id),
  route_stop_id uuid references route_stops(id) on delete set null,
  visited_by uuid not null references profiles(id),
  visit_date timestamptz not null default now(),
  reason text not null,
  result text not null,
  observation text
);

-- ---------------------------------------------------------------------
-- 7. VENTAS
-- ---------------------------------------------------------------------
create table if not exists sales (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references customers(id),
  sold_by uuid not null references profiles(id),
  sale_date date not null default current_date,
  subtotal numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  payment_type text not null check (payment_type in ('contado','credito')),
  status text not null default 'completada' check (status in ('completada','anulada')),
  created_at timestamptz not null default now()
);

create table if not exists sale_items (
  id uuid primary key default uuid_generate_v4(),
  sale_id uuid not null references sales(id) on delete cascade,
  product_id uuid not null references products(id),
  quantity numeric(12,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  line_total numeric(12,2) not null default 0
);

-- ---------------------------------------------------------------------
-- 8. CUENTAS POR COBRAR Y CUOTAS
-- ---------------------------------------------------------------------
create table if not exists accounts_receivable (
  id uuid primary key default uuid_generate_v4(),
  sale_id uuid not null references sales(id) on delete cascade,
  customer_id uuid not null references customers(id),
  total_amount numeric(12,2) not null default 0,
  paid_amount numeric(12,2) not null default 0,
  balance numeric(12,2) not null default 0,
  status text not null default 'pendiente' check (status in ('pendiente','parcial','pagado','vencido')),
  due_date date,
  created_at timestamptz not null default now()
);

create table if not exists receivable_installments (
  id uuid primary key default uuid_generate_v4(),
  receivable_id uuid not null references accounts_receivable(id) on delete cascade,
  installment_number int not null,
  amount numeric(12,2) not null,
  paid_amount numeric(12,2) not null default 0,
  due_date date not null,
  status text not null default 'pendiente' check (status in ('pendiente','parcial','pagado','vencido'))
);

-- ---------------------------------------------------------------------
-- 9. PAGOS (con comprobante fotografico en Supabase Storage)
-- ---------------------------------------------------------------------
create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  receivable_id uuid references accounts_receivable(id),
  customer_id uuid not null references customers(id),
  amount numeric(12,2) not null,
  payment_date date not null default current_date,
  method text not null check (method in ('efectivo','qr','transferencia','otro')),
  observation text,
  receipt_url text,
  collected_by uuid not null references profiles(id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 10. COMPROMISOS DE PAGO
-- ---------------------------------------------------------------------
create table if not exists payment_commitments (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references customers(id),
  receivable_id uuid references accounts_receivable(id),
  debt_amount numeric(12,2) not null,
  committed_amount numeric(12,2) not null,
  promised_date date not null,
  status text not null default 'pendiente' check (status in ('pendiente','cumplido','incumplido','reprogramado')),
  created_by uuid not null references profiles(id),
  linked_payment_id uuid references payments(id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 11. RESERVAS DE DINERO
-- ---------------------------------------------------------------------
create table if not exists money_reservations (
  id uuid primary key default uuid_generate_v4(),
  customer_id uuid not null references customers(id),
  created_by uuid not null references profiles(id),
  amount numeric(12,2) not null,
  applied_amount numeric(12,2) not null default 0,
  purpose text,
  status text not null default 'disponible' check (status in ('disponible','parcial','utilizada','devuelta','anulada')),
  observation text,
  created_at timestamptz not null default now()
);

create table if not exists money_reservation_applications (
  id uuid primary key default uuid_generate_v4(),
  reservation_id uuid not null references money_reservations(id) on delete cascade,
  sale_id uuid references sales(id),
  amount numeric(12,2) not null,
  note text,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- FUNCIONES DE APOYO PARA PERMISOS (RLS)
-- =====================================================================
create or replace function current_role_name()
returns text language sql stable security definer as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function is_admin_or_supervisor()
returns boolean language sql stable security definer as $$
  select coalesce(current_role_name() in ('admin','supervisor'), false);
$$;

create or replace function is_admin()
returns boolean language sql stable security definer as $$
  select coalesce(current_role_name() = 'admin', false);
$$;

create or replace function owns_customer(cust_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from customers where id = cust_id and assigned_to = auth.uid()
  );
$$;

-- =====================================================================
-- ACTIVAR RLS EN TODAS LAS TABLAS
-- =====================================================================
alter table profiles enable row level security;
alter table customers enable row level security;
alter table products enable row level security;
alter table opportunities enable row level security;
alter table routes enable row level security;
alter table route_stops enable row level security;
alter table visits enable row level security;
alter table sales enable row level security;
alter table sale_items enable row level security;
alter table accounts_receivable enable row level security;
alter table receivable_installments enable row level security;
alter table payments enable row level security;
alter table payment_commitments enable row level security;
alter table money_reservations enable row level security;
alter table money_reservation_applications enable row level security;

-- ---------------------------------------------------------------------
-- POLITICAS: PROFILES
-- ---------------------------------------------------------------------
create policy "profiles_select" on profiles for select to authenticated
  using (true);
create policy "profiles_insert_self" on profiles for insert to authenticated
  with check (id = auth.uid() or is_admin());
create policy "profiles_update" on profiles for update to authenticated
  using (id = auth.uid() or is_admin());

-- ---------------------------------------------------------------------
-- POLITICAS: CUSTOMERS
-- ---------------------------------------------------------------------
create policy "customers_select" on customers for select to authenticated
  using (is_admin_or_supervisor() or assigned_to = auth.uid());
create policy "customers_insert" on customers for insert to authenticated
  with check (is_admin_or_supervisor() or assigned_to = auth.uid());
create policy "customers_update" on customers for update to authenticated
  using (is_admin_or_supervisor() or assigned_to = auth.uid());

-- ---------------------------------------------------------------------
-- POLITICAS: PRODUCTS (catalogo visible para todos, solo admin edita)
-- ---------------------------------------------------------------------
create policy "products_select" on products for select to authenticated
  using (true);
create policy "products_insert" on products for insert to authenticated
  with check (is_admin());
create policy "products_update" on products for update to authenticated
  using (is_admin());

-- ---------------------------------------------------------------------
-- POLITICAS: OPPORTUNITIES
-- ---------------------------------------------------------------------
create policy "opportunities_select" on opportunities for select to authenticated
  using (is_admin_or_supervisor() or assigned_to = auth.uid());
create policy "opportunities_insert" on opportunities for insert to authenticated
  with check (is_admin_or_supervisor() or assigned_to = auth.uid());
create policy "opportunities_update" on opportunities for update to authenticated
  using (is_admin_or_supervisor() or assigned_to = auth.uid());

-- ---------------------------------------------------------------------
-- POLITICAS: ROUTES / ROUTE_STOPS
-- ---------------------------------------------------------------------
create policy "routes_select" on routes for select to authenticated
  using (is_admin_or_supervisor() or assigned_to = auth.uid());
create policy "routes_insert" on routes for insert to authenticated
  with check (is_admin_or_supervisor() or assigned_to = auth.uid());
create policy "routes_update" on routes for update to authenticated
  using (is_admin_or_supervisor() or assigned_to = auth.uid());

create policy "route_stops_select" on route_stops for select to authenticated
  using (is_admin_or_supervisor() or exists (
    select 1 from routes r where r.id = route_id and r.assigned_to = auth.uid()
  ));
create policy "route_stops_insert" on route_stops for insert to authenticated
  with check (is_admin_or_supervisor() or exists (
    select 1 from routes r where r.id = route_id and r.assigned_to = auth.uid()
  ));
create policy "route_stops_update" on route_stops for update to authenticated
  using (is_admin_or_supervisor() or exists (
    select 1 from routes r where r.id = route_id and r.assigned_to = auth.uid()
  ));

-- ---------------------------------------------------------------------
-- POLITICAS: VISITS
-- ---------------------------------------------------------------------
create policy "visits_select" on visits for select to authenticated
  using (is_admin_or_supervisor() or visited_by = auth.uid() or owns_customer(customer_id));
create policy "visits_insert" on visits for insert to authenticated
  with check (is_admin_or_supervisor() or visited_by = auth.uid());

-- ---------------------------------------------------------------------
-- POLITICAS: SALES / SALE_ITEMS
-- ---------------------------------------------------------------------
create policy "sales_select" on sales for select to authenticated
  using (is_admin_or_supervisor() or sold_by = auth.uid());
create policy "sales_insert" on sales for insert to authenticated
  with check (is_admin_or_supervisor() or sold_by = auth.uid());

create policy "sale_items_select" on sale_items for select to authenticated
  using (is_admin_or_supervisor() or exists (
    select 1 from sales s where s.id = sale_id and s.sold_by = auth.uid()
  ));
create policy "sale_items_insert" on sale_items for insert to authenticated
  with check (is_admin_or_supervisor() or exists (
    select 1 from sales s where s.id = sale_id and s.sold_by = auth.uid()
  ));

-- ---------------------------------------------------------------------
-- POLITICAS: ACCOUNTS_RECEIVABLE / INSTALLMENTS
-- ---------------------------------------------------------------------
create policy "receivables_select" on accounts_receivable for select to authenticated
  using (is_admin_or_supervisor() or owns_customer(customer_id));
create policy "receivables_insert" on accounts_receivable for insert to authenticated
  with check (is_admin_or_supervisor() or owns_customer(customer_id));
create policy "receivables_update" on accounts_receivable for update to authenticated
  using (is_admin_or_supervisor() or owns_customer(customer_id));

create policy "installments_select" on receivable_installments for select to authenticated
  using (is_admin_or_supervisor() or exists (
    select 1 from accounts_receivable ar where ar.id = receivable_id and owns_customer(ar.customer_id)
  ));
create policy "installments_insert" on receivable_installments for insert to authenticated
  with check (is_admin_or_supervisor() or exists (
    select 1 from accounts_receivable ar where ar.id = receivable_id and owns_customer(ar.customer_id)
  ));
create policy "installments_update" on receivable_installments for update to authenticated
  using (is_admin_or_supervisor() or exists (
    select 1 from accounts_receivable ar where ar.id = receivable_id and owns_customer(ar.customer_id)
  ));

-- ---------------------------------------------------------------------
-- POLITICAS: PAYMENTS
-- ---------------------------------------------------------------------
create policy "payments_select" on payments for select to authenticated
  using (is_admin_or_supervisor() or collected_by = auth.uid() or owns_customer(customer_id));
create policy "payments_insert" on payments for insert to authenticated
  with check (is_admin_or_supervisor() or collected_by = auth.uid());

-- ---------------------------------------------------------------------
-- POLITICAS: PAYMENT_COMMITMENTS
-- ---------------------------------------------------------------------
create policy "commitments_select" on payment_commitments for select to authenticated
  using (is_admin_or_supervisor() or created_by = auth.uid() or owns_customer(customer_id));
create policy "commitments_insert" on payment_commitments for insert to authenticated
  with check (is_admin_or_supervisor() or created_by = auth.uid() or owns_customer(customer_id));
create policy "commitments_update" on payment_commitments for update to authenticated
  using (is_admin_or_supervisor() or created_by = auth.uid() or owns_customer(customer_id));

-- ---------------------------------------------------------------------
-- POLITICAS: MONEY_RESERVATIONS / APPLICATIONS
-- ---------------------------------------------------------------------
create policy "reservations_select" on money_reservations for select to authenticated
  using (is_admin_or_supervisor() or created_by = auth.uid() or owns_customer(customer_id));
create policy "reservations_insert" on money_reservations for insert to authenticated
  with check (is_admin_or_supervisor() or created_by = auth.uid() or owns_customer(customer_id));
create policy "reservations_update" on money_reservations for update to authenticated
  using (is_admin_or_supervisor() or created_by = auth.uid() or owns_customer(customer_id));

create policy "reservation_apps_select" on money_reservation_applications for select to authenticated
  using (is_admin_or_supervisor() or exists (
    select 1 from money_reservations mr where mr.id = reservation_id and (mr.created_by = auth.uid() or owns_customer(mr.customer_id))
  ));
create policy "reservation_apps_insert" on money_reservation_applications for insert to authenticated
  with check (is_admin_or_supervisor() or exists (
    select 1 from money_reservations mr where mr.id = reservation_id and (mr.created_by = auth.uid() or owns_customer(mr.customer_id))
  ));

-- =====================================================================
-- FIN DEL SCRIPT. Sigue con "2_crear_administrador.sql"
-- =====================================================================
