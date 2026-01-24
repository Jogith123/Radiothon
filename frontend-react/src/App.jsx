/**
 * App Entry Point
 * Main app with routing, context providers, and route transitions.
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Layout & Pages
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import LiveCalls from './pages/LiveCalls';
import Analytics from './pages/Analytics';
import PlaceholderPage from './pages/PlaceholderPage';

// Context Providers
import { ThemeProvider } from './context/ThemeContext';
import { WebSocketProvider } from './context/WebSocketContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: 1,
    },
  },
});

/**
 * Animated routes wrapper for page transitions
 */
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/calls" element={<LiveCalls />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/content" element={<PlaceholderPage title="Content Library" />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <WebSocketProvider>
            <DashboardLayout>
              <AnimatedRoutes />
            </DashboardLayout>
          </WebSocketProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

