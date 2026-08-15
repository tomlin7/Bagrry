import Link from "next/link";
import { SiteFooter, SiteHeader } from "../components/SiteChrome";

const plans = [
  {
    name: "Basic",
    price: "$0",
    pitch: "A free taste of Bagrry",
    items: [
      "AI meeting notes",
      "Last 30 days in the app",
      "Chat within and across meetings",
      "Shared folders & templates",
      "Recipes and MCP on this machine",
    ],
  },
  {
    name: "Business",
    price: "$14",
    pitch: "For people who live in meetings",
    items: [
      "Unlimited history",
      "Advanced chat models",
      "Notion, Slack, HubSpot, Attio, Zapier",
      "Centralized billing",
      "MCP in every AI app",
    ],
  },
  {
    name: "Enterprise",
    price: "$35",
    pitch: "For larger companies",
    items: [
      "SSO and admin controls",
      "Priority support & analytics",
      "Org-wide auto-deletion",
      "Sharing & API governance",
      "Org-wide training opt-out",
    ],
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f2] text-[#1c1914]">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-[#5b6f00]">Plans</p>
        <h1 className="font-display mt-2 text-5xl font-semibold">Unlimited notes. Upgrade for history.</h1>
        <p className="mt-3 max-w-xl text-[#5c574f]">
          Take as many notes as you like. Business keeps every conversation searchable forever.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {plans.map((p) => (
            <article key={p.name} className="paper-card rounded-2xl border border-[#e4dfd3] p-6">
              <p className="text-[11px] uppercase tracking-[0.16em] text-[#8a847a]">{p.name}</p>
              <p className="font-display mt-2 text-4xl">
                {p.price}
                <span className="font-sans text-base text-[#8a847a]"> / user / mo</span>
              </p>
              <p className="mt-2 text-sm text-[#5c574f]">{p.pitch}</p>
              <ul className="mt-4 space-y-2 text-sm">
                {p.items.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
              <Link
                href="/download"
                className={`mt-6 block rounded-full py-2 text-center text-sm ${
                  p.name === "Business"
                    ? "bg-[#5b6f00] text-[#f7f7f2]"
                    : "border border-[#e4dfd3]"
                }`}
              >
                {p.name === "Basic" ? "Start free" : "Get the app"}
              </Link>
            </article>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
