import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import {
  Search,
  Plus,
  Filter,
  Download,
  ChevronDown,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { TicketCard } from "@/components/ticket-card";
import { EmptyState } from "@/components/empty-state";
import { TicketCardSkeleton } from "@/components/loading-skeleton";
import { PriorityBadge } from "@/components/priority-badge";
import { StatusBadge } from "@/components/status-badge";
import { CATEGORIES, STUDIOS, STATUSES, PRIORITIES } from "@/lib/constants";
import type { Ticket } from "@shared/schema";

export default function Tickets() {
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [studioFilter, setStudioFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");

  const { data: tickets, isLoading } = useQuery<Ticket[]>({
    queryKey: ["/api/tickets", { 
      search: searchQuery || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      priority: priorityFilter !== "all" ? priorityFilter : undefined,
      category: categoryFilter !== "all" ? categoryFilter : undefined,
      studio: studioFilter !== "all" ? studioFilter : undefined,
    }],
  });

  const activeFiltersCount = [statusFilter, priorityFilter, categoryFilter, studioFilter]
    .filter(f => f !== "all").length;

  const clearFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setCategoryFilter("all");
    setStudioFilter("all");
    setSearchQuery("");
  };

  const toggleTicketSelection = (id: string) => {
    const newSelected = new Set(selectedTickets);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedTickets(newSelected);
  };

  const selectAllTickets = () => {
    if (tickets) {
      if (selectedTickets.size === tickets.length) {
        setSelectedTickets(new Set());
      } else {
        setSelectedTickets(new Set(tickets.map(t => t.id)));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-700 to-purple-600 dark:from-purple-400 dark:to-purple-300 bg-clip-text text-transparent">All Tickets</h1>
          <p className="text-base text-slate-600 dark:text-slate-400">
            Manage and track customer feedback and issues
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-purple-300 dark:hover:border-purple-600" data-testid="button-export">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button asChild className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 dark:from-purple-500 dark:to-purple-600 dark:hover:from-purple-600 dark:hover:to-purple-700 shadow-lg hover:shadow-xl transition-all text-white font-semibold" data-testid="button-new-ticket">
            <Link href="/tickets/new">
              <Plus className="h-4 w-4 mr-2" />
              New Ticket
            </Link>
          </Button>
        </div>
      </div>

      <Card className="border-0 bg-white dark:from-slate-900 dark:to-slate-800 shadow-lg relative overflow-hidden">
        {/* Glossy shine */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
        <CardContent className="p-5 relative z-10">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets by number, title, or customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-tickets"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                data-testid="button-toggle-filters"
              >
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </div>

            {showFilters && (
              <div className="flex flex-wrap items-center gap-3 pt-2 border-t">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40" data-testid="select-status">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.entries(STATUSES).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-36" data-testid="select-priority">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    {Object.entries(PRIORITIES).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        {config.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48" data-testid="select-category">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.id} value={cat.name}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={studioFilter} onValueChange={setStudioFilter}>
                  <SelectTrigger className="w-48" data-testid="select-studio">
                    <SelectValue placeholder="Studio" />
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

                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    data-testid="button-clear-filters"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear all
                  </Button>
                )}
              </div>
            )}

            {activeFiltersCount > 0 && !showFilters && (
              <div className="flex flex-wrap items-center gap-2">
                {statusFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Status: {STATUSES[statusFilter as keyof typeof STATUSES]?.label || statusFilter}
                    <button onClick={() => setStatusFilter("all")}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {priorityFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Priority: {PRIORITIES[priorityFilter as keyof typeof PRIORITIES]?.label || priorityFilter}
                    <button onClick={() => setPriorityFilter("all")}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {categoryFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Category: {categoryFilter}
                    <button onClick={() => setCategoryFilter("all")}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {studioFilter !== "all" && (
                  <Badge variant="secondary" className="gap-1">
                    Studio: {STUDIOS.find(s => s.id === studioFilter)?.name || studioFilter}
                    <button onClick={() => setStudioFilter("all")}>
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedTickets.size > 0 && (
        <Card className="border-primary">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium">
                {selectedTickets.size} ticket{selectedTickets.size !== 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Bulk Actions
                      <ChevronDown className="h-4 w-4 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Assign to Team</DropdownMenuItem>
                    <DropdownMenuItem>Change Status</DropdownMenuItem>
                    <DropdownMenuItem>Change Priority</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">Close Tickets</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTickets(new Set())}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {isLoading ? (
          <>
            {[1, 2, 3, 4, 5].map((i) => (
              <TicketCardSkeleton key={i} />
            ))}
          </>
        ) : tickets && tickets.length > 0 ? (
          tickets.map((ticket) => (
            <div key={ticket.id} className="flex items-start gap-3">
              <Checkbox
                checked={selectedTickets.has(ticket.id)}
                onCheckedChange={() => toggleTicketSelection(ticket.id)}
                className="mt-4"
                data-testid={`checkbox-ticket-${ticket.id}`}
              />
              <div className="flex-1">
                <TicketCard ticket={ticket} />
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            title="No tickets found"
            description={
              activeFiltersCount > 0 || searchQuery
                ? "Try adjusting your filters or search query"
                : "Create your first ticket to get started"
            }
            action={
              activeFiltersCount > 0 || searchQuery
                ? { label: "Clear Filters", onClick: clearFilters }
                : { label: "Create Ticket", onClick: () => navigate("/tickets/new") }
            }
          />
        )}
      </div>

      {tickets && tickets.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}</span>
        </div>
      )}
    </div>
  );
}
