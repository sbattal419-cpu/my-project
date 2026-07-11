import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://eowanazyrbdklkgrumfg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVvd2FuYXp5cmJka2xrZ3J1bWZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDM2OTE4NiwiZXhwIjoyMDg5OTQ1MTg2fQ.VFgv1mD9j7Yj-D2lHz_rjd1FWBFQrbZrJiNL2sZuuU4'
)

// حذف السجل التجريبي
await supabase.from('Intellectual_Properties').delete().eq('title', 'TEST')
console.log('تم التنظيف')
