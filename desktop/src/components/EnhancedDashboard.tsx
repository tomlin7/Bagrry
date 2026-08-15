import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Calendar,
  CheckSquare,
  Clock,
  FileText,
  MessageSquare,
  Plus,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageFrame } from "@/components/EnhancedAppShell";
import * as api from "@/lib/api";
import { useAppStore } from "@/store/app";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

export function EnhancedDashboard() {
  const setPage = useAppStore((s) => s.setPage);
  const meetings = useQuery({
    queryKey: ["meetings", null],
    queryFn: () => api.listMeetings(null),
  });

  const actions = useQuery({
    queryKey: ["actions"],
    queryFn: api.listActionItems,
  });

  const stats = {
    totalMeetings: meetings.data?.length || 0,
    todayMeetings: 0, // TODO: Calculate from API
    pendingActions: actions.data?.length || 0,
    completedThisWeek: 0, // TODO: Calculate from API
  };

  const recentMeetings = meetings.data?.slice(0, 6) || [];
  const upcomingActions = actions.data?.slice(0, 4) || [];

  return (
    <PageFrame
      title="Good morning"
      subtitle="Here's what's happening with your meetings and notes today."
      actions={
        <motion.div variants={itemVariants}>
          <Button onClick={() => setPage("notes")} className="gap-2">
            <Plus className="h-4 w-4" />
            New Meeting
          </Button>
        </motion.div>
      }
    >
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
        {/* Stats Grid */}
        <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            icon={<FileText className="h-5 w-5" />}
            value={stats.totalMeetings.toString()}
            subtitle="Total meetings"
            trend="+12%"
          />
          <StatsCard
            icon={<Calendar className="h-5 w-5" />}
            value={stats.todayMeetings.toString()}
            subtitle="Today's meetings"
          />
          <StatsCard
            icon={<CheckSquare className="h-5 w-5" />}
            value={stats.pendingActions.toString()}
            subtitle="Action items"
            trend="-3"
          />
          <StatsCard
            icon={<TrendingUp className="h-5 w-5" />}
            value={stats.completedThisWeek.toString()}
            subtitle="Completed this week"
            trend="+8"
          />
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Recent Meetings */}
          <motion.div variants={itemVariants} className="lg:col-span-2">
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">Recent Meetings</h2>
                <Button variant="ghost" size="sm" onClick={() => setPage("notes")}>
                  View all
                </Button>
              </div>
              <div className="space-y-3">
                {recentMeetings.length > 0 ? (
                  recentMeetings.map((meeting, index) => (
                    <motion.div
                      key={meeting.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-accent"
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-muted">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate font-medium">{meeting.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(meeting.date).toLocaleDateString()}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        Open
                      </Button>
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <FileText className="mb-2 h-8 w-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No meetings yet</p>
                    <Button variant="ghost" size="sm" className="mt-2" onClick={() => setPage("notes")}>
                      Create your first meeting
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Coming Up & Action Items */}
          <motion.div variants={itemVariants} className="space-y-6">
            {/* Coming Up */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Coming Up</h3>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    Today, 2:00 PM
                  </div>
                  <p className="mt-1 font-medium">Team Standup</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Tomorrow, 10:00 AM
                  </div>
                  <p className="mt-1 font-medium">Client Review</p>
                </div>
              </div>
            </div>

            {/* Action Items */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Action Items</h3>
                <Button variant="ghost" size="sm" onClick={() => setPage("actions")}>
                  View all
                </Button>
              </div>
              <div className="space-y-2">
                {upcomingActions.length > 0 ? (
                  upcomingActions.map((action, index) => (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="flex items-center gap-2 rounded-lg p-2 text-sm transition-colors hover:bg-accent"
                    >
                      <CheckSquare className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1 truncate">{action.task}</span>
                    </motion.div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No pending actions</p>
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <QuickActionCard
              icon={<Plus className="h-5 w-5" />}
              title="New Meeting"
              description="Start recording a new meeting"
              onClick={() => setPage("notes")}
            />
            <QuickActionCard
              icon={<MessageSquare className="h-5 w-5" />}
              title="Ask AI"
              description="Search across all meetings"
              onClick={() => setPage("search")}
            />
            <QuickActionCard
              icon={<Users className="h-5 w-5" />}
              title="People"
              description="Manage contacts and attendees"
              onClick={() => setPage("people")}
            />
            <QuickActionCard
              icon={<Zap className="h-5 w-5" />}
              title="Templates"
              description="Use meeting templates"
              onClick={() => setPage("templates")}
            />
          </div>
        </motion.div>
      </motion.div>
    </PageFrame>
  );
}

function StatsCard({
  icon,
  value,
  subtitle,
  trend,
}: {
  icon: React.ReactNode;
  value: string;
  subtitle: string;
  trend?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md hover-lift">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
        </div>
        {trend && (
          <span
            className={cn(
              "text-xs font-medium",
              trend.startsWith("+") ? "text-green-600" : trend.startsWith("-") ? "text-red-600" : "text-muted-foreground",
            )}
          >
            {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

function QuickActionCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group rounded-xl border border-border bg-card p-6 text-left shadow-sm transition-all hover:shadow-md hover-lift focus-ring"
    >
      <div className="mb-3 inline-flex rounded-lg bg-primary/10 p-2 text-primary transition-colors group-hover:bg-primary/20">
        {icon}
      </div>
      <h3 className="font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </button>
  );
}