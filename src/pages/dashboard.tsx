import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { motion } from "framer-motion";
import {
  Ticket,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  Plus,
  Sparkles,
  Activity,
  Target,
  Users,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/stats-card";
import { TicketCard } from "@/components/ticket-card";
import { EmptyState } from "@/components/empty-state";
import { DashboardSkeleton, TicketCardSkeleton } from "@/components/loading-skeleton";
import { AIInsightsCompact, AIInsightsPanel } from "@/components/ai-insights-panel";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, AreaChart, Area } from "recharts";
import type { Ticket as TicketType } from "@shared/schema";
import { cn } from "@/lib/utils";

interface DashboardStats {
  totalOpen: number;
  totalNew: number;
  resolvedToday: number;
  slaBreached: number;
  avgResolutionHours: number;
  byStatus: { name: string; value: number; color: string }[];
  byPriority: { name: string; value: number; color: string }[];
  byCategory: { name: string; count: number }[];
}

const statusColors: Record<string, string> = {
  new: "hsl(210, 90%, 50%)",
  assigned: "hsl(260, 85%, 55%)",
  in_progress: "hsl(45, 100%, 50%)",
  pending_customer: "hsl(30, 100%, 50%)",
  resolved: "hsl(160, 75%, 40%)",
  closed: "hsl(220, 15%, 55%)",
  reopened: "hsl(0, 85%, 55%)",
};

const priorityColors: Record<string, string> = {
  critical: "hsl(0, 85%, 55%)",
  high: "hsl(30, 100%, 50%)",
  medium: "hsl(45, 100%, 50%)",
  low: "hsl(160, 75%, 45%)",
};

