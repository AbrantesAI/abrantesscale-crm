import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/shared/sidebar'
import { ParticlesBackground } from '@/components/ui/particles-background'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="relative min-h-screen">
      {/* Fundo de partículas Scalit — ecrã inteiro, atrás do conteúdo (a sidebar opaca tapa-o) */}
      <ParticlesBackground className="fixed inset-0 z-0 opacity-60" />
      <div className="relative z-10 flex min-h-screen w-full">
        <Sidebar />
        <main className="flex-1 overflow-auto pb-16 lg:pb-0">
          {children}
        </main>
      </div>
    </div>
  )
}
