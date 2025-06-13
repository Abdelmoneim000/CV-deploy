import { useState } from 'react';

const Notifications = () => {
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    jobAlerts: true,
    securityAlerts: true,
  });

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-foreground">
        Notification Preferences
      </h2>

      <div className="space-y-4">
        {[
          {
            key: 'emailNotifications',
            label: 'Email Notifications',
            description: 'Receive email updates about your account',
          },
          {
            key: 'jobAlerts',
            label: 'Job Alerts',
            description: 'Get notified about new job opportunities',
          },
          {
            key: 'securityAlerts',
            label: 'Security Alerts',
            description: 'Important security notifications',
          },
        ].map((item) => (
          <div
            key={item.key}
            className="flex items-center justify-between p-4 bg-muted rounded-lg"
          >
            <div>
              <h3 className="text-sm font-medium text-foreground">
                {item.label}
              </h3>
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="notifications-toggle"
                type="checkbox"
                checked={notifications[item.key as keyof typeof notifications]}
                onChange={(e) =>
                  setNotifications({
                    ...notifications,
                    [item.key]: e.target.checked,
                  })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ring rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notifications;
