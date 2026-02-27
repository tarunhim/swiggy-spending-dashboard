"use client";

import { useState } from "react";
import { Search, ArrowUpDown } from "lucide-react";
import { RestaurantData } from "@/types/swiggy";
import { formatCurrency, formatDate } from "@/lib/utils";

interface RestaurantTableProps {
  restaurants: RestaurantData[];
}

type SortKey = "name" | "orders" | "totalSpent" | "avgOrderValue";

export default function RestaurantTable({ restaurants }: RestaurantTableProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("totalSpent");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(0);
  const perPage = 10;

  const filtered = restaurants
    .filter(
      (r) =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.cuisine.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string")
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortAsc ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
    });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice(page * perPage, (page + 1) * perPage);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else {
      setSortKey(key);
      setSortAsc(false);
    }
    setPage(0);
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h3 className="font-semibold text-card-foreground">
          All Restaurants ({restaurants.length})
        </h3>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search restaurants..."
            className="w-full h-9 pl-9 pr-3 bg-muted border border-border rounded-lg text-sm text-card-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {(
                [
                  ["name", "Restaurant"],
                  ["orders", "Orders"],
                  ["totalSpent", "Total Spent"],
                  ["avgOrderValue", "Avg Value"],
                ] as [SortKey, string][]
              ).map(([key, label]) => (
                <th
                  key={key}
                  className="text-left py-3 px-2 text-muted-foreground font-medium cursor-pointer hover:text-card-foreground transition-colors"
                  onClick={() => handleSort(key)}
                >
                  <div className="flex items-center gap-1">
                    {label}
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              ))}
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Cuisine</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Last Order</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((r) => (
              <tr key={r.name} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                <td className="py-3 px-2 font-medium text-card-foreground max-w-[200px] truncate">
                  {r.name}
                </td>
                <td className="py-3 px-2 text-card-foreground">{r.orders}</td>
                <td className="py-3 px-2 text-card-foreground font-medium">{formatCurrency(r.totalSpent)}</td>
                <td className="py-3 px-2 text-card-foreground">{formatCurrency(r.avgOrderValue)}</td>
                <td className="py-3 px-2 text-muted-foreground max-w-[150px] truncate">{r.cuisine}</td>
                <td className="py-3 px-2 text-muted-foreground">{formatDate(r.lastOrdered)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Showing {page * perPage + 1}–{Math.min((page + 1) * perPage, filtered.length)} of {filtered.length}
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 text-xs bg-muted rounded-md text-card-foreground disabled:opacity-40"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-xs bg-muted rounded-md text-card-foreground disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
