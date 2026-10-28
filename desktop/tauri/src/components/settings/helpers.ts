import { toast } from "@/components/ui/toast";

export function comingSoon(feature: string) {
  toast.info("UI only for now", `${feature} will land in a follow-up.`);
}

export const quietField = "h-8 rounded-lg border-border bg-transparent px-2.5 text-[13px] hover:border-border-strong";
