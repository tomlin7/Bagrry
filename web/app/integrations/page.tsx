import { SiteFooter, SiteHeader } from "../components/SiteChrome";

const tools = [
  ["Notion", "Push structured notes into a database."],
  ["Slack", "Send recaps and action items to a channel."],
  ["HubSpot", "Attach call notes to contacts and deals."],
  ["Attio", "Keep CRM records in sync with meetings."],
  ["Zapier", "Fan out webhooks to the rest of your stack."],
  ["MCP", "Claude, ChatGPT, and Cursor query local notes."],
];

export default function IntegrationsPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f2] text-[#1c1914]">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5b6f00]">Connect</p>
        <h1 className="font-display mt-2 text-5xl font-semibold">Use your notes anywhere</h1>
        <p className="mt-3 max-w-xl text-[#5c574f]">
          No more copy-pasting transcripts into other AI tools. Local MCP runs inside the desktop app; CRM
          sync uses your webhook.
        </p>
        <div className="mt-10 grid gap-3 md:grid-cols-2">
          {tools.map(([name, body]) => (
            <article key={name} className="rounded-2xl border border-[#e4dfd3] bg-white/50 p-5">
              <h3 className="font-display text-xl">{name}</h3>
              <p className="mt-2 text-sm text-[#5c574f]">{body}</p>
              <p className="mt-3 text-xs text-[#5b6f00]">Available on Business · configure in the desktop app</p>
            </article>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
