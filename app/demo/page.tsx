"use client";

import Link from "next/link";
import { useState } from "react";

type DemoView = "overview" | "clients" | "plans" | "messages";

const navigation: Array<{ id: DemoView; label: string; icon: string }> = [
  { id: "overview", label: "Overview", icon: "⌂" },
  { id: "clients", label: "Clients", icon: "◎" },
  { id: "plans", label: "Plans", icon: "▤" },
  { id: "messages", label: "Messages", icon: "✦" },
];

const clients = [
  {
    id: "maya",
    initials: "MP",
    name: "Maya Patel",
    goal: "Build strength and improve energy",
    plan: "Strength Foundations",
    progress: 78,
    checkIn: "Today",
    color: "bg-[#d9eee8] text-[#267060]",
  },
  {
    id: "jordan",
    initials: "JL",
    name: "Jordan Lee",
    goal: "Prepare for a first half marathon",
    plan: "Endurance Builder",
    progress: 64,
    checkIn: "Yesterday",
    color: "bg-[#e1ebf4] text-[#416f91]",
  },
  {
    id: "sam",
    initials: "SR",
    name: "Sam Rivera",
    goal: "Improve mobility and nutrition habits",
    plan: "Mobility Reset",
    progress: 86,
    checkIn: "2 days ago",
    color: "bg-[#f7e7cf] text-[#a26722]",
  },
];

