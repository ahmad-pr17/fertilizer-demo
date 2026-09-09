import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  Lock,
  Leaf,
  MessageCircle,
  Moon,
  PackageCheck,
  ShieldAlert,
  Sun,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useTheme } from '../lib/useTheme';

const features = [
  {
    icon: MessageCircle,
    title: 'Instant price & stock replies',
    body: 'Dealers ask in Urdu or English, over plain WhatsApp — no app to install. They get an answer in seconds, any hour of the day.',
  },
  {
    icon: PackageCheck,
    title: 'Order placement, end to end',
    body: 'Product, quantity, delivery address, payment terms — collected conversationally and logged as a real order your team can act on.',
  },
  {
    icon: ShieldAlert,
    title: 'Credit-limit safety net',
    body: "Every order is checked against the dealer's actual credit limit and balance before it's confirmed. Nothing that breaches a limit goes through automatically.",
  },
  {
    icon: Users,
    title: 'Human escalation, by design',
    body: "Complaints, unclear requests, and anything money-related that needs judgment get routed straight to your team — the model never decides those.",
  },
  {
    icon: TrendingUp,
    title: 'Owner dashboard',
    body: 'Live order feed, escalation queue, and dealer activity in one place — so you see exactly what the agent is doing on your behalf.',
  },
  {
    icon: Lock,
    title: 'Built for your data, safely',
    body: 'Prices, credit limits, and balances are encrypted at rest. Conversation logs auto-purge on a retention schedule you control.',
  },
];

const steps = [
  {
    title: 'Dealer messages your WhatsApp number',
    body: 'No new app, no training — the same WhatsApp they already use every day.',
  },
  {
    title: 'The agent checks your real data',
    body: 'Live prices, credit limits, and order history for that specific dealer — nothing generic or made up.',
  },
  {
    title: 'It acts, or it asks a human',
    body: 'Routine requests get handled instantly. Anything uncertain or over-limit goes to your team, with full context.',
  },
];

type DemoMessage = { from: 'dealer' | 'agent'; text: string; escalated?: boolean };

const demoScenarios: { id: string; label: string; messages: DemoMessage[] }[] = [
  {
    id: 'price',
    label: 'Check a price',
    messages: [
      { from: 'dealer', text: 'Urea ka rate kya hai?' },
      { from: 'agent', text: 'Sona Urea: Rs. 4,450 per 50kg bag.' },
    ],
  },
  {
    id: 'order',
    label: 'Place an order',
    messages: [
      { from: 'dealer', text: 'Mujhe 20 bags Urea chahiye, cash on delivery, address wohi purana.' },
      {
        from: 'agent',
        text: 'Order received: 20 50kg bag(s) of Urea, total Rs. 89,000. Payment: cash on delivery. Our team will confirm shortly.',
      },
    ],
  },
  {
    id: 'escalate',
    label: 'Try to overspend',
    messages: [
      { from: 'dealer', text: 'Mujhe 100 bags DAP chahiye, credit pe, address wohi purana.' },
      {
        from: 'agent',
        text: 'Thanks — let me check on that, a team member will get back to you shortly.',
        escalated: true,
      },
    ],
  },
];

const faqs = [
  {
    question: "What happens if the agent isn't sure what a dealer means?",
    answer:
      'It escalates to your team instead of guessing. Low-confidence messages, complaints, and anything unclear never get auto-handled.',
  },
  {
    question: 'Is our price list and dealer credit data safe?',
    answer:
      "Prices, credit limits, and balances are encrypted at rest. Every distributor's data is isolated from every other, and conversation logs purge automatically on a retention schedule you set.",
  },
  {
    question: 'Do our dealers need to install anything?',
    answer: 'No. It runs over plain WhatsApp — the same app your dealers already use to message you today.',
  },
  {
    question: 'What does the pilot actually cost?',
    answer:
      "Nothing. It's free for 4–6 weeks with 2–3 of your dealers on your real price list, no commitment beyond honest feedback at the end.",
  },
  {
    question: 'Can we change the rules or turn it off later?',
    answer:
      'Yes — credit-limit thresholds and escalation rules are configurable per distributor, and you can stop or delete your data on request at any time.',
  },
];

