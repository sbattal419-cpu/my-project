import { supabase } from './supabase'

export type Note = {
  id: string
  user_id: string
  title: string
  body: string | null
  created_at: string
}

export async function getNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createNote(title: string, body?: string): Promise<Note> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('notes')
    .insert({ title, body: body ?? null, user_id: user.id })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateNote(
  id: string,
  patch: Partial<Pick<Note, 'title' | 'body'>>
): Promise<Note> {
  const { data, error } = await supabase
    .from('notes')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('id', id)
  if (error) throw error
}
