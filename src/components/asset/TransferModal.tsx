import React, { useState } from 'react';
import { Asset, Sector } from '../../types';
import { X } from 'lucide-react';

interface TransferModalProps {
  asset: Asset;
  onClose: () => void;
  onTransfer: (toSector: Sector, reason?: string) => void;
  sectors: Sector[];
}

export default function TransferModal({ asset, onClose, onTransfer, sectors }: TransferModalProps) {
  const [selectedSector, setSelectedSector] = useState<Sector>('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSector) return;
    onTransfer(selectedSector, reason);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Transferir Patrimônio
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Transferindo: <span className="font-medium">{asset.description}</span>
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Setor atual: <span className="font-medium">{asset.sector}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Novo Setor
            </label>
            <select
              required
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value as Sector)}
            >
              <option value="">Selecione o setor</option>
              {sectors.map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Motivo da Transferência
            </label>
            <textarea
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Descreva o motivo da transferência..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600"
            >
              Transferir
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}