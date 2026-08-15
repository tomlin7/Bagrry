import { useAppStore } from "@/store/app";
import { Button } from "@/components/ui/button";

const LOGOS = ["Linear", "Vercel", "a16z", "Menlo", "Northwind", "Bit Labs", "Attio", "Notion"];

export function LandingPage() {
  const enter = useAppStore((s) => s.enterWorkspace);
  const setPage = useAppStore((s) => s.setPage);

  return (
    <div className="relative h-full overflow-y-auto bg-[#f7f7f2] text-[#1c1914]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="orb absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-[#cdd4a0]/50 blur-3xl" />
        <div className="orb absolute right-[-8rem] top-40 h-[22rem] w-[22rem] rounded-full bg-[#e8d9b0]/60 blur-3xl [animation-delay:-4s]" />
        <div className="orb absolute bottom-10 left-1/3 h-[18rem] w-[18rem] rounded-full bg-[#d7e0c4]/40 blur-3xl [animation-delay:-7s]" />
        <div className="grain absolute inset-0 opacity-[0.07] mix-blend-multiply" />
      </div>

      <header className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 backdrop-blur-md">
        <Mark />
        <nav className="hidden items-center gap-6 text-sm text-[#5c574f] md:flex">
          <button type="button" onClick={() => document.getElementById("product")?.scrollIntoView({ behavior: "smooth" })}>
            Product
          </button>
          <button type="button" onClick={() => setPage("pricing")}>
            Pricing
          </button>
          <button type="button" onClick={() => setPage("integrations")}>
            Integrations
          </button>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => enter("dashboard")}>
            Sign in
          </Button>
          <Button className="rounded-full bg-[#5b6f00] px-5 text-[#f7f7f2] hover:bg-[#4a5a00]" onClick={() => enter("notes")}>
            Open notepad
          </Button>
        </div>
      </header>

      <section className="relative mx-auto max-w-5xl px-6 pb-16 pt-10 text-center">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.22em] text-[#5b6f00]">
          Notes, actions and memory. Without a meeting bot.
        </p>
        <h1 className="font-display mx-auto max-w-4xl text-5xl leading-[1.05] font-semibold tracking-tight md:text-7xl">
          The AI notepad for <em className="italic font-normal">back-to-back</em> meetings
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[#5c574f]">
          Stay present. Jot what matters. Bagrry captures the conversation from your computer audio and
          turns it into notes that still sound like you.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            className="rounded-full bg-[#5b6f00] px-7 text-[#f7f7f2] hover:bg-[#4a5a00]"
            onClick={() => enter("notes")}
          >
            Start taking notes
          </Button>
          <Button size="lg" variant="outline" className="rounded-full border-[#cfc8b8] bg-white/50" onClick={() => setPage("pricing")}>
            View pricing
          </Button>
        </div>
        <p className="mt-4 text-xs text-[#8a847a]">macOS · Windows · iOS · Android · unlimited notes on Basic</p>

        <div className="paper-card mx-auto mt-14 overflow-hidden rounded-2xl border border-[#e4dfd3]">
          <div className="flex items-center gap-2 border-b border-[#ece7db] bg-[#fbfaf5] px-4 py-2.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#d9c8a8]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#cdd4a0]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#e4dfd3]" />
            <span className="ml-2 text-[11px] tracking-wide text-[#8a847a]">Northwind pricing review</span>
          </div>
          <div className="grid min-h-[280px] grid-cols-2 text-left">
            <div className="border-r border-[#ece7db] p-6">
              <p className="mb-3 text-[10px] font-medium uppercase tracking-widest text-[#8a847a]">My notes</p>
              <p className="text-sm leading-7">
                $14 / user annual
                <br />
                quarterly true-ups
                <br />
                legal wants DPA by Friday
              </p>
            </div>
            <div className="bg-[#fbfaf5] p-6">
              <p className="mb-3 text-[10px] font-medium uppercase tracking-widest text-[#8a847a]">Enhanced</p>
              <p className="text-sm font-medium">Pricing</p>
              <p className="ai-text mt-1 text-sm leading-7">
                Agreed on $14/user/mo for annual billing with quarterly true-ups.
              </p>
              <p className="mt-4 text-sm font-medium">Next steps</p>
              <p className="ai-text mt-1 text-sm leading-7">Legal to send the DPA by Friday. Alex owns follow-up.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="relative border-y border-[#ece7db] py-8">
        <p className="mb-4 text-center text-[11px] uppercase tracking-[0.2em] text-[#8a847a]">Trusted by teams we admire</p>
        <div className="overflow-hidden">
          <div className="marquee-track flex w-max gap-16 px-8 text-lg text-[#8a847a]">
            {[...LOGOS, ...LOGOS].map((name, i) => (
              <span key={`${name}-${i}`} className="font-display italic">
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section id="product" className="relative mx-auto max-w-5xl px-6 py-20">
        <h2 className="font-display text-center text-4xl font-semibold">
          Before, during, and after — without choosing.
        </h2>
        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            {
              kicker: "Before",
              title: "Start prepared",
              body: "Calendar syncs a brief: who’s attending, what you decided last time, and what still matters.",
            },
            {
              kicker: "During",
              title: "Give your full attention",
              body: "Write as little or as much as you like. Bagrry listens to system audio — no bot joins the call.",
            },
            {
              kicker: "After",
              title: "Admin, done",
              body: "Notes, action items, and follow-up recipes are ready the moment you hit stop.",
            },
          ].map((card) => (
            <article key={card.title} className="paper-card rounded-2xl border border-[#e4dfd3] p-6 transition hover:-translate-y-0.5">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[#5b6f00]">{card.kicker}</p>
              <h3 className="font-display mt-2 text-2xl">{card.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#5c574f]">{card.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-5xl px-6 pb-20">
        <div className="grid gap-4 md:grid-cols-2">
          {[
            ["Humans in the room, not bots", "Transcribes in the background while you stay present."],
            ["Works with every meeting app", "Zoom, Meet, Teams, huddles, walking meetings, coffee."],
            ["Private by default", "Notes live on this machine. Share a link only when you choose."],
            ["Chat your meeting memory", "Ask across folders: objections, decisions, open loops."],
          ].map(([title, body]) => (
            <article key={title} className="rounded-2xl border border-[#e4dfd3] bg-white/40 p-6">
              <h3 className="font-display text-xl">{title}</h3>
              <p className="mt-2 text-sm text-[#5c574f]">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="relative mx-auto max-w-3xl px-6 pb-24 text-center">
        <blockquote className="font-display text-3xl leading-snug font-medium">
          “It clicked instantly. Seamless, purpose-built, and calm enough for a packed calendar.”
        </blockquote>
        <p className="mt-4 text-sm text-[#8a847a]">Product teams who live in meetings</p>
        <Button
          className="mt-8 rounded-full bg-[#5b6f00] px-7 text-[#f7f7f2] hover:bg-[#4a5a00]"
          onClick={() => enter("dashboard")}
        >
          Open your dashboard
        </Button>
      </section>

      <section className="relative mx-auto max-w-3xl px-6 pb-24">
        <h2 className="font-display text-center text-3xl">Things worth noting</h2>
        <div className="mt-8 space-y-3">
          {[
            ["Do you train models on my meetings?", "No. Audio never leaves RAM after transcription. Chat and enhance use your Groq key. Opt out of any provider training in Workspace."],
            ["How do others know I’m taking notes?", "Copy a one-line consent message into Meet or Teams chat. Optional recording watermark sits at the top of the window."],
            ["What’s on Basic vs Business?", "Basic is free with 30-day history in the app. Business is $14/user/mo for unlimited history, CRM connectors, and advanced chat."],
            ["Where does data live?", "SQLite on this machine. Share links are local. MCP and the REST API bind to 127.0.0.1."],
          ].map(([q, a]) => (
            <details key={q} className="rounded-2xl border border-[#e4dfd3] bg-white/50 px-5 py-4">
              <summary className="cursor-pointer font-medium">{q}</summary>
              <p className="mt-2 text-sm leading-relaxed text-[#5c574f]">{a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}

export function Mark() {
  return (
    <span className="font-display text-xl italic tracking-tight">
      Bagrry
    </span>
  );
}
