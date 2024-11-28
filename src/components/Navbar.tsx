import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Car, FileText, Search, PlusCircle, LogOut, Sun, Moon, Package, Home, List } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-hot-toast';

export default function Navbar() {
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  const isVehicleSection = location.pathname.startsWith('/vehicles');
  const isAssetSection = location.pathname.startsWith('/assets');
  const isCalendarSection = location.pathname.startsWith('/calendar');

  return (
    <nav className="bg-indigo-600 dark:bg-indigo-900 text-white shadow-lg transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <Home className="h-6 w-6" />
              <span className="font-bold text-lg">Início</span>
            </Link>

            {isVehicleSection && (
              <>
                <Link to="/vehicles" className="flex items-center space-x-2">
                  <List className="h-5 w-5" />
                  <span>Geral</span>
                </Link>
                <Link to="/vehicles/new" className="flex items-center space-x-1 hover:text-indigo-200 transition">
                  <PlusCircle className="h-5 w-5" />
                  <span>Cadastrar</span>
                </Link>
                <Link to="/vehicles/search" className="flex items-center space-x-1 hover:text-indigo-200 transition">
                  <Search className="h-5 w-5" />
                  <span>Buscar</span>
                </Link>
                <Link to="/vehicles/reports" className="flex items-center space-x-1 hover:text-indigo-200 transition">
                  <FileText className="h-5 w-5" />
                  <span>Relatórios</span>
                </Link>
              </>
            )}

            {isAssetSection && (
              <>
                <Link to="/assets" className="flex items-center space-x-2">
                  <List className="h-5 w-5" />
                  <span>Geral</span>
                </Link>
                <Link to="/assets/new" className="flex items-center space-x-1 hover:text-indigo-200 transition">
                  <PlusCircle className="h-5 w-5" />
                  <span>Cadastrar</span>
                </Link>
                <Link to="/assets/search" className="flex items-center space-x-1 hover:text-indigo-200 transition">
                  <Search className="h-5 w-5" />
                  <span>Buscar</span>
                </Link>
                <Link to="/assets/reports" className="flex items-center space-x-1 hover:text-indigo-200 transition">
                  <FileText className="h-5 w-5" />
                  <span>Relatórios</span>
                </Link>
                <Link to="/assets/sectors" className="flex items-center space-x-1 hover:text-indigo-200 transition">
                  <Package className="h-5 w-5" />
                  <span>Setores</span>
                </Link>
              </>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {!isVehicleSection && !isAssetSection && !isCalendarSection && (
              <>
                <Link to="/vehicles" className="flex items-center space-x-1 hover:text-indigo-200 transition">
                  <Car className="h-5 w-5" />
                  <span>Veículos</span>
                </Link>
                <Link to="/assets" className="flex items-center space-x-1 hover:text-indigo-200 transition">
                  <Package className="h-5 w-5" />
                  <span>Patrimônio</span>
                </Link>
              </>
            )}

            {/* Removida a verificação para isCalendarSection */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-indigo-700 dark:hover:bg-indigo-800 transition-colors"
              aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
            >
              {isDark ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 hover:text-indigo-200 transition"
            >
              <LogOut className="h-5 w-5" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}