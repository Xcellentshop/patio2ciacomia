import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, FileText, Search, PlusCircle, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'react-hot-toast';

export default function Navbar() {
  const { logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  return (
    <nav className="bg-indigo-600 dark:bg-indigo-900 text-white shadow-lg transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Car className="h-6 w-6" />
            <span className="font-bold text-lg">Sistema de Veículos</span>
          </Link>
          
          <div className="flex items-center space-x-4">
            <Link to="/cadastro" className="flex items-center space-x-1 hover:text-indigo-200 transition">
              <PlusCircle className="h-5 w-5" />
              <span>Cadastrar</span>
            </Link>
            
            <Link to="/busca" className="flex items-center space-x-1 hover:text-indigo-200 transition">
              <Search className="h-5 w-5" />
              <span>Buscar</span>
            </Link>
            
            <Link to="/relatorios" className="flex items-center space-x-1 hover:text-indigo-200 transition">
              <FileText className="h-5 w-5" />
              <span>Relatórios</span>
            </Link>

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