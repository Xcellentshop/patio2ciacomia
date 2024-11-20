import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
<<<<<<< HEAD
import { Car, FileText, Search, PlusCircle, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
=======
import { Car, FileText, Search, PlusCircle, LogOut, Sun, Moon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
>>>>>>> 55a98a4 (Primeiro commit)
import { toast } from 'react-hot-toast';

export default function Navbar() {
  const { logout } = useAuth();
<<<<<<< HEAD
=======
  const { isDark, toggleTheme } = useTheme();
>>>>>>> 55a98a4 (Primeiro commit)
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
<<<<<<< HEAD
    <nav className="bg-indigo-600 text-white shadow-lg">
=======
    <nav className="bg-indigo-600 dark:bg-indigo-900 text-white shadow-lg transition-colors duration-200">
>>>>>>> 55a98a4 (Primeiro commit)
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <Car className="h-6 w-6" />
            <span className="font-bold text-lg">Sistema de Veículos</span>
          </Link>
          
<<<<<<< HEAD
          <div className="flex space-x-4">
=======
          <div className="flex items-center space-x-4">
>>>>>>> 55a98a4 (Primeiro commit)
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
<<<<<<< HEAD
=======
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
>>>>>>> 55a98a4 (Primeiro commit)
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