import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { pickTextFiles } from "@/lib/open";
import { useSetting } from "@/hooks/useSetting";
import { Avatar } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { SettingRow, SettingsCard } from "@/components/ui/controls";
import { toast } from "@/components/ui/toast";
import { SettingsField, TabHeading } from "./shared";
import { quietField } from "./helpers";

export function ProfileTab() {
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: api.qk.profile(), queryFn: api.getProfile });

  const [name, setName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useSetting("profile_job_title", "");
  const [linkedin, setLinkedin] = useSetting("profile_linkedin", "");
  const [companyDescription, setCompanyDescription] = useSetting("profile_company_description", "");
  const [confirmDelete, setConfirmDelete] = useState("");

  const displayName = name ?? profile?.name ?? "";
  const displayEmail = email ?? profile?.email ?? "";
  const company = workspace ?? profile?.workspace ?? "";

  const save = useMutation({
    mutationFn: () => api.setProfile(displayName, displayEmail, company),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.profile() });
      toast.success("Profile saved");
    },
    onError: (e) => toast.error(e),
  });

  const importNotes = useMutation({
    mutationFn: async () => {
      const files = await pickTextFiles(".md,.txt,.markdown,text/markdown,text/plain");
      if (files.length === 0) return 0;
      const notes = files.map((file) => ({
        title: file.name.replace(/\.(md|txt|markdown)$/i, ""),
        body: file.text,
      }));
      return api.importNotes(notes);
    },
    onSuccess: (count) => {
      if (count === 0) return;
      void queryClient.invalidateQueries({ queryKey: api.qk.meetings() });
      toast.success(`Imported ${count} note${count === 1 ? "" : "s"}`);
    },
    onError: (e) => toast.error(e),
  });

  const exportCsv = useMutation({
    mutationFn: api.exportCsv,
    onSuccess: (path) => toast.success("CSV saved", path),
    onError: (e) => toast.error(e),
  });

  const wipe = useMutation({
    mutationFn: api.deleteAllData,
    onSuccess: () => {
      void queryClient.invalidateQueries();
      setConfirmDelete("");
      toast.success("All notes and data deleted");
    },
    onError: (e) => toast.error(e),
  });

  return (
    <>
      <TabHeading
        title="Profile"
        description="Bagrry works best knowing a little about you. This is used when summarising your meetings."
      />

      <SettingsCard title="Account" dashed>
        <SettingRow
          title="Avatar"
          description={displayEmail || "No email set"}
          control={<Avatar name={displayName || "You"} size={28} />}
        />
        <SettingsField label="Full name">
          <Input
            className={quietField}
            value={displayName}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => displayName.trim() && save.mutate()}
            placeholder="Your name"
          />
        </SettingsField>
        <SettingsField label="Email">
          <Input
            className={quietField}
            type="email"
            value={displayEmail}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => save.mutate()}
            placeholder="you@company.com"
          />
        </SettingsField>
        <SettingsField label="Job title">
          <Input
            className={quietField}
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="Investing Partner"
          />
        </SettingsField>
        <SettingsField label="LinkedIn username">
          <div className="flex h-8 items-center rounded-lg border border-border bg-transparent px-2.5 text-[13px] focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25">
            <span className="shrink-0 text-subtle">linkedin.com/in/</span>
            <input
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-subtle"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, ""))}
              placeholder="sarahjohnson"
            />
          </div>
        </SettingsField>
      </SettingsCard>

      <SettingsCard title="Your company" dashed>
        <SettingsField label="Company name">
          <Input
            className={quietField}
            value={company}
            onChange={(e) => setWorkspace(e.target.value)}
            onBlur={() => company.trim() && save.mutate()}
            placeholder="Acme"
          />
        </SettingsField>
        <SettingsField
          label="Company description"
          hint="Bagrry takes this into account when summarising your meetings."
        >
          <Textarea
            rows={3}
            value={companyDescription}
            onChange={(e) => setCompanyDescription(e.target.value)}
            placeholder="What does your company do?"
          />
        </SettingsField>
      </SettingsCard>

      <SettingsCard title="Account management" dashed>
        <SettingRow
          title="Import notes from another account"
          description="Choose Markdown or text files. Each file becomes a note."
          control={
            <Button
              variant="outline"
              size="sm"
              shape="square"
              loading={importNotes.isPending}
              onClick={() => importNotes.mutate()}
            >
              Import
            </Button>
          }
        />
        <SettingRow
          title="Export historical data"
          description="Download a CSV of your notes and attendees to your Downloads folder."
          control={
            <Button
              variant="outline"
              size="sm"
              shape="square"
              loading={exportCsv.isPending}
              onClick={() => exportCsv.mutate()}
            >
              Generate CSV
            </Button>
          }
        />
      </SettingsCard>

      <SettingsCard title="Danger zone" danger dashed>
        <SettingRow
          title="Delete my account"
          description="Deletes every note, transcript, chat and calendar event on this computer. Type DELETE to confirm."
        />
        <div className="flex items-center gap-2 px-4 pb-4">
          <Input
            className={quietField}
            value={confirmDelete}
            onChange={(e) => setConfirmDelete(e.target.value)}
            placeholder="DELETE"
          />
          <Button
            variant="ghost"
            size="sm"
            className="text-danger hover:bg-danger/10 hover:text-danger"
            disabled={confirmDelete !== "DELETE" || wipe.isPending}
            loading={wipe.isPending}
            onClick={() => wipe.mutate()}
          >
            Delete my account
          </Button>
        </div>
      </SettingsCard>
    </>
  );
}
