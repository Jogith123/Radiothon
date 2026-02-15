/**
 * App Entry Point
 * Main app with routing, auth protection, context providers, and route transitions.
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layout & Pages
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import LiveCalls from './pages/LiveCalls';
import Analytics from './pages/Analytics';
import CallHistory from './pages/CallHistory';
import ContentLibrary from './pages/ContentLibrary';
import Login from './pages/Login';

// Auth
import ProtectedRoute from './components/auth/ProtectedRoute';

// Context Providers
import { AuthProvider } from './context/AuthContext';
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
 * Protected dashboard routes — only accessible after admin login
 */
const ProtectedRoutes = () => {
  return (
    <ProtectedRoute>
      <WebSocketProvider>
        <DashboardLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/calls" element={<LiveCalls />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/history" element={<CallHistory />} />
            <Route path="/content" element={<ContentLibrary />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DashboardLayout>
      </WebSocketProvider>
    </ProtectedRoute>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ThemeProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/*" element={<ProtectedRoutes />} />
            </Routes>
          </ThemeProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

