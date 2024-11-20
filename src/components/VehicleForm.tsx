import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, query, orderBy, limit, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Vehicle, VehicleType, City } from '../types';
import { toast } from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';

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

export default function VehicleForm() {
  const [loading, setLoading] = useState(false);
  const [useExternalRegistration, setUseExternalRegistration] = useState(false);
  const [externalRegistrationNumber, setExternalRegistrationNumber] = useState('');
  const [formData, setFormData] = useState({
    plate: '',
    state: '',
    inspectionDate: '',
    brand: '',
    model: '',
    vehicleType: '' as VehicleType,
    hasKey: false,
    chassisObservation: '',
    city: '' as City,
    bouTrv: '',
    hasNoPlate: false,
    releaseDate: ''
  });

  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  useEffect(() => {
    if (isEditing) {
      fetchVehicle();
    }
  }, [id]);

  useEffect(() => {
    if (formData.hasNoPlate) {
      setFormData(prev => ({ ...prev, plate: 'SEM PLACA', state: '--' }));
    } else if (formData.plate === 'SEM PLACA') {
      setFormData(prev => ({ ...prev, plate: '', state: '' }));
    }
  }, [formData.hasNoPlate]);

  const fetchVehicle = async () => {
    try {
      const vehicleDoc = await getDoc(doc(db, 'vehicles', id!));
      if (vehicleDoc.exists()) {
        const vehicleData = vehicleDoc.data() as Vehicle;
        setFormData({
          plate: vehicleData.plate,
          state: vehicleData.state,
          inspectionDate: vehicleData.inspectionDate,
          brand: vehicleData.brand,
          model: vehicleData.model,
          vehicleType: vehicleData.vehicleType,
          hasKey: vehicleData.hasKey,
          chassisObservation: vehicleData.chassisObservation,
          city: vehicleData.city,
          bouTrv: vehicleData.bouTrv || '',
          hasNoPlate: vehicleData.hasNoPlate || false,
          releaseDate: vehicleData.releaseDate || ''
        });
        const lastAutoNumber = await getLastAutoRegistrationNumber();
        if (vehicleData.registrationNumber < lastAutoNumber - 100) {
          setUseExternalRegistration(true);
          setExternalRegistrationNumber(vehicleData.registrationNumber.toString());
        }
      }
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      toast.error('Erro ao carregar dados do veículo');
    }
  };

  const getLastAutoRegistrationNumber = async () => {
    const vehiclesRef = collection(db, 'vehicles');
    const q = query(vehiclesRef, orderBy('registrationNumber', 'desc'), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return 1202890;
    }

    const lastVehicle = snapshot.docs[0].data() as Vehicle;
    return lastVehicle.registrationNumber;
  };

  const validateExternalRegistration = (number: string) => {
    const parsedNumber = parseInt(number);
    if (isNaN(parsedNumber)) {
      throw new Error('O número de registro deve ser um número válido');
    }
    if (parsedNumber <= 0) {
      throw new Error('O número de registro deve ser maior que zero');
    }
    return parsedNumber;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let registrationNumber: number;

      if (useExternalRegistration) {
        if (!externalRegistrationNumber.trim()) {
          throw new Error('Por favor, insira um número de registro');
        }
        registrationNumber = validateExternalRegistration(externalRegistrationNumber);
      } else {
        registrationNumber = await getLastAutoRegistrationNumber() + 1;
      }

      if (isEditing) {
        await updateDoc(doc(db, 'vehicles', id!), {
          ...formData,
          registrationNumber,
          releaseDate: formData.releaseDate || null,
          updatedAt: new Date().toISOString()
        });
        toast.success('Veículo atualizado com sucesso!');
      } else {
        const vehicleData: Omit<Vehicle, 'id'> = {
          ...formData,
          registrationNumber,
          releaseDate: null,
          createdAt: new Date().toISOString()
        };
        await addDoc(collection(db, 'vehicles'), vehicleData);
        toast.success('Veículo cadastrado com sucesso!');
      }
      navigate('/');
    } catch (error) {
      console.error('Error saving vehicle:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao salvar veículo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
        {isEditing ? 'Editar Veículo' : 'Cadastro de Veículo'}
      </h2>

      <div className="mb-6">
        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="useExternalRegistration"
            checked={useExternalRegistration}
            onChange={(e) => setUseExternalRegistration(e.target.checked)}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
          />
          <label htmlFor="useExternalRegistration" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">
            Usar número de registro Detran manual
          </label>
        </div>

        {useExternalRegistration && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Número de Registro
            </label>
            <input
              type="number"
              required
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={externalRegistrationNumber}
              onChange={(e) => setExternalRegistrationNumber(e.target.value)}
              placeholder="Digite o número de registro Detran"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center mb-2">
            <input
              type="checkbox"
              id="hasNoPlate"
              checked={formData.hasNoPlate}
              onChange={(e) => setFormData({ ...formData, hasNoPlate: e.target.checked })}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
            />
            <label htmlFor="hasNoPlate" className="ml-2 block text-sm text-gray-900 dark:text-gray-200">
              Veículo sem placa
            </label>
          </div>
          <input
            type="text"
            required
            disabled={formData.hasNoPlate}
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
            value={formData.plate}
            onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
            placeholder="Digite a Placa"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            UF
          </label>
          <select
            required
            disabled={formData.hasNoPlate}
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-600"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
          >
            <option value="">Selecione o estado</option>
            {STATES.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Data de Vistoria
          </label>
          <input
            type="date"
            required
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={formData.inspectionDate}
            onChange={(e) => setFormData({ ...formData, inspectionDate: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            BOU/TRV
          </label>
          <input
            type="text"
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={formData.bouTrv}
            onChange={(e) => setFormData({ ...formData, bouTrv: e.target.value })}
            placeholder="Digite o BOU/TRV"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Marca
          </label>
          <input
            type="text"
            required
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Modelo
          </label>
          <input
            type="text"
            required
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo de Veículo
          </label>
          <select
            required
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={formData.vehicleType}
            onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value as VehicleType })}
          >
            <option value="">Selecione o tipo</option>
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
            required
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={formData.hasKey ? 'SIM' : 'NÃO'}
            onChange={(e) => setFormData({ ...formData, hasKey: e.target.value === 'SIM' })}
          >
            <option value="NÃO">NÃO</option>
            <option value="SIM">SIM</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Cidade
          </label>
          <select
            required
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value as City })}
          >
            <option value="">Selecione a cidade</option>
            {CITIES.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Data de Liberação
          </label>
          <input
            type="date"
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={formData.releaseDate}
            onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Observação Chassi
        </label>
        <textarea
          className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          rows={3}
          value={formData.chassisObservation}
          onChange={(e) => setFormData({ ...formData, chassisObservation: e.target.value })}
        />
      </div>

      <div className="mt-6">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          {loading ? (isEditing ? 'Atualizando...' : 'Cadastrando...') : (isEditing ? 'Atualizar Veículo' : 'Cadastrar Veículo')}
        </button>
      </div>
    </form>
  );
}