import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Laptop, ShieldCheck, UploadCloud, RefreshCw } from "lucide-react";
import * as api from "@/lib/api";
import { SettingRow, SettingsCard } from "@/components/ui/controls";
import { toast } from "@/components/ui/toast";
import type { PeerInfo } from "@/lib/types";

export function PeerSyncCard() {
  const queryClient = useQueryClient();
  const [importPath, setImportPath] = useState("");

  const { data: peers = [], refetch } = useQuery({
    queryKey: api.qk.localPeers(),
    queryFn: api.listLocalPeers,
  });

  const importMutation = useMutation({
    mutationFn: (path: string) => api.importMeetingBundle(path),
    onSuccess: (res) => {
      setImportPath("");
      void queryClient.invalidateQueries({ queryKey: api.qk.meetings() });
      toast.success(`Imported "${res.title}" with ${res.importedActionItemsCount} action items`);
    },
    onError: (e) => toast.error(e, "Bundle import failed"),
  });

  return (
    <SettingsCard
      title="Zero-Cloud Peer Sync & Bundles"
      description="Collaborate securely with colleagues on your local network using end-to-end encrypted .bgry bundles."
    >
      <SettingRow
        title="Local Subnet Peer Discovery"
        description={
          <div className="space-y-2 pt-1">
            <p className="text-xs text-subtle">
              Active Bagrry workspaces discovered via zero-configuration mDNS broadcast.
            </p>
            {peers.length === 0 ? (
              <p className="text-xs text-subtle italic">No local peers detected on current Wi-Fi/Ethernet subnet.</p>
            ) : (
              peers.map((p: PeerInfo) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl border border-border/80 bg-surface/50 p-2.5 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="grid size-8 place-items-center rounded-lg bg-surface border border-border text-subtle">
                      <Laptop className="size-4 text-accent" />
                    </div>
                    <div>
                      <span className="font-semibold text-text">{p.deviceName}</span>
                      <p className="text-[11px] text-subtle font-mono">{p.ipAddress}:{p.port}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.paired ? (
                      <span className="flex items-center gap-1 rounded bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                        <ShieldCheck className="size-3" />
                        <span>Paired</span>
                      </span>
                    ) : (
                      <span className="rounded bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-subtle">
                        Discoverable
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        }
        control={
          <button
            type="button"
            onClick={() => refetch()}
            className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium text-subtle hover:bg-hover hover:text-text"
          >
            <RefreshCw className="size-3" />
            <span>Scan Subnet</span>
          </button>
        }
      />

      <SettingRow
        title="Import Encrypted Meeting Bundle (.bgry)"
        description="Unpack a password or hardware encrypted meeting file into your local workspace."
        control={
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={importPath}
              onChange={(e) => setImportPath(e.target.value)}
              placeholder="Path to .bgry bundle file"
              className="w-56 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-text placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <button
              type="button"
              disabled={!importPath.trim() || importMutation.isPending}
              onClick={() => importMutation.mutate(importPath.trim())}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1 text-xs font-semibold text-accent-fg hover:opacity-90 disabled:opacity-40"
            >
              <UploadCloud className="size-3" />
              <span>Import</span>
            </button>
          </div>
        }
      />
    </SettingsCard>
  );
}
