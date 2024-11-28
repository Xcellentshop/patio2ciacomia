import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Asset, Sector } from '../../types';
import { format } from 'date-fns';
import { Package, ArrowRightLeft, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import TransferModal from './TransferModal';

const SECTORS: Sector[] = [
  'Sargenteação', 'Comando', 'Subcomando', 'Copom e RPA',
  'Cozinha', 'Lavanderia', 'Banheiros e Lavacar', 'Sala de Aula',
  'Rotam', 'Academia', 'Associação', 'Removido'
];

export default function SectorManagement() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState<Sector | ''>('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);

  useEffect(() => {
    fetchAssets();
  }, [selectedSector]);

  useEffect(() => {
    filterAssets();
  }, [selectedSector, assets]);

  const fetchAssets = async () => {
    try {
      const assetsRef = collection(db, 'assets');
      const q = query(assetsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const assetData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Asset[];
      setAssets(assetData);
    } catch (error) {
      console.error('Error fetching assets:', error);
      toast.error('Erro ao carregar patrimônios');
    } finally {
      setLoading(false);
    }
  };

  const filterAssets = () => {
    if (!selectedSector) {
      setFilteredAssets(assets);
    } else {
      const filtered = assets.filter(asset => asset.sector === selectedSector);
      setFilteredAssets(filtered);
    }
  };

  const handleTransfer = async (toSector: Sector, reason?: string) => {
    if (!selectedAsset?.id) return;

    try {
      const assetRef = doc(db, 'assets', selectedAsset.id);
      const transferHistory = [
        ...(selectedAsset.transferHistory || []),
        {
          fromSector: selectedAsset.sector,
          toSector,
          date: new Date().toISOString(),
          reason
        }
      ];

      await updateDoc(assetRef, {
        sector: toSector,
        transferHistory,
        updatedAt: new Date().toISOString()
      });

      toast.success('Patrimônio transferido com sucesso');
      fetchAssets();
      setShowTransferModal(false);
      setSelectedAsset(null);
    } catch (error) {
      console.error('Error transferring asset:', error);
      toast.error('Erro ao transferir patrimônio');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusColor = (state: string) => {
    const colors = {
      'Novo': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'Bom': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'Regular': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'Ruim': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      'Inservível': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return colors[state as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Gerenciamento por Setor
          </h2>
          <select
            className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={selectedSector}
            onChange={(e) => setSelectedSector(e.target.value as Sector)}
          >
            <option value="">Todos os setores</option>
            {SECTORS.map(sector => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
        </div>
      </div>

      {filteredAssets.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md text-center">
          <p className="text-gray-600 dark:text-gray-300">
            {selectedSector 
              ? `Nenhum patrimônio encontrado no setor ${selectedSector}`
              : 'Nenhum patrimônio cadastrado'}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Plaquetas
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Setor Atual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAssets.map((asset) => (
                  <React.Fragment key={asset.id}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <div>
                          <p>Geral: {asset.generalTag}</p>
                          <p>Local: {asset.localTag}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                        <div>
                          <p className="font-medium">{asset.description}</p>
                          <p className="text-xs text-gray-400">{asset.assetClass}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          asset.sector === 'Removido' 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {asset.sector}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(asset.conservationState)}`}>
                          {asset.conservationState}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <div>
                          <p>Aquisição: {formatCurrency(asset.acquisitionValue)}</p>
                          <p>Atual: {formatCurrency(asset.netValue)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedAsset(asset);
                              setShowTransferModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Transferir"
                          >
                            <ArrowRightLeft className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setShowHistory(showHistory === asset.id ? null : asset.id)}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                            title="Histórico"
                          >
                            <FileText className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {showHistory === asset.id && asset.transferHistory && (
                      <tr className="bg-gray-50 dark:bg-gray-700">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="space-y-4">
                            <h4 className="font-semibold text-gray-900 dark:text-white">Histórico de Transferências</h4>
                            {asset.transferHistory.length > 0 ? (
                              <div className="space-y-2">
                                {asset.transferHistory.map((transfer, index) => (
                                  <div key={index} className="text-sm text-gray-600 dark:text-gray-300 border-l-2 border-indigo-500 pl-3">
                                    <p>
                                      De: <span className="font-medium">{transfer.fromSector}</span> →{' '}
                                      Para: <span className="font-medium">{transfer.toSector}</span>
                                    </p>
                                    <p>Data: {format(new Date(transfer.date), 'dd/MM/yyyy HH:mm')}</p>
                                    {transfer.reason && (
                                      <p>Motivo: {transfer.reason}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                Nenhuma transferência registrada
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showTransferModal && selectedAsset && (
        <TransferModal
          asset={selectedAsset}
          onClose={() => {
            setShowTransferModal(false);
            setSelectedAsset(null);
          }}
          onTransfer={handleTransfer}
          sectors={SECTORS.filter(s => s !== selectedAsset.sector)}
        />
      )}
    </div>
  );
}