import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Vehicle, VehicleType, City } from '../types';
import { format } from 'date-fns';
import { Search, Calendar } from 'lucide-react';
import { toast } from 'react-hot-toast';

const VEHICLE_TYPES: VehicleType[] = [
  'Automóvel', 'Motocicleta', 'Camioneta', 'Caminhonete', 'Caminhão',
  'Ônibus', 'Cam. Trator', 'Triciclo', 'Quadriciclo', 'Trator de Rodas',
  'Semi-Reboque', 'Motoneta', 'Microônibus', 'Reboque', 'Ciclomotor', 'Utilitário'
];

const CITIES: City[] = ['Medianeira', 'SMI', 'Missal', 'Itaipulândia', 'Serranópolis'];

const STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE',
  'TO', 'EX'
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
    isReleased: ''
  });
  const [results, setResults] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);

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
      if (searchParams.brand) {
        constraints.push(where('brand', '==', searchParams.brand));
      }
      if (searchParams.model) {
        constraints.push(where('model', '==', searchParams.model));
      }
      if (searchParams.hasKey) {
        constraints.push(where('hasKey', '==', searchParams.hasKey === 'true'));
      }
      if (searchParams.isReleased === 'true') {
        constraints.push(where('releaseDate', '!=', null));
      } else if (searchParams.isReleased === 'false') {
        constraints.push(where('releaseDate', '==', null));
      }

      const q = constraints.length > 0 ? query(baseQuery, ...constraints) : baseQuery;
      const querySnapshot = await getDocs(q);
      
      let vehicles = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Vehicle[];

      // Filter by date ranges after fetching
      if (searchParams.startInspectionDate || searchParams.endInspectionDate) {
        vehicles = vehicles.filter(vehicle => {
          const inspectionDate = new Date(vehicle.inspectionDate);
          const startDate = searchParams.startInspectionDate ? new Date(searchParams.startInspectionDate) : null;
          const endDate = searchParams.endInspectionDate ? new Date(searchParams.endInspectionDate) : null;
          
          return (!startDate || inspectionDate >= startDate) && 
                 (!endDate || inspectionDate <= endDate);
        });
      }

      if (searchParams.startReleaseDate || searchParams.endReleaseDate) {
        vehicles = vehicles.filter(vehicle => {
          if (!vehicle.releaseDate) return false;
          const releaseDate = new Date(vehicle.releaseDate);
          const startDate = searchParams.startReleaseDate ? new Date(searchParams.startReleaseDate) : null;
          const endDate = searchParams.endReleaseDate ? new Date(searchParams.endReleaseDate) : null;
          
          return (!startDate || releaseDate >= startDate) && 
                 (!endDate || releaseDate <= endDate);
        });
      }

      setResults(vehicles);
    } catch (error) {
      console.error('Error searching vehicles:', error);
      toast.error('Erro ao buscar veículos');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReleaseDate = async (vehicleId: string, date: string) => {
    try {
      const docRef = doc(db, 'vehicles', vehicleId);
      await updateDoc(docRef, {
        releaseDate: date
      });
      toast.success('Data de liberação atualizada com sucesso');
      handleSearch(new Event('submit'));
    } catch (error) {
      console.error('Error updating release date:', error);
      toast.error('Erro ao atualizar data de liberação');
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Buscar Veículos</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Registro
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              value={searchParams.registrationNumber}
              onChange={(e) => setSearchParams({...searchParams, registrationNumber: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placa
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              value={searchParams.plate}
              onChange={(e) => setSearchParams({...searchParams, plate: e.target.value.toUpperCase()})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={searchParams.state}
              onChange={(e) => setSearchParams({...searchParams, state: e.target.value})}
            >
              <option value="">Todos os estados</option>
              {STATES.map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cidade
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={searchParams.city}
              onChange={(e) => setSearchParams({...searchParams, city: e.target.value})}
            >
              <option value="">Todas as cidades</option>
              {CITIES.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Veículo
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={searchParams.vehicleType}
              onChange={(e) => setSearchParams({...searchParams, vehicleType: e.target.value})}
            >
              <option value="">Todos os tipos</option>
              {VEHICLE_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Marca
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              value={searchParams.brand}
              onChange={(e) => setSearchParams({...searchParams, brand: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modelo
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              value={searchParams.model}
              onChange={(e) => setSearchParams({...searchParams, model: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Possui Chave
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={searchParams.hasKey}
              onChange={(e) => setSearchParams({...searchParams, hasKey: e.target.value})}
            >
              <option value="">Todos</option>
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status de Liberação
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={searchParams.isReleased}
              onChange={(e) => setSearchParams({...searchParams, isReleased: e.target.value})}
            >
              <option value="">Todos</option>
              <option value="true">Liberados</option>
              <option value="false">Não Liberados</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Vistoria (Início)
            </label>
            <input
              type="date"
              className="w-full p-2 border rounded-md"
              value={searchParams.startInspectionDate}
              onChange={(e) => setSearchParams({...searchParams, startInspectionDate: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Vistoria (Fim)
            </label>
            <input
              type="date"
              className="w-full p-2 border rounded-md"
              value={searchParams.endInspectionDate}
              onChange={(e) => setSearchParams({...searchParams, endInspectionDate: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Liberação (Início)
            </label>
            <input
              type="date"
              className="w-full p-2 border rounded-md"
              value={searchParams.startReleaseDate}
              onChange={(e) => setSearchParams({...searchParams, startReleaseDate: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data de Liberação (Fim)
            </label>
            <input
              type="date"
              className="w-full p-2 border rounded-md"
              value={searchParams.endReleaseDate}
              onChange={(e) => setSearchParams({...searchParams, endReleaseDate: e.target.value})}
            />
          </div>
        </div>

        <div className="mt-6">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center"
          >
            <Search className="h-5 w-5 mr-2" />
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>
      </form>

      {results.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <p className="text-lg font-semibold">Total de veículos encontrados: {results.length}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Placa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Marca/Modelo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cidade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Vistoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Liberação
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((vehicle) => (
                  <tr key={vehicle.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {vehicle.registrationNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vehicle.plate} - {vehicle.state}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vehicle.brand} {vehicle.model}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vehicle.city}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vehicle.vehicleType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(vehicle.inspectionDate), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vehicle.releaseDate ? (
                        format(new Date(vehicle.releaseDate), 'dd/MM/yyyy')
                      ) : (
                        <div className="flex items-center space-x-2">
                          <input
                            type="date"
                            className="p-1 border rounded"
                            onChange={(e) => handleUpdateReleaseDate(vehicle.id!, e.target.value)}
                          />
                          <Calendar className="h-4 w-4 text-gray-400" />
                        </div>
                      )}
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