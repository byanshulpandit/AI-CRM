import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles, ArrowRight, Users, KanbanSquare, BarChart3, Bot,
  ShieldCheck, Zap, Check,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';

const features = [
  { icon: Users, title: 'Customer 360', desc: 'Every contact, deal, email and note in one unified timeline.' },
  { icon: KanbanSquare, title: 'Visual pipeline', desc: 'Drag-and-drop deals across stages with instant persistence.' },
  { icon: Bot, title: 'AI assistant', desc: 'Auto-summarize interactions and get suggested next steps.' },
  { icon: BarChart3, title: 'Live analytics', desc: 'Win rate, pipeline value and revenue trends in real time.' },
  { icon: ShieldCheck, title: 'Role-based access', desc: 'Admin, Sales Manager and Employee scopes out of the box.' },
  { icon: Zap, title: 'Fast by design', desc: 'Optimistic UI, skeletons and caching for a snappy feel.' },
];

export default function LandingPage() {
  const status = useAuthStore((s) => s.status);
  const authed = status === 'authenticated';

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Nav */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold text-foreground">AI-CRM</span>
        </div>
        <Link to={authed ? '/app/dashboard' : '/login'}>
          <Button variant="outline" size="sm">
            {authed ? 'Open app' : 'Sign in'} <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pb-20 pt-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> AI-powered customer relationships
          </span>
          <h1 className="text-balance text-5xl font-black leading-[1.05] tracking-tight text-foreground sm:text-6xl">
            The CRM that thinks
            <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              alongside your team
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-lg text-muted-foreground">
            Manage customers, leads and deals in a beautiful, glassy workspace — with an AI assistant
            that summarizes every interaction and tells you what to do next.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to={authed ? '/app/dashboard' : '/login'}>
              <Button size="lg">
                {authed ? 'Go to dashboard' : 'Get started free'} <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline">Explore features</Button>
            </a>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            {['No credit card required', 'Demo data included', 'Self-hostable'].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-success" /> {t}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Mock dashboard preview */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass-strong mt-16 rounded-2xl p-2 shadow-glass"
        >
          <div className="rounded-xl bg-background/50 p-6">
            <div className="grid grid-cols-3 gap-3">
              {['Pipeline', 'Win rate', 'Revenue'].map((label, i) => (
                <div key={label} className="rounded-xl border border-border bg-card/60 p-4 text-left">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-1 text-xl font-bold text-foreground">
                    {['$1.2M', '68%', '$480K'][i]}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-4 gap-3">
              {['Lead In', 'Qualified', 'Proposal', 'Won'].map((s, i) => (
                <div key={s} className="rounded-xl border border-border bg-card/40 p-3 text-left">
                  <p className="text-[11px] font-medium text-muted-foreground">{s}</p>
                  {Array.from({ length: 3 - (i % 2) }).map((_, k) => (
                    <div key={k} className="mt-2 h-8 rounded-lg bg-gradient-to-r from-primary/20 to-accent/10" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-foreground">Everything a modern sales team needs</h2>
          <p className="mt-2 text-muted-foreground">Built with the polish of Linear, Notion and Vercel.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="card-surface p-6"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/10 text-primary">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-foreground">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="glass-strong mt-16 flex flex-col items-center gap-4 rounded-2xl p-10 text-center">
          <h2 className="text-2xl font-bold text-foreground">Ready to close more deals?</h2>
          <p className="max-w-md text-muted-foreground">
            Sign in with the demo account and explore a fully seeded workspace.
          </p>
          <Link to={authed ? '/app/dashboard' : '/login'}>
            <Button size="lg">
              {authed ? 'Open dashboard' : 'Sign in to demo'} <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} AI-CRM · Built with React, Node & PostgreSQL
      </footer>
    </div>
  );
}