function InteractiveDemo() {
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [replayNonce, setReplayNonce] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [typing, setTyping] = useState(false);
  const scenario = demoScenarios[scenarioIndex];

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    setVisibleCount(0);
    setTyping(false);

    let t = 300;
    scenario.messages.forEach((message, i) => {
      if (message.from === 'agent') {
        timers.push(
          setTimeout(() => {
            if (!cancelled) setTyping(true);
          }, t),
        );
        t += 900;
        timers.push(
          setTimeout(() => {
            if (!cancelled) {
              setTyping(false);
              setVisibleCount(i + 1);
            }
          }, t),
        );
        t += 400;
      } else {
        timers.push(
          setTimeout(() => {
            if (!cancelled) setVisibleCount(i + 1);
          }, t),
        );
        t += 700;
      }
    });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [scenarioIndex, replayNonce]);

  function selectScenario(index: number) {
    if (index === scenarioIndex) {
      setReplayNonce((n) => n + 1);
    } else {
      setScenarioIndex(index);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-3 flex flex-wrap gap-2">
        {demoScenarios.map((s, i) => (
          <button
            key={s.id}
            onClick={() => selectScenario(i)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              i === scenarioIndex
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-3 shadow-xl">
        <div className="mb-3 flex items-center gap-2 border-b border-border pb-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Leaf size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Your Distributor</p>
            <p className="text-xs text-muted-foreground">via WhatsApp</p>
          </div>
        </div>

        <div className="flex min-h-[168px] flex-col justify-end gap-2 text-sm">
          {scenario.messages.slice(0, visibleCount).map((message, i) => (
            <div
              key={i}
              className={
                message.from === 'dealer'
                  ? 'max-w-[85%] animate-[fadeIn_0.25s_ease-out] self-start rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-foreground'
                  : 'max-w-[85%] animate-[fadeIn_0.25s_ease-out] self-end rounded-2xl rounded-br-sm bg-primary px-3 py-2 text-primary-foreground'
              }
            >
              {message.text}
            </div>
          ))}
          {typing && (
            <div className="flex max-w-[60%] animate-[fadeIn_0.2s_ease-out] items-center gap-1 self-end rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-foreground [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-foreground [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary-foreground" />
            </div>
          )}
          {!typing && visibleCount >= scenario.messages.length && scenario.messages[scenario.messages.length - 1]?.escalated && (
            <div className="mt-1 flex items-center gap-1.5 self-start rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
              <ShieldAlert size={12} />
              Escalated — would exceed credit limit
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="divide-y divide-border rounded-xl border border-border bg-card">
      {faqs.map((faq, i) => {
        const open = openIndex === i;
        return (
          <div key={faq.question}>
            <button
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
            >
              <span className="text-sm font-medium text-foreground">{faq.question}</span>
              <ChevronDown
                size={16}
                className={`shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
              />
            </button>
            {open && <p className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>}
          </div>
        );
      })}
    </div>
  );
}

function PilotRequestForm() {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [contact, setContact] = useState('');
  const [copied, setCopied] = useState(false);

  const canCopy = name.trim() && company.trim() && contact.trim();

  async function handleCopy() {
    const summary = [
      `Pilot request — FertiGreen`,
      `Name: ${name}`,
      `Distributor: ${company}`,
      `Contact: ${contact}`,
      ``,
      `We'd like to run the free 4–6 week pilot with 2–3 dealers on our real price list.`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard access can be blocked by the browser — nothing to recover from here.
    }
  }

  return (
    <div className="mt-8 rounded-xl border border-border bg-card p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Your name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Ahmad"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground">Distributor / company</label>
          <input
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="e.g. your company name"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-foreground">Email or WhatsApp number</label>
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="How should we reach you?"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>
      <button
        type="button"
        disabled={!canCopy}
        onClick={handleCopy}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? 'Copied — paste it in an email or WhatsApp' : 'Copy pilot request'}
      </button>
      <p className="mt-3 text-xs text-muted-foreground">
        This copies a short summary to your clipboard — paste it into an email or WhatsApp message to send it on.
      </p>
    </div>
  );
}

export function LandingPage() {
  const [theme, toggleTheme] = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Leaf size={18} />
            </div>
            <span className="font-semibold tracking-tight">FertiGreen</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <Link
              to="/login"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              Dashboard login
            </Link>
            <a
              href="#pilot"
              className="rounded-md bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
            >
              Book a free pilot
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                'radial-gradient(60% 50% at 85% 0%, oklch(0.44 0.1 155 / 0.14), transparent 70%)',
            }}
          />
          <div className="mx-auto grid max-w-6xl gap-12 px-6 pb-20 pt-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-24">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <MessageCircle size={12} className="text-primary" />
                For fertilizer distributors in Punjab
              </span>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                Let your dealers order over WhatsApp — <span className="text-primary">safely, automatically.</span>
              </h1>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
                Your dealers already call or WhatsApp your team for prices, orders, and credit checks.
                This turns that into an AI agent that answers instantly, places real orders, and
                only ever hands off to a human for the decisions that actually need one.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#pilot"
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Book a free pilot
                  <ArrowRight size={16} />
                </a>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
                >
                  See how it works
                </a>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-primary" /> No app for dealers to install
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-primary" /> Your real price list, your rules
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 size={15} className="text-primary" /> Free pilot, no commitment
                </span>
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <InteractiveDemo />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="border-t border-border bg-muted/40">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">How it works</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Three steps, all happening inside a WhatsApp conversation your dealers already know how to use.
            </p>
            <div className="mt-10 grid gap-6 sm:grid-cols-3">
              {steps.map((step, i) => (
                <div key={step.title} className="rounded-xl border border-border bg-card p-6">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {i + 1}
                  </span>
                  <h3 className="mt-4 font-semibold text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Everything the calls and messages already cover — just faster
            </h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Built around the decisions that actually matter to a distributor: what's confirmed
              automatically, and what always goes to a person.
            </p>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, body }) => (
                <div
                  key={title}
                  className="rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/40"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon size={18} />
                  </div>
                  <h3 className="mt-4 font-semibold text-foreground">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="border-t border-border bg-muted/40">
          <div className="mx-auto max-w-3xl px-6 py-16">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Common questions</h2>
            <p className="mt-2 text-muted-foreground">The things distributors usually ask before saying yes to a pilot.</p>
            <div className="mt-8">
              <FaqAccordion />
            </div>
          </div>
        </section>

        {/* Pilot offer */}
        <section id="pilot" className="border-t border-border">
          <div className="mx-auto max-w-2xl px-6 py-20">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
                <Clock size={12} className="text-primary" />
                4–6 week pilot
              </span>
              <h2 className="mt-5 text-3xl font-semibold tracking-tight text-foreground">
                See it working with your own dealers, before you decide anything.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
                Free for 4–6 weeks with 2–3 of your dealers on your real price list — no cost, no
                commitment beyond honest feedback at the end.
              </p>
            </div>
            <PilotRequestForm />
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-muted-foreground sm:flex-row">
          <div className="flex items-center gap-2">
            <Leaf size={14} className="text-primary" />
            <span>FertiGreen</span>
          </div>
          <p>Built for distributors, priced only after you've seen it work.</p>
        </div>
      </footer>
    </div>
  );
}
