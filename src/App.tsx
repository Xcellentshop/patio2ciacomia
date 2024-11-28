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
import SystemChoice from './components/SystemChoice';
import Calendar from './components/calendar/Calendar';
import AssetList from './components/asset/AssetList';
import AssetForm from './components/asset/AssetForm';
import AssetSearch from './components/asset/AssetSearch';
import AssetReports from './components/asset/AssetReports';
import SectorManagement from './components/asset/SectorManagement';

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
                        <Route path="/" element={<SystemChoice />} />
                        
                        {/* Vehicle Routes */}
                        <Route path="/vehicles" element={<VehicleList />} />
                        <Route path="/vehicles/new" element={<VehicleForm />} />
                        <Route path="/vehicles/edit/:id" element={<VehicleForm />} />
                        <Route path="/vehicles/search" element={<VehicleSearch />} />
                        <Route path="/vehicles/reports" element={<Reports />} />
                        
                        {/* Asset Routes */}
                        <Route path="/assets" element={<AssetList />} />
                        <Route path="/assets/new" element={<AssetForm />} />
                        <Route path="/assets/edit/:id" element={<AssetForm />} />
                        <Route path="/assets/search" element={<AssetSearch />} />
                        <Route path="/assets/reports" element={<AssetReports />} />
                        <Route path="/assets/sectors" element={<SectorManagement />} />

                        {/* Calendar Routes */}
                        <Route path="/calendar" element={<Calendar />} />
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