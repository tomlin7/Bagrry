import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/misc";
import { SettingsCard } from "@/components/ui/controls";
import { toast } from "@/components/ui/toast";
import { TabHeading } from "./shared";

const referralUrl = "https://bagrry.app/r/demo";

const steps = [
  { n: "1", title: "Share your link", body: "Send it to teammates who take meeting notes." },
  { n: "2", title: "They join Bagrry", body: "When they create a workspace from your link, it counts." },
  { n: "3", title: "You both get credit", body: "Referral rewards will land here once billing is live." },
];

export function ReferralsTab() {
  return (
    <>
      <TabHeading title="Referrals" />

      <SettingsCard>
        <div className="px-5 py-6">
          <Badge tone="accent">New</Badge>
          <h2 className="mt-3 font-display text-[22px] font-semibold tracking-tight text-text">
            Invite people to Bagrry
          </h2>
          <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-muted">
            Share your personal link. This screen is layout-only — rewards are not wired yet.
          </p>
          <div className="mt-4 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg border border-border bg-bg px-3 py-2 text-[12px] text-muted">
              {referralUrl}
            </code>
            <Button
              variant="accent"
              size="sm"
              shape="square"
              onClick={() => {
                void navigator.clipboard.writeText(referralUrl).then(
                  () => toast.success("Link copied"),
                  () => toast.info("Copy this link", referralUrl),
                );
              }}
            >
              <Copy />
              Copy
            </Button>
          </div>
        </div>
      </SettingsCard>

      <div className="mb-6 grid grid-cols-3 gap-3">
        {steps.map((step) => (
          <div key={step.n} className="rounded-xl border border-border bg-surface px-4 py-4">
            <span className="grid size-6 place-items-center rounded-full bg-hover text-[11px] font-semibold text-muted">
              {step.n}
            </span>
            <p className="mt-3 text-[13px] font-medium text-text">{step.title}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-subtle">{step.body}</p>
          </div>
        ))}
      </div>

      <SettingsCard title="A few rules">
        <ul className="list-disc space-y-1.5 px-8 py-4 text-[13px] leading-relaxed text-muted">
          <li>Self-referrals do not count.</li>
          <li>Credit is a placeholder until billing ships.</li>
          <li>We may change rewards before launch.</li>
        </ul>
      </SettingsCard>
    </>
  );
}
