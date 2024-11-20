import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './components/Login';
import Navbar from './components/Navbar';
import VehicleForm from './components/VehicleForm';
import VehicleList from './components/VehicleList';
import VehicleSearch from './components/VehicleSearch';
import Reports from './components/Reports';
import Chat from './components/Chat';

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <PrivateRoute>
                  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                    <Navbar />
                    <main className="container mx-auto py-8 px-4">
                      <Routes>
                        <Route path="/" element={<VehicleList />} />
                        <Route path="/cadastro" element={<VehicleForm />} />
                        <Route path="/editar/:id" element={<VehicleForm />} />
                        <Route path="/busca" element={<VehicleSearch />} />
                        <Route path="/relatorios" element={<Reports />} />
                      </Routes>
                    </main>
                    <Chat />
                  </div>
                </PrivateRoute>
              }
            />
          </Routes>
          <Toaster position="top-right" />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}