// Mock trend data for sparklines
const trendData = [
  { value: 30 },
  { value: 45 },
  { value: 35 },
  { value: 50 },
  { value: 42 },
  { value: 58 },
  { value: 52 },
];

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: recentTickets, isLoading: ticketsLoading } = useQuery<TicketType[]>({
    queryKey: ["/api/tickets", { limit: 5, sort: "createdAt", order: "desc" }],
  });

  const { data: urgentTickets, isLoading: urgentLoading } = useQuery<TicketType[]>({
    queryKey: ["/api/tickets", { priority: "critical,high", status: "new,assigned,in_progress", limit: 5 }],
  });

  if (statsLoading) {
    return <DashboardSkeleton />;
  }

  const displayStats: DashboardStats = {
    totalOpen: stats?.totalOpen ?? 0,
    totalNew: stats?.totalNew ?? 0,
    resolvedToday: stats?.resolvedToday ?? 0,
    slaBreached: stats?.slaBreached ?? 0,
    avgResolutionHours: stats?.avgResolutionHours ?? 0,
    byStatus: stats?.byStatus ?? [],
    byPriority: stats?.byPriority ?? [],
    byCategory: stats?.byCategory ?? [],
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4 flex-wrap"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold gradient-text-accent">Dashboard</h1>
              <p className="text-sm text-muted-foreground">
                Real-time ticket activity and performance metrics
              </p>
            </div>
          </div>
        </div>
        <Button 
          asChild 
          className="h-11 px-6 rounded-xl bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-primary-foreground shadow-lg shadow-primary/25" 
        >
          <Link href="/tickets/new">
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Link>
        </Button>
      </motion.div>

      {/* AI Insights Compact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
      >
        <AIInsightsCompact />
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
      >
        {[
          { title: "Open Tickets", value: displayStats.totalOpen, subtitle: "Across all studios", icon: Ticket, color: "from-blue-500 to-cyan-500", trend: 5 },
          { title: "New Today", value: displayStats.totalNew, subtitle: "Awaiting assignment", icon: Clock, color: "from-amber-500 to-orange-500", trend: -3 },
          { title: "Resolved Today", value: displayStats.resolvedToday, subtitle: "Successfully closed", icon: CheckCircle, color: "from-emerald-500 to-teal-500", trend: 12 },
          { title: "SLA Breached", value: displayStats.slaBreached, subtitle: "Requires attention", icon: AlertTriangle, color: "from-red-500 to-rose-500", trend: -8, warning: displayStats.slaBreached > 0 },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 + index * 0.05 }}
            >
              <Card className={cn(
                "glass-card relative overflow-hidden group hover:shadow-xl transition-all duration-300",
                stat.warning && "ring-2 ring-destructive/30"
              )}>
                <div className={cn(
                  "absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br opacity-10 -translate-y-1/2 translate-x-1/2 group-hover:opacity-20 transition-opacity",
                  stat.color
                )} />
                <CardContent className="pt-6 relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center bg-gradient-to-br shadow-lg",
                      stat.color
                    )}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="h-12 w-20">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData}>
                          <defs>
                            <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="hsl(var(--primary))"
                            fill={`url(#gradient-${index})`}
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-3xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.title}</p>
                    </div>
                    <div className={cn(
                      "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg",
                      stat.trend > 0 ? "text-emerald-600 bg-emerald-500/10" : "text-red-600 bg-red-500/10"
                    )}>
                      {stat.trend > 0 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {Math.abs(stat.trend)}%
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tickets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2"
        >
          <Card className="glass-card h-full">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Ticket className="h-4 w-4 text-primary" />
                </div>
                Recent Tickets
              </CardTitle>
              <Button variant="ghost" size="sm" asChild className="rounded-lg hover:bg-primary/10">
                <Link href="/tickets" className="flex items-center gap-1 text-primary">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticketsLoading ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <TicketCardSkeleton key={i} />
                  ))}
                </>
              ) : recentTickets && recentTickets.length > 0 ? (
                recentTickets.map((ticket, index) => (
                  <motion.div 
                    key={ticket.id} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <TicketCard ticket={ticket} />
                  </motion.div>
                ))
              ) : (
                <EmptyState
                  icon={Ticket}
                  title="No tickets yet"
                  description="Create your first ticket to get started"
                  action={{
                    label: "Create Ticket",
                    onClick: () => window.location.href = "/tickets/new",
                  }}
                />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Status & Priority Charts */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-primary" />
                  </div>
                  By Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {displayStats.byStatus.length > 0 ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={displayStats.byStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {displayStats.byStatus.map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.color || statusColors[entry.name] || "#6b7280"} 
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            background: 'hsl(var(--popover))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '12px',
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-sm text-muted-foreground">
                    No data available
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {displayStats.byStatus.slice(0, 6).map((item) => (
                    <div key={item.name} className="flex items-center gap-2 text-xs group cursor-default">
                      <div
                        className="h-2.5 w-2.5 rounded-full ring-2 ring-offset-2 ring-offset-card transition-transform group-hover:scale-125"
                        style={{ 
                          backgroundColor: item.color || statusColors[item.name] || "#6b7280",
                          ringColor: item.color || statusColors[item.name] || "#6b7280"
                        }}
                      />
                      <span className="text-muted-foreground capitalize truncate">{item.name.replace("_", " ")}</span>
                      <span className="font-semibold ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="glass-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Target className="h-4 w-4 text-primary" />
                  </div>
                  By Priority
                </CardTitle>
              </CardHeader>
              <CardContent>
                {displayStats.byPriority.length > 0 ? (
                  <div className="space-y-3">
                    {displayStats.byPriority.map((item, index) => (
                      <motion.div 
                        key={item.name} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                        className="flex items-center gap-3 group"
                      >
                        <div
                          className="h-3 w-3 rounded-full ring-2 ring-offset-2 ring-offset-card transition-transform group-hover:scale-125"
                          style={{ 
                            backgroundColor: item.color || priorityColors[item.name] || "#6b7280",
                            ringColor: item.color || priorityColors[item.name] || "#6b7280"
                          }}
                        />
                        <span className="text-sm capitalize flex-1">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min((item.value / Math.max(...displayStats.byPriority.map(p => p.value))) * 100, 100)}%` }}
                              transition={{ delay: 0.4, duration: 0.5 }}
                              className="h-full rounded-full"
                              style={{ 
                                backgroundColor: item.color || priorityColors[item.name] || "#6b7280"
                              }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-6 text-right">{item.value}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Tickets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <Card className="glass-card">
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10">
                  <AlertTriangle className="h-4 w-4 text-orange-500 animate-pulse" />
                </div>
                Urgent Tickets
              </CardTitle>
              {urgentTickets && urgentTickets.length > 0 && (
                <Badge variant="destructive" className="rounded-lg">
                  {urgentTickets.length} pending
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {urgentLoading ? (
                <>
                  {[1, 2].map((i) => (
                    <TicketCardSkeleton key={i} />
                  ))}
                </>
              ) : urgentTickets && urgentTickets.length > 0 ? (
                urgentTickets.map((ticket, index) => (
                  <motion.div 
                    key={ticket.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <TicketCard ticket={ticket} />
                  </motion.div>
                ))
              ) : (
                <div className="py-8 text-center">
                  <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 mb-4">
                    <CheckCircle className="h-8 w-8 text-emerald-500" />
                  </div>
                  <p className="text-sm font-medium text-foreground">All clear!</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    No urgent tickets requiring attention
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Top Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                Top Categories
              </CardTitle>
            </CardHeader>
            <CardContent>
              {displayStats.byCategory.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={displayStats.byCategory.slice(0, 5)} layout="vertical">
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={120}
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'hsl(var(--popover))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                        }}
                      />
                      <Bar 
                        dataKey="count" 
                        fill="hsl(var(--primary))" 
                        radius={[0, 8, 8, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
                  No category data available
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
