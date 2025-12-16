import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Users,
  Building2,
  Download,
  Filter,
  Calendar,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Scatter,
} from "recharts";
import { STUDIOS } from "@/lib/constants";
import { ExportDialog } from "@/components/export-dialog";
import { AIInsightsPanel } from "@/components/ai-insights-panel";
import { cn } from "@/lib/utils";

interface AnalyticsData {
  overview: {
    totalTickets: number;
    openTickets: number;
    resolvedThisMonth: number;
    avgResolutionTime: number;
    slaComplianceRate: number;
    customerSatisfaction: number;
  };
  trends: {
    date: string;
    created: number;
    resolved: number;
  }[];
  byCategory: {
    name: string;
    count: number;
    percentage: number;
  }[];
  byStudio: {
    name: string;
    open: number;
    resolved: number;
  }[];
  byPriority: {
    name: string;
    value: number;
    color: string;
  }[];
  teamPerformance: {
    team: string;
    ticketsHandled: number;
    avgResolutionTime: number;
    slaCompliance: number;
  }[];
  resolutionTimes: {
    range: string;
    count: number;
  }[];
}

const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const generateMockData = (): AnalyticsData => ({
  overview: {
    totalTickets: 1247,
    openTickets: 89,
    resolvedThisMonth: 342,
    avgResolutionTime: 4.2,
    slaComplianceRate: 94,
    customerSatisfaction: 4.6,
  },
  trends: [
    { date: "Week 1", created: 45, resolved: 38 },
    { date: "Week 2", created: 52, resolved: 48 },
    { date: "Week 3", created: 38, resolved: 42 },
    { date: "Week 4", created: 61, resolved: 55 },
  ],
  byCategory: [
    { name: "Booking & Tech", count: 245, percentage: 28 },
    { name: "Customer Service", count: 189, percentage: 22 },
    { name: "Health & Safety", count: 156, percentage: 18 },
    { name: "Instructor", count: 134, percentage: 15 },
    { name: "Retail", count: 87, percentage: 10 },
    { name: "Other", count: 61, percentage: 7 },
  ],
  byStudio: [
    { name: "Kwality House", open: 24, resolved: 156 },
    { name: "Supreme HQ", open: 18, resolved: 134 },
    { name: "WeWork Prestige", open: 15, resolved: 98 },
    { name: "Kenkre House", open: 12, resolved: 87 },
    { name: "SUFC", open: 8, resolved: 65 },
  ],
  byPriority: [
    { name: "Critical", value: 12, color: "hsl(0, 85%, 55%)" },
    { name: "High", value: 45, color: "hsl(30, 100%, 50%)" },
    { name: "Medium", value: 234, color: "hsl(45, 100%, 50%)" },
    { name: "Low", value: 156, color: "hsl(160, 75%, 45%)" },
  ],
  teamPerformance: [
    { team: "Operations", ticketsHandled: 245, avgResolutionTime: 3.8, slaCompliance: 96 },
    { team: "Client Success", ticketsHandled: 189, avgResolutionTime: 2.4, slaCompliance: 98 },
    { team: "Facilities", ticketsHandled: 134, avgResolutionTime: 5.2, slaCompliance: 91 },
    { team: "Training", ticketsHandled: 87, avgResolutionTime: 4.1, slaCompliance: 94 },
    { team: "IT Support", ticketsHandled: 76, avgResolutionTime: 3.5, slaCompliance: 95 },
  ],
  resolutionTimes: [
    { range: "<1h", count: 45 },
    { range: "1-4h", count: 123 },
    { range: "4-8h", count: 89 },
    { range: "8-24h", count: 67 },
    { range: "24-48h", count: 34 },
    { range: ">48h", count: 12 },
  ],
});

