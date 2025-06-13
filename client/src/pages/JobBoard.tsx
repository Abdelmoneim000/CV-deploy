import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

import JobBoardHeader from '@/components/jobboard/JobBoardHeader';
import Container from '@/components/ui/Container';
import useAuth from '@/hooks/useAuth';

const JobBoard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'hr') {
      if (location.pathname === '/job-board') {
        navigate('/job-board/job-manager', { replace: true });
      }
    } else {
      if (location.pathname === '/job-board') {
        navigate('/job-board/discover', { replace: true });
      }
    }
  }, [location.pathname, navigate, user]);

  return (
    <div className="min-h-screen bg-background">
      <JobBoardHeader />

      <Container>
        <Outlet />
      </Container>
    </div>
  );
};

export default JobBoard;
