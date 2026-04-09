"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Download,
  Filter,
  ChevronRight,
  Mail,
  Phone,
  Building2,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { LeadCardSkeleton, TableRowSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { getLeads } from "@/actions/leads";
import { formatDate, truncate } from "@/lib/utils";
import type { LeadWithTags, LeadStatus } from "@/types";

const STATUS_TABS: { value: LeadStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "reviewed", label: "Reviewed" },
  { value: "contacted", label: "Contacted" },
  { value: "qualified", label: "Qualified" },
  { value: "archived", label: "Archived" },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "name", label: "Name" },
  { value: "company", label: "Company" },
  { value: "status", label: "Status" },
];

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadWithTags[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<LeadStatus | "all">("all");
  const [sort, setSort] = useState("newest");
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    const result = await getLeads({ search, status, sort });
    if (result.error) {
      toast(result.error, "error");
    } else {
      setLeads(result.data as LeadWithTags[]);
    }
    setLoading(false);
  }, [search, status, sort, toast]);

  useEffect(() => {
    const timer = setTimeout(fetchLeads, 300);
    return () => clearTimeout(timer);
  }, [fetchLeads]);

  async function handleExport() {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status !== "all") params.set("status", status);
      if (sort) params.set("sort", sort);

      const res = await fetch(`/api/export?${params}`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bridgeleads-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Export downloaded!", "success");
    } catch {
      toast("Export failed", "error");
    }
    setExporting(false);
  }

  return (
    <AppShell>
      <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl font-bold">Leads</h1>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            loading={exporting}
            className="gap-2 w-fit"
          >
            <Download className="h-4 w-4" />
            Export Excel
          </Button>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-muted" />
              <input
                type="text"
                placeholder="Search leads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full h-[42px] rounded-lg border border-border bg-panel pl-10 pr-3 text-sm text-text placeholder:text-text-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="h-[42px] rounded-lg border border-border bg-panel px-3 text-sm text-text appearance-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatus(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  status === tab.value
                    ? "bg-brand-soft text-brand"
                    : "text-text-muted hover:text-text hover:bg-panel-2"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <>
            {/* Mobile skeletons */}
            <div className="space-y-2 md:hidden">
              {Array.from({ length: 3 }).map((_, i) => (
                <LeadCardSkeleton key={i} />
              ))}
            </div>
            {/* Desktop skeleton */}
            <table className="hidden md:table w-full">
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} />
                ))}
              </tbody>
            </table>
          </>
        )}

        {/* Empty state */}
        {!loading && leads.length === 0 && (
          <EmptyState
            title={search ? "No matching leads" : "No leads yet"}
            description={
              search
                ? "Try adjusting your search or filters"
                : "Scan a business card to create your first lead"
            }
            action={
              !search ? (
                <Link href="/scan">
                  <Button>Scan Card</Button>
                </Link>
              ) : undefined
            }
          />
        )}

        {/* Mobile cards */}
        {!loading && leads.length > 0 && (
          <div className="space-y-2 md:hidden">
            {leads.map((lead) => (
              <Link
                key={lead.id}
                href={`/leads/${lead.id}`}
                className="block p-4 rounded-2xl border border-border bg-panel hover:bg-panel-2 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">
                      {lead.full_name || "Unknown"}
                    </p>
                    {lead.job_title && (
                      <p className="text-xs text-text-muted truncate">
                        {lead.job_title}
                      </p>
                    )}
                  </div>
                  <StatusBadge status={lead.status} />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-muted">
                  {lead.company && (
                    <span className="flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {lead.company}
                    </span>
                  )}
                  {lead.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {truncate(lead.email, 24)}
                    </span>
                  )}
                  {lead.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {lead.phone}
                    </span>
                  )}
                </div>
                {lead.lead_tags?.length > 0 && (
                  <div className="mt-2 flex gap-1 flex-wrap">
                    {lead.lead_tags.map((tag) => (
                      <span
                        key={tag.id}
                        className="text-xs px-1.5 py-0.5 rounded bg-panel-2 text-text-muted border border-border"
                      >
                        {tag.tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Desktop table */}
        {!loading && leads.length > 0 && (
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-panel">
                  <th className="text-left p-3 font-medium text-text-muted">Name</th>
                  <th className="text-left p-3 font-medium text-text-muted">Company</th>
                  <th className="text-left p-3 font-medium text-text-muted">Email</th>
                  <th className="text-left p-3 font-medium text-text-muted">Phone</th>
                  <th className="text-left p-3 font-medium text-text-muted">Status</th>
                  <th className="text-left p-3 font-medium text-text-muted">Date</th>
                  <th className="p-3 w-8" />
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-border hover:bg-panel-2/50 transition-colors"
                  >
                    <td className="p-3">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="font-medium hover:text-brand transition-colors"
                      >
                        {lead.full_name || "Unknown"}
                      </Link>
                      {lead.job_title && (
                        <p className="text-xs text-text-muted">{lead.job_title}</p>
                      )}
                    </td>
                    <td className="p-3 text-text-muted">{lead.company || "—"}</td>
                    <td className="p-3 text-text-muted">
                      {lead.email ? (
                        <a
                          href={`mailto:${lead.email}`}
                          className="hover:text-brand transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {truncate(lead.email, 28)}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-3 text-text-muted">{lead.phone || "—"}</td>
                    <td className="p-3">
                      <StatusBadge status={lead.status} />
                    </td>
                    <td className="p-3 text-text-muted text-xs">
                      {formatDate(lead.created_at)}
                    </td>
                    <td className="p-3">
                      <Link href={`/leads/${lead.id}`}>
                        <ChevronRight className="h-4 w-4 text-text-muted" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
