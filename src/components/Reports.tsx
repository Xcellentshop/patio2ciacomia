import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Vehicle, City, VehicleType } from '../types';
import { FileText, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';

export default function Reports() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<City | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'vehicles'));
      const vehicleData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Vehicle[];
      setVehicles(vehicleData);
    } catch (error) {
      console.error('Error fetching vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterVehicles = () => {
    return vehicles.filter(vehicle => {
      const matchesCity = !selectedCity || vehicle.city === selectedCity;
      const matchesDateRange = (!startDate && !endDate) || 
        (vehicle.inspectionDate >= startDate && vehicle.inspectionDate <= endDate);
      return matchesCity && matchesDateRange;
    });
  };

  const generateStats = (filteredVehicles: Vehicle[]) => {
    const stats = {
      total: filteredVehicles.length,
      released: filteredVehicles.filter(v => v.releaseDate).length,
      notReleased: filteredVehicles.filter(v => !v.releaseDate).length,
      byType: {} as Record<VehicleType, {
        total: number,
        released: number,
        notReleased: number
      }>,

      byKey: { yes: 0, no: 0 },
      byState: {} as Record<string, number>,
      byCity: {} as Record<City, {
        total: number,
        released: number,
        notReleased: number
      }>
    };

    filteredVehicles.forEach(vehicle => {
      if (!stats.byType[vehicle.vehicleType]) {
        stats.byType[vehicle.vehicleType] = {
          total: 0,
          released: 0,
          notReleased: 0
        };
      }

      stats.byType[vehicle.vehicleType].total++;
      if (vehicle.releaseDate) {
        stats.byType[vehicle.vehicleType].released++;
      } else {
        stats.byType[vehicle.vehicleType].notReleased++;
      }

      vehicle.hasKey ? stats.byKey.yes++ : stats.byKey.no++;

      stats.byState[vehicle.state] = (stats.byState[vehicle.state] || 0) + 1;

      if (!stats.byCity[vehicle.city]) {
        stats.byCity[vehicle.city] = {
          total: 0,
          released: 0,
          notReleased: 0
        };
      }

      stats.byCity[vehicle.city].total++;
      if (vehicle.releaseDate) {
        stats.byCity[vehicle.city].released++;
      } else {
        stats.byCity[vehicle.city].notReleased++;
      }
    });

    return stats;
  };

  const exportToPDF = (filteredVehicles: Vehicle[]) => {
    const doc = new jsPDF();
    const stats = generateStats(filteredVehicles);

    doc.setFontSize(16);
    doc.text('Relatório de Veículos', 14, 20);

    doc.setFontSize(12);
    doc.text(`Período: ${startDate ? format(new Date(startDate), 'dd/MM/yyyy') : 'Início'} até ${endDate ? format(new Date(endDate), 'dd/MM/yyyy') : 'Fim'}`, 14, 30);
    doc.text(`Cidade: ${selectedCity || 'Todas'}`, 14, 37);

    let yPos = 50;

    // Add total statistics
    doc.text('Resumo Geral:', 14, yPos);
    yPos += 7;
    doc.text(`Total de Veículos: ${stats.total}`, 20, yPos);
    yPos += 7;
    doc.text(`Veículos Liberados: ${stats.released}`, 20, yPos);
    yPos += 7;
    doc.text(`Veículos Não Liberados: ${stats.notReleased}`, 20, yPos);
    yPos += 14;

    // Add city statistics
    doc.text('Por Cidade:', 14, yPos);
    yPos += 7;
    Object.entries(stats.byCity).forEach(([city, data]) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20; // Reset yPos for the new page
      }
      doc.text(`${city}:`, 20, yPos);
      yPos += 7;
      doc.text(`Total: ${data.total} | Liberados: ${data.released} | Não Liberados: ${data.notReleased}`, 25, yPos);
      yPos += 7;
    });
    yPos += 7;

    // Add vehicle type statistics
    doc.text('Por Tipo de Veículo:', 14, yPos);
    yPos += 7;
    Object.entries(stats.byType).forEach(([type, data]) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20; // Reset yPos for the new page
      }
      doc.text(`${type}:`, 20, yPos);
      yPos += 7;
      doc.text(`Total: ${data.total} | Liberados: ${data.released} | Não Liberados: ${data.notReleased}`, 25, yPos);
      yPos += 7;
    });
    yPos += 7;

    // Add key statistics
    doc.text('Status das Chaves:', 14, yPos);
    yPos += 7;
    doc.text(`Com Chave: ${stats.byKey.yes}`, 20, yPos);
    yPos += 7;
    doc.text(`Sem Chave: ${stats.byKey.no}`, 20, yPos);
    yPos += 14;

    // Add state statistics with multiple pages if needed
    doc.text('Por Estado:', 14, yPos);
    yPos += 7;
    Object.entries(stats.byState).forEach(([state, count]) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20; // Reset yPos for the new page
      }
      doc.text(`${state}: ${count}`, 20, yPos);
      yPos += 7;
    });

    doc.save('relatorio-detalhado-veiculos.pdf');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const filteredVehicles = filterVehicles();
  const stats = generateStats(filteredVehicles);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Relatórios</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cidade
            </label>
            <select
              className="w-full p-2 border rounded-md"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value as City)}
            >
              <option value="">Todas as cidades</option>
              {['Medianeira', 'SMI', 'Missal', 'Itaipulândia', 'Serranópolis'].map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              className="w-full p-2 border rounded-md"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Final
            </label>
            <input
              type="date"
              className="w-full p-2 border rounded-md"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <button
          onClick={() => exportToPDF(filteredVehicles)}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md mt-4 hover:bg-indigo-700 flex items-center justify-center"
        >
          <FileText className="mr-2" /> Gerar Relatório PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2 text-gray-700">Resumo Geral</h3>
          <p>Total de Veículos: {stats.total}</p>
          <p>Veículos Liberados: {stats.released}</p>
          <p>Veículos Não Liberados: {stats.notReleased}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2 text-gray-700">Status das Chaves</h3>
          <p>Com Chave: {stats.byKey.yes}</p>
          <p>Sem Chave: {stats.byKey.no}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-2 text-gray-700">Por Tipo de Veículo</h3>
          {Object.entries(stats.byType).map(([type, data]) => (
            <div key={type} className="mb-2">
              <p>{type}: {data.total} total</p>
              <p>Liberados: {data.released} | Não Liberados: {data.notReleased}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
