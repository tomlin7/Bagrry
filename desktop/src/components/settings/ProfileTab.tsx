import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as api from "@/lib/api";
import { useSetting } from "@/hooks/useSetting";
import { Avatar } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { SettingRow, SettingsCard } from "@/components/ui/controls";
import { toast } from "@/components/ui/toast";
import { SettingsField, TabHeading } from "./shared";
import { comingSoon, quietField } from "./helpers";

export function ProfileTab() {
  const queryClient = useQueryClient();
  const { data: profile } = useQuery({ queryKey: api.qk.profile(), queryFn: api.getProfile });

  const [name, setName] = useState<string | null>(null);
  const [workspace, setWorkspace] = useState<string | null>(null);
  const [jobTitle, setJobTitle] = useSetting("profile_job_title", "");
  const [linkedin, setLinkedin] = useSetting("profile_linkedin", "");
  const [companyDescription, setCompanyDescription] = useSetting("profile_company_description", "");

  const displayName = name ?? profile?.name ?? "";
  const displayEmail = profile?.email ?? "";
  const company = workspace ?? profile?.workspace ?? "";

  const save = useMutation({
    mutationFn: () => api.setProfile(displayName, displayEmail, company),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: api.qk.profile() });
      toast.success("Profile saved");
    },
    onError: (e) => toast.error(e),
  });

  return (
    <>
      <TabHeading
        title="Profile"
        description="Bagrry works best knowing a little about you. Info here is visible to other users in your meetings."
      />

      <SettingsCard title="Account" dashed>
        <SettingRow
          title="Email"
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
          description="Bring existing meeting notes into this workspace."
          control={
            <Button variant="outline" size="sm" shape="square" onClick={() => comingSoon("Note import")}>
              Import
            </Button>
          }
        />
        <SettingRow
          title="Export historical data"
          description="Download a CSV of your notes and attendees."
          control={
            <Button variant="outline" size="sm" shape="square" onClick={() => comingSoon("CSV export")}>
              Generate CSV
            </Button>
          }
        />
      </SettingsCard>

      <SettingsCard title="Danger zone" danger dashed>
        <SettingRow
          title="Delete my account"
          description="Delete your account, notes, and all associated data. This cannot be undone."
          control={
            <Button
              variant="ghost"
              size="sm"
              className="text-danger hover:bg-danger/10 hover:text-danger"
              onClick={() => comingSoon("Account deletion")}
            >
              Delete my account
            </Button>
          }
        />
      </SettingsCard>
    </>
  );
}
