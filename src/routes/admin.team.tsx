import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, UserPlus, Shield, KeyRound, LogOut, Trash2, CheckCircle2, Ban } from "lucide-react";
import { toast } from "sonner";
import {
  adminCreateMember,
  adminDeleteMember,
  adminListTeam,
  adminResetMemberPassword,
  adminRevokeAllSessions,
  adminRevokeMemberSessions,
  adminUpdateMember,
} from "../lib/admin";
import {
  ADMIN_ROLES,
  assignableAdminRoles,
  canManageTeamRole,
  canRevokeAllAdminSessions,
  roleLabel,
  type AdminRole,
  type TeamMember,
} from "../lib/admin-roles";
import { useAdminQuery } from "../components/admin-shell";
import { Badge, Button, Card, EmptyState, Field, Modal, PageHeader, errorMessage, inputClass } from "../components/admin-ui";

export const Route = createFileRoute("/admin/team")({
  component: TeamPage,
});

function TeamPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useAdminQuery(["team"], () => adminListTeam());
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<{ name: string; email: string; role: AdminRole; password: string }>({
    name: "",
    email: "",
    role: "staff",
    password: "",
  });
  const [busyId, setBusyId] = useState<number | null>(null);
  const [resetTarget, setResetTarget] = useState<{ id: number; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [revokingAll, setRevokingAll] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "team"] });

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await adminCreateMember({ data: form });
      toast.success(`Added ${form.name} (${roleLabel(form.role)})`);
      setForm({ name: "", email: "", role: "staff", password: "" });
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const updateMember = async (member: TeamMember, patch: { role?: AdminRole; active?: boolean }) => {
    setBusyId(member.id);
    try {
      await adminUpdateMember({
        data: {
          id: member.id,
          name: member.name,
          role: patch.role ?? member.role,
          active: patch.active ?? member.active,
        },
      });
      toast.success(`Updated ${member.name}`);
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const revokeMember = async (member: TeamMember) => {
    setBusyId(member.id);
    try {
      await adminRevokeMemberSessions({ data: { id: member.id } });
      toast.success(`Signed out ${member.email} everywhere`);
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const deleteMember = async (member: TeamMember) => {
    if (!confirm(`Remove ${member.name} (${member.email}) from admin access?`)) return;
    setBusyId(member.id);
    try {
      await adminDeleteMember({ data: { id: member.id } });
      toast.success(`Removed ${member.email}`);
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!resetTarget) return;
    setResetting(true);
    try {
      await adminResetMemberPassword({ data: { id: resetTarget.id, password: newPassword } });
      toast.success(`Password updated and sessions revoked for ${resetTarget.email}`);
      setResetTarget(null);
      setNewPassword("");
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setResetting(false);
    }
  };

  const handleRevokeAll = async () => {
    if (!confirm("Sign out every admin and team member (including yourself) on all devices?")) return;
    setRevokingAll(true);
    try {
      await adminRevokeAllSessions();
      toast.success("All sessions revoked");
      window.location.reload();
    } catch (err) {
      toast.error(errorMessage(err));
      setRevokingAll(false);
    }
  };

  if (isLoading) {
    return <Loader2 className="mx-auto mt-20 h-6 w-6 animate-spin text-[#616161]" />;
  }

  if (error || !data) {
    return (
      <Card>
        <EmptyState title="Access denied" body={error instanceof Error ? error.message : "Failed to load team."} />
      </Card>
    );
  }

  const { members, logs, currentActorId, currentActorRole, masterPasswordEnabled } = data;
  const assignableRoles = ADMIN_ROLES.filter((r) => assignableAdminRoles(currentActorRole).includes(r.role));
  const allowRevokeAll = canRevokeAllAdminSessions(currentActorRole);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Team & Access Control"
        actions={
          allowRevokeAll ? (
            <Button variant="secondary" loading={revokingAll} onClick={handleRevokeAll}>
              <LogOut className="h-3.5 w-3.5" /> Sign out all sessions
            </Button>
          ) : undefined
        }
      />

      <div className="grid gap-3 md:grid-cols-3">
        {ADMIN_ROLES.map((r) => (
          <div key={r.role} className="rounded-xl bg-white p-4 shadow-[0_1px_0_0_rgba(26,26,26,0.07)] ring-1 ring-black/[0.06]">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#303030]">
                <Shield className="h-4 w-4 text-[#0B4A36]" />
                {r.label}
              </span>
              <Badge tone={r.role === "owner" ? "active" : r.role === "manager" ? "Processing" : "Pending"}>{r.role}</Badge>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#616161]">{r.summary}</p>
          </div>
        ))}
      </div>

      <Card title="Add Team Member">
        <form onSubmit={handleCreate} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Name">
            <input
              type="text"
              required
              placeholder="Usman Tariq"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              required
              placeholder="usman@nadeemtraders.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Role">
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })}
              className={inputClass}
            >
              {assignableRoles.map((r) => (
                <option key={r.role} value={r.role}>
                  {r.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Password (min 8 chars)">
            <input
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={inputClass}
            />
          </Field>
          <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-between pt-1">
            <p className="text-xs text-[#616161]">
              {masterPasswordEnabled
                ? "Master owner password (ADMIN_PASSWORD) is also active."
                : "Master password is not set; team email logins only."}
            </p>
            <Button type="submit" variant="primary" loading={creating}>
              <UserPlus className="h-3.5 w-3.5" /> Add member
            </Button>
          </div>
        </form>
      </Card>

      <Card title={`Admin & Staff Accounts (${members.length})`}>
        {members.length === 0 ? (
          <EmptyState
            title="No individual accounts yet"
            body="Add staff, manager, or owner logins above so team members don't share one password."
          />
        ) : (
          <div className="-mx-4 -my-2 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#EBEBEB] font-semibold text-[#616161]">
                <tr>
                  <th className="px-4 py-2.5">Member</th>
                  <th className="px-3 py-2.5">Role</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Last login</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBEBEB]">
                {members.map((m) => {
                  const isSelf = currentActorId === m.id;
                  const canManage = canManageTeamRole(currentActorRole, m.role);
                  const busy = busyId === m.id;
                  return (
                    <tr key={m.id}>
                      <td className="px-4 py-2.5">
                        <div className="font-semibold text-[#303030]">
                          {m.name} {isSelf && <span className="ml-1 text-[10px] font-medium text-[#0B4A36]">(You)</span>}
                        </div>
                        <div className="text-[#616161]">{m.email}</div>
                      </td>
                      <td className="px-3 py-2.5">
                        {canManage ? (
                          <select
                            aria-label={`Role for ${m.name}`}
                            disabled={busy || isSelf}
                            value={m.role}
                            onChange={(e) => updateMember(m, { role: e.target.value as AdminRole })}
                            className="rounded-lg border border-[#D4D4D4] bg-white px-2 py-1 text-xs font-medium text-[#303030] disabled:opacity-50"
                          >
                            {assignableRoles.map((r) => (
                              <option key={r.role} value={r.role}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-[#F6F6F7] px-2 py-1 text-xs font-medium text-[#303030]">
                            {roleLabel(m.role)}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge tone={m.active ? "active" : "Cancelled"}>{m.active ? "Active" : "Suspended"}</Badge>
                      </td>
                      <td className="px-3 py-2.5 text-[#616161]">
                        {m.last_login_at
                          ? new Date(m.last_login_at).toLocaleString("en-PK", { dateStyle: "medium", timeStyle: "short" })
                          : "Never"}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center justify-end gap-1.5">
                          {canManage ? (
                            <>
                              <Button
                                variant="secondary"
                                disabled={busy}
                                onClick={() => {
                                  setResetTarget({ id: m.id, email: m.email });
                                  setNewPassword("");
                                }}
                                title="Reset password"
                              >
                                <KeyRound className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="secondary"
                                disabled={busy}
                                onClick={() => revokeMember(m)}
                                title="Sign out everywhere"
                              >
                                <LogOut className="h-3.5 w-3.5" />
                              </Button>
                              {!isSelf && (
                                <>
                                  <Button
                                    variant="secondary"
                                    disabled={busy}
                                    onClick={() => updateMember(m, { active: !m.active })}
                                    title={m.active ? "Suspend access" : "Re-enable access"}
                                  >
                                    {m.active ? <Ban className="h-3.5 w-3.5 text-[#C70A24]" /> : <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />}
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    disabled={busy}
                                    onClick={() => deleteMember(m)}
                                    title="Delete member"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-[#C70A24]" />
                                  </Button>
                                </>
                              )}
                            </>
                          ) : (
                            <span className="text-[11px] text-[#8A8A8A]">Owner protected</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Card title="Recent Admin Activity Log">
        {logs.length === 0 ? (
          <EmptyState title="No admin activity recorded yet" body="Sign-ins, rate updates, and settings changes will appear here." />
        ) : (
          <div className="-mx-4 -my-2 max-h-80 overflow-auto">
            <table className="w-full text-left text-xs">
              <thead className="sticky top-0 border-b border-[#EBEBEB] bg-white font-semibold text-[#616161]">
                <tr>
                  <th className="px-4 py-2">When</th>
                  <th className="px-3 py-2">Actor</th>
                  <th className="px-3 py-2">Action</th>
                  <th className="px-4 py-2">Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBEBEB]">
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className="whitespace-nowrap px-4 py-2 text-[#616161]">
                      {new Date(l.created_at).toLocaleString("en-PK", { dateStyle: "short", timeStyle: "short" })}
                    </td>
                    <td className="px-3 py-2 font-medium text-[#303030]">
                      {l.actor_email}{" "}
                      <span className="ml-1 rounded bg-[#F1F1F1] px-1.5 py-0.5 text-[10px] uppercase text-[#616161]">
                        {l.actor_role}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] text-[#303030]">{l.action}</td>
                    <td className="max-w-xs truncate px-4 py-2 text-[#616161]">{l.target || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {resetTarget && (
        <Modal
          title={`Reset Password — ${resetTarget.email}`}
          onClose={() => setResetTarget(null)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setResetTarget(null)}>
                Cancel
              </Button>
              <Button type="submit" form="reset-member-pw-form" variant="primary" loading={resetting} disabled={newPassword.length < 8}>
                Save &amp; Sign Out User
              </Button>
            </>
          }
        >
          <form id="reset-member-pw-form" onSubmit={handleResetPassword} className="space-y-3">
            <Field label="New Password (minimum 8 characters)">
              <input
                type="password"
                required
                minLength={8}
                autoFocus
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
              />
            </Field>
          </form>
        </Modal>
      )}
    </div>
  );
}
