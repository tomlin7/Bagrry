import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { KeyRound, Mic, Sparkles } from "lucide-react";
import * as api from "@/lib/api";
import { useAppStore } from "@/store/app";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { AnimatePresence, motion } from "framer-motion";
import { snappy } from "@/lib/motion";

const STEPS = [
  {
    icon: Mic,
    title: "Capture every meeting",
    body: "Bagrry records your mic and your system audio, then turns the conversation into a searchable transcript. Nothing leaves your machine except the audio you choose to transcribe.",
  },
  {
    icon: Sparkles,
    title: "Notes that write themselves",
    body: "Jot rough notes while you talk. When the call ends, Bagrry merges them with the transcript into a structured summary — with citations back to what was actually said.",
  },
] as const;

export function Onboarding() {
  const open = useAppStore((s) => s.onboardingOpen);
  const finish = useAppStore((s) => s.finishOnboarding);
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [groqKey, setGroqKey] = useState("");

  const complete = useMutation({
    mutationFn: async () => {
      if (name.trim()) await api.setProfile(name.trim(), "", `${name.trim().split(" ")[0]}'s`);
      if (groqKey.trim()) await api.setSecret("groq_api_key", groqKey.trim());
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.profile() });
      void queryClient.invalidateQueries({ queryKey: api.qk.dbStatus() });
      finish();
    },
    onError: (error) => {
      toast.error(error);
      finish();
    },
  });

  const isLastStep = step === STEPS.length;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && finish()}>
      <DialogContent showClose={false} className="max-w-[420px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={isLastStep ? "setup" : step}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={snappy}
          >
            {isLastStep ? (
              <div>
                <div className="mb-4 grid size-9 place-items-center rounded-xl bg-accent-subtle text-accent">
                  <KeyRound className="size-4" />
                </div>
                <h2 className="font-display text-xl font-semibold text-text">Almost there</h2>
                <p className="mt-1 text-[13px] text-muted">
                  Transcription and summaries run through Groq. You can add the key later in Settings.
                </p>

                <div className="mt-4 space-y-3">
                  <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
                  <Input
                    type="password"
                    placeholder="Groq API key (optional)"
                    value={groqKey}
                    onChange={(e) => setGroqKey(e.target.value)}
                  />
                </div>

                <div className="mt-5 flex items-center justify-between">
                  <Button variant="ghost" size="md" onClick={finish}>
                    Skip
                  </Button>
                  <Button
                    variant="solid"
                    size="md"
                    loading={complete.isPending}
                    onClick={() => complete.mutate()}
                  >
                    Start using Bagrry
                  </Button>
                </div>
              </div>
            ) : (
              <Step
                index={step}
                onNext={() => setStep((s) => s + 1)}
                onSkip={finish}
                total={STEPS.length}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

function Step({
  index,
  total,
  onNext,
  onSkip,
}: {
  index: number;
  total: number;
  onNext: () => void;
  onSkip: () => void;
}) {
  const step = STEPS[index];
  const Icon = step.icon;

  return (
    <div>
      <div className="mb-4 grid size-9 place-items-center rounded-xl bg-accent-subtle text-accent">
        <Icon className="size-4" />
      </div>
      <h2 className="font-display text-xl font-semibold text-text">{step.title}</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-muted">{step.body}</p>

      <div className="mt-5 flex items-center justify-between">
        <div className="flex gap-1.5">
          {Array.from({ length: total + 1 }, (_, i) => (
            <span
              key={i}
              className={
                i === index
                  ? "h-1 w-4 rounded-full bg-accent transition-all duration-150"
                  : "size-1 rounded-full bg-border-strong transition-all duration-150"
              }
            />
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="md" onClick={onSkip}>
            Skip
          </Button>
          <Button variant="solid" size="md" onClick={onNext}>
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
