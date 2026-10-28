import { Check } from "lucide-react";
import { Badge } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { SettingsCard } from "@/components/ui/controls";
import { toast } from "@/components/ui/toast";
import { useSetting } from "@/hooks/useSetting";
import { TabHeading } from "./shared";

const plans = [
  {
    id: "basic",
    name: "Basic",
    price: "$8",
    period: "per user / month",
    features: ["Local notes", "Calendar", "Templates"],
  },
  {
    id: "business",
    name: "Business",
    price: "$14",
    period: "per user / month",
    features: ["Everything in Basic", "Sharing", "Connectors", "Priority support"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "annual",
    features: ["Everything in Business", "SSO", "Admin controls", "Dedicated support"],
  },
] as const;

export function BillingTab() {
  const [plan, setPlan] = useSetting("billing_plan", "business");
  const current = plans.find((p) => p.id === plan) ?? plans[1];

  return (
    <>
      <TabHeading title="Billing" />

      <SettingsCard>
        <div className="flex items-start justify-between gap-4 px-5 py-5">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[16px] font-semibold text-text">{current.name}</p>
              <Badge tone="accent">Local</Badge>
            </div>
            <p className="mt-1 max-w-sm text-[13px] leading-snug text-muted">
              Plans are stored on this device until cloud billing ships. Switching a plan unlocks the matching UI.
            </p>
          </div>
          <div className="text-right">
            <p className="font-display text-[22px] font-semibold tracking-tight text-text">{current.price}</p>
            <p className="text-[12px] text-subtle">{current.period}</p>
          </div>
        </div>
        <div className="grid grid-cols-3">
          {[
            ["Seats", "1"],
            ["Plan", current.name],
            ["Workspace", "This device"],
          ].map(([label, value]) => (
            <div key={label} className="border-l border-border px-5 py-3 first:border-l-0">
              <p className="text-[11px] text-subtle">{label}</p>
              <p className="mt-0.5 text-[13px] font-medium text-text">{value}</p>
            </div>
          ))}
        </div>
      </SettingsCard>

      <section className="mb-6">
        <h2 className="mb-2 px-1 text-[13px] text-muted">Compare plans</h2>
        <div className="grid grid-cols-3 gap-3">
          {plans.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-xl border border-border bg-surface">
              <div className="border-b border-border px-4 py-4">
                <p className="text-[13px] font-semibold text-text">{item.name}</p>
                <p className="mt-2 font-display text-[20px] font-semibold tracking-tight text-text">{item.price}</p>
                <p className="text-[11px] text-subtle">{item.period}</p>
              </div>
              <ul className="flex flex-col gap-2 px-4 py-4">
                {item.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-[12px] text-muted">
                    <Check className="mt-0.5 size-3.5 shrink-0 text-accent" strokeWidth={2} />
                    {feature}
                  </li>
                ))}
              </ul>
              <div className="px-4 pb-4">
                <Button
                  variant={item.id === plan ? "solid" : "outline"}
                  size="sm"
                  shape="square"
                  className="w-full"
                  onClick={() => {
                    setPlan(item.id);
                    toast.success(`${item.name} selected`);
                  }}
                >
                  {item.id === plan ? "Current" : "Switch"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
