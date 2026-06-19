import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ContactsTable } from '@/components/contacts/contacts-table'
import { NewContactDialog } from '@/components/contacts/new-contact-dialog'

export default async function ContactsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: contacts }, { data: stages }] = await Promise.all([
    supabase
      .from('contacts')
      .select('*, pipeline_stages(name, track)')
      .eq('owner_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false }),
    supabase
      .from('pipeline_stages')
      .select('*')
      .eq('owner_id', user.id)
      .order('track')
      .order('position'),
  ])

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Contactos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {contacts?.length ?? 0} contacto{contacts?.length !== 1 ? 's' : ''} ativos
          </p>
        </div>
        <NewContactDialog stages={stages ?? []} />
      </div>

      <ContactsTable contacts={contacts ?? []} />
    </div>
  )
}
