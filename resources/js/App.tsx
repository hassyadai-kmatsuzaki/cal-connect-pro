import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { isCentralDomain } from './utils/api';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TenantHome from './pages/TenantHome';
import PrivateRoute from './components/PrivateRoute';

// Tenant Admin Pages
import CalendarList from './pages/tenant/CalendarList';
import CalendarNew from './pages/tenant/CalendarNew';
import CalendarDetail from './pages/tenant/CalendarDetail';
import CalendarEdit from './pages/tenant/CalendarEdit';
import LineSettings from './pages/tenant/LineSettings';
import HearingForms from './pages/tenant/HearingForms';
import InflowAnalysis from './pages/tenant/InflowAnalysis';
import UserManagement from './pages/tenant/UserManagement';
import TagManagement from './pages/tenant/TagManagement';
import GoogleCalendar from './pages/tenant/GoogleCalendar';
import Availability from './pages/tenant/Availability';
import ReservationManagement from './pages/tenant/ReservationManagement';
import ReservationDetail from './pages/tenant/ReservationDetail';
import ReservationForm from './pages/tenant/ReservationForm';

const App: React.FC = () => {
  const isCentral = isCentralDomain();

  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {isCentral ? (
          <>
            {/* セントラルドメインのルート */}
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            
            {/* 古いパスからのリダイレクト */}
            <Route path="/admin/*" element={<Navigate to="/dashboard" replace />} />
          </>
        ) : (
          <>
            {/* テナントドメインのルート */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <TenantHome />
                </PrivateRoute>
              }
            />
            
            {/* Admin用ルート - 具体的なルートを先に定義 */}
            <Route
              path="/calendars/new"
              element={
                <PrivateRoute>
                  <CalendarNew />
                </PrivateRoute>
              }
            />
            <Route
              path="/calendars/:id/edit"
              element={
                <PrivateRoute>
                  <CalendarEdit />
                </PrivateRoute>
              }
            />
            <Route
              path="/calendars/:id"
              element={
                <PrivateRoute>
                  <CalendarDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/calendars"
              element={
                <PrivateRoute>
                  <CalendarList />
                </PrivateRoute>
              }
            />
            <Route
              path="/line-settings"
              element={
                <PrivateRoute>
                  <LineSettings />
                </PrivateRoute>
              }
            />
            <Route
              path="/hearing-forms"
              element={
                <PrivateRoute>
                  <HearingForms />
                </PrivateRoute>
              }
            />
            <Route
              path="/inflow-analysis"
              element={
                <PrivateRoute>
                  <InflowAnalysis />
                </PrivateRoute>
              }
            />
            <Route
              path="/user-management"
              element={
                <PrivateRoute>
                  <UserManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/tag-management"
              element={
                <PrivateRoute>
                  <TagManagement />
                </PrivateRoute>
              }
            />
            <Route
              path="/reservations/new"
              element={
                <PrivateRoute>
                  <ReservationForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/reservations/:id/edit"
              element={
                <PrivateRoute>
                  <ReservationForm />
                </PrivateRoute>
              }
            />
            <Route
              path="/reservations/:id"
              element={
                <PrivateRoute>
                  <ReservationDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/reservations"
              element={
                <PrivateRoute>
                  <ReservationManagement />
                </PrivateRoute>
              }
            />
            
            {/* User用ルート */}
            <Route
              path="/google-calendar"
              element={
                <PrivateRoute>
                  <GoogleCalendar />
                </PrivateRoute>
              }
            />
            <Route
              path="/availability"
              element={
                <PrivateRoute>
                  <Availability />
                  </PrivateRoute>
              }
            />
              
        </>
        )}
        
        {/* 404ページ - すべての未定義ルート */}
        <Route path="*" element={<Navigate to={isCentral ? "/dashboard" : "/"} replace />} />
      </Routes>
    </AuthProvider>
  );
};

export default App;
