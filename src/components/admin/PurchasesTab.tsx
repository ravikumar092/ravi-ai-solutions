import { useState, useMemo, useEffect } from "react";
import { useServerFn } from "@/hooks/use-server-fn";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, CreditCard, DollarSign, Users, ShoppingBag, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { adminListPurchases } from "@/lib/purchases.functions";
import { TabLoader } from "./AdminSkeletons";

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
};

const formatPriceDisplay = (price: string, currency: string = "USD") => {
  const numeric = parseFloat(price.replace(/[^0-9.]/g, ""));
  if (isNaN(numeric)) return price;
  const symbol = CURRENCY_SYMBOLS[currency] || "$";
  return `${symbol}${numeric.toFixed(2)}`;
};

export function PurchasesTab() {
  const fetchPurchases = useServerFn(adminListPurchases);

  const { data: purchases = [], isLoading, error, isError } = useQuery({
    queryKey: ["admin-purchases"],
    queryFn: () => fetchPurchases(),
  });

  useEffect(() => {
    if (isError) {
      console.error("admin-purchases query error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load purchases");
    }
  }, [isError, error]);

  const [search, setSearch] = useState("");

  const filteredPurchases = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return purchases;
    return purchases.filter((p: any) =>
      p.customer_name.toLowerCase().includes(q) ||
      p.customer_email.toLowerCase().includes(q) ||
      p.product_title.toLowerCase().includes(q) ||
      p.razorpay_payment_id.toLowerCase().includes(q)
    );
  }, [purchases, search]);

  const stats = useMemo(() => {
    let totalRevenue = 0;
    const uniqueCustomers = new Set();
    purchases.forEach((p: any) => {
      totalRevenue += Number(p.amount) || 0;
      uniqueCustomers.add(p.customer_email);
    });

    return {
      revenue: totalRevenue,
      orders: purchases.length,
      customers: uniqueCustomers.size,
    };
  }, [purchases]);

  function formatDate(dateStr: string) {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  }

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">Product Sales & Purchases</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Monitor successful user payments processed via Razorpay.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by customer, product, transaction..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-3 gap-5">
        <div className="bg-card/30 border border-border/80 rounded-xl p-5 backdrop-blur flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <DollarSign size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Total Revenue (USD)</p>
            <h3 className="text-2xl font-bold font-display tracking-tight mt-0.5 neon-text">
              ${stats.revenue.toFixed(2)}
            </h3>
          </div>
        </div>

        <div className="bg-card/30 border border-border/80 rounded-xl p-5 backdrop-blur flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <ShoppingBag size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Total Orders</p>
            <h3 className="text-2xl font-bold font-display tracking-tight mt-0.5">
              {stats.orders}
            </h3>
          </div>
        </div>

        <div className="bg-card/30 border border-border/80 rounded-xl p-5 backdrop-blur flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Users size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground">Unique Buyers</p>
            <h3 className="text-2xl font-bold font-display tracking-tight mt-0.5">
              {stats.customers}
            </h3>
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-card/20 border border-border rounded-xl overflow-hidden backdrop-blur">
        {isLoading ? (
          <TabLoader label="Loading purchases…" />
        ) : isError ? (
          <div className="p-8 flex flex-col items-center justify-center text-center text-destructive gap-2">
            <AlertCircle size={24} />
            <span className="text-xs">Failed to load purchases history.</span>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground">
            No transaction records found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border/50 bg-muted/25 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  <th className="py-3.5 px-4">Customer Details</th>
                  <th className="py-3.5 px-4">Item Details</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Payment Identifiers</th>
                  <th className="py-3.5 px-4">Date Purchased</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredPurchases.map((p: any) => (
                  <tr key={p.id} className="hover:bg-muted/10 transition-colors">
                    <td className="py-3.5 px-4 space-y-0.5">
                      <div className="font-semibold text-foreground">{p.customer_name}</div>
                      <div className="text-[10px] text-muted-foreground">{p.customer_email}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-foreground">{p.product_title}</div>
                      <div className="text-[9px] text-muted-foreground">ID: {p.product_id}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-foreground font-display">
                      {formatPriceDisplay(p.amount.toString(), p.currency)}
                    </td>
                    <td className="py-3.5 px-4 space-y-0.5 font-mono text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span className="opacity-60">PayID:</span>
                        <span className="text-foreground">{p.razorpay_payment_id}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="opacity-60">OrdID:</span>
                        <span>{p.razorpay_order_id}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={12} className="opacity-60" />
                        {formatDate(p.created_at)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
