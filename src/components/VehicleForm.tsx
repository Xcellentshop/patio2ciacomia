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
  'TO', 'EX'
];

export default function VehicleForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    plate: '',
    state: '',
    inspectionDate: '',
    brand: '',
    model: '',
    vehicleType: '' as VehicleType,
    hasKey: false,
    chassisObservation: '',
    city: '' as City
  });

  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  useEffect(() => {
    if (isEditing) {
      fetchVehicle();
    }
  }, [id]);

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
          city: vehicleData.city
        });
      }
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      toast.error('Erro ao carregar dados do veículo');
    }
  };

  const getNextRegistrationNumber = async () => {
    const vehiclesRef = collection(db, 'vehicles');
    const q = query(vehiclesRef, orderBy('registrationNumber', 'desc'), limit(1));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return 1202890;
    }
    
    const lastVehicle = snapshot.docs[0].data() as Vehicle;
    return lastVehicle.registrationNumber + 1;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isEditing) {
        await updateDoc(doc(db, 'vehicles', id!), {
          ...formData,
          updatedAt: new Date().toISOString()
        });
        toast.success('Veículo atualizado com sucesso!');
      } else {
        const registrationNumber = await getNextRegistrationNumber();
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
      toast.error(isEditing ? 'Erro ao atualizar veículo' : 'Erro ao cadastrar veículo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        {isEditing ? 'Editar Veículo' : 'Cadastro de Veículo'}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Placa
          </label>
          <input
            type="text"
            required
            className="w-full p-2 border rounded-md"
            value={formData.plate}
            onChange={(e) => setFormData({ ...formData, plate: e.target.value.toUpperCase() })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            UF
          </label>
          <select
            required
            className="w-full p-2 border rounded-md"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data de Vistoria
          </label>
          <input
            type="date"
            required
            className="w-full p-2 border rounded-md"
            value={formData.inspectionDate}
            onChange={(e) => setFormData({ ...formData, inspectionDate: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Marca
          </label>
          <input
            type="text"
            required
            className="w-full p-2 border rounded-md"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Modelo
          </label>
          <input
            type="text"
            required
            className="w-full p-2 border rounded-md"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Veículo
          </label>
          <select
            required
            className="w-full p-2 border rounded-md"
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Possui Chave?
          </label>
          <select
            required
            className="w-full p-2 border rounded-md"
            value={formData.hasKey ? 'SIM' : 'NÃO'}
            onChange={(e) => setFormData({ ...formData, hasKey: e.target.value === 'SIM' })}
          >
            <option value="NÃO">NÃO</option>
            <option value="SIM">SIM</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cidade
          </label>
          <select
            required
            className="w-full p-2 border rounded-md"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value as City })}
          >
            <option value="">Selecione a cidade</option>
            {CITIES.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Observação Chassi
        </label>
        <textarea
          className="w-full p-2 border rounded-md"
          rows={3}
          value={formData.chassisObservation}
          onChange={(e) => setFormData({ ...formData, chassisObservation: e.target.value })}
        />
      </div>

      <div className="mt-6">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loading ? (isEditing ? 'Atualizando...' : 'Cadastrando...') : (isEditing ? 'Atualizar Veículo' : 'Cadastrar Veículo')}
        </button>
      </div>
    </form>
  );
}