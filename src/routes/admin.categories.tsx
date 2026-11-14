import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
import { adminDeleteCategory, adminListCategories, adminMoveCategory, adminSaveCategory } from "../lib/admin";
import { useAdminQuery } from "../components/admin-shell";
import { Button, EmptyState, Field, Modal, PageHeader, Thumb, errorMessage, inputClass } from "../components/admin-ui";

export const Route = createFileRoute("/admin/categories")({
  component: CategoriesPage,
});

type Editing = { id?: number; name: string; name_ur: string; image_url: string };

function CategoriesPage() {
  const qc = useQueryClient();
  const { data: categories = [], isLoading } = useAdminQuery(["categories"], () => adminListCategories());
  const [editing, setEditing] = useState<Editing | null>(null);
  const [saving, setSaving] = useState(false);
  const [moving, setMoving] = useState<number | null>(null);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin"] });

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await adminSaveCategory({
        data: { id: editing.id, name: editing.name, name_ur: editing.name_ur || null, image_url: editing.image_url || null },
      });
      toast.success(editing.id ? "Category saved" : "Category added");
      setEditing(null);
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const move = async (id: number, direction: -1 | 1) => {
    setMoving(id);
    try {
      await adminMoveCategory({ data: { id, direction } });
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setMoving(null);
    }
  };

  const remove = async (c: any) => {
    if (!confirm(`Delete category “${c.name}”?`)) return;
    try {
      await adminDeleteCategory({ data: { id: c.id } });
      toast.success("Category deleted");
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const list = categories as any[];

  return (
    <>
      <PageHeader
        title="Categories"
        actions={
          <Button variant="primary" onClick={() => setEditing({ name: "", name_ur: "", image_url: "" })}>
            <Plus className="h-4 w-4" /> Add category
          </Button>
        }
      />
      <p className="-mt-2 mb-4 text-[13px] text-[#616161]">The order here is the order customers see on the store.</p>

      <div className="overflow-hidden rounded-xl bg-white shadow-[0_1px_0_0_rgba(26,26,26,0.07)] ring-1 ring-black/[0.06]">
        {isLoading ? (
          <Loader2 className="mx-auto my-16 h-6 w-6 animate-spin text-[#616161]" />
        ) : list.length === 0 ? (
          <EmptyState title="No categories yet" body="Add a category, then assign products to it." />
        ) : (
          <ul className="divide-y divide-[#EBEBEB]">
            {list.map((c, i) => (
              <li key={c.id} className="flex items-center gap-3 px-3 py-2.5 sm:px-4">
                <div className="flex flex-col">
                  <button
                    type="button"
                    disabled={i === 0 || moving !== null}
                    onClick={() => move(c.id, -1)}
                    className="grid h-6 w-6 place-items-center rounded text-[#616161] hover:bg-[#F1F1F1] disabled:opacity-30"
                    aria-label={`Move ${c.name} up`}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={i === list.length - 1 || moving !== null}
                    onClick={() => move(c.id, 1)}
                    className="grid h-6 w-6 place-items-center rounded text-[#616161] hover:bg-[#F1F1F1] disabled:opacity-30"
                    aria-label={`Move ${c.name} down`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </div>
                <Thumb src={c.image_url} alt={c.name} size={44} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold">{c.name}</p>
                  {c.name_ur && <p lang="ur" className="font-urdu truncate text-xs text-[#616161]">{c.name_ur}</p>}
                </div>
                <Link
                  to={"/admin/products" as any}
                  className="hidden text-[13px] text-[#616161] hover:underline sm:block"
                >
                  {c.product_count} {c.product_count === 1 ? "product" : "products"}
                </Link>
                <Button onClick={() => setEditing({ id: c.id, name: c.name, name_ur: c.name_ur ?? "", image_url: c.image_url ?? "" })}>Edit</Button>
                <Button
                  variant="plain"
                  className="text-[#C70A24]"
                  onClick={() => remove(c)}
                  disabled={c.product_count > 0}
                  title={c.product_count > 0 ? "Move or delete its products first" : undefined}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing && (
        <Modal
          title={editing.id ? "Edit category" : "Add category"}
          onClose={() => setEditing(null)}
          footer={
            <>
              <Button onClick={() => setEditing(null)}>Cancel</Button>
              <Button variant="primary" onClick={save} loading={saving} disabled={!editing.name.trim()}>
                Save
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Name">
              <input autoFocus value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Urdu name">
              <input
                dir="rtl"
                lang="ur"
                value={editing.name_ur}
                onChange={(e) => setEditing({ ...editing, name_ur: e.target.value })}
                className={`${inputClass} font-urdu text-lg sm:text-lg`}
              />
            </Field>
            <Field label="Image link" help="e.g. /categories/seeds.jpg">
              <input value={editing.image_url} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} className={inputClass} />
            </Field>
          </div>
        </Modal>
      )}
    </>
  );
}
