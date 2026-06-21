import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ContentClient } from '@/components/content/content-client'

export const metadata = { title: 'Conteúdo · AbrantesScale' }

export default async function ContentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: pieces } = await supabase
    .from('content_pieces')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 max-w-3xl mx-auto w-full">
      <div>
        <h1 className="text-xl font-bold">Conteúdo</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Log de ideias, rascunhos e posts publicados
        </p>
      </div>
      <ContentClient pieces={pieces ?? []} />
    </div>
  )
}
