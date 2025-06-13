import { BrowserRouter, Routes, Route } from 'react-router-dom';

/* context */
import { CvProvider } from './context/CvContext';
import { AuthProvider } from './context/AuthContext';
import { useCvContext } from './context/CvContext';

/* pages */
import Register from './pages/Register';
import Login from './pages/Login';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import TemplatePreview from './pages/TemplatePreview';
import JobBoard from './pages/JobBoard';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

/* components */
import FontLoader from './components/ui/FontLoader';
import ProtectedRoute from './pages/ProtectedRoute';
import DiscoverJobs from './components/jobboard/discover/DiscoverJobs';
import PostJob from './components/jobboard/post/PostJob';
import ProfileDetails from './components/profile/ProfileDetails';
import Security from './components/profile/Security';
import Notifications from './components/profile/Notifications';
import Settings from './components/profile/Settings';

import { ToastContainer } from 'react-toastify';
import ApplicationManager from './components/jobboard/application-manager/ApplicationManager';
import JobManager from './components/jobboard/job-manager/JobManager';
import HrApplications from './components/jobboard/applications/HrApplications';
import EditPage from './components/jobboard/job/EditPage';

function FontLoaderWrapper({ children }: { children: React.ReactNode }) {
  const { cvData } = useCvContext();
  const fontFamily = cvData?.data?.theme?.fontFamily || 'Arial';

  return (
    <>
      <FontLoader fontFamily={fontFamily} />
      {children}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          >
            <Route path="personal" element={<ProfileDetails />} />
            <Route path="security" element={<Security />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          <Route
            path="/job-board/jobs/applications/:jobId"
            element={
              <ProtectedRoute allowedRoles={['hr']}>
                <HrApplications />
              </ProtectedRoute>
            }
          />

          <Route
            path="/job-board/jobs/edit/:jobId"
            element={
              <ProtectedRoute allowedRoles={['hr']}>
                <EditPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/job-board"
            element={
              <ProtectedRoute>
                <JobBoard />
              </ProtectedRoute>
            }
          >
            <Route
              path="discover"
              element={
                <ProtectedRoute allowedRoles={['candidate']}>
                  <DiscoverJobs />
                </ProtectedRoute>
              }
            />

            {/* Routes only for HR/Employers */}
            <Route
              path="post"
              element={
                <ProtectedRoute allowedRoles={['hr']}>
                  <PostJob />
                </ProtectedRoute>
              }
            />
            <Route
              path="job-manager"
              element={
                <ProtectedRoute allowedRoles={['hr']}>
                  <JobManager />
                </ProtectedRoute>
              }
            />

            <Route
              path="application-manager"
              element={
                <ProtectedRoute requiredRole="candidate">
                  <ApplicationManager />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="candidate">
                <CvProvider>
                  <FontLoaderWrapper>
                    <Dashboard />
                  </FontLoaderWrapper>
                </CvProvider>
              </ProtectedRoute>
            }
          />

          <Route
            path="/shareCv/:token"
            element={
              <CvProvider>
                <FontLoaderWrapper>
                  <TemplatePreview />
                </FontLoaderWrapper>
              </CvProvider>
            }
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>

      {/* Toast Notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </BrowserRouter>
  );
}

export default App;
