import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ImageIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminDeleteProducts, adminGetProduct, adminListCategories, adminSaveProduct, type ProductInput } from "../lib/admin";
import { useAdminQuery } from "../components/admin-shell";
import { Button, Card, Field, PageHeader, errorMessage, inputClass } from "../components/admin-ui";

export const Route = createFileRoute("/admin/products/$productId")({
  component: ProductEditor,
});

type Form = {
  name: string;
  name_ur: string;
  description: string;
  origin: string;
  weight: string;
  price: string;
  category_id: string;
  image_url: string;
  stock: boolean;
  status: "active" | "draft";
};

const EMPTY: Form = {
  name: "",
  name_ur: "",
  description: "",
  origin: "",
  weight: "",
  price: "",
  category_id: "",
  image_url: "",
  stock: true,
  status: "active",
};

function toForm(p: any): Form {
  return {
    name: p.name ?? "",
    name_ur: p.name_ur ?? "",
    description: p.description ?? "",
    origin: p.origin ?? "",
    weight: p.weight ?? "",
    price: p.price == null ? "" : String(p.price),
    category_id: p.category_id == null ? "" : String(p.category_id),
    image_url: p.image_url ?? "",
    stock: p.stock !== false,
    status: p.status === "draft" ? "draft" : "active",
  };
}

