import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app";

const STEPS = [
  {
    title: "No bot joins the call",
    body: "Bagrry listens to your mic and system audio on this machine. Grant capture when Windows asks, then record with Ctrl+Shift+R.",
  },
  {
    title: "Your notes stay yours",
    body: "Jot shorthand during the meeting. After you stop, Enhance expands it in gray, with citations back to the transcript.",
  },
  {
    title: "Bring your own Groq key",
    body: "Whisper and Llama run through your key. Without one, search and heuristic enhance still work offline.",
  },
];

export function Onboarding() {
  const open = useAppStore((s) => s.onboardingOpen);
  const finish = useAppStore((s) => s.finishOnboarding);
  const setPage = useAppStore((s) => s.setPage);
  const [step, setStep] = useState(0);
  if (!open) return null;
  const s = STEPS[step];
  const last = step === STEPS.length - 1;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#1c1914]/30 px-4 backdrop-blur-[2px]">
      <div className="paper-card w-full max-w-md rounded-2xl border border-[#e4dfd3] p-7">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {step + 1} / {STEPS.length}
        </p>
        <h2 className="font-display mt-2 text-3xl">{s.title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
        <div className="mt-6 flex justify-between">
          <Button variant="ghost" className="rounded-full" onClick={finish}>
            Skip
          </Button>
          <Button
            className="rounded-full"
            onClick={() => {
              if (last) {
                finish();
                setPage("notes");
              } else {
                setStep(step + 1);
              }
            }}
          >
            {last ? "Open notepad" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}
