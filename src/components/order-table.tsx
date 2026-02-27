"use client";

import { useState, Fragment } from "react";
import { Search, ChevronDown, ChevronUp } from "lucide-react";
import { SwiggyOrder } from "@/types/swiggy";
import { formatCurrency, formatDate } from "@/lib/utils";

interface OrderTableProps {
  orders: SwiggyOrder[];
}

export default function OrderTable({ orders }: OrderTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | number | null>(null);
  const perPage = 15;

  const filtered = orders.filter(
    (o) =>
      (o.restaurant_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (o.order_items || []).some((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
      )
  );

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice(page * perPage, (page + 1) * perPage);

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h3 className="font-semibold text-card-foreground">
          Order History ({orders.length})
        </h3>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search orders..."
            className="w-full h-9 pl-9 pr-3 bg-muted border border-border rounded-lg text-sm text-card-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Date</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium">Restaurant</th>
              <th className="text-left py-3 px-2 text-muted-foreground font-medium hidden md:table-cell">Items</th>
              <th className="text-right py-3 px-2 text-muted-foreground font-medium">Amount</th>
              <th className="text-right py-3 px-2 text-muted-foreground font-medium hidden sm:table-cell">Discount</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((o) => (
              <Fragment key={String(o.order_id)}>
                <tr
                  className="border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() =>
                    setExpandedId(expandedId === o.order_id ? null : o.order_id)
                  }
                >
                  <td className="py-3 px-2 text-muted-foreground whitespace-nowrap">
                    {formatDate(o.order_time)}
                  </td>
                  <td className="py-3 px-2 font-medium text-card-foreground max-w-[180px] truncate">
                    {o.restaurant_name}
                  </td>
                  <td className="py-3 px-2 text-muted-foreground hidden md:table-cell max-w-[200px] truncate">
                    {(o.order_items || []).map((item) => item.name).join(", ") || "—"}
                  </td>
                  <td className="py-3 px-2 text-right font-medium text-card-foreground">
                    {formatCurrency(o.order_total)}
                  </td>
                  <td className="py-3 px-2 text-right text-emerald-500 hidden sm:table-cell">
                    {(o.order_discount || o.coupon_discount || o.discount)
                      ? `-${formatCurrency(o.order_discount || o.coupon_discount || o.discount || 0)}`
                      : "—"}
                  </td>
                  <td className="py-3 px-2">
                    {expandedId === o.order_id ? (
                      <ChevronUp className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    )}
                  </td>
                </tr>
                {expandedId === o.order_id && (
                  <tr className="bg-muted/30">
                    <td colSpan={6} className="py-3 px-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                          <p className="text-muted-foreground">Cuisine</p>
                          <p className="text-card-foreground font-medium">
                            {Array.isArray(o.restaurant_cuisine)
                              ? o.restaurant_cuisine.join(", ")
                              : o.restaurant_cuisine || "N/A"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Delivery Fee</p>
                          <p className="text-card-foreground font-medium">
                            {(o.order_delivery_charge || o.discounted_total_delivery_fee || o.delivery_fee)
                              ? formatCurrency(o.order_delivery_charge || o.discounted_total_delivery_fee || o.delivery_fee || 0)
                              : "Free"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Payment</p>
                          <p className="text-card-foreground font-medium">{o.payment_method || "N/A"}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Status</p>
                          <p className="text-card-foreground font-medium">{o.order_delivery_status || "N/A"}</p>
                        </div>
                      </div>
                      {o.order_items && o.order_items.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-border/50">
                          <p className="text-xs text-muted-foreground mb-2">Items ordered:</p>
                          <div className="flex flex-wrap gap-2">
                            {o.order_items.map((item, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-muted px-2 py-1 rounded-md text-card-foreground"
                              >
                                {item.name} ×{Number(item.quantity) || 1}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Showing {page * perPage + 1}–{Math.min((page + 1) * perPage, filtered.length)} of{" "}
            {filtered.length}
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