function ProductEditor() {
  const { productId } = Route.useParams();
  const isNew = productId === "new";
  const navigate = useNavigate();
  const qc = useQueryClient();

  const categories = useAdminQuery(["categories"], () => adminListCategories());
  const product = useAdminQuery(["product", productId], () =>
    isNew ? Promise.resolve(null) : adminGetProduct({ data: { id: Number(productId) } }),
  );

  const initial = useMemo(() => (product.data ? toForm(product.data) : EMPTY), [product.data]);
  const [form, setForm] = useState<Form>(initial);
  const [saving, setSaving] = useState(false);
  const [imgOk, setImgOk] = useState(true);

  useEffect(() => setForm(initial), [initial]);
  useEffect(() => setImgOk(true), [form.image_url]);
  useEffect(() => {
    if (isNew && !form.category_id && categories.data?.length) {
      setForm((f) => ({ ...f, category_id: String((categories.data as any[])[0].id) }));
    }
  }, [isNew, categories.data, form.category_id]);

  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const set = <K extends keyof Form>(key: K, value: Form[K]) => setForm((f) => ({ ...f, [key]: value }));

  const save = async () => {
    if (!form.name.trim()) return toast.error("Title is required");
    if (form.price.trim() && !(Number(form.price) >= 0)) return toast.error("Price must be a number");
    setSaving(true);
    try {
      const payload: ProductInput = {
        id: isNew ? undefined : Number(productId),
        name: form.name,
        name_ur: form.name_ur || null,
        description: form.description || null,
        origin: form.origin || null,
        weight: form.weight || null,
        price: form.price.trim() ? Number(form.price) : null,
        category_id: Number(form.category_id),
        image_url: form.image_url || null,
        stock: form.stock,
        status: form.status,
      };
      const saved: any = await adminSaveProduct({ data: payload });
      await qc.invalidateQueries({ queryKey: ["admin"] });
      toast.success(isNew ? "Product created" : "Product saved");
      if (isNew) navigate({ to: "/admin/products/$productId" as any, params: { productId: String(saved.id) } as any, replace: true });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Delete “${form.name}”? This can't be undone.`)) return;
    try {
      await adminDeleteProducts({ data: { ids: [Number(productId)] } });
      await qc.invalidateQueries({ queryKey: ["admin"] });
      toast.success("Product deleted");
      navigate({ to: "/admin/products" as any });
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  if (product.isLoading || categories.isLoading) {
    return <Loader2 className="mx-auto mt-20 h-6 w-6 animate-spin text-[#616161]" />;
  }
  if (!isNew && !product.data) {
    return <p className="mt-20 text-center text-[13px] text-[#616161]">Product not found.</p>;
  }

  return (
    <>
      {dirty && (
        <div className="fixed inset-x-0 top-0 z-50 flex h-14 items-center gap-3 bg-[#1A1A1A] px-4 text-white">
          <span className="text-[13px] font-semibold">Unsaved changes</span>
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={() => setForm(initial)} className="rounded-lg px-3 py-1.5 text-[13px] font-semibold text-white/80 hover:bg-white/10">
              Discard
            </button>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[13px] font-semibold text-[#303030] disabled:opacity-60"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save
            </button>
          </div>
        </div>
      )}

      <PageHeader
        title={isNew ? "Add product" : form.name || "Untitled product"}
        back={
          <button
            type="button"
            onClick={() => navigate({ to: "/admin/products" as any })}
            className="grid h-8 w-8 place-items-center rounded-lg hover:bg-black/5"
            aria-label="Back to products"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <Card>
            <div className="space-y-4">
              <Field label="Title">
                <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Green Cardamom" className={inputClass} />
              </Field>
              <Field label="Urdu title">
                <input
                  dir="rtl"
                  lang="ur"
                  value={form.name_ur}
                  onChange={(e) => set("name_ur", e.target.value)}
                  placeholder="سبز الائچی"
                  className={`${inputClass} font-urdu text-lg sm:text-lg`}
                />
              </Field>
              <Field label="Description">
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Grade, taste, how it's packed…"
                  className={`${inputClass} resize-y`}
                />
              </Field>
            </div>
          </Card>

          <Card title="Media">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="grid aspect-square w-full shrink-0 place-items-center overflow-hidden rounded-lg border border-dashed border-[#C9C9C9] bg-[#F7F7F7] sm:w-40">
                {form.image_url && imgOk ? (
                  <img src={form.image_url} alt="" onError={() => setImgOk(false)} className="h-full w-full object-cover" />
                ) : (
                  <div className="p-3 text-center text-xs text-[#616161]">
                    <ImageIcon className="mx-auto mb-1 h-6 w-6 text-[#8A8A8A]" />
                    {form.image_url ? "Image not found" : "No image"}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <Field label="Image link" help="Paste an image URL, or a file path like /products/green-cardamom.jpg">
                  <input value={form.image_url} onChange={(e) => set("image_url", e.target.value)} placeholder="/products/name.jpg" className={inputClass} />
                </Field>
              </div>
            </div>
          </Card>

          <Card title="Pricing">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Price" help="Leave empty to show “Rate Poochein” (rate on WhatsApp).">
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13px] text-[#616161]">Rs.</span>
                  <input
                    inputMode="numeric"
                    value={form.price}
                    onChange={(e) => set("price", e.target.value.replace(/[^\d.]/g, ""))}
                    placeholder="0"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </Field>
              <Field label="Pack size" help="e.g. 250g, 500g, 1kg">
                <input value={form.weight} onChange={(e) => set("weight", e.target.value)} placeholder="500g" className={inputClass} />
              </Field>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Status">
            <select value={form.status} onChange={(e) => set("status", e.target.value as Form["status"])} className={inputClass}>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
            <p className="mt-2 text-xs text-[#616161]">Drafts are hidden from the store.</p>
          </Card>

          <Card title="Product organization">
            <div className="space-y-4">
              <Field label="Category">
                <select value={form.category_id} onChange={(e) => set("category_id", e.target.value)} className={inputClass}>
                  {(categories.data as any[] | undefined)?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Origin" help="Country or region, e.g. Iran, Sindh, Pakistan">
                <input value={form.origin} onChange={(e) => set("origin", e.target.value)} className={inputClass} />
              </Field>
            </div>
          </Card>

          <Card title="Inventory">
            <label className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" checked={form.stock} onChange={(e) => set("stock", e.target.checked)} className="h-4 w-4 accent-[#303030]" />
              In stock
            </label>
          </Card>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-[#E3E3E3] pt-4">
        {!isNew ? (
          <Button variant="critical" onClick={remove}>
            Delete product
          </Button>
        ) : (
          <span />
        )}
        <Button variant="primary" onClick={save} loading={saving} disabled={!dirty && !isNew}>
          Save
        </Button>
      </div>
    </>
  );
}
