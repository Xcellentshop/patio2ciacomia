import React, { useState } from 'react';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Vehicle, VehicleType, City } from '../types';
import { format } from 'date-fns';
import { Search, Edit, Trash2, Calendar, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const VEHICLE_TYPES: VehicleType[] = [
  'Automóvel', 'Motocicleta', 'Camioneta', 'Caminhonete', 'Caminhão',
  'Ônibus', 'Cam. Trator', 'Triciclo', 'Quadriciclo', 'Trator de Rodas',
  'Semi-Reboque', 'Motoneta', 'Microônibus', 'Reboque', 'Ciclomotor', 'Utilitário'
];

const CITIES: City[] = ['Medianeira', 'SMI', 'Missal', 'Itaipulândia', 'Serranópolis'];

const STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE',
  'TO', 'EX', '--'
];

export default function VehicleSearch() {
  const [searchParams, setSearchParams] = useState({
    registrationNumber: '',
    plate: '',
    city: '',
    vehicleType: '',
    state: '',
    brand: '',
    model: '',
    startInspectionDate: '',
    endInspectionDate: '',
    startReleaseDate: '',
    endReleaseDate: '',
    hasKey: '',
    isReleased: '',
    bouTrv: '',
    hasNoPlate: false
  });
  const [results, setResults] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [editingReleaseDate, setEditingReleaseDate] = useState<string | null>(null);
  const [newReleaseDate, setNewReleaseDate] = useState('');
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let baseQuery = collection(db, 'vehicles');
      let constraints: any[] = [];

      if (searchParams.registrationNumber) {
        constraints.push(where('registrationNumber', '==', parseInt(searchParams.registrationNumber)));
      }

      if (searchParams.plate) {
        constraints.push(where('plate', '==', searchParams.plate.toUpperCase()));
      }

      if (searchParams.city) {
        constraints.push(where('city', '==', searchParams.city));
      }

      if (searchParams.vehicleType) {
        constraints.push(where('vehicleType', '==', searchParams.vehicleType));
      }

      if (searchParams.state) {
        constraints.push(where('state', '==', searchParams.state));
      }

      if (searchParams.hasKey !== '') {
        constraints.push(where('hasKey', '==', searchParams.hasKey === 'true'));
      }

      if (searchParams.bouTrv) {
        constraints.push(where('bouTrv', '==', searchParams.bouTrv));
      }

      if (searchParams.hasNoPlate) {
        constraints.push(where('hasNoPlate', '==', true));
      }

      const q = constraints.length > 0 ? query(baseQuery, ...constraints) : baseQuery;
      const querySnapshot = await getDocs(q);
      
      let vehicles = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Vehicle[];

      vehicles = vehicles.filter(vehicle => {
        let matches = true;

        if (searchParams.brand) {
          matches = matches && vehicle.brand.toLowerCase().includes(searchParams.brand.toLowerCase());
        }

        if (searchParams.model) {
          matches = matches && vehicle.model.toLowerCase().includes(searchParams.model.toLowerCase());
        }

        if (searchParams.startInspectionDate || searchParams.endInspectionDate) {
          const inspectionDate = new Date(vehicle.inspectionDate);
          if (searchParams.startInspectionDate) {
            matches = matches && inspectionDate >= new Date(searchParams.startInspectionDate);
          }
          if (searchParams.endInspectionDate) {
            matches = matches && inspectionDate <= new Date(searchParams.endInspectionDate);
          }
        }

        if (searchParams.isReleased !== '') {
          const hasReleaseDate = !!vehicle.releaseDate;
          matches = matches && (
            searchParams.isReleased === 'true' ? hasReleaseDate : !hasReleaseDate
          );
        }

        if (searchParams.startReleaseDate || searchParams.endReleaseDate) {
          if (vehicle.releaseDate) {
            const releaseDate = new Date(vehicle.releaseDate);
            if (searchParams.startReleaseDate) {
              matches = matches && releaseDate >= new Date(searchParams.startReleaseDate);
            }
            if (searchParams.endReleaseDate) {
              matches = matches && releaseDate <= new Date(searchParams.endReleaseDate);
            }
          } else {
            matches = false;
          }
        }

        return matches;
      });

      setResults(vehicles.sort((a, b) => b.registrationNumber - a.registrationNumber));
    } catch (error) {
      console.error('Error searching vehicles:', error);
      toast.error('Erro ao buscar veículos');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vehicleId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este veículo?')) {
      try {
        await deleteDoc(doc(db, 'vehicles', vehicleId));
        toast.success('Veículo excluído com sucesso');
        handleSearch(new Event('submit') as any);
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        toast.error('Erro ao excluir veículo');
      }
    }
  };

  const handleReleaseDateUpdate = async (vehicleId: string, date: string) => {
    try {
      const releaseDate = new Date(date);
      releaseDate.setUTCHours(12, 0, 0, 0);

      await updateDoc(doc(db, 'vehicles', vehicleId), {
        releaseDate: releaseDate.toISOString()
      });
      toast.success('Data de liberação atualizada');
      handleSearch(new Event('submit') as any);
      setEditingReleaseDate(null);
    } catch (error) {
      console.error('Error updating release date:', error);
      toast.error('Erro ao atualizar data de liberação');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Não definida';
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy');
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Buscar Veículo</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nº Registro
            </label>
            <input
              type="number"
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchParams.registrationNumber}
              onChange={(e) => setSearchParams({ ...searchParams, registrationNumber: e.target.value })}
            />
          </div>

          <div>
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="hasNoPlate"
                checked={searchParams.hasNoPlate}
                onChange={(e) => setSearchParams({ ...searchParams, hasNoPlate: e.target.checked })}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
              />
              <label htmlFor="hasNoPlate" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">
                Veículo sem placa
              </label>
            </div>
            <input
              type="text"
              disabled={searchParams.hasNoPlate}
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
              value={searchParams.plate}
              onChange={(e) => setSearchParams({ ...searchParams, plate: e.target.value.toUpperCase() })}
              placeholder="Digite a Placa"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              UF
            </label>
            <select
              disabled={searchParams.hasNoPlate}
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
              value={searchParams.state}
              onChange={(e) => setSearchParams({ ...searchParams, state: e.target.value })}
            >
              <option value="">Todos os estados</option>
              {STATES.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cidade
            </label>
            <select
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchParams.city}
              onChange={(e) => setSearchParams({ ...searchParams, city: e.target.value })}
            >
              <option value="">Todas as cidades</option>
              {CITIES.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Veículo
            </label>
            <select
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchParams.vehicleType}
              onChange={(e) => setSearchParams({ ...searchParams, vehicleType: e.target.value })}
            >
              <option value="">Todos os tipos</option>
              {VEHICLE_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Possui Chave?
            </label>
            <select
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchParams.hasKey}
              onChange={(e) => setSearchParams({ ...searchParams, hasKey: e.target.value })}
            >
              <option value="">Todos</option>
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status de Liberação
            </label>
            <select
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchParams.isReleased}
              onChange={(e) => setSearchParams({ ...searchParams, isReleased: e.target.value })}
            >
              <option value="">Todos</option>
              <option value="true">Liberados</option>
              <option value="false">Não Liberados</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Marca
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchParams.brand}
              onChange={(e) => setSearchParams({ ...searchParams, brand: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Modelo
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchParams.model}
              onChange={(e) => setSearchParams({ ...searchParams, model: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              BOU/TRV
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchParams.bouTrv}
              onChange={(e) => setSearchParams({ ...searchParams, bouTrv: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data de Vistoria Inicial
            </label>
            <input
              type="date"
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchParams.startInspectionDate}
              onChange={(e) => setSearchParams({ ...searchParams, startInspectionDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data de Vistoria Final
            </label>
            <input
              type="date"
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchParams.endInspectionDate}
              onChange={(e) => setSearchParams({ ...searchParams, endInspectionDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data de Liberação Inicial
            </label>
            <input
              type="date"
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchParams.startReleaseDate}
              onChange={(e) => setSearchParams({ ...searchParams, startReleaseDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data de Liberação Final
            </label>
            <input
              type="date"
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={searchParams.endReleaseDate}
              onChange={(e) => setSearchParams({ ...searchParams, endReleaseDate: e.target.value })}
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
                    Registro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Placa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Cidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Data Vistoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Data Liberação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Chave
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {results.map((vehicle) => (
                  <React.Fragment key={vehicle.id}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {vehicle.registrationNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {vehicle.plate} ({vehicle.state})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {vehicle.city}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {formatDate(vehicle.inspectionDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {editingReleaseDate === vehicle.id ? (
                          <div className="flex items-center space-x-2">
                            <input
                              type="date"
                              className="p-1 border rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                              value={newReleaseDate}
                              onChange={(e) => setNewReleaseDate(e.target.value)}
                            />
                            <button
                              onClick={() => handleReleaseDateUpdate(vehicle.id!, newReleaseDate)}
                              className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => setEditingReleaseDate(null)}
                              className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className={vehicle.releaseDate ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                              {vehicle.releaseDate ? formatDate(vehicle.releaseDate) : 'Não liberado'}
                            </span>
                            <button
                              onClick={() => {
                                setEditingReleaseDate(vehicle.id!);
                                setNewReleaseDate(vehicle.releaseDate ? vehicle.releaseDate.split('T')[0] : '');
                              }}
                              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                            >
                              <Calendar className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {vehicle.vehicleType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          vehicle.hasKey
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {vehicle.hasKey ? 'SIM' : 'NÃO'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => navigate(`/vehicles/edit/${vehicle.id}`)}
                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                            title="Editar"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(vehicle.id!)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            title="Excluir"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setShowDetails(showDetails === vehicle.id ? null : vehicle.id)}
                            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                            title="Detalhes"
                          >
                            <Info className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {showDetails === vehicle.id && (
                      <tr className="bg-gray-50 dark:bg-gray-700">
                        <td colSpan={8} className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white">Informações Adicionais</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300">Marca: {vehicle.brand}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">Modelo: {vehicle.model}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-300">BOU/TRV: {vehicle.bouTrv || 'Não informado'}</p>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white">Observações</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                {vehicle.chassisObservation || 'Nenhuma observação registrada'}
                              </p>
                            </div>
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
    </div>
  );
}