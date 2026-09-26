import { createClient } from '@supabase/supabase-js'

// Estas dos variables son las UNICAS que necesitas configurar.
// Ve el archivo .env.example en la raiz del proyecto.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el archivo .env'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
