import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Cpu,
  Download,
  HardDrive,
  Loader2,
  Lock,
  ShieldCheck,
  Trash2,
  Zap,
} from "lucide-react";
import * as api from "@/lib/api";
import { toast } from "@/components/ui/toast";
import { Switch, SettingRow, SettingsCard } from "@/components/ui/controls";

export function LocalWhisperCard() {
  const queryClient = useQueryClient();
  const [downloadingModelId, setDownloadingModelId] = useState<string | null>(null);

  const { data: sttStatus, isLoading } = useQuery({
    queryKey: api.qk.localSttStatus(),
    queryFn: () => api.getLocalSttStatus(),
  });

  const setEngineMutation = useMutation({
    mutationFn: (engine: "local" | "cloud") => api.setLocalSttEngine(engine),
    onSuccess: (_, engine) => {
      void queryClient.invalidateQueries({ queryKey: api.qk.localSttStatus() });
      toast.success(
        engine === "local"
          ? "Switched to Local Offline STT (100% confidential)"
          : "Switched to Cloud Turbo STT",
      );
    },
    onError: (e) => toast.error(e),
  });

  const setActiveModelMutation = useMutation({
    mutationFn: (modelId: string) => api.setActiveLocalModel(modelId),
    onSuccess: (_, modelId) => {
      void queryClient.invalidateQueries({ queryKey: api.qk.localSttStatus() });
      toast.success(`Active local model set to ${modelId}`);
    },
    onError: (e) => toast.error(e),
  });

  const setCloudFallbackMutation = useMutation({
    mutationFn: (enable: boolean) => api.setSttCloudFallback(enable),
    onSuccess: (_, enable) => {
      void queryClient.invalidateQueries({ queryKey: api.qk.localSttStatus() });
      toast.success(
        enable ? "Cloud fallback enabled" : "Cloud fallback disabled (strict air-gapped)",
      );
    },
    onError: (e) => toast.error(e),
  });

  const downloadModelMutation = useMutation({
    mutationFn: async (modelId: string) => {
      setDownloadingModelId(modelId);
      await api.downloadLocalModel(modelId);
    },
    onSuccess: () => {
      setDownloadingModelId(null);
      void queryClient.invalidateQueries({ queryKey: api.qk.localSttStatus() });
      toast.success("Model weights downloaded & verified (SHA-256)");
    },
    onError: (e) => {
      setDownloadingModelId(null);
      toast.error(e, "Failed to download model weights");
    },
  });

  const deleteModelMutation = useMutation({
    mutationFn: (modelId: string) => api.deleteLocalModel(modelId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.localSttStatus() });
      toast.success("Model weights removed from disk");
    },
    onError: (e) => toast.error(e),
  });

  if (isLoading || !sttStatus) {
    return (
      <SettingsCard title="Speech-to-Text (STT) Inference Engine">
        <div className="flex items-center justify-center p-6 text-xs text-subtle">
          <Loader2 className="size-4 animate-spin mr-2" /> Loading STT hardware & models…
        </div>
      </SettingsCard>
    );
  }

  const isLocal = sttStatus.engine === "local";

  return (
    <SettingsCard title="Speech-to-Text (STT) Engine" dashed>
      {/* Engine Selection Radios */}
      <div className="grid grid-cols-2 gap-3 p-4">
        <button
          type="button"
          onClick={() => setEngineMutation.mutate("local")}
          className={`flex flex-col gap-1.5 rounded-xl border p-3.5 text-left transition-all ${
            isLocal
              ? "border-accent bg-accent/5 ring-1 ring-accent"
              : "border-border bg-surface hover:border-accent/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-text">
              <ShieldCheck className="size-4 text-emerald-400" />
              Local Offline Engine
            </span>
            {isLocal && <Check className="size-3.5 text-accent" />}
          </div>
          <span className="text-[11px] text-subtle leading-relaxed">
            100% confidential on-device inference using AVX2 SIMD CPU & GPU. Zero audio leaves your computer.
          </span>
        </button>

        <button
          type="button"
          onClick={() => setEngineMutation.mutate("cloud")}
          className={`flex flex-col gap-1.5 rounded-xl border p-3.5 text-left transition-all ${
            !isLocal
              ? "border-accent bg-accent/5 ring-1 ring-accent"
              : "border-border bg-surface hover:border-accent/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-text">
              <Zap className="size-4 text-accent" />
              Cloud Turbo Engine
            </span>
            {!isLocal && <Check className="size-3.5 text-accent" />}
          </div>
          <span className="text-[11px] text-subtle leading-relaxed">
            Ultra-fast cloud processing via Groq Whisper-large-v3. Ideal when operating on battery power.
          </span>
        </button>
      </div>

      {/* Hardware Diagnostics Banner */}
      <div className="mx-4 mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-surface-raised/40 px-3 py-2 text-[11px]">
        <span className="font-semibold text-text flex items-center gap-1">
          <Cpu className="size-3.5 text-subtle" /> Hardware Acceleration:
        </span>
        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-emerald-400 font-medium">
          {sttStatus.avx2Supported ? "AVX2 SIMD Enabled" : "SSE4.2 Fallback"}
        </span>
        <span className="rounded bg-accent/10 px-1.5 py-0.5 text-accent font-medium">
          {sttStatus.cpuThreads} CPU Threads
        </span>
        <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-cyan-400 font-medium">
          DirectML / GPU Ready
        </span>
      </div>

      {/* Local Model Weights Management Table */}
      <div className="flex flex-col gap-2 border-t border-border/80 px-4 pt-3 pb-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-text flex items-center gap-1.5">
            <HardDrive className="size-3.5 text-subtle" />
            Quantized Whisper Models
          </h4>
          <span className="text-[11px] text-subtle">
            Active: <strong className="text-text capitalize">{sttStatus.activeModel}</strong>
          </span>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          {sttStatus.models.map((m) => {
            const isDownloading = downloadingModelId === m.id;
            return (
              <div
                key={m.id}
                className={`flex flex-col gap-2 rounded-xl border p-3 transition-colors ${
                  m.active
                    ? "border-accent/40 bg-accent/5"
                    : "border-border/70 bg-surface hover:border-border"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-text">{m.name}</span>
                    <span className="rounded bg-surface-raised px-1.5 py-0.5 text-[10px] font-mono text-subtle">
                      ~{m.sizeMb} MB
                    </span>
                    <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] text-accent font-medium">
                      {m.speedFactor}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {m.active ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                        <Check className="size-3" /> Active
                      </span>
                    ) : m.downloaded ? (
                      <button
                        type="button"
                        onClick={() => setActiveModelMutation.mutate(m.id)}
                        className="rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-text hover:bg-hover transition-colors"
                      >
                        Activate
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isDownloading}
                        onClick={() => downloadModelMutation.mutate(m.id)}
                        className="flex items-center gap-1 rounded-lg bg-accent px-2.5 py-1 text-xs font-semibold text-accent-fg hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        {isDownloading ? (
                          <>
                            <Loader2 className="size-3 animate-spin" /> Downloading…
                          </>
                        ) : (
                          <>
                            <Download className="size-3" /> Download
                          </>
                        )}
                      </button>
                    )}

                    {m.downloaded && !m.active && m.id !== "base" && (
                      <button
                        type="button"
                        onClick={() => deleteModelMutation.mutate(m.id)}
                        className="p-1 text-subtle hover:text-rose-400 transition-colors"
                        title="Delete model weights"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-subtle">
                  <span>{m.description}</span>
                  <span className="font-mono text-[9px] opacity-60 truncate max-w-[120px]" title={`SHA-256: ${m.sha256}`}>
                    sha: {m.sha256.slice(0, 10)}…
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cloud Fallback Toggle */}
      <SettingRow
        icon={<Lock />}
        title="Allow Cloud Fallback on Battery"
        description="Automatically switches to Groq Whisper when disconnected from power or if local memory runs low."
        control={
          <Switch
            checked={sttStatus.cloudFallback}
            onCheckedChange={(val) => setCloudFallbackMutation.mutate(val)}
          />
        }
      />
    </SettingsCard>
  );
}
