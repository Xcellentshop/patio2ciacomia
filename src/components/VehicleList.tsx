import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Vehicle, City } from '../types';
import { format } from 'date-fns';
import { Calendar, Edit, Trash2, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Pagination from './common/Pagination';
import { usePagination } from '../hooks/usePagination';

const CITIES: City[] = ['Medianeira', 'SMI', 'Missal', 'Itaipulândia', 'Serranópolis'];

export default function VehicleList() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [editingReleaseDate, setEditingReleaseDate] = useState<string | null>(null);
  const [newReleaseDate, setNewReleaseDate] = useState('');
  const [selectedCity, setSelectedCity] = useState<City | ''>('');
  const navigate = useNavigate();

  const {
    currentPage,
    totalPages,
    itemsPerPage,
    currentItems: paginatedVehicles,
    totalItems,
    handlePageChange,
    handleItemsPerPageChange
  } = usePagination({ items: filteredVehicles });

  useEffect(() => {
    fetchVehicles();
  }, []);

  useEffect(() => {
    filterVehiclesByCity();
  }, [selectedCity, vehicles]);

  const fetchVehicles = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'vehicles'));
      const vehicleData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Vehicle[];
      setVehicles(vehicleData.sort((a, b) => b.registrationNumber - a.registrationNumber));
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      toast.error('Erro ao carregar veículos');
    } finally {
      setLoading(false);
    }
  };

  const filterVehiclesByCity = () => {
    if (!selectedCity) {
      setFilteredVehicles(vehicles);
    } else {
      const filtered = vehicles.filter(vehicle => vehicle.city === selectedCity);
      setFilteredVehicles(filtered);
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
      fetchVehicles();
      setEditingReleaseDate(null);
    } catch (error) {
      console.error('Error updating release date:', error);
      toast.error('Erro ao atualizar data de liberação');
    }
  };

  const handleDelete = async (vehicleId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este veículo?')) {
      try {
        await deleteDoc(doc(db, 'vehicles', vehicleId));
        toast.success('Veículo excluído com sucesso');
        fetchVehicles();
      } catch (error) {
        console.error('Error deleting vehicle:', error);
        toast.error('Erro ao excluir veículo');
      }
    }
  };

  const handleEdit = (vehicleId: string) => {
    navigate(`/vehicles/edit/${vehicleId}`);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Não definida';
    const date = new Date(dateString);
    return format(date, 'dd/MM/yyyy');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        <select
          className="p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value as City)}
        >
          <option value="">Todas as cidades</option>
          {CITIES.map(city => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>
      </div>

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
              {paginatedVehicles.map((vehicle) => (
                <React.Fragment key={vehicle.id}>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
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
                          <span className={`text-sm ${vehicle.releaseDate ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
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
                          onClick={() => handleEdit(vehicle.id!)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(vehicle.id!)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => setShowDetails(showDetails === vehicle.id ? null : vehicle.id)}
                          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
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

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </div>
    </div>
  );
}