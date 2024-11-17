import React, { useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Vehicle, VehicleType, City } from '../types';
import { format } from 'date-fns';
import { Search, Calendar, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';

// ... (rest of the imports and constants remain the same)

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
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  // ... (handleSearch and handleUpdateReleaseDate functions remain the same)

  return (
    <div className="space-y-6">
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-semibold mb-4">Observação do Chassi</h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {selectedVehicle.chassisObservation || 'Nenhuma observação registrada'}
            </p>
            <button
              onClick={() => setSelectedVehicle(null)}
              className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSearch} className="bg-white p-6 rounded-lg shadow-md">
        {/* ... (search form remains the same) ... */}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chassi
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {vehicle.chassisObservation && (
                        <button
                          onClick={() => setSelectedVehicle(vehicle)}
                          className="text-indigo-600 hover:text-indigo-800"
                          title="Ver observação do chassi"
                        >
                          <Info className="h-5 w-5" />
                        </button>
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
