import { useQuery } from "@tanstack/react-query";
import { Activity, Clock, Smile, Zap } from "lucide-react";
import * as api from "@/lib/api";
import { formatDuration } from "@/lib/format";
import { Badge } from "@/components/ui/misc";

export function BehavioralAnalyticsCard({ meetingId }: { meetingId: string }) {
  const { data: analytics, isLoading } = useQuery({
    queryKey: api.qk.behavioralAnalytics(meetingId),
    queryFn: () => api.getBehavioralAnalytics(meetingId),
  });

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5 text-center text-xs text-subtle">
        Analyzing speaker dynamics and sentiment...
      </div>
    );
  }

  if (!analytics) return null;

  const youRatio = analytics.talk_ratios.find((r) => r.speaker === "You")?.percentage ?? 50;
  const attendeesRatio = 100 - youRatio;

  const positiveTurns = analytics.sentiment_timeline.filter((p) => p.sentiment === "positive").length;
  const skepticalTurns = analytics.sentiment_timeline.filter((p) => p.sentiment === "skeptical").length;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-accent" />
          <h3 className="text-sm font-semibold tracking-tight text-text">
            Speaker Dynamics & Behavioral Intelligence
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-subtle">Engagement:</span>
          <Badge tone="success">{analytics.overall_engagement_score.toFixed(0)}% Score</Badge>
        </div>
      </div>

      {/* Talk-to-Listen Ratio Bar */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-medium text-text">
            You: <span className="font-semibold text-accent">{youRatio}%</span>
          </span>
          <span className="font-medium text-subtle">
            Attendees: <span className="font-semibold text-text">{attendeesRatio}%</span>
          </span>
        </div>
        <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-surface-2 border border-border/60">
          <div
            className="bg-accent transition-all duration-500"
            style={{ width: `${youRatio}%` }}
          />
          <div
            className="bg-border-strong transition-all duration-500"
            style={{ width: `${attendeesRatio}%` }}
          />
        </div>
      </div>

      {/* Metric Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <div className="rounded-xl border border-border/70 bg-surface-2 p-3">
          <div className="flex items-center gap-1.5 text-[11px] text-subtle mb-1">
            <Clock className="size-3 text-subtle" />
            <span>Longest Monologue</span>
          </div>
          <div className="text-sm font-semibold text-text">
            {formatDuration(analytics.longest_monologue_ms)}
          </div>
          <span className="text-[10px] text-subtle font-mono">By {analytics.longest_monologue_speaker}</span>
        </div>

        <div className="rounded-xl border border-border/70 bg-surface-2 p-3">
          <div className="flex items-center gap-1.5 text-[11px] text-subtle mb-1">
            <Zap className="size-3 text-warning" />
            <span>Pacing & Turns</span>
          </div>
          <div className="text-sm font-semibold text-text">
            {analytics.interruption_count} speaker transitions
          </div>
          <span className="text-[10px] text-subtle font-mono">Active dialogue flow</span>
        </div>

        <div className="rounded-xl border border-border/70 bg-surface-2 p-3 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1.5 text-[11px] text-subtle mb-1">
            <Smile className="size-3 text-success" />
            <span>Sentiment Signals</span>
          </div>
          <div className="text-sm font-semibold text-text flex items-center gap-2">
            <span className="text-success">+{positiveTurns}</span>
            <span className="text-subtle">/</span>
            <span className="text-danger">-{skepticalTurns}</span>
          </div>
          <span className="text-[10px] text-subtle font-mono">Positive vs Objections</span>
        </div>
      </div>

      {/* Key Sentiment Quotes */}
      {analytics.sentiment_timeline.length > 0 && (
        <div>
          <label className="text-[11px] font-semibold text-subtle uppercase tracking-wider mb-1.5 block">
            Notable Sentiment Moments
          </label>
          <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1 scrollbar-none">
            {analytics.sentiment_timeline
              .filter((p) => p.sentiment !== "neutral")
              .slice(0, 4)
              .map((point, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 rounded-lg border border-border/60 bg-surface-2/60 p-2 text-xs"
                >
                  <span
                    className={`mt-0.5 size-2 shrink-0 rounded-full ${
                      point.sentiment === "positive"
                        ? "bg-success"
                        : point.sentiment === "skeptical"
                        ? "bg-danger"
                        : "bg-warning"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-[10px] text-subtle font-mono">
                      <span>{point.speaker}</span>
                      <span>{formatDuration(point.timestamp_ms)}</span>
                    </div>
                    <p className="mt-0.5 italic text-text-muted truncate">"{point.text}"</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
