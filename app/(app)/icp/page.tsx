import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { IcpClient } from '@/components/icp/icp-client'

export const metadata = { title: 'ICP · AbrantesScale' }

export default async function IcpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('icp_definition')
    .select('track, sector, main_pain, ticket, qual_signals, red_flags, approach')
    .eq('owner_id', user.id)

  const salesIcp = data?.find(r => r.track === 'sales') ?? null
  const communityIcp = data?.find(r => r.track === 'community') ?? null

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6 max-w-3xl mx-auto w-full">
      <div>
        <h1 className="text-xl font-bold">ICP — Perfil do Cliente Ideal</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Dois perfis: público da Comunidade / ZTL e clientes da Scalit
        </p>
      </div>
      <IcpClient salesIcp={salesIcp} communityIcp={communityIcp} />
    </div>
  )
}
