import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Agendas from './pages/Agendas';
import Processes from './pages/Processes';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import { useStore } from './store';

function App() {
  const { auth } = useStore();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={!auth.isAuthenticated ? <Login /> : <Navigate to="/" />} />
        <Route path="/signup" element={!auth.isAuthenticated ? <Signup /> : <Navigate to="/" />} />
        <Route path="/forgot-password" element={!auth.isAuthenticated ? <ForgotPassword /> : <Navigate to="/" />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            auth.isAuthenticated ? (
              <Layout>
                <Dashboard />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/agendas"
          element={
            auth.isAuthenticated ? (
              <Layout>
                <Agendas />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/processes"
          element={
            auth.isAuthenticated ? (
              <Layout>
                <Processes />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
        <Route
          path="/settings"
          element={
            auth.isAuthenticated ? (
              <Layout>
                <Settings />
              </Layout>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;