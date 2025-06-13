import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AiOutlineHome,
  AiOutlineArrowLeft,
  AiOutlineSearch,
  AiOutlineUser,
} from 'react-icons/ai';

const NotFound: React.FC = () => {
  const navigate = useNavigate();

  const handleGoBack = () => {
    navigate(-1);
  };

  const popularPages = [
    {
      title: 'Dashboard',
      description: 'Manage your CV and templates',
      href: '/dashboard',
      icon: <AiOutlineUser size={20} />,
    },
    {
      title: 'Job Board',
      description: 'Discover and apply for jobs',
      href: '/job-board',
      icon: <AiOutlineSearch size={20} />,
    },
    {
      title: 'Profile',
      description: 'View and edit your profile',
      href: '/profile',
      icon: <AiOutlineUser size={20} />,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-2xl w-full">
        {/* Main Content Container */}
        <div className="text-center">
          {/* 404 Illustration */}
          <div className="mb-12">
            <div className="relative">
              {/* Large 404 Text */}
              <div className="text-8xl sm:text-9xl lg:text-[12rem] font-bold text-primary/10 mb-4 leading-none">
                404
              </div>
            </div>
          </div>

          {/* Error Message Section */}
          <div className="mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Oops! Page Not Found
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-md mx-auto leading-relaxed">
              The page you're looking for seems to have wandered off. Don't
              worry, we'll help you find your way back!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mb-16">
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <button
                onClick={handleGoBack}
                className="cursor-pointer flex items-center justify-center gap-3 px-8 py-4 bg-card border-2 border-border text-foreground rounded-xl hover:bg-muted hover:border-primary/30 transition-all duration-200 font-medium shadow-sm"
              >
                <AiOutlineArrowLeft size={20} />
                Go Back
              </button>
              <Link
                to="/"
                className="flex items-center justify-center gap-3 px-8 py-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <AiOutlineHome size={20} />
                Go Home
              </Link>
            </div>
          </div>
        </div>

        {/* Popular Pages Section */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-3">
              Popular Destinations
            </h2>
            <p className="text-muted-foreground">
              Maybe one of these pages is what you're looking for?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {popularPages.map((page, index) => (
              <Link
                key={page.href}
                to={page.href}
                className="group relative overflow-hidden bg-background border border-border rounded-xl p-6 hover:border-primary/30 transition-all duration-300 hover:shadow-md transform hover:-translate-y-1"
              >
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-300"></div>

                {/* Icon */}
                <div className="relative mb-4">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
                    {page.icon}
                  </div>
                </div>

                {/* Content */}
                <div className="relative">
                  <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {page.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {page.description}
                  </p>
                </div>

                {/* Hover indicator */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-t-full"></div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
