import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Package, Calendar } from 'lucide-react';

export default function SystemChoice() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        <button
          onClick={() => navigate('/vehicles')}
          className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-indigo-500 dark:hover:border-indigo-400"
        >
          <Car className="w-16 h-16 text-indigo-600 dark:text-indigo-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Sistema de Veículos
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-center">
            Gerenciamento de veículos apreendidos e documentação
          </p>
        </button>

        <button
          onClick={() => navigate('/assets')}
          className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-indigo-500 dark:hover:border-indigo-400"
        >
          <Package className="w-16 h-16 text-indigo-600 dark:text-indigo-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Sistema de Patrimônio
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-center">
            Controle e gerenciamento de patrimônio da unidade
          </p>
        </button>

        <button
          onClick={() => navigate('/calendar')}
          className="flex flex-col items-center justify-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-indigo-500 dark:hover:border-indigo-400"
        >
          <Calendar className="w-16 h-16 text-indigo-600 dark:text-indigo-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Ordem de Serviços
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-center">
            Calendário e agendamento de ordens de serviço
          </p>
        </button>
      </div>
    </div>
  );
}