const conversations = [
  {
    id: "maya",
    initials: "MP",
    name: "Maya Patel",
    preview: "The new workout felt great!",
    time: "9:42 AM",
    unread: true,
  },
  {
    id: "jordan",
    initials: "JL",
    name: "Jordan Lee",
    preview: "Should I adjust Saturday’s run?",
    time: "Yesterday",
    unread: false,
  },
  {
    id: "sam",
    initials: "SR",
    name: "Sam Rivera",
    preview: "Thanks for reviewing my check-in.",
    time: "Mon",
    unread: false,
  },
];

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[#e9ece8]">
      <div
        className="h-full rounded-full bg-[#5dbeaa]"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

function Overview() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Active clients", "8", "+2 this month", "◎"],
          ["Plans on track", "6", "75% of clients", "▤"],
          ["Unread messages", "3", "Across 2 clients", "✦"],
          ["Weekly check-ins", "7/8", "One remaining", "✓"],
        ].map(([label, value, detail, icon]) => (
          <div
            key={label}
            className="rounded-2xl border border-[#e8e5dc] bg-white p-5 shadow-[0_8px_30px_rgba(31,55,49,0.05)]"
          >
            <div className="mb-5 flex items-start justify-between">
              <span className="text-sm font-medium text-[#6b756f]">{label}</span>
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf7f4] text-[#347f70]">
                {icon}
              </span>
            </div>
            <div className="text-3xl font-bold tracking-tight text-[#183d35]">
              {value}
            </div>
            <p className="mt-1 text-xs text-[#87918c]">{detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="rounded-3xl border border-[#e8e5dc] bg-white p-6 shadow-[0_8px_30px_rgba(31,55,49,0.05)]">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-[#183d35]">Client momentum</h2>
              <p className="mt-1 text-sm text-[#7c8580]">
                Progress across active plans this week
              </p>
            </div>
            <span className="rounded-full bg-[#edf7f4] px-3 py-1 text-xs font-semibold text-[#347f70]">
              76% average
            </span>
          </div>
          <div className="space-y-5">
            {clients.map((client) => (
              <div key={client.id}>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${client.color}`}
                    >
                      {client.initials}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#233f38]">
                        {client.name}
                      </p>
                      <p className="truncate text-xs text-[#8a928e]">
                        {client.plan}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-[#347f70]">
                    {client.progress}%
                  </span>
                </div>
                <ProgressBar value={client.progress} />
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-[#183d35] p-6 text-white shadow-[0_16px_40px_rgba(24,61,53,0.2)]">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9fd8ca]">
            Today
          </span>
          <h2 className="mt-3 text-2xl font-bold">Your next touchpoints</h2>
          <div className="mt-6 space-y-3">
            {[
              ["10:30", "Maya’s weekly check-in"],
              ["1:00", "Review Jordan’s running plan"],
              ["3:30", "Team message with Sam"],
            ].map(([time, event]) => (
              <div
                key={event}
                className="flex gap-4 rounded-2xl bg-white/8 p-4 ring-1 ring-white/10"
              >
                <span className="text-sm font-bold text-[#9fd8ca]">{time}</span>
                <span className="text-sm text-white/90">{event}</span>
              </div>
            ))}
          </div>
          <button className="mt-6 w-full rounded-xl bg-[#9fd8ca] px-4 py-3 text-sm font-bold text-[#183d35] transition hover:bg-[#b8e5da]">
            Open schedule
          </button>
        </section>
      </div>
    </div>
  );
}

function Clients() {
  const [selectedId, setSelectedId] = useState(clients[0].id);
  const selected = clients.find((client) => client.id === selectedId)!;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="rounded-3xl border border-[#e8e5dc] bg-white p-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#183d35]">Client roster</h2>
            <p className="mt-1 text-sm text-[#7c8580]">
              Select a client to preview their shared workspace.
            </p>
          </div>
          <button className="rounded-xl bg-[#183d35] px-4 py-2 text-sm font-semibold text-white">
            + Add client
          </button>
        </div>
        <div className="space-y-3">
          {clients.map((client) => (
            <button
              key={client.id}
              onClick={() => setSelectedId(client.id)}
              className={`w-full rounded-2xl border p-4 text-left transition ${
                selectedId === client.id
                  ? "border-[#5dbeaa] bg-[#f0f8f5]"
                  : "border-[#ece9e1] hover:border-[#b8d8d0]"
              }`}
            >
              <div className="flex items-center gap-4">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ${client.color}`}
                >
                  {client.initials}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-[#233f38]">{client.name}</p>
                    <span className="text-xs text-[#8a928e]">{client.checkIn}</span>
                  </div>
                  <p className="mt-1 truncate text-sm text-[#7c8580]">
                    {client.goal}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-[#e8e5dc] bg-white p-6">
        <div className="flex items-center gap-4">
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-full font-bold ${selected.color}`}
          >
            {selected.initials}
          </span>
          <div>
            <h2 className="text-xl font-bold text-[#183d35]">{selected.name}</h2>
            <p className="text-sm text-[#7c8580]">Active client · Verified match</p>
          </div>
        </div>
        <div className="mt-6 rounded-2xl bg-[#faf8f3] p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8a928e]">
            Primary goal
          </p>
          <p className="mt-2 font-medium text-[#233f38]">{selected.goal}</p>
        </div>
        <div className="mt-5">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium text-[#4f5e58]">Weekly plan completion</span>
            <span className="font-bold text-[#347f70]">{selected.progress}%</span>
          </div>
          <ProgressBar value={selected.progress} />
        </div>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button className="rounded-xl border border-[#d8e2dd] px-4 py-3 text-sm font-semibold text-[#315f54]">
            Message
          </button>
          <button className="rounded-xl bg-[#5dbeaa] px-4 py-3 text-sm font-semibold text-[#123a31]">
            View progress
          </button>
        </div>
      </section>
    </div>
  );
}

function Plans() {
  const plans = [
    {
      name: "Strength Foundations",
      client: "Maya Patel",
      type: "Exercise",
      status: "Active",
      progress: 78,
      items: ["Goblet squat · 3 × 10", "Incline push-up · 3 × 8", "Farmer carry · 4 × 30 sec"],
    },
    {
      name: "Endurance Builder",
      client: "Jordan Lee",
      type: "Exercise",
      status: "Active",
      progress: 64,
      items: ["Easy run · 35 min", "Tempo intervals · 4 × 5 min", "Recovery mobility · 15 min"],
    },
    {
      name: "Everyday Fuel",
      client: "Sam Rivera",
      type: "Nutrition",
      status: "Active",
      progress: 86,
      items: ["Protein · 120 g", "Water · 2,400 ml", "Fiber · 28 g"],
    },
  ];

  return (
    <section className="rounded-3xl border border-[#e8e5dc] bg-white p-6">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#183d35]">Active plans</h2>
          <p className="mt-1 text-sm text-[#7c8580]">
            Exercise and nutrition plans shared with your clients.
          </p>
        </div>
        <button className="rounded-xl bg-[#183d35] px-4 py-2 text-sm font-semibold text-white">
          + Create plan
        </button>
      </div>
      <div className="grid gap-4 xl:grid-cols-3">
        {plans.map((plan) => (
          <article key={plan.name} className="rounded-2xl border border-[#ece9e1] p-5">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-[#edf7f4] px-3 py-1 text-xs font-semibold text-[#347f70]">
                {plan.type}
              </span>
              <span className="text-xs font-semibold text-[#6b9b63]">● {plan.status}</span>
            </div>
            <h3 className="mt-5 text-lg font-bold text-[#233f38]">{plan.name}</h3>
            <p className="mt-1 text-sm text-[#7c8580]">{plan.client}</p>
            <ul className="mt-5 space-y-3">
              {plan.items.map((item) => (
                <li key={item} className="flex gap-2 text-sm text-[#52615b]">
                  <span className="text-[#5dbeaa]">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <div className="mb-2 flex justify-between text-xs text-[#7c8580]">
                <span>Weekly completion</span>
                <span className="font-bold text-[#347f70]">{plan.progress}%</span>
              </div>
              <ProgressBar value={plan.progress} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Messages() {
  const [selectedId, setSelectedId] = useState(conversations[0].id);
  const selected = conversations.find((conversation) => conversation.id === selectedId)!;

  return (
    <div className="grid min-h-[520px] overflow-hidden rounded-3xl border border-[#e8e5dc] bg-white xl:grid-cols-[340px_1fr]">
      <aside className="border-b border-[#ece9e1] p-4 xl:border-b-0 xl:border-r">
        <h2 className="px-2 py-2 text-xl font-bold text-[#183d35]">Messages</h2>
        <div className="mt-3 space-y-2">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => setSelectedId(conversation.id)}
              className={`flex w-full gap-3 rounded-2xl p-3 text-left transition ${
                selectedId === conversation.id ? "bg-[#edf7f4]" : "hover:bg-[#faf8f3]"
              }`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d9eee8] text-xs font-bold text-[#267060]">
                {conversation.initials}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <span className="text-sm font-semibold text-[#233f38]">{conversation.name}</span>
                  <span className="text-[11px] text-[#8a928e]">{conversation.time}</span>
                </div>
                <p className="mt-1 truncate text-xs text-[#7c8580]">{conversation.preview}</p>
              </div>
              {conversation.unread && <span className="mt-2 h-2 w-2 rounded-full bg-[#5dbeaa]" />}
            </button>
          ))}
        </div>
      </aside>

      <section className="flex min-h-[430px] flex-col">
        <div className="border-b border-[#ece9e1] px-6 py-4">
          <p className="font-semibold text-[#233f38]">{selected.name}</p>
          <p className="text-xs text-[#7c8580]">Active now · Shared wellness team</p>
        </div>
        <div className="flex flex-1 flex-col justify-end gap-4 bg-[#fcfbf8] p-6">
          <div className="max-w-md self-start rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm text-[#52615b] shadow-sm">
            I finished all three strength sessions this week. The last set of squats finally felt steady.
          </div>
          <div className="max-w-md self-end rounded-2xl rounded-br-md bg-[#5dbeaa] px-4 py-3 text-sm text-[#123a31]">
            That’s excellent progress. I reviewed your check-in and increased next week’s carry duration slightly.
          </div>
          <div className="max-w-md self-start rounded-2xl rounded-bl-md bg-white px-4 py-3 text-sm text-[#52615b] shadow-sm">
            {selected.preview} I’ll keep the same schedule next week.
          </div>
        </div>
        <div className="flex gap-3 border-t border-[#ece9e1] p-4">
          <div className="flex-1 rounded-xl bg-[#f4f3ef] px-4 py-3 text-sm text-[#9aa19d]">
            Preview mode — messaging is disabled
          </div>
          <button className="rounded-xl bg-[#183d35] px-5 text-sm font-semibold text-white opacity-70">
            Send
          </button>
        </div>
      </section>
    </div>
  );
}

export default function DemoPage() {
  const [view, setView] = useState<DemoView>("overview");
  const activeLabel = navigation.find((item) => item.id === view)?.label;

  return (
    <div className="min-h-screen bg-[#f6f3ec] text-[#183d35]">
      <div className="border-b border-[#dbe6e1] bg-[#eaf5f1] px-4 py-2 text-center text-xs font-medium text-[#315f54]">
        Interactive preview with sample data — no account or external services required
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-33px)] max-w-[1600px] flex-col lg:flex-row">
        <aside className="flex shrink-0 flex-col bg-[#183d35] p-4 text-white lg:w-64 lg:p-6">
          <div className="flex items-center justify-between lg:block">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#9fd8ca] text-lg font-black text-[#183d35]">
                K
              </span>
              <div>
                <p className="text-lg font-bold">Kindred</p>
                <p className="text-[11px] text-white/55">Professional workspace</p>
              </div>
            </Link>
            <Link href="/" className="text-xs text-white/65 hover:text-white lg:hidden">
              Exit demo
            </Link>
          </div>

          <nav className="mt-5 flex gap-2 overflow-x-auto pb-1 lg:mt-10 lg:flex-col lg:overflow-visible">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                  view === item.id
                    ? "bg-white text-[#183d35]"
                    : "text-white/70 hover:bg-white/8 hover:text-white"
                }`}
              >
                <span className="w-4 text-center">{item.icon}</span>
                {item.label}
                {item.id === "messages" && (
                  <span className="ml-auto rounded-full bg-[#f6aa5a] px-1.5 py-0.5 text-[10px] font-bold text-[#56330f]">
                    3
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div className="mt-auto hidden rounded-2xl bg-white/8 p-4 ring-1 ring-white/10 lg:block">
            <p className="text-xs font-semibold text-[#9fd8ca]">Demo workspace</p>
            <p className="mt-2 text-xs leading-relaxed text-white/65">
              Explore the interface safely. Changes are not saved and all people shown are fictional.
            </p>
            <Link href="/" className="mt-4 block text-xs font-semibold text-white hover:underline">
              ← Back to Kindred
            </Link>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e8e5dc] bg-white px-5 py-5 sm:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65a697]">
                Professional dashboard
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#183d35]">
                {activeLabel}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden rounded-full bg-[#edf7f4] px-3 py-1.5 text-xs font-semibold text-[#347f70] sm:inline-flex">
                ● Verified professional
              </span>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f7e7cf] text-xs font-bold text-[#a26722]">
                MC
              </span>
            </div>
          </header>

          <div className="p-5 sm:p-8">
            {view === "overview" && <Overview />}
            {view === "clients" && <Clients />}
            {view === "plans" && <Plans />}
            {view === "messages" && <Messages />}
          </div>
        </main>
      </div>
    </div>
  );
}
