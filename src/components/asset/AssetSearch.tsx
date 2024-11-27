import React, { useState } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Asset, Sector, AssetClass, ConservationState } from '../../types';
import { Search, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const SECTORS: Sector[] = [
  'Sargenteação', 'Comando', 'Subcomando', 'Copom e RPA',
  'Cozinha', 'Lavanderia', 'Banheiros e Lavacar', 'Sala de Aula',
  'Rotam', 'Academia', 'Associação', 'Removido'
];

const ASSET_CLASSES: AssetClass[] = [
  'Mobiliário em geral',
  'Aparelhos e utensílios domésticos',
  'Equipamentos de processamento de dados',
  'Aparelhos e equipamentos para esporte e diversão',
  'Aparelhos ou equipamentos ou utensílios de médico-odontológico-hospitalar',
  'Equipamentos de proteção-segurança-socorro',
  'Equipamentos para áudio-vídeo-imagem',
  'Máquinas e equipamentos energéticos',
  'Máquinas e equipamentos agrícolas e rodoviários'
];

const CONSERVATION_STATES: ConservationState[] = [
  'Novo', 'Bom', 'Regular', 'Ruim', 'Inservível'
];

export default function AssetSearch() {
  const [searchParams, setSearchParams] = useState({
    generalTag: '',
    localTag: '',
    description: '',
    sector: '',
    assetClass: '',
    conservationState: '',
    startAcquisitionDate: '',
    endAcquisitionDate: '',
    minValue: '',
    maxValue: ''
  });
  const [results, setResults] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let baseQuery = collection(db, 'assets');
      let constraints: any[] = [];

      // Add orderBy to sort by createdAt
      constraints.push(orderBy('createdAt', 'desc'));

      if (searchParams.generalTag) {
        constraints.push(where('generalTag', '==', searchParams.generalTag));
      }

      if (searchParams.localTag) {
        constraints.push(where('localTag', '==', searchParams.localTag));
      }

      if (searchParams.sector) {
        constraints.push(where('sector', '==', searchParams.sector));
      }

      if (searchParams.assetClass) {
        constraints.push(where('assetClass', '==', searchParams.assetClass));
      }

      if (searchParams.conservationState) {
        constraints.push(where('conservationState', '==', searchParams.conservationState));
      }

      const q = query(baseQuery, ...constraints);
      const querySnapshot = await getDocs(q);
      
      let assets = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Asset[];

      // Additional filtering for complex conditions
      assets = assets.filter(asset => {
        let matches = true;

        if (searchParams.description) {
          matches = matches && asset.description.toLowerCase().includes(searchParams.description.toLowerCase());
        }

        if (searchParams.startAcquisitionDate || searchParams.endAcquisitionDate) {
          const acquisitionDate = new Date(asset.acquisitionDate);
          if (searchParams.startAcquisitionDate) {
            matches = matches && acquisitionDate >= new Date(searchParams.startAcquisitionDate);
          }
          if (searchParams.endAcquisitionDate) {
            matches = matches && acquisitionDate <= new Date(searchParams.endAcquisitionDate);
          }
        }

        if (searchParams.minValue) {
          matches = matches && asset.netValue >= parseFloat(searchParams.minValue);
        }

        if (searchParams.maxValue) {
          matches = matches && asset.netValue <= parseFloat(searchParams.maxValue);
        }

        return matches;
      });

      setResults(assets);
    } catch (error) {
      console.error('Error searching assets:', error);
      toast.error('Erro ao buscar patrimônios');
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Buscar Patrimônio</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Plaqueta Geral
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchParams.generalTag}
              onChange={(e) => setSearchParams({ ...searchParams, generalTag: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Plaqueta Local
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchParams.localTag}
              onChange={(e) => setSearchParams({ ...searchParams, localTag: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descrição
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchParams.description}
              onChange={(e) => setSearchParams({ ...searchParams, description: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Setor
            </label>
            <select
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchParams.sector}
              onChange={(e) => setSearchParams({ ...searchParams, sector: e.target.value })}
            >
              <option value="">Todos os setores</option>
              {SECTORS.map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Classe
            </label>
            <select
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchParams.assetClass}
              onChange={(e) => setSearchParams({ ...searchParams, assetClass: e.target.value })}
            >
              <option value="">Todas as classes</option>
              {ASSET_CLASSES.map(assetClass => (
                <option key={assetClass} value={assetClass}>{assetClass}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estado de Conservação
            </label>
            <select
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchParams.conservationState}
              onChange={(e) => setSearchParams({ ...searchParams, conservationState: e.target.value })}
            >
              <option value="">Todos os estados</option>
              {CONSERVATION_STATES.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data de Aquisição Inicial
            </label>
            <input
              type="date"
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchParams.startAcquisitionDate}
              onChange={(e) => setSearchParams({ ...searchParams, startAcquisitionDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data de Aquisição Final
            </label>
            <input
              type="date"
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchParams.endAcquisitionDate}
              onChange={(e) => setSearchParams({ ...searchParams, endAcquisitionDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Valor Mínimo
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchParams.minValue}
              onChange={(e) => setSearchParams({ ...searchParams, minValue: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Valor Máximo
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchParams.maxValue}
              onChange={(e) => setSearchParams({ ...searchParams, maxValue: e.target.value })}
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600 flex items-center justify-center"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Search className="h-5 w-5 mr-2" />
                Buscar
              </>
            )}
          </button>
        </div>
      </form>

      {results.length > 0 && (
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
                {results.map((asset) => (
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
                          onClick={() => navigate(`/assets/edit/${asset.id}`)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                          title="Editar"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}