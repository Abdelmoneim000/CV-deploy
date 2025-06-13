import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AiOutlineSearch,
  AiOutlinePlus,
  AiOutlineBell,
  AiOutlineUser,
  AiOutlineLogout,
  AiOutlineDown,
  AiOutlineMenu,
  AiOutlineClose,
  AiOutlineFileText,
  AiOutlineRise,
} from 'react-icons/ai';
import useAuth from '@/hooks/useAuth';
import Avatar from '@/components/ui/Avatar';

const JobBoardHeader = () => {
  const [activeTab, setActiveTab] = useState<
    'discover' | 'post' | 'job-manager' | 'application-manager'
  >('discover');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    if (location.pathname.includes('/post')) {
      setActiveTab('post');
    }

    if (location.pathname.includes('/job-manager')) {
      setActiveTab('job-manager');
    }

    if (location.pathname.includes('/application-manager')) {
      setActiveTab('application-manager');
    }

    if (location.pathname.includes('/discover')) {
      setActiveTab('discover');
    }
  }, [location.pathname]);

  const getUserFirstName = () => {
    return user?.firstName || user?.username || 'User';
  };

  const getUserRole = () => {
    return user?.role || 'guest';
  };

  const handleMobileMenuToggle = () => {
    setShowMobileMenu(!showMobileMenu);
    setShowUserMenu(false);
  };

  const closeMobileMenu = () => {
    setShowMobileMenu(false);
  };

  // Role-based navigation items
  const getNavItems = () => {
    const userRole = getUserRole();

    if (userRole === 'hr') {
      // HR/Employer can see: Post Job and Job Manager
      return [
        {
          to: '/job-board/job-manager',
          label: 'Job Manager',
          icon: <AiOutlineRise size={18} />,
          id: 'job-manager',
        },
        {
          to: '/job-board/post',
          label: 'Post Job',
          icon: <AiOutlinePlus size={18} />,
          id: 'post',
        },
      ];
    } else if (userRole === 'candidate') {
      // Candidates can see: Discover Jobs and Application Manager
      return [
        {
          to: '/job-board/discover',
          label: 'Discover Jobs',
          icon: <AiOutlineSearch size={18} />,
          id: 'discover',
        },
        {
          to: '/job-board/application-manager',
          label: 'Application Manager',
          icon: <AiOutlineFileText size={18} />,
          id: 'application-manager',
        },
      ];
    } else {
      // Default/guest users - redirect based on login
      return [
        {
          to: '/job-board/discover',
          label: 'Discover Jobs',
          icon: <AiOutlineSearch size={18} />,
          id: 'discover',
        },
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <>
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Side: Logo + Navigation */}
            <div className="flex items-center gap-8">
              {/* Logo */}
              <div className="flex items-center">
                <h1 className="text-2xl font-bold">Job Board</h1>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden lg:flex gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      activeTab === item.id
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {item.icon}
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </nav>
            </div>

            {/* Right Side: Actions + User Menu */}
            <div className="flex items-center gap-4">
              {/* Notifications - Desktop only */}
              {/* <button className="hidden lg:flex p-2 text-muted-foreground hover:text-foreground transition-colors relative">
                <AiOutlineBell size={20} />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  3
                </span>
              </button> */}

              {/* Desktop User Menu */}
              <div className="hidden lg:block relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 p-2 hover:bg-muted rounded-lg transition-colors min-w-0"
                >
                  {/* Simplified Avatar Component */}
                  <Avatar
                    size={32}
                    editable={false}
                    className="flex-shrink-0"
                  />

                  {/* User Info */}
                  <div className="text-left min-w-0 w-20">
                    <div className="text-sm font-medium truncate">
                      {getUserFirstName()}
                    </div>
                  </div>

                  <AiOutlineDown
                    size={14}
                    className={`text-muted-foreground transition-transform flex-shrink-0 ${
                      showUserMenu ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Desktop Dropdown Menu */}
                {showUserMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowUserMenu(false)}
                    />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-20">
                      {/* User Info Header */}
                      <div className="px-4 py-3 border-b border-border">
                        <div className="flex items-center gap-3">
                          <Avatar
                            size={40}
                            editable={false}
                            className="flex-shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">
                              {user?.firstName && user?.lastName
                                ? `${user.firstName} ${user.lastName}`
                                : getUserFirstName()}
                            </div>
                            <div className="text-xs text-muted-foreground capitalize truncate">
                              {getUserRole()} Account
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <AiOutlineUser size={16} className="flex-shrink-0" />
                          <span>View Profile</span>
                        </Link>

                        {user?.role === 'candidate' && (
                          <Link
                            to="/dashboard"
                            className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <AiOutlineUser
                              size={16}
                              className="flex-shrink-0"
                            />
                            <span>My CV Dashboard</span>
                          </Link>
                        )}

                        <div className="border-t border-border my-2"></div>

                        <button
                          onClick={logout}
                          className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors w-full text-left text-red-600 hover:text-red-700"
                        >
                          <AiOutlineLogout
                            size={16}
                            className="flex-shrink-0"
                          />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Mobile Actions */}
              <div className="lg:hidden flex items-center gap-2">
                {/* Mobile Notifications */}
                {/* <button className="p-2 text-muted-foreground hover:text-foreground transition-colors relative">
                  <AiOutlineBell size={20} />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    3
                  </span>
                </button> */}

                {/* Mobile Menu Button */}
                <button
                  onClick={handleMobileMenuToggle}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showMobileMenu ? (
                    <AiOutlineClose size={20} />
                  ) : (
                    <AiOutlineMenu size={20} />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="lg:hidden border-t border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
              <div className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md font-medium transition-colors ${
                      activeTab === item.id
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </Link>
                ))}

                {/* Mobile User Section */}
                <div className="pt-4 mt-4 border-t border-border">
                  <div className="flex items-center gap-3 px-3 py-2">
                    <Avatar
                      size={40}
                      editable={false}
                      className="flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">
                        {user?.firstName && user?.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : getUserFirstName()}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize truncate">
                        {getUserRole()} Account
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 space-y-1">
                    <Link
                      to="/profile"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                    >
                      <AiOutlineUser className="w-4 h-4 flex-shrink-0" />
                      <span>Profile</span>
                    </Link>
                    {user?.role === 'candidate' && (
                      <Link
                        to="/dashboard"
                        onClick={closeMobileMenu}
                        className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                      >
                        <AiOutlineUser className="w-4 h-4 flex-shrink-0" />
                        <span>My CV Dashboard</span>
                      </Link>
                    )}
                    <button
                      onClick={logout}
                      className="flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-md transition-colors w-full text-left"
                    >
                      <AiOutlineLogout className="w-4 h-4 flex-shrink-0" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Overlay for mobile menus */}
      {(showMobileMenu || showUserMenu) && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => {
            setShowMobileMenu(false);
            setShowUserMenu(false);
          }}
        />
      )}
    </>
  );
};

export default JobBoardHeader;
