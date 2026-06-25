import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from './store/auth.store';

/* Pages */
import Hero from './components/Hero';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Analytics from './pages/Analytics';
import Savings from './pages/Savings';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Profile from './pages/profile';

/* Layout */
import Layout from './components/common/Layout';

/* =======================
   AUTH ROUTES
======================= */

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, token } = useAuthStore();

  if (!token || !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, token } = useAuthStore();

  if (token && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

/* =======================
   ANIMATION
======================= */
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

function App() {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>

          {/* HOME */}
          <Route
            path="/"
            element={
              <PublicRoute>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  <Hero />
                </motion.div>
              </PublicRoute>
            }
          />

          {/* LOGIN */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <motion.div
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={pageVariants}
                >
                  <Login />
                </motion.div>
              </PublicRoute>
            }
          />

          {/* REGISTER */}
          <Route
            path="/register"
            element={
              <PublicRoute>
                <motion.div
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={pageVariants}
                >
                  <Register />
                </motion.div>
              </PublicRoute>
            }
          />

          {/* PROTECTED ROUTES */}
          {[
            { path: "/dashboard", element: <Dashboard /> },
            { path: "/transactions", element: <Transactions /> },
            { path: "/budgets", element: <Budgets /> },
            { path: "/analytics", element: <Analytics /> },
            { path: "/savings", element: <Savings /> },
            { path: "/reports", element: <Reports /> },
            { path: "/profile", element: <Profile /> },
            { path: "/settings", element: <Settings /> },
          ].map(({ path, element }) => (
            <Route
              key={path}
              path={path}
              element={
                <PrivateRoute>
                  <Layout>
                    <motion.div
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      variants={pageVariants}
                    >
                      {element}
                    </motion.div>
                  </Layout>
                </PrivateRoute>
              }
            />
          ))}

          {/* CATCH ALL */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </AnimatePresence>
    </Router>
  );
}

export default App;