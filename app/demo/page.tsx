"use client";

import Link from "next/link";
import { useState } from "react";

type DemoView = "dashboard" | "clients" | "chat" | "onboarding";

const clients = [
  {
    id: "maya",
    name: "Maya Patel",
    userName: "mayapatel",
    location: "Austin, TX",
    gender: "Female",
    matched: "8/4/2026",
  },
  {
    id: "jordan",
    name: "Jordan Lee",
    userName: "jordanlee",
    location: "Dallas, TX",
    gender: "Non-binary",
    matched: "7/28/2026",
  },
  {
    id: "sam",
    name: "Sam Rivera",
    userName: "samrivera",
    location: "Houston, TX",
    gender: "Male",
    matched: "7/19/2026",
  },
];

const conversations = [
  { id: "maya", name: "Maya Patel", role: "Client", preview: "The new workout felt great!", date: "Today" },
  { id: "jordan", name: "Jordan Lee", role: "Client", preview: "Should I adjust Saturday’s run?", date: "Yesterday" },
  { id: "sam", name: "Sam Rivera", role: "Client", preview: "Thanks for reviewing my check-in.", date: "Mon" },
];

function Dashboard({ setView }: { setView: (view: DemoView) => void }) {
  const actions: Array<{ view: DemoView; icon: string; label: string }> = [
    { view: "clients", icon: "👥", label: "My Clients" },
    { view: "chat", icon: "💬", label: "Chat" },
    { view: "onboarding", icon: "📋", label: "Onboarding Answers" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-[var(--color-foreground)] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {actions.map((action) => (
              <button
                key={action.view}
                onClick={() => setView(action.view)}
                className="flex flex-col items-center justify-center p-4 rounded-xl bg-[var(--color-background)] hover:bg-gray-100 transition-colors group"
              >
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm mb-2 group-hover:scale-110 transition-transform">
                  <span className="text-xl">{action.icon}</span>
                </div>
                <span className="text-sm font-medium text-center">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-[var(--color-foreground)]">Recent Clients</h2>
            <button onClick={() => setView("clients")} className="text-[var(--color-teal)] text-sm font-medium hover:underline">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {clients.map((client) => (
              <div key={client.id} className="flex items-center justify-between p-3 bg-[var(--color-background)] rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[var(--color-teal)] font-bold shadow-sm">
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-medium text-[var(--color-foreground)]">{client.name}</h3>
                    <p className="text-xs text-[var(--color-subtext)]">Matched {client.matched}</p>
                  </div>
                </div>
                <button onClick={() => setView("clients")} className="px-3 py-1.5 bg-white text-[var(--color-teal)] text-sm font-medium rounded-lg shadow-sm hover:bg-gray-50 transition-colors">
                  View
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full mb-4 overflow-hidden border-4 border-white shadow-sm flex items-center justify-center bg-[var(--color-teal)] text-white text-3xl font-bold">
              A
            </div>
            <h2 className="text-xl font-bold text-[var(--color-foreground)]">Alex Morgan</h2>
            <p className="text-[var(--color-teal)] font-medium capitalize">trainer</p>
            <div className="mt-4 w-full">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-[var(--color-subtext)] text-sm">Status</span>
                <span className="text-sm font-medium text-green-600">Verified</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-[var(--color-subtext)] text-sm">Member Since</span>
                <span className="text-sm font-medium text-[var(--color-foreground)]">2026</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Clients({ setView }: { setView: (view: DemoView) => void }) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--color-foreground)] mb-2">My Clients</h2>
          <p className="text-gray-600">Manage your active client relationships and plans</p>
        </div>
        <button onClick={() => setView("dashboard")} className="mt-4 md:mt-0 inline-flex items-center text-[var(--color-teal)] hover:underline">
          <span className="mr-2">←</span> Back to Dashboard
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <div key={client.id} className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-[var(--color-background)] rounded-full flex items-center justify-center text-xl font-bold text-[var(--color-teal)]">
                  {client.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[var(--color-foreground)]">{client.name}</h3>
                  <p className="text-sm text-gray-500">{client.location}</p>
                </div>
              </div>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm text-gray-600"><span className="w-4 mr-2 text-[var(--color-teal)]">♙</span>{client.gender}</div>
              <div className="flex items-center text-sm text-gray-600"><span className="w-4 mr-2 text-[var(--color-teal)]">□</span>Matched {client.matched}</div>
            </div>
            <button className="w-full bg-[var(--color-teal)] text-white text-center py-2.5 rounded-xl font-medium hover:opacity-90 transition-opacity">
              View Profile
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Chat({ setView }: { setView: (view: DemoView) => void }) {
  const [selectedId, setSelectedId] = useState(conversations[0].id);
  const selected = conversations.find((conversation) => conversation.id === selectedId)!;

  return (
    <div className="flex h-[calc(100vh-176px)] min-h-[560px] bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
      <div className="w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Messages</h2>
          <button onClick={() => setView("dashboard")} className="text-sm text-[var(--color-teal)] hover:underline">Back</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              onClick={() => setSelectedId(conversation.id)}
              className={`w-full p-4 border-b border-gray-100 text-left hover:bg-gray-50 transition-colors ${selectedId === conversation.id ? "bg-blue-50 border-l-4 border-l-blue-600" : ""}`}
            >
              <div className="flex items-center">
                <div className="mr-3 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold">
                  {conversation.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-gray-900 truncate pr-2">{conversation.name}</h3>
                    <span className="text-xs text-gray-500 whitespace-nowrap">{conversation.date}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate">{conversation.preview}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="hidden md:flex md:w-2/3 lg:w-3/4 flex-col bg-white">
        <div className="p-4 border-b border-gray-200 flex items-center bg-white shadow-sm z-10">
          <div className="mr-3 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-semibold">{selected.name.charAt(0)}</div>
          <div><h2 className="text-lg font-semibold text-gray-800">{selected.name}</h2><p className="text-xs text-gray-500">{selected.role}</p></div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4 flex flex-col justify-end">
          <div className="flex justify-start">
            <div className="mr-2 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-semibold self-end">{selected.name.charAt(0)}</div>
            <div className="max-w-[75%] rounded-2xl rounded-bl-none px-4 py-2 shadow-sm bg-white text-gray-800 border border-gray-200"><p className="text-sm md:text-base">{selected.preview}</p><p className="text-[10px] mt-1 text-right text-gray-400">9:42 AM</p></div>
          </div>
          <div className="flex justify-end">
            <div className="max-w-[75%] rounded-2xl rounded-br-none px-4 py-2 shadow-sm bg-blue-600 text-white"><p className="text-sm md:text-base">Great work. I reviewed your check-in and updated next week’s plan.</p><p className="text-[10px] mt-1 text-right text-blue-100">9:45 AM</p></div>
          </div>
        </div>
        <div className="p-4 bg-white border-t border-gray-200 flex gap-2">
          <div className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-gray-400">Preview mode — messaging is disabled</div>
          <button disabled className="bg-blue-600 text-white rounded-full p-2 w-10 h-10 opacity-50">➤</button>
        </div>
      </div>
    </div>
  );
}

function Onboarding({ setView }: { setView: (view: DemoView) => void }) {
  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => setView("dashboard")} className="mb-6 inline-flex items-center text-[var(--color-teal)] hover:underline">← Back to Dashboard</button>
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-full bg-[var(--color-background)] flex items-center justify-center text-2xl">📋</div>
          <div><h2 className="text-2xl font-bold text-[var(--color-foreground)]">Professional Onboarding</h2><p className="text-gray-600">Your saved profile and coaching preferences</p></div>
        </div>
        <div className="space-y-6">
          {[
            ["Professional type", "Personal Trainer"],
            ["Specialties", "Strength training, mobility, sustainable habits"],
            ["Coaching approach", "Supportive, practical, and progress-focused"],
            ["Typical availability", "Weekday mornings and early evenings"],
          ].map(([label, answer]) => (
            <div key={label} className="pb-5 border-b border-gray-100 last:border-0"><p className="text-sm text-[var(--color-subtext)] mb-1">{label}</p><p className="font-medium text-[var(--color-foreground)]">{answer}</p></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DemoPage() {
  const [view, setView] = useState<DemoView>("dashboard");

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex flex-col">
      <div className="pt-8 px-6 pb-6 flex flex-wrap gap-4 justify-between items-center bg-white shadow-sm z-10">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Professional Dashboard</h1>
          <p className="text-[var(--color-subtext)] mt-1">Welcome back, Alex Morgan</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-flex px-3 py-1.5 bg-orange-50 text-orange-700 rounded-full text-sm font-medium">Demo data</span>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--color-background)] rounded-full">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm font-medium text-[var(--color-foreground)]">Verified Pro</span>
          </div>
          <Link href="/" aria-label="Exit demo" className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center hover:opacity-80 transition-opacity border border-gray-200 font-semibold text-gray-600">A</Link>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <div className={view === "chat" ? "max-w-6xl mx-auto" : "max-w-6xl mx-auto"}>
          {view === "dashboard" && <Dashboard setView={setView} />}
          {view === "clients" && <Clients setView={setView} />}
          {view === "chat" && <Chat setView={setView} />}
          {view === "onboarding" && <Onboarding setView={setView} />}
        </div>
      </div>

      <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-xs text-gray-600 max-w-xs">
        Interactive preview with fictional sample data. No account or external services required.
      </div>
    </div>
  );
}
