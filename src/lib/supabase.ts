// ════════════════════════════════════════════════════════════════
// FILE: src/lib/supabase.ts
// تهيئة عميل Supabase الوحيد للمشروع
// الإعدادات من ملف .env.local:
//   VITE_SUPABASE_URL      — رابط مشروع Supabase
//   VITE_SUPABASE_ANON_KEY — مفتاح الوصول العام (آمن للفرونتاند)
// الاستخدام: import { supabase } from '../lib/supabase'
// ════════════════════════════════════════════════════════════════
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
