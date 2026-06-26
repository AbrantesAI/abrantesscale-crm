import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const auth = request.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()
  const today = new Date().toISOString().split('T')[0]

  const [{ data: allContacts, error: contactsErr }, { data: allStages, error: stagesErr }] =
    await Promise.all([
      supabase
        .from('contacts')
        .select('id, owner_id, status, deal_value, mrr, community_status, stage_id'),
      supabase
        .from('pipeline_stages')
        .select('id, owner_id, is_won, is_lost, track'),
    ])

  if (contactsErr) return NextResponse.json({ error: contactsErr.message }, { status: 500 })
  if (stagesErr) return NextResponse.json({ error: stagesErr.message }, { status: 500 })

  const stageById = new Map(
    (allStages ?? []).map((s) => [s.id, s])
  )

  const wonSalesStageIds = new Set(
    (allStages ?? [])
      .filter((s) => s.is_won && s.track === 'sales')
      .map((s) => s.id)
  )

  // Agrupar contactos por owner
  const ownerMap = new Map<string, NonNullable<typeof allContacts>>()
  for (const c of allContacts ?? []) {
    const list = ownerMap.get(c.owner_id) ?? []
    list.push(c)
    ownerMap.set(c.owner_id, list)
  }

  if (ownerMap.size === 0) {
    return NextResponse.json({ ok: true, owners: 0 })
  }

  const upsertRows = []

  for (const [ownerId, contacts] of ownerMap) {
    const active = contacts.filter((c) => c.status === 'active')

    const totalLeads = contacts.length
    const activeLeads = active.length

    const pipelineValue = active.reduce((sum, c) => {
      if (!c.stage_id) return sum
      const stage = stageById.get(c.stage_id)
      if (!stage || stage.is_won || stage.is_lost) return sum
      return sum + (c.deal_value ?? 0)
    }, 0)

    // MRR: ganhos no track sales + membros FLC (sem duplicar)
    const counted = new Set<string>()
    let mrr = 0
    for (const c of active) {
      const isWonSales = c.stage_id != null && wonSalesStageIds.has(c.stage_id)
      const isFLC = c.community_status === 'full_leverage_circle'
      if (isWonSales || isFLC) {
        if (!counted.has(c.id)) {
          counted.add(c.id)
          mrr += c.mrr != null ? c.mrr : isFLC ? 49.99 : 0
        }
      }
    }

    const ztlMembers = active.filter((c) => c.community_status === 'zero_to_leverage').length
    const flcMembers = active.filter((c) => c.community_status === 'full_leverage_circle').length

    upsertRows.push({
      owner_id: ownerId,
      snapshot_date: today,
      total_leads: totalLeads,
      active_leads: activeLeads,
      pipeline_value: pipelineValue,
      mrr,
      ztl_members: ztlMembers,
      flc_members: flcMembers,
    })
  }

  const { error: upsertErr } = await supabase
    .from('daily_snapshots')
    .upsert(upsertRows, { onConflict: 'owner_id,snapshot_date' })

  if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 })

  return NextResponse.json({ ok: true, owners: ownerMap.size })
}
