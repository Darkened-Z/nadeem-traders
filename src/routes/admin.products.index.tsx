import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { adminDeleteProducts, adminListProducts, adminSetProductStatus } from "../lib/admin";
import { useAdminQuery } from "../components/admin-shell";
import { Badge, Button, EmptyState, PageHeader, Thumb, errorMessage } from "../components/admin-ui";

type View = "all" | "active" | "draft" | "unpriced";
const VIEWS: { id: View; label: string }[] = [
  { id: "all", label: "All" },
  { id: "active", label: "Active" },
  { id: "draft", label: "Draft" },
  { id: "unpriced", label: "Needs price" },
];

export const Route = createFileRoute("/admin/products/")({
  validateSearch: (s: Record<string, unknown>): { view: View } => ({
    view: VIEWS.some((v) => v.id === s.view) ? (s.view as View) : "all",
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { view } = Route.useSearch();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: products = [], isLoading } = useAdminQuery(["products"], () => adminListProducts());
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (products as any[]).filter((p) => {
      if (view === "active" && p.status !== "active") return false;
      if (view === "draft" && p.status !== "draft") return false;
      if (view === "unpriced" && p.price != null) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.name_ur ?? "").includes(query.trim()) ||
        (p.category_name ?? "").toLowerCase().includes(q) ||
        (p.origin ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, view, query]);

  const allChecked = rows.length > 0 && rows.every((r) => selected.includes(r.id));
  const toggleAll = () => setSelected(allChecked ? [] : rows.map((r) => r.id));
  const toggle = (id: number) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const bulk = async (action: "active" | "draft" | "delete") => {
    if (action === "delete" && !confirm(`Delete ${selected.length} product(s)? This can't be undone.`)) return;
    setBusy(true);
    try {
      if (action === "delete") await adminDeleteProducts({ data: { ids: selected } });
      else await adminSetProductStatus({ data: { ids: selected, status: action } });
      toast.success(action === "delete" ? "Products deleted" : `Set ${selected.length} product(s) as ${action}`);
      setSelected([]);
      await qc.invalidateQueries({ queryKey: ["admin"] });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Products"
        actions={
          <Button variant="primary" onClick={() => navigate({ to: "/admin/products/$productId" as any, params: { productId: "new" } as any })}>
            <Plus className="h-4 w-4" /> Add product
          </Button>
        }
      />

      <div className="overflow-hidden rounded-xl bg-white shadow-[0_1px_0_0_rgba(26,26,26,0.07)] ring-1 ring-black/[0.06]">
        <div className="flex flex-wrap items-center gap-2 border-b border-[#EBEBEB] px-2 py-2">
          <div className="flex gap-1 overflow-x-auto">
            {VIEWS.map((v) => (
              <Link
                key={v.id}
                to={"/admin/products" as any}
                search={{ view: v.id } as any}
                onClick={() => setSelected([])}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-[13px] font-semibold ${
                  view === v.id ? "bg-[#EBEBEB] text-[#303030]" : "text-[#616161] hover:bg-[#F7F7F7]"
                }`}
              >
                {v.label}
              </Link>
            ))}
          </div>
          <div className="relative ml-auto w-full sm:w-64">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A8A8A]" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products"
              className="w-full rounded-lg border border-[#C9C9C9] py-1.5 pl-8 pr-3 text-[16px] outline-none focus:border-[#005BD3] focus:ring-2 focus:ring-[#005BD3]/30 sm:text-[13px]"
            />
          </div>
        </div>

        {selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-[#EBEBEB] bg-[#F7F7F7] px-4 py-2">
            <span className="text-[13px] font-semibold">{selected.length} selected</span>
            <div className="ml-auto flex gap-2">
              <Button onClick={() => bulk("active")} loading={busy}>Set as active</Button>
              <Button onClick={() => bulk("draft")} loading={busy}>Set as draft</Button>
              <Button variant="critical" onClick={() => bulk("delete")} loading={busy}>Delete</Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <Loader2 className="mx-auto my-16 h-6 w-6 animate-spin text-[#616161]" />
        ) : rows.length === 0 ? (
          <EmptyState
            title={query ? "No products match your search" : "No products here"}
            body={query ? "Try a different name, category or origin." : "Add a product to get started."}
          />
        ) : (
          <table className="w-full text-left text-[13px]">
            <thead className="hidden bg-[#F7F7F7] text-xs font-semibold text-[#616161] md:table-header-group">
              <tr>
                <th className="w-10 px-4 py-2">
                  <input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label="Select all" className="h-4 w-4 accent-[#303030]" />
                </th>
                <th className="py-2 pr-3">Product</th>
                <th className="py-2 pr-3">Status</th>
                <th className="py-2 pr-3">Category</th>
                <th className="py-2 pr-3">Origin</th>
                <th className="py-2 pr-4 text-right">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EBEBEB]">
              {rows.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => navigate({ to: "/admin/products/$productId" as any, params: { productId: String(p.id) } as any })}
                  className="cursor-pointer hover:bg-[#FAFAFA]"
                >
                  <td className="w-10 px-4 py-2.5 align-middle" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.includes(p.id)}
                      onChange={() => toggle(p.id)}
                      aria-label={`Select ${p.name}`}
                      className="h-4 w-4 accent-[#303030]"
                    />
                  </td>
                  <td className="py-2.5 pr-3">
                    <div className="flex items-center gap-3">
                      <Thumb src={p.image_url} alt={p.name} />
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#303030]">{p.name}</p>
                        {p.name_ur && (
                          <p lang="ur" className="font-urdu truncate text-xs text-[#616161]">{p.name_ur}</p>
                        )}
                        <p className="mt-0.5 text-xs text-[#616161] md:hidden">
                          {p.category_name} · {p.price != null ? `Rs. ${Number(p.price).toLocaleString()}` : "No price"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 pr-3">
                    <Badge tone={p.status}>{p.status === "active" ? "Active" : "Draft"}</Badge>
                  </td>
                  <td className="hidden py-2.5 pr-3 text-[#616161] md:table-cell">{p.category_name}</td>
                  <td className="hidden py-2.5 pr-3 text-[#616161] md:table-cell">{p.origin ?? "—"}</td>
                  <td className="hidden py-2.5 pr-4 text-right md:table-cell">
                    {p.price != null ? (
                      <span className="font-medium">Rs. {Number(p.price).toLocaleString()}</span>
                    ) : (
                      <Badge tone="warning">No price</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="mt-3 text-center text-xs text-[#616161]">{rows.length} of {(products as any[]).length} products</p>
    </>
  );
}
