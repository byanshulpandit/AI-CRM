import { useState } from 'react';
import { Moon, Sun, Monitor, ShieldCheck, Users as UsersIcon } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { useThemeStore } from '@/store/themeStore';
import { useAuthStore } from '@/store/authStore';
import { useUsers, useUpdateUserRole } from '@/hooks/useUsers';

const roleOptions = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'SALES_MANAGER', label: 'Sales Manager' },
  { value: 'EMPLOYEE', label: 'Employee' },
];

export default function SettingsPage() {
  const { theme, setTheme } = useThemeStore();
  const me = useAuthStore((s) => s.user);
  const isAdmin = me?.role === 'ADMIN';

  return (
    <div>
      <PageHeader title="Settings" description="Manage your workspace preferences." />

      <div className="space-y-6">
        {/* Appearance */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Choose how AI-CRM looks to you.</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {([
                { key: 'light', label: 'Light', icon: Sun },
                { key: 'dark', label: 'Dark', icon: Moon },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setTheme(opt.key)}
                  className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                    theme === opt.key
                      ? 'border-primary bg-primary/10 text-foreground shadow-glass-sm'
                      : 'border-border text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <opt.icon className="h-4 w-4" /> {opt.label}
                </button>
              ))}
              <div className="flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                <Monitor className="h-4 w-4" /> Respects your saved choice
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team management — admin only */}
        {isAdmin && <TeamManagement />}

        {/* About */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>About</CardTitle>
              <CardDescription>AI-CRM · v1.0.0</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              A production-ready CRM built with React, TypeScript, Node/Express and PostgreSQL.
              Role-based access is enforced end-to-end across {roleOptions.length} roles.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TeamManagement() {
  const { data: users, isLoading } = useUsers();
  const updateRole = useUpdateUserRole();
  const me = useAuthStore((s) => s.user);
  const [savingId, setSavingId] = useState<string | null>(null);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Team & roles</CardTitle>
          <CardDescription>Manage roles for members of your workspace.</CardDescription>
        </div>
        <Badge tone="primary"><UsersIcon className="h-3 w-3" /> {users?.length ?? 0} members</Badge>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <CardSkeleton />
        ) : (
          <div className="divide-y divide-border">
            {users?.map((u) => (
              <div key={u.id} className="flex items-center gap-3 py-3">
                <Avatar firstName={u.firstName} lastName={u.lastName} src={u.avatarUrl} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {u.firstName} {u.lastName} {u.id === me?.id && <span className="text-xs text-muted-foreground">(you)</span>}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                </div>
                <Select
                  options={roleOptions}
                  value={u.role}
                  disabled={u.id === me?.id || (savingId === u.id && updateRole.isPending)}
                  onChange={async (e) => {
                    setSavingId(u.id);
                    await updateRole.mutateAsync({ id: u.id, role: e.target.value });
                    setSavingId(null);
                  }}
                  className="w-44"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
