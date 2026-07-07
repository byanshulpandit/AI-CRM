import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, ShieldCheck, KeyRound } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';
import { useUpdateProfile, useChangePassword } from '@/hooks/useUsers';

const profileSchema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  title: z.string().optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'At least 8 characters'),
});
type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      title: user?.title ?? '',
      phone: user?.phone ?? '',
      avatarUrl: user?.avatarUrl ?? '',
    },
  });

  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });

  const saveProfile = profileForm.handleSubmit((values) =>
    updateProfile.mutateAsync({ ...values, avatarUrl: values.avatarUrl || undefined }),
  );
  const savePassword = passwordForm.handleSubmit(async (values) => {
    await changePassword.mutateAsync(values);
    passwordForm.reset();
  });

  return (
    <div>
      <PageHeader title="My Profile" description="Manage your personal information and security." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Identity card */}
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center pt-6 text-center">
            <Avatar firstName={user?.firstName} lastName={user?.lastName} src={user?.avatarUrl} size="lg" className="h-20 w-20 text-2xl" />
            <p className="mt-3 text-lg font-semibold text-foreground">{user?.firstName} {user?.lastName}</p>
            {user?.title && <p className="text-sm text-muted-foreground">{user.title}</p>}
            <Badge tone="primary" className="mt-2 capitalize">
              <ShieldCheck className="h-3 w-3" /> {user?.role.replace('_', ' ').toLowerCase()}
            </Badge>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" /> {user?.email}
            </div>
          </CardContent>
        </Card>

        {/* Forms */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Personal information</CardTitle>
                <CardDescription>Update your name and contact details.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={saveProfile} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="First name" error={profileForm.formState.errors.firstName?.message} {...profileForm.register('firstName')} />
                <Input label="Last name" error={profileForm.formState.errors.lastName?.message} {...profileForm.register('lastName')} />
                <Input label="Job title" {...profileForm.register('title')} />
                <Input label="Phone" {...profileForm.register('phone')} />
                <div className="sm:col-span-2">
                  <Input label="Avatar URL" placeholder="https://…" error={profileForm.formState.errors.avatarUrl?.message} {...profileForm.register('avatarUrl')} />
                </div>
                <div className="sm:col-span-2 flex justify-end">
                  <Button type="submit" loading={updateProfile.isPending}>Save changes</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle className="flex items-center gap-2"><KeyRound className="h-4 w-4" /> Password</CardTitle>
                <CardDescription>Change your password. You'll stay signed in on this device.</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={savePassword} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Current password" type="password" error={passwordForm.formState.errors.currentPassword?.message} {...passwordForm.register('currentPassword')} />
                <Input label="New password" type="password" hint="Minimum 8 characters" error={passwordForm.formState.errors.newPassword?.message} {...passwordForm.register('newPassword')} />
                <div className="sm:col-span-2 flex justify-end">
                  <Button type="submit" variant="outline" loading={changePassword.isPending}>Update password</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
