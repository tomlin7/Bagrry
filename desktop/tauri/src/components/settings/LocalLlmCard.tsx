import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  BrainCircuit,
  Check,
  Cpu,
  Download,
  HardDrive,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  Trash2,
  Zap,
} from "lucide-react";
import * as api from "@/lib/api";
import { toast } from "@/components/ui/toast";
import { Switch, SettingRow, SettingsCard } from "@/components/ui/controls";

export function LocalLlmCard() {
  const queryClient = useQueryClient();
  const [downloadingModelId, setDownloadingModelId] = useState<string | null>(null);

  const { data: llmStatus, isLoading } = useQuery({
    queryKey: api.qk.localLlmStatus(),
    queryFn: () => api.getLocalLlmStatus(),
  });

  const setEngineMutation = useMutation({
    mutationFn: (engine: "local" | "cloud") => api.setLocalLlmEngine(engine),
    onSuccess: (_, engine) => {
      void queryClient.invalidateQueries({ queryKey: api.qk.localLlmStatus() });
      toast.success(
        engine === "local"
          ? "Switched to Local On-Device LLM (Zero cloud API calls)"
          : "Switched to Cloud Turbo LLM",
      );
    },
    onError: (e) => toast.error(e),
  });

  const setActiveModelMutation = useMutation({
    mutationFn: (modelId: string) => api.setActiveLocalLlmModel(modelId),
    onSuccess: (_, modelId) => {
      void queryClient.invalidateQueries({ queryKey: api.qk.localLlmStatus() });
      toast.success(`Active local model set to ${modelId}`);
    },
    onError: (e) => toast.error(e),
  });

  const setCloudFallbackMutation = useMutation({
    mutationFn: (enable: boolean) => api.setLlmCloudFallback(enable),
    onSuccess: (_, enable) => {
      void queryClient.invalidateQueries({ queryKey: api.qk.localLlmStatus() });
      toast.success(
        enable ? "Cloud fallback enabled" : "Cloud fallback disabled (strict air-gapped)",
      );
    },
    onError: (e) => toast.error(e),
  });

  const downloadModelMutation = useMutation({
    mutationFn: async (modelId: string) => {
      setDownloadingModelId(modelId);
      await api.downloadLocalLlmModel(modelId);
    },
    onSuccess: () => {
      setDownloadingModelId(null);
      void queryClient.invalidateQueries({ queryKey: api.qk.localLlmStatus() });
      toast.success("GGUF model weights downloaded & verified");
    },
    onError: (e) => {
      setDownloadingModelId(null);
      toast.error(e, "Failed to download GGUF model");
    },
  });

  const deleteModelMutation = useMutation({
    mutationFn: (modelId: string) => api.deleteLocalLlmModel(modelId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.localLlmStatus() });
      toast.success("Model weights deleted from disk");
    },
    onError: (e) => toast.error(e),
  });

  if (isLoading || !llmStatus) {
    return (
      <SettingsCard title="Local On-Device LLM (Zero-Cloud Summaries)">
        <div className="flex items-center justify-center p-6 text-xs text-subtle">
          <Loader2 className="mr-2 size-4 animate-spin" /> Loading GGUF inference hardware & models…
        </div>
      </SettingsCard>
    );
  }

  const isLocal = llmStatus.engine === "local";

  return (
    <SettingsCard title="On-Device LLM Inference (Zero-Cloud Summaries)" dashed>
      {/* Engine Selection Radios */}
      <div className="grid grid-cols-2 gap-3 p-4">
        <button
          type="button"
          onClick={() => setEngineMutation.mutate("local")}
          className={`relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all cursor-pointer ${
            isLocal
              ? "border-accent bg-accent/5 ring-1 ring-accent"
              : "border-border bg-surface-2 hover:border-border-strong hover:bg-hover"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BrainCircuit className="size-4 text-accent" />
              <span className="text-sm font-semibold text-text">On-Device GGUF (Local)</span>
            </div>
            {isLocal && <Check className="size-4 text-accent" />}
          </div>
          <p className="text-xs text-muted leading-relaxed">
            Runs quantized 4-bit GGUF models directly on your hardware. Zero API keys, zero cloud dependencies, 100% confidential.
          </p>
          <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-accent">
            <Lock className="size-3" />
            <span>Air-Gapped & Offline Ready</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setEngineMutation.mutate("cloud")}
          className={`relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all cursor-pointer ${
            !isLocal
              ? "border-accent bg-accent/5 ring-1 ring-accent"
              : "border-border bg-surface-2 hover:border-border-strong hover:bg-hover"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="size-4 text-amber-500" />
              <span className="text-sm font-semibold text-text">Cloud LLM (Groq / OpenRouter)</span>
            </div>
            {!isLocal && <Check className="size-4 text-accent" />}
          </div>
          <p className="text-xs text-muted leading-relaxed">
            High-speed cloud synthesis via remote APIs. Requires an API key in the Billing / Keys tab.
          </p>
          <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-subtle">
            <span>Fast cloud latency</span>
          </div>
        </button>
      </div>

      {/* Hardware Diagnostics Bar */}
      <div className="mx-4 mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/80 bg-surface-2 px-3.5 py-2.5 text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 font-medium text-text">
            <Cpu className="size-3.5 text-accent" />
            <span>{llmStatus.hardwareBackend}</span>
          </span>
          <span className="text-subtle">·</span>
          <span className="text-subtle">{llmStatus.cpuThreads} CPU Threads</span>
          <span className="text-subtle">·</span>
          <span className="text-subtle">{llmStatus.contextTokens} Context Tokens</span>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-500">
          <ShieldCheck className="size-3.5" />
          <span>Local Storage Ready</span>
        </div>
      </div>

      {/* Available Quantized Models Catalog */}
      <div className="px-4 pb-4">
        <span className="mb-2.5 block text-xs font-semibold uppercase tracking-wider text-subtle">
          Quantized GGUF Neural Models
        </span>
        <div className="space-y-2.5">
          {llmStatus.models.map((model) => {
            const isDownloading = downloadingModelId === model.id;
            const isActive = isLocal && model.active;

            return (
              <div
                key={model.id}
                className={`flex flex-col gap-2 rounded-xl border p-3.5 transition-colors ${
                  isActive
                    ? "border-accent bg-accent/5 ring-1 ring-accent"
                    : "border-border bg-surface-2"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-text">{model.name}</span>
                      <span className="rounded-full bg-hover px-2 py-0.5 font-mono text-[10px] text-subtle">
                        {model.sizeMb} MB
                      </span>
                      <span className="rounded-full bg-hover px-2 py-0.5 font-mono text-[10px] text-accent">
                        {model.parameters}
                      </span>
                      <span className="rounded-full bg-hover px-2 py-0.5 font-mono text-[10px] text-subtle">
                        {model.quantization}
                      </span>
                      {isActive && (
                        <span className="rounded-full bg-accent/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-accent">
                          Active Model
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted">{model.description}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {model.downloaded ? (
                      <>
                        {!model.active && (
                          <button
                            type="button"
                            onClick={() => setActiveModelMutation.mutate(model.id)}
                            disabled={setActiveModelMutation.isPending}
                            className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text transition-colors hover:border-accent hover:text-accent cursor-pointer"
                          >
                            Activate
                          </button>
                        )}
                        <button
                          type="button"
                          aria-label={`Delete ${model.name}`}
                          onClick={() => deleteModelMutation.mutate(model.id)}
                          disabled={model.active || deleteModelMutation.isPending}
                          title={
                            model.active
                              ? "Cannot delete active model. Activate another first."
                              : "Remove model weights from disk"
                          }
                          className="grid size-7 place-items-center rounded-lg text-subtle transition-colors hover:bg-hover hover:text-red-400 disabled:opacity-40 cursor-pointer"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => downloadModelMutation.mutate(model.id)}
                        disabled={isDownloading}
                        className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1 text-xs font-medium text-white shadow-xs transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="size-3 animate-spin" />
                            <span>Downloading…</span>
                          </>
                        ) : (
                          <>
                            <Download className="size-3" />
                            <span>Download GGUF</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-border/40 pt-2 font-mono text-[10px] text-subtle">
                  <span className="flex items-center gap-1">
                    <Sparkles className="size-3 text-accent" />
                    <span>Inference Speed: {model.speedFactor}</span>
                  </span>
                  <span className="truncate max-w-[260px]">
                    SHA-256: {model.sha256.slice(0, 16)}…
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <SettingRow
        icon={<HardDrive />}
        title="Allow Cloud Fallback"
        description="If local inference exhausts available RAM on large transcripts, automatically fall back to cloud."
        control={
          <Switch
            checked={llmStatus.cloudFallback}
            onCheckedChange={(checked) => setCloudFallbackMutation.mutate(checked)}
          />
        }
      />
    </SettingsCard>
  );
}
