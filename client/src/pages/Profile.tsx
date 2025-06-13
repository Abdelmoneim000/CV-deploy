import ProfileHeader from '@/components/profile/ProfileHeader';
import Container from '@/components/ui/Container';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { User, Shield, Bell, Settings as SettingsIcon } from 'lucide-react';
import { useEffect } from 'react';

const Profile = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect to profile details if on the base profile route
  useEffect(() => {
    if (location.pathname === '/profile') {
      navigate('/profile/personal', { replace: true });
    }
  }, [location.pathname, navigate]);

  const tabs = [
    {
      id: 'personal',
      label: 'Personal',
      icon: User,
      path: '/profile/personal',
    },
    {
      id: 'security',
      label: 'Security',
      icon: Shield,
      path: '/profile/security',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      path: '/profile/notifications',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: SettingsIcon,
      path: '/profile/settings',
    },
  ];

  const activeTab = location.pathname.split('/').pop() || 'personal';

  return (
    <Container>
      <div>
        <ProfileHeader />
      </div>

      {/* Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-1 bg-muted p-1 rounded-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={`
                  flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Page Content */}
      <div className="bg-card rounded-lg border border-border p-6">
        <Outlet />
      </div>
    </Container>
  );
};

export default Profile;
