import { ProfileForm } from '@/components/settings/ProfileForm';
import { AvatarUpload } from '@/components/settings/AvatarUpload';
import { PasswordChange } from '@/components/settings/PasswordChange';
import { PushNotificationToggle } from '@/components/settings/PushNotificationToggle';

export default function Settings() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-description">Manage your account settings</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Avatar Upload */}
        <div className="lg:col-span-1">
          <AvatarUpload />
        </div>

        {/* Profile Form */}
        <div className="lg:col-span-2">
          <ProfileForm />
        </div>
      </div>

      {/* Push Notifications */}
      <div className="max-w-md">
        <PushNotificationToggle />
      </div>

      {/* Password Change */}
      <div className="max-w-md">
        <PasswordChange />
      </div>
    </div>
  );
}
