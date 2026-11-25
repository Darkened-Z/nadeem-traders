import { createFileRoute } from "@tanstack/react-router";
import { Fragment, useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Coins, Loader2, Save, Search, RefreshCw, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { adminListProducts, adminBatchUpdateRates } from "../lib/admin";
import { useAdminQuery } from "../components/admin-shell";
import { Badge, Button, EmptyState, PageHeader, Thumb, errorMessage, inputClass } from "../components/admin-ui";

export const Route = createFileRoute("/admin/rates")({
  component: RatesPage,
});

type Option = { id: number; name: string; price: number | null; weight: string | null; image_url: string | null };

// Products with options are priced per option; every other product has one rate.
const productKey = (id: number) => `p${id}`;
const optionKey = (id: number) => `o${id}`;

function RatesPage() {
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useAdminQuery(["products"], () => adminListProducts());
  const [rates, setRates] = useState<Record<string, number | null>>({});
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [saving, setSaving] = useState(false);

  const original = useMemo(() => {
    const map: Record<string, number | null> = {};
    for (const p of products as any[]) {
      const options = (p.variants ?? []) as Option[];
      if (options.length === 0) map[productKey(p.id)] = p.price;
      for (const o of options) map[optionKey(o.id)] = o.price;
    }
    return map;
  }, [products]);

  const rateOf = (key: string) => (rates[key] !== undefined ? rates[key] : original[key]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products as any[]) {
      if (p.category_name) set.add(p.category_name);
    }
    return Array.from(set);
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (products as any[]).filter((p) => {
      if (selectedCategory !== "all" && p.category_name !== selectedCategory) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.name_ur ?? "").includes(search.trim()) ||
        (p.origin ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, search, selectedCategory]);

  const changedKeys = Object.keys(original).filter((k) => rates[k] !== undefined && rates[k] !== original[k]);
  const changedCount = changedKeys.length;

  const handlePriceChange = (key: string, val: string) => {
    const trimmed = val.trim();
    if (!trimmed) {
      setRates((prev) => ({ ...prev, [key]: null }));
      return;
    }
    const num = Number(trimmed);
    if (!Number.isNaN(num) && num >= 0) {
      setRates((prev) => ({ ...prev, [key]: Math.round(num) }));
    }
  };

  const toggleRatePoochein = (key: string) => {
    setRates((prev) => ({ ...prev, [key]: rateOf(key) === null ? 0 : null }));
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      const pick = (prefix: string) =>
        changedKeys.filter((k) => k.startsWith(prefix)).map((k) => ({ id: Number(k.slice(1)), price: rates[k] }));
      await adminBatchUpdateRates({ data: { rates: pick("p"), optionRates: pick("o") } });
      toast.success("All daily rates updated and published to storefront!");
      setRates({});
      await qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const resetAll = () => {
    setRates({});
    toast.info("Reverted unsaved rate changes");
  };

  const rateCells = (key: string) => {
    const currentPrice = rateOf(key);
    const isUnpriced = currentPrice === null;
    const isChanged = currentPrice !== original[key];
    return (
      <>
        <td className="py-3 pr-4 text-right">
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-xs text-[#8A8A8A]">Rs.</span>
            <input
              type="number"
              min="0"
              step="10"
              placeholder="Rate Poochein"
              disabled={isUnpriced}
              value={isUnpriced ? "" : (currentPrice ?? "")}
              onChange={(e) => handlePriceChange(key, e.target.value)}
              className={`w-28 rounded-lg border px-2.5 py-1 text-right text-xs font-semibold focus:outline-none focus:ring-1 ${
                isUnpriced
                  ? "bg-[#F1F1F1] text-[#8A8A8A] border-transparent"
                  : isChanged
                  ? "border-[#D97706] bg-white text-[#92400E] ring-[#D97706]"
                  : "border-[#8A8A8A] bg-white text-[#303030] focus:border-[#303030]"
              }`}
            />
          </div>
        </td>
        <td className="py-3 pr-4 text-center">
          <button
            type="button"
            onClick={() => toggleRatePoochein(key)}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              isUnpriced
                ? "bg-[#25D366]/15 text-[#075E54] font-semibold"
                : "bg-[#F1F1F1] text-[#616161] hover:bg-[#E5E5E5]"
            }`}
            title="If enabled, customers see 'Rate Poochein' on WhatsApp instead of adding to cart"
          >
            <MessageSquare className="h-3 w-3" />
            {isUnpriced ? "Rate Poochein" : "Fixed Rate"}
          </button>
        </td>
      </>
    );
  };

  return (
    <>
      <PageHeader
        title="Daily Rates Sheet"
        actions={
          <div className="flex items-center gap-2">
            {changedCount > 0 && (
              <Button variant="secondary" onClick={resetAll} disabled={saving}>
                <RefreshCw className="h-3.5 w-3.5" /> Revert
              </Button>
            )}
            <Button variant="primary" onClick={saveAll} loading={saving}>
              <Save className="h-4 w-4" /> Save Today's Rates {changedCount > 0 ? `(${changedCount} changed)` : ""}
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-3 shadow-[0_1px_0_0_rgba(26,26,26,0.07)] ring-1 ring-black/[0.06]">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              selectedCategory === "all" ? "bg-[#1A1A1A] text-white" : "bg-[#F1F1F1] text-[#4A4A4A] hover:bg-[#E5E5E5]"
            }`}
          >
            All Products ({products.length})
          </button>
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedCategory(c)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedCategory === c ? "bg-[#1A1A1A] text-white" : "bg-[#F1F1F1] text-[#4A4A4A] hover:bg-[#E5E5E5]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8A8A8A]" />
          <input
            type="text"
            placeholder="Search commodity or Urdu name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputClass} pl-8 text-xs`}
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-[0_1px_0_0_rgba(26,26,26,0.07)] ring-1 ring-black/[0.06]">
        {isLoading ? (
          <Loader2 className="mx-auto my-16 h-6 w-6 animate-spin text-[#616161]" />
        ) : filtered.length === 0 ? (
          <EmptyState title="No commodities found" body="Try adjusting your search or category filter." />
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead className="bg-[#F7F7F7] text-xs font-semibold text-[#616161]">
              <tr>
                <th className="px-4 py-2.5">Commodity</th>
                <th className="hidden py-2.5 pr-3 sm:table-cell">Urdu Name</th>
                <th className="hidden py-2.5 pr-3 md:table-cell">Category</th>
                <th className="py-2.5 pr-3">Pack / Weight</th>
                <th className="py-2.5 pr-4 text-right">Today's Rate (PKR)</th>
                <th className="py-2.5 pr-4 text-center">Quote Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEB]">
              {filtered.map((p) => {
                const options = (p.variants ?? []) as Option[];
                const rowChanged =
                  options.length === 0
                    ? changedKeys.includes(productKey(p.id))
                    : options.some((o) => changedKeys.includes(optionKey(o.id)));
                return (
                  <Fragment key={p.id}>
                    <tr className={`hover:bg-[#FAFAFA] ${rowChanged ? "bg-[#FFFDEB]" : ""}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Thumb src={p.image_url} alt="" />
                          <div>
                            <p className="font-semibold text-[#303030]">{p.name}</p>
                            {p.origin && <p className="text-[11px] text-[#8A8A8A]">Origin: {p.origin}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="hidden py-3 pr-3 font-serif text-sm sm:table-cell text-[#303030]">
                        {p.name_ur || "—"}
                      </td>
                      <td className="hidden py-3 pr-3 text-xs md:table-cell text-[#616161]">
                        <Badge tone="default">{p.category_name}</Badge>
                      </td>
                      {options.length === 0 ? (
                        <>
                          <td className="py-3 pr-3 text-xs font-medium text-[#4A4A4A]">{p.weight || "—"}</td>
                          {rateCells(productKey(p.id))}
                        </>
                      ) : (
                        <td colSpan={3} className="py-3 pr-4 text-right text-xs text-[#8A8A8A]">
                          {options.length} options, priced below
                        </td>
                      )}
                    </tr>
                    {options.map((o) => (
                      <tr
                        key={o.id}
                        className={`hover:bg-[#FAFAFA] ${changedKeys.includes(optionKey(o.id)) ? "bg-[#FFFDEB]" : ""}`}
                      >
                        <td className="py-2 pl-14 pr-4">
                          <div className="flex items-center gap-2">
                            <Thumb src={o.image_url || p.image_url} alt="" />
                            <p className="text-[13px] text-[#303030]">{o.name}</p>
                          </div>
                        </td>
                        <td className="hidden sm:table-cell" />
                        <td className="hidden md:table-cell" />
                        <td className="py-2 pr-3 text-xs font-medium text-[#4A4A4A]">{o.weight || p.weight || "—"}</td>
                        {rateCells(optionKey(o.id))}
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 rounded-xl bg-white p-4 text-xs text-[#616161] shadow-[0_1px_0_0_rgba(26,26,26,0.07)] ring-1 ring-black/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Coins className="h-4 w-4 text-[#D97706]" />
          <span>
            <strong>Pro-tip:</strong> Clicking <em>Rate Poochein</em> on any commodity switches it to WhatsApp live market inquiry mode without displaying a fixed price.
          </span>
        </div>
        <Button variant="primary" onClick={saveAll} loading={saving} disabled={changedCount === 0}>
          <Save className="h-3.5 w-3.5" /> Save Changes ({changedCount})
        </Button>
      </div>
    </>
  );
}
