import { useQuery } from "@tanstack/react-query";
import {
  Clock,
  Mic,
  Users2,
  CheckCircle2,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import * as api from "@/lib/api";
import { TabHeading } from "./shared";
import { SettingsCard } from "@/components/ui/controls";
import type { MeetingAnalytics } from "@/lib/types";

export function AnalyticsTab() {
  const { data: analytics } = useQuery<MeetingAnalytics>({
    queryKey: api.qk.analytics(),
    queryFn: api.getMeetingAnalytics,
  });

  const totalHours = ((analytics?.total_minutes ?? 0) / 60).toFixed(1);
  const thisWeekHours = ((analytics?.this_week_minutes ?? 0) / 60).toFixed(1);

  const weekDiff = (analytics?.this_week_minutes ?? 0) - (analytics?.last_week_minutes ?? 0);
  const weekTrend = weekDiff >= 0 ? `+${(weekDiff / 60).toFixed(1)}h` : `${(weekDiff / 60).toFixed(1)}h`;

  const totalCommitments = (analytics?.open_commitments ?? 0) + (analytics?.completed_commitments ?? 0);
  const completionRate =
    totalCommitments > 0
      ? Math.round(((analytics?.completed_commitments ?? 0) / totalCommitments) * 100)
      : 100;

  const mePct = Math.round(analytics?.talk_time_me_pct ?? 40);
  const othersPct = Math.round(analytics?.talk_time_others_pct ?? 60);

  const maxDayMinutes = Math.max(1, ...(analytics?.day_breakdown.map((d) => d.minutes) ?? [120]));

  return (
    <>
      <TabHeading
        title="Workspace Analytics"
        description="Meeting habits, talk-time ratio insights, and collaborator intelligence."
      />

      {/* Top Level Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <MetricCard
          label="Total Hours"
          value={`${totalHours}h`}
          subtext={`${analytics?.total_meetings ?? 0} meetings`}
          icon={<Clock className="size-4 text-accent" />}
        />
        <MetricCard
          label="This Week"
          value={`${thisWeekHours}h`}
          subtext={`${weekTrend} vs last week`}
          icon={<TrendingUp className="size-4 text-emerald-400" />}
        />
        <MetricCard
          label="Talk-Time Me"
          value={`${mePct}%`}
          subtext={`${othersPct}% attendees`}
          icon={<Mic className="size-4 text-accent" />}
        />
        <MetricCard
          label="Loop Clearance"
          value={`${completionRate}%`}
          subtext={`${analytics?.open_commitments ?? 0} open loops`}
          icon={<CheckCircle2 className="size-4 text-blue-400" />}
        />
      </div>

      {/* Talk-Time Ratio Card */}
      <SettingsCard title="Talk-Time Ratio (Me vs Attendees)">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="flex items-center gap-1.5 text-text font-medium">
              <span className="size-2 rounded-full bg-accent" />
              <span>Me (Microphone): {mePct}%</span>
            </span>
            <span className="flex items-center gap-1.5 text-muted font-medium">
              <span className="size-2 rounded-full bg-[#8b5cf6]" />
              <span>Attendees (System): {othersPct}%</span>
            </span>
          </div>

          {/* Ratio bar */}
          <div className="relative h-3 w-full overflow-hidden rounded-full bg-surface-2 flex">
            <div
              style={{ width: `${mePct}%` }}
              className="h-full bg-accent transition-all duration-500 ease-out"
              title={`Me: ${mePct}%`}
            />
            <div
              style={{ width: `${othersPct}%` }}
              className="h-full bg-[#8b5cf6] transition-all duration-500 ease-out"
              title={`Attendees: ${othersPct}%`}
            />
          </div>

          <div className="flex items-start gap-2 rounded-xl border border-border/60 bg-surface-2/40 p-3 text-[12px] text-muted">
            <Sparkles className="size-4 text-accent shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {mePct < 30
                ? "High listener ratio. You predominantly listen and take structured notes during calls."
                : mePct > 60
                  ? "High speaker ratio. Consider opening up more conversational floor for cross-functional attendees."
                  : "Balanced collaborative participation. Your talk-time aligns with optimal meeting productivity patterns."}
            </p>
          </div>
        </div>
      </SettingsCard>

      {/* Weekly Meeting Hours Breakdown */}
      <SettingsCard title="Weekly Meeting Cadence">
        <div className="p-4 space-y-3">
          <div className="flex items-end justify-between gap-2 h-32 pt-4 pb-2 border-b border-border/40">
            {(analytics?.day_breakdown ?? []).map((day) => {
              const heightPct = Math.max(12, Math.round((day.minutes / maxDayMinutes) * 100));
              return (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[28px] rounded-t-md bg-accent/80 hover:bg-accent transition-all cursor-pointer relative group"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-surface-1 border border-border px-1.5 py-0.5 rounded text-[10px] font-mono text-text whitespace-nowrap shadow-md pointer-events-none z-10">
                      {day.minutes} min
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-subtle">{day.day}</span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-[11px] text-muted pt-1">
            <span>Average: {((analytics?.this_week_minutes ?? 0) / 7).toFixed(0)} min / day</span>
            <span>Last 7 Days</span>
          </div>
        </div>
      </SettingsCard>

      {/* Top Collaborators */}
      <SettingsCard title="Top Collaborators">
        <div className="divide-y divide-border/40">
          {(analytics?.top_collaborators ?? []).length === 0 ? (
            <div className="p-4 text-xs text-muted">No attendees recorded yet.</div>
          ) : (
            (analytics?.top_collaborators ?? []).map((collab, idx) => (
              <div key={collab.name + idx} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="grid size-8 place-items-center rounded-full bg-surface-2 border border-border/60 text-xs font-semibold text-text">
                    {collab.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-[13px] font-medium text-text">{collab.name}</div>
                    <div className="text-[11px] text-muted">
                      {collab.role || collab.company || "Collaborator"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs text-subtle bg-surface-2 px-2.5 py-1 rounded-md border border-border/50">
                  <Users2 className="size-3 text-accent" />
                  <span>{collab.meeting_count} meetings</span>
                </div>
              </div>
            ))
          )}
        </div>
      </SettingsCard>
    </>
  );
}

function MetricCard({
  label,
  value,
  subtext,
  icon,
}: {
  label: string;
  value: string;
  subtext: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-surface-1/90 p-3.5 shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-muted uppercase tracking-wider">{label}</span>
        {icon}
      </div>
      <div className="font-display text-2xl font-bold text-text tracking-tight">{value}</div>
      <div className="text-[11px] text-subtle font-mono truncate">{subtext}</div>
    </div>
  );
}