"use client";

import { useState } from "react";
import { GraduationCap, KeyRound, ShieldCheck, UserPlus, Users } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { PageHeader } from "@/components/ui/page-header";
import { KpiCard } from "@/components/ui/kpi-card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/modal";
import { Field, SelectInput } from "@/components/ui/form-field";
import { ErrorState } from "@/components/ui/query-state";
import { DataTable, type Column } from "@/components/ui/data-table";
import { CreateAccountDialog } from "@/components/domain/create-account-dialog";
import { SetPasswordDialog } from "@/components/domain/set-password-dialog";
import { useAuth } from "@/features/auth";
import { useAccounts, useSetAccountStatus, type Account, type AccountStatus } from "@/features/users";
import { ROLES_CONFIG } from "@/lib/auth/roles";
import { formatNumber } from "@/lib/format";
import { toast } from "@/lib/toast-store";
import type { UserRole } from "@/types";

const STATUS_BADGE: Record<AccountStatus, { label: string; variant: BadgeVariant }> = {
  ACTIVE: { label: "Active", variant: "success" },
  INACTIVE: { label: "Inactive", variant: "neutral" },
  SUSPENDED: { label: "Suspended", variant: "warning" },
  LOCKED: { label: "Locked", variant: "error" },
};

const ROLE_OPTIONS = Object.keys(ROLES_CONFIG) as UserRole[];

export default function UsersPage() {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole | "">("");
  const accounts = useAccounts(role ? { role } : {});
  const setStatus = useSetAccountStatus();
  const [creating, setCreating] = useState(false);
  const [toggling, setToggling] = useState<Account | null>(null);
  const [resetting, setResetting] = useState<Account | null>(null);

  const list = accounts.data ?? [];
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const canManage = (a: Account) =>
    !a.managedByEnv && a.id !== user?.id && a.role !== "SUPER_ADMIN" && (a.role !== "ADMIN" || isSuperAdmin);

  const confirmToggle = () => {
    if (!toggling) return;
    const next = toggling.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    setStatus.mutate(
      { id: toggling.id, status: next },
      {
        onSuccess: (a) => {
          toast.success(next === "ACTIVE" ? `${a.name} can sign in again.` : `${a.name} has been deactivated and signed out.`);
          setToggling(null);
        },
      },
    );
  };

  const columns: Column<Account>[] = [
    {
      header: "Name",
      accessorKey: "name",
      sortable: true,
      cell: (a) => (
        <div className="min-w-0">
          <span className="font-semibold text-slate-900 block leading-tight">{a.name}</span>
          <span className="text-xs text-slate-500 break-all">{a.email}</span>
        </div>
      ),
    },
    {
      header: "Role",
      accessorKey: "role",
      sortable: true,
      cell: (a) => (
        <div>
          <span className="text-sm text-slate-800 block leading-tight">{ROLES_CONFIG[a.role]?.label ?? a.role}</span>
          {a.managedByEnv && <span className="text-xs text-slate-500">Managed in server .env</span>}
        </div>
      ),
    },
    {
      header: "ID",
      accessorKey: "identifier",
      sortable: true,
      cell: (a) => <span className="font-mono text-xs text-slate-700">{a.identifier ?? "—"}</span>,
    },
    {
      header: "Department",
      accessorKey: "department",
      sortable: true,
      cell: (a) => <span className="text-sm text-slate-700">{[a.department, a.program].filter(Boolean).join(" · ") || "—"}</span>,
    },
    {
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (a) => <Badge variant={STATUS_BADGE[a.status].variant}>{STATUS_BADGE[a.status].label}</Badge>,
    },
    {
      header: "Actions",
      cell: (a) =>
        canManage(a) ? (
          <div className="flex flex-wrap items-center justify-end gap-1">
            <Button size="sm" variant="ghost" icon={<KeyRound className="w-4 h-4" />} aria-label={`Set password for ${a.name}`} onClick={() => setResetting(a)}>
              Set password
            </Button>
            <Button size="sm" variant={a.status === "ACTIVE" ? "ghost" : "soft"} aria-label={`${a.status === "ACTIVE" ? "Deactivate" : "Activate"} ${a.name}`} onClick={() => setToggling(a)}>
              {a.status === "ACTIVE" ? "Deactivate" : "Activate"}
            </Button>
          </div>
        ) : null,
    },
  ];

  const counts = list.reduce(
    (acc, a) => ({
      students: acc.students + Number(a.role === "STUDENT"),
      teaching: acc.teaching + Number(a.role === "FACULTY" || a.role === "HOD"),
      active: acc.active + Number(a.status === "ACTIVE"),
    }),
    { students: 0, teaching: 0, active: 0 },
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          breadcrumbs={["Administration", "Users"]}
          title="Users"
          description="Create accounts for students, faculty and staff. Each person signs in with their own email and password."
          actions={
            <Button icon={<UserPlus className="w-4 h-4" />} onClick={() => setCreating(true)}>
              Create account
            </Button>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard title={role ? "Accounts in role" : "Accounts"} value={formatNumber(list.length)} icon={<Users className="w-5 h-5" />} />
          <KpiCard title="Active" value={formatNumber(counts.active)} icon={<ShieldCheck className="w-5 h-5" />} />
          <KpiCard title="Students" value={formatNumber(counts.students)} icon={<GraduationCap className="w-5 h-5" />} />
          <KpiCard title="Faculty & HODs" value={formatNumber(counts.teaching)} icon={<KeyRound className="w-5 h-5" />} />
        </div>

        {accounts.isError ? (
          <ErrorState error={accounts.error} onRetry={() => accounts.refetch()} />
        ) : (
          <DataTable
            caption="User accounts"
            data={list}
            columns={columns}
            searchPlaceholder="Search name, email or ID…"
            pageSize={15}
            isLoading={accounts.isPending}
            emptyMessage={role ? "No accounts with this role" : "No accounts yet"}
            emptySubMessage="Use “Create account” to add the first one."
            exportFileName="jbit-users"
            filterComponent={
              <div className="w-full sm:w-60">
                <Field label="Role">
                  <SelectInput value={role} onChange={(e) => setRole(e.target.value as UserRole | "")}>
                    <option value="">All roles</option>
                    {ROLE_OPTIONS.map((r) => (
                      <option key={r} value={r}>
                        {ROLES_CONFIG[r].label}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
              </div>
            }
          />
        )}
      </div>

      <CreateAccountDialog open={creating} onClose={() => setCreating(false)} allowAdmin={isSuperAdmin} />

      {resetting && <SetPasswordDialog key={resetting.id} account={resetting} onClose={() => setResetting(null)} />}

      <ConfirmDialog
        open={toggling !== null}
        title={toggling?.status === "ACTIVE" ? "Deactivate account?" : "Activate account?"}
        message={
          toggling?.status === "ACTIVE"
            ? `${toggling?.name} will be signed out on all devices and won't be able to sign in until the account is activated again.`
            : `${toggling?.name} will be able to sign in again with their existing password.`
        }
        confirmLabel={toggling?.status === "ACTIVE" ? "Deactivate" : "Activate"}
        confirmVariant={toggling?.status === "ACTIVE" ? "danger" : "primary"}
        loading={setStatus.isPending}
        onConfirm={confirmToggle}
        onCancel={() => setToggling(null)}
      />
    </DashboardLayout>
  );
}
