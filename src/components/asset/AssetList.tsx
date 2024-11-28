import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Asset, Sector } from '../../types';
import { format } from 'date-fns';
import { Package, ArrowRightLeft, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';
import TransferModal from './TransferModal';
import Pagination from '../common/Pagination';
import { usePagination } from '../../hooks/usePagination';

export default function AssetList() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [currentSector, setCurrentSector] = useState<Sector | ''>('');
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);

  const {
    currentPage,
    totalPages,
    itemsPerPage,
    currentItems: paginatedAssets,
    totalItems,
    handlePageChange,
    handleItemsPerPageChange
  } = usePagination({ items: filteredAssets });

  const SECTORS: Sector[] = [
    'Sargenteação', 'Comando', 'Subcomando', 'Copom e RPA',
    'Cozinha', 'Lavanderia', 'Banheiros e Lavacar', 'Sala de Aula',
    'Rotam', 'Academia', 'Associação', 'Removido'
  ];

  useEffect(() => {
    fetchAssets();
  }, []);

  useEffect(() => {
    filterAssets();
  }, [currentSector, assets]);

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
      setFilteredAssets(assetData); // Inicialmente, mostra todos os ativos
    } catch (error) {
      console.error('Error fetching assets:', error);
      toast.error('Erro ao carregar patrimônios');
    } finally {
      setLoading(false);
    }
  };

  const filterAssets = () => {
    if (!currentSector) {
      setFilteredAssets(assets);
    } else {
      const filtered = assets.filter(asset => asset.sector === currentSector);
      setFilteredAssets(filtered);
    }
  };

  const handleSectorChange = (sector: Sector | '') => {
    setCurrentSector(sector);
    if (!sector) {
      setFilteredAssets(assets);
    } else {
      const filtered = assets.filter(asset => asset.sector === sector);
      setFilteredAssets(filtered);
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
            value={currentSector}
            onChange={(e) => handleSectorChange(e.target.value as Sector)}
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
            {currentSector 
              ? `Nenhum patrimônio encontrado no setor ${currentSector}`
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
                    Setor
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
                {paginatedAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
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
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </div>
      )}

      {showTransferModal && selectedAsset && (
        <TransferModal
          asset={selectedAsset}
          onClose={() => {
            setShowTransferModal(false);
            setSelectedAsset(null);
          }}
          onTransfer={async (toSector, reason) => {
            try {
              // Implemente a lógica de transferência aqui
              toast.success('Patrimônio transferido com sucesso');
              await fetchAssets(); // Recarrega os dados após a transferência
              setShowTransferModal(false);
              setSelectedAsset(null);
            } catch (error) {
              console.error('Error transferring asset:', error);
              toast.error('Erro ao transferir patrimônio');
            }
          }}
          sectors={SECTORS.filter(s => s !== selectedAsset.sector)}
        />
      )}
    </div>
  );
}