export default function Analytics() {
  const [timeRange, setTimeRange] = useState("30d");
  const [studioFilter, setStudioFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("overview");

  const { data: analytics, isLoading, refetch } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics", { timeRange, studio: studioFilter }],
  });

  const data = analytics || generateMockData();

  if (isLoading) {
    return <AnalyticsSkeleton />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text-accent">Analytics & Reports</h1>
              <p className="text-sm text-muted-foreground">
                Comprehensive performance metrics and insights
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36 rounded-xl">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Time range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
            </SelectContent>
          </Select>

          <Select value={studioFilter} onValueChange={setStudioFilter}>
            <SelectTrigger className="w-48 rounded-xl">
              <Building2 className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All studios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Studios</SelectItem>
              {STUDIOS.map((studio) => (
                <SelectItem key={studio.id} value={studio.id}>
                  {studio.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <ExportDialog data={data.teamPerformance} filename="analytics_report" title="Export Analytics">
            <Button variant="outline" className="rounded-xl">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </ExportDialog>

          <Button variant="ghost" size="icon" onClick={() => refetch()} className="rounded-xl">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4"
      >
        {[
          { title: "Total Tickets", value: data.overview.totalTickets, icon: BarChart3, trend: 12, color: "from-blue-500 to-cyan-500" },
          { title: "Open Tickets", value: data.overview.openTickets, icon: Clock, trend: -5, color: "from-amber-500 to-orange-500" },
          { title: "Resolved (Month)", value: data.overview.resolvedThisMonth, icon: CheckCircle, trend: 8, color: "from-emerald-500 to-teal-500" },
          { title: "Avg Resolution", value: `${data.overview.avgResolutionTime}h`, icon: Target, trend: -15, trendPositive: true, color: "from-purple-500 to-pink-500" },
          { title: "SLA Compliance", value: `${data.overview.slaComplianceRate}%`, icon: CheckCircle, trend: 3, color: "from-green-500 to-emerald-500" },
          { title: "Satisfaction", value: `${data.overview.customerSatisfaction}/5`, icon: Users, trend: 2, color: "from-indigo-500 to-violet-500" },
        ].map((metric, index) => {
          const Icon = metric.icon;
          const isPositive = metric.trendPositive !== undefined ? metric.trendPositive : metric.trend > 0;
          return (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="glass-card relative overflow-hidden group hover:shadow-lg transition-all">
                <div className={cn(
                  "absolute top-0 right-0 w-24 h-24 rounded-full bg-gradient-to-br opacity-10 -translate-y-1/2 translate-x-1/2 group-hover:opacity-20 transition-opacity",
                  metric.color
                )} />
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <div className={cn(
                      "h-9 w-9 rounded-xl flex items-center justify-center bg-gradient-to-br",
                      metric.color
                    )}>
                      <Icon className="h-4 w-4 text-white" />
                    </div>
                    <div className={cn(
                      "flex items-center gap-1 text-xs font-medium",
                      isPositive ? "text-emerald-500" : "text-red-500"
                    )}>
                      {isPositive ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {Math.abs(metric.trend)}%
                    </div>
                  </div>
                  <p className="text-2xl font-bold">{metric.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{metric.title}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="distribution" className="gap-2">
            <PieChartIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Distribution</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2">
            <Sparkles className="h-4 w-4" />
            <span className="hidden sm:inline">AI Insights</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Ticket Trends
                </CardTitle>
                <CardDescription>Created vs Resolved over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.trends}>
                      <defs>
                        <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                        }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="created"
                        name="Created"
                        stroke="hsl(var(--chart-1))"
                        fill="url(#colorCreated)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="resolved"
                        name="Resolved"
                        stroke="hsl(var(--chart-2))"
                        fill="url(#colorResolved)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  By Category
                </CardTitle>
                <CardDescription>Ticket distribution across categories</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.byCategory} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={100}
                        tick={{ fontSize: 11 }}
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
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">By Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.byPriority}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {data.byPriority.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
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
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {data.byPriority.map((item) => (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-muted-foreground">{item.name}</span>
                      <span className="font-semibold ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  By Studio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.byStudio}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="open" name="Open" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="resolved" name="Resolved" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Team Performance
                    </CardTitle>
                    <CardDescription>Metrics by team</CardDescription>
                  </div>
                  <ExportDialog data={data.teamPerformance} filename="team_performance">
                    <Button variant="ghost" size="sm" className="rounded-lg">
                      <Download className="h-4 w-4" />
                    </Button>
                  </ExportDialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-3 px-2 font-medium">Team</th>
                        <th className="text-right py-3 px-2 font-medium">Tickets</th>
                        <th className="text-right py-3 px-2 font-medium">Avg Time</th>
                        <th className="text-right py-3 px-2 font-medium">SLA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.teamPerformance.map((team, index) => (
                        <motion.tr
                          key={team.team}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-border/30 hover:bg-muted/30 transition-colors"
                        >
                          <td className="py-3 px-2 font-medium">{team.team}</td>
                          <td className="py-3 px-2 text-right">{team.ticketsHandled}</td>
                          <td className="py-3 px-2 text-right">{team.avgResolutionTime}h</td>
                          <td className="py-3 px-2 text-right">
                            <Badge
                              variant={
                                team.slaCompliance >= 95
                                  ? "default"
                                  : team.slaCompliance >= 85
                                    ? "secondary"
                                    : "destructive"
                              }
                              className="rounded-lg"
                            >
                              {team.slaCompliance}%
                            </Badge>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Resolution Time Distribution
                </CardTitle>
                <CardDescription>How quickly tickets are resolved</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.resolutionTimes}>
                      <XAxis dataKey="range" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                        }}
                      />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Team Radar Analysis
              </CardTitle>
              <CardDescription>Comparative performance across metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={data.teamPerformance.map(t => ({
                    team: t.team,
                    volume: t.ticketsHandled / 3,
                    speed: 100 - (t.avgResolutionTime * 10),
                    compliance: t.slaCompliance,
                  }))}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis dataKey="team" tick={{ fontSize: 11 }} />
                    <PolarRadiusAxis tick={{ fontSize: 10 }} />
                    <Radar name="Volume" dataKey="volume" stroke="hsl(var(--chart-1))" fill="hsl(var(--chart-1))" fillOpacity={0.3} />
                    <Radar name="Speed" dataKey="speed" stroke="hsl(var(--chart-2))" fill="hsl(var(--chart-2))" fillOpacity={0.3} />
                    <Radar name="SLA" dataKey="compliance" stroke="hsl(var(--chart-3))" fill="hsl(var(--chart-3))" fillOpacity={0.3} />
                    <Legend />
                    <Tooltip
                      contentStyle={{
                        background: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '12px',
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Distribution Tab */}
        <TabsContent value="distribution" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Category Breakdown</CardTitle>
                <CardDescription>Percentage distribution by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.byCategory.map((cat, index) => (
                    <motion.div
                      key={cat.name}
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "100%" }}
                      transition={{ delay: index * 0.1 }}
                      className="space-y-2"
                    >
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{cat.name}</span>
                        <span className="text-muted-foreground">{cat.count} ({cat.percentage}%)</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${cat.percentage}%` }}
                          transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Studio Comparison</CardTitle>
                <CardDescription>Open vs resolved by location</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.byStudio}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '12px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="resolved" name="Resolved" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="open" name="Open" stroke="hsl(var(--chart-3))" strokeWidth={3} dot={{ fill: "hsl(var(--chart-3))", strokeWidth: 2 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AIInsightsPanel />
            </div>
            <div className="space-y-6">
              <Card className="glass-card">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { label: "First Response Time", value: "1.2h", target: "< 2h", status: "good" },
                    { label: "Resolution Rate", value: "94%", target: "> 90%", status: "good" },
                    { label: "Customer Effort Score", value: "2.3", target: "< 3", status: "good" },
                    { label: "Reopened Tickets", value: "6%", target: "< 5%", status: "warning" },
                  ].map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{stat.label}</p>
                        <p className="text-xs text-muted-foreground">Target: {stat.target}</p>
                      </div>
                      <Badge variant={stat.status === "good" ? "default" : "secondary"}>
                        {stat.value}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <Skeleton className="h-9 w-9 rounded-xl mb-2" />
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><CardContent className="pt-6"><Skeleton className="h-80 w-full" /></CardContent></Card>
        <Card><CardContent className="pt-6"><Skeleton className="h-80 w-full" /></CardContent></Card>
      </div>
    </div>
  );
}
