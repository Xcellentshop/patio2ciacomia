import React, { useState } from 'react';
import { navigate } from '@reach/router'; // or your preferred router

const VEHICLE_TYPES = ['CAR', 'TRUCK', 'MOTORCYCLE']; // Example vehicle types
const CITIES = ['City1', 'City2', 'City3']; // Example cities
const STATES = ['State1', 'State2', 'State3']; // Example states

const VehicleForm = ({ isEditing, initialData }) => {
  const [formData, setFormData] = useState(isEditing ? initialData : {});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Perform form submission logic here
      if (isEditing) {
        await updateVehicle(formData); // Implement this function
      } else {
        await createVehicle(formData); // Implement this function
      }
      navigate('/'); // Redirect to another page or show a success message
    } catch (error) {
      console.error('Error submitting form', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
      <h2 className="text-xl font-bold mb-4">{isEditing ? 'Atualizar Veículo' : 'Cadastrar Veículo'}</h2>
      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="plate" className="block text-gray-700 font-bold mb-2">Placa</label>
          <input
            type="text"
            id="plate"
            name="plate"
            value={formData.plate || ''}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div>
          <label htmlFor="renavam" className="block text-gray-700 font-bold mb-2">Renavam</label>
          <input
            type="text"
            id="renavam"
            name="renavam"
            value={formData.renavam || ''}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div>
          <label htmlFor="chassis" className="block text-gray-700 font-bold mb-2">Chassi</label>
          <input
            type="text"
            id="chassis"
            name="chassis"
            value={formData.chassis || ''}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div>
          <label htmlFor="inspectionDate" className="block text-gray-700 font-bold mb-2">Data de Inspeção</label>
          <input
            type="date"
            id="inspectionDate"
            name="inspectionDate"
            value={formData.inspectionDate || ''}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div>
          <label htmlFor="bouTrv" className="block text-gray-700 font-bold mb-2">BOU/TRV</label>
          <input
            type="text"
            id="bouTrv"
            name="bouTrv"
            value={formData.bouTrv || ''}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div>
          <label htmlFor="brand" className="block text-gray-700 font-bold mb-2">Marca</label>
          <input
            type="text"
            id="brand"
            name="brand"
            value={formData.brand || ''}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div>
          <label htmlFor="model" className="block text-gray-700 font-bold mb-2">Modelo</label>
          <input
            type="text"
            id="model"
            name="model"
            value={formData.model || ''}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div>
          <label htmlFor="year" className="block text-gray-700 font-bold mb-2">Ano</label>
          <input
            type="number"
            id="year"
            name="year"
            value={formData.year || ''}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div>
          <label htmlFor="fuelType" className="block text-gray-700 font-bold mb-2">Tipo de Combustível</label>
          <select
            id="fuelType"
            name="fuelType"
            value={formData.fuelType || ''}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          >
            <option value="">Selecione</option>
            <option value="GASOLINA">Gasolina</option>
            <option value="DIESEL">Diesel</option>
            <option value="FLEX">Flex</option>
          </select>
        </div>
        <div>
          <label htmlFor="color" className="block text-gray-700 font-bold mb-2">Cor</label>
          <input
            type="text"
            id="color"
            name="color"
            value={formData.color || ''}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          />
        </div>
        <div>
          <label htmlFor="vehicleType" className="block text-gray-700 font-bold mb-2">Tipo de Veículo</label>
          <select
            id="vehicleType"
            name="vehicleType"
            value={formData.vehicleType || ''}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          >
            <option value="">Selecione</option>
            {VEHICLE_TYPES.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="city" className="block text-gray-700 font-bold mb-2">Cidade</label>
          <select
            id="city"
            name="city"
            value={formData.city || ''}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          >
            <option value="">Selecione</option>
            {CITIES.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="state" className="block text-gray-700 font-bold mb-2">Estado</label>
          <select
            id="state"
            name="state"
            value={formData.state || ''}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            required
          >
            <option value="">Selecione</option>
            {STATES.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>
      </div>
      <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
        {isSubmitting ? 'Salvando...' : 'Salvar'}
      </button>
    </form>
  );
};

export default VehicleForm;
