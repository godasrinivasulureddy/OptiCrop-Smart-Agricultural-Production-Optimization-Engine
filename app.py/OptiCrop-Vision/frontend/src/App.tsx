import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { PredictPage } from './pages/PredictPage';
import { LeafDiagnosisPage } from './pages/LeafDiagnosisPage';
import { HistoryPage } from './pages/HistoryPage';
import { ReportsPage } from './pages/ReportsPage';
import { AdminPage } from './pages/AdminPage';
import { FarmerAssistantPage } from './pages/FarmerAssistantPage';
import { LandingPage } from './pages/LandingPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<LandingPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            
            <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="predict" element={<ProtectedRoute><PredictPage /></ProtectedRoute>} />
            <Route path="leaf-diagnosis" element={<ProtectedRoute><LeafDiagnosisPage /></ProtectedRoute>} />
            <Route path="assistant" element={<ProtectedRoute><FarmerAssistantPage /></ProtectedRoute>} />
            <Route path="history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
            <Route path="reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
            <Route path="reports/:id" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
            <Route path="admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
