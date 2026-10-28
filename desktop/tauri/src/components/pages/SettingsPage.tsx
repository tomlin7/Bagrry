import type { SettingsTab } from "@/lib/types";
import { AnimatePresence, motion } from "framer-motion";
import { snappy } from "@/lib/motion";
import { PreferencesTab } from "@/components/settings/PreferencesTab";
import { ProfileTab } from "@/components/settings/ProfileTab";
import { CalendarTab } from "@/components/settings/CalendarTab";
import { NotificationsTab } from "@/components/settings/NotificationsTab";
import { ConnectorsTab } from "@/components/settings/ConnectorsTab";
import { GetHelpTab } from "@/components/settings/GetHelpTab";
import { BillingTab } from "@/components/settings/BillingTab";
import { ReferralsTab } from "@/components/settings/ReferralsTab";
import { AnalyticsTab, MembersTab, SpacesTab, WorkspaceGeneralTab } from "@/components/settings/WorkspaceTabs";

export function SettingsPage({ tab }: { tab: SettingsTab }) {
  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={snappy}
          className="mx-auto w-full max-w-[640px] px-8 pb-16 pt-6"
        >
          {tab === "preferences" && <PreferencesTab />}
          {tab === "profile" && <ProfileTab />}
          {tab === "calendar" && <CalendarTab />}
          {tab === "notifications" && <NotificationsTab />}
          {tab === "connectors" && <ConnectorsTab />}
          {tab === "help" && <GetHelpTab />}
          {tab === "workspace-general" && <WorkspaceGeneralTab />}
          {tab === "members" && <MembersTab />}
          {tab === "spaces" && <SpacesTab />}
          {tab === "analytics" && <AnalyticsTab />}
          {tab === "billing" && <BillingTab />}
          {tab === "referrals" && <ReferralsTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
