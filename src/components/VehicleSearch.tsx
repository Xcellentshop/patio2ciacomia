import React, { useState } from 'react';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
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
  const [editingVehicle, setEditingVehicle] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<string>('');

  const normalizeDate = (date: string) => {
    const normalizedDate = new Date(date);
    normalizedDate.setUTCHours(0, 0, 0, 0);
    return normalizedDate;
  };

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
      if (searchParams.bouTrv) {
        constraints.push(where('bouTrv', '==', searchParams.bouTrv));
      }
      if (searchParams.hasNoPlate) {
        constraints.push(where('plate', '==', 'SEM PLACA'));
      }

      const q = constraints.length > 0 ? query(baseQuery, ...constraints) : baseQuery;
      const querySnapshot = await getDocs(q);
      
      let vehicles = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Vehicle[];

      if (searchParams.startInspectionDate || searchParams.endInspectionDate) {
        vehicles = vehicles.filter(vehicle => {
          const inspectionDate = new Date(vehicle.inspectionDate);
          const startDate = searchParams.startInspectionDate
            ? normalizeDate(searchParams.startInspectionDate)
            : null;
          const endDate = searchParams.endInspectionDate
            ? normalizeDate(searchParams.endInspectionDate)
            : null;
          
          return (!startDate || inspectionDate >= startDate) && 
                 (!endDate || inspectionDate <= endDate);
        });
      }

      if (searchParams.startReleaseDate || searchParams.endReleaseDate) {
        vehicles = vehicles.filter(vehicle => {
          if (!vehicle.releaseDate) return false;
          const releaseDate = new Date(vehicle.releaseDate);
          const startDate = searchParams.startReleaseDate
            ? normalizeDate(searchParams.startReleaseDate)
            : null;
          const endDate = searchParams.endReleaseDate
            ? normalizeDate(searchParams.endReleaseDate)
            : null;
          
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
        releaseDate: normalizeDate(date).toISOString()
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
              BOU/TRV
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-md"
              value={searchParams.bouTrv}
              onChange={(e) => setSearchParams({...searchParams, bouTrv: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placa
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                className="w-full p-2 border rounded-md"
                value={searchParams.plate}
                onChange={(e) => setSearchParams({...searchParams, plate: e.target.value.toUpperCase()})}
                disabled={searchParams.hasNoPlate}
              />
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="searchHasNoPlate"
                  checked={searchParams.hasNoPlate}
                  onChange={(e) => {
                    setSearchParams({
                      ...searchParams,
                      hasNoPlate: e.target.checked,
                      plate: e.target.checked ? 'SEM PLACA' : ''
                    });
                  }}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="searchHasNoPlate" className="ml-2 text-sm text-gray-600">
                  Sem Placa
                </label>
              </div>
            </div>
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

          <div className="flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Liberação
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
                Até
              </label>
              <input
                type="date"
                className="w-full p-2 border rounded-md"
                value={searchParams.endReleaseDate}
                onChange={(e) => setSearchParams({...searchParams, endReleaseDate: e.target.value})}
              />
            </div>
          </div>

          <div className="flex justify-center mt-6">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white px-6 py-2 rounded-md shadow-md hover:bg-indigo-700"
            >
              {loading ? 'Carregando...' : 'Buscar'}
            </button>
          </div>
        </div>
      </form>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Resultados da Busca</h2>

        <table className="min-w-full">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Placa</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">BOU/TRV</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Marca</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Modelo</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Data Liberação</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">Ações</th>
            </tr>
          </thead>
          <tbody>
            {results.map(vehicle => (
              <tr key={vehicle.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vehicle.plate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vehicle.bouTrv}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vehicle.brand}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{vehicle.model}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {editingVehicle === vehicle.id ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="date"
                        value={editDate}
                        className="p-1 border rounded"
                        onChange={(e) => setEditDate(e.target.value)}
                      />
                      <button
                        onClick={async () => {
                          await handleUpdateReleaseDate(vehicle.id!, editDate);
                          setEditingVehicle(null);
                        }}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        Salvar
                      </button>
                    </div>
                  ) : vehicle.releaseDate ? (
                    <span>{format(new Date(vehicle.releaseDate), 'dd/MM/yyyy')}</span>
                  ) : (
                    <span>—</span>
                  )}
                  <button
                    onClick={() => {
                      setEditingVehicle(vehicle.id);
                      setEditDate(vehicle.releaseDate ? vehicle.releaseDate.split('T')[0] : '');
                    }}
                    className="text-indigo-600 hover:text-indigo-900 ml-2"
                  >
                    Editar
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {/* Ações como editar e excluir */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}