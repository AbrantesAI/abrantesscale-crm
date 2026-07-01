import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/shared/sidebar'
import { ParticlesBackground } from '@/components/ui/particles-background'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="relative flex-1 overflow-auto pb-16 lg:pb-0">
        {/* Fundo de partículas Scalit — cobre toda a área de conteúdo (menos a sidebar) */}
        <ParticlesBackground className="fixed inset-y-0 right-0 left-0 lg:left-[76px] z-0 opacity-60" />
        <div className="relative z-10 min-h-full">
          {children}
        </div>
      </main>
    </div>
  )
}
