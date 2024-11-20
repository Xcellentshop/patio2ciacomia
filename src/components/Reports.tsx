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
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    let yPos = margin;
    const lineHeight = 7;

    const addNewPageIfNeeded = (requiredSpace: number) => {
      if (yPos + requiredSpace > pageHeight - margin) {
        doc.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    const writeText = (text: string, indent: number = 0) => {
      if (addNewPageIfNeeded(lineHeight)) {
        // Reset position to top of new page
        yPos = margin;
      }
      doc.text(text, margin + indent, yPos);
      yPos += lineHeight;
    };

    // Title and Header
    doc.setFontSize(16);
    writeText('Relatório de Veículos');
    
    doc.setFontSize(12);
    writeText(`Período: ${startDate ? format(new Date(startDate), 'dd/MM/yyyy') : 'Início'} até ${endDate ? format(new Date(endDate), 'dd/MM/yyyy') : 'Fim'}`);
    writeText(`Cidade: ${selectedCity || 'Todas'}`);
    yPos += lineHeight; // Add extra spacing

    // Resumo Geral
    writeText('Resumo Geral:');
    writeText(`Total de Veículos: ${stats.total}`, 6);
    writeText(`Veículos Liberados: ${stats.released}`, 6);
    writeText(`Veículos Não Liberados: ${stats.notReleased}`, 6);
    yPos += lineHeight;

    // Por Cidade
    addNewPageIfNeeded(20 + (Object.keys(stats.byCity).length * lineHeight * 3));
    writeText('Por Cidade:');
    Object.entries(stats.byCity).forEach(([city, data]) => {
      writeText(`${city}:`, 6);
      writeText(`Total: ${data.total} | Liberados: ${data.released} | Não Liberados: ${data.notReleased}`, 12);
      yPos += 2; // Small spacing between cities
    });
    yPos += lineHeight;

    // Por Tipo de Veículo
    addNewPageIfNeeded(20 + (Object.keys(stats.byType).length * lineHeight * 3));
    writeText('Por Tipo de Veículo:');
    Object.entries(stats.byType).forEach(([type, data]) => {
      writeText(`${type}:`, 6);
      writeText(`Total: ${data.total} | Liberados: ${data.released} | Não Liberados: ${data.notReleased}`, 12);
      yPos += 2; // Small spacing between types
    });
    yPos += lineHeight;

    // Status das Chaves
    addNewPageIfNeeded(30);
    writeText('Status das Chaves:');
    writeText(`Com Chave: ${stats.byKey.yes}`, 6);
    writeText(`Sem Chave: ${stats.byKey.no}`, 6);
    yPos += lineHeight;

    // Por Estado
    addNewPageIfNeeded(20 + (Object.keys(stats.byState).length * lineHeight));
    writeText('Por Estado:');
    Object.entries(stats.byState).forEach(([state, count]) => {
      writeText(`${state}: ${count}`, 6);
    });

    // Lista detalhada de veículos
    addNewPageIfNeeded(40);
    yPos += lineHeight;
    writeText('Lista Detalhada de Veículos:');
    yPos += lineHeight;

    // Use autoTable for vehicle list
    doc.autoTable({
      startY: yPos,
      head: [['Placa', 'Marca/Modelo', 'Tipo', 'Cidade', 'Data Vistoria', 'Data Liberação']],
      body: filteredVehicles.map(vehicle => [
        `${vehicle.plate} (${vehicle.state})`,
        `${vehicle.brand} ${vehicle.model}`,
        vehicle.vehicleType,
        vehicle.city,
        format(new Date(vehicle.inspectionDate), 'dd/MM/yyyy'),
        vehicle.releaseDate ? format(new Date(vehicle.releaseDate), 'dd/MM/yyyy') : 'Não liberado'
      ]),
      margin: { top: 10 },
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 66, 166] }
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
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition flex items-center justify-center"
        >
          <Download className="h-5 w-5 mr-2" />
          Exportar Relatório Detalhado (PDF)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Resumo Geral</h3>
          <div className="space-y-2">
            <p>Total: <span className="font-bold text-indigo-600">{stats.total}</span></p>
            <p>Liberados: <span className="font-bold text-green-600">{stats.released}</span></p>
            <p>Não Liberados: <span className="font-bold text-red-600">{stats.notReleased}</span></p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Por Cidade</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {Object.entries(stats.byCity).map(([city, data]) => (
              <div key={city} className="border-b pb-2">
                <p className="font-medium">{city}</p>
                <div className="pl-4 text-sm">
                  <p>Total: <span className="font-bold text-indigo-600">{data.total}</span></p>
                  <p>Liberados: <span className="font-bold text-green-600">{data.released}</span></p>
                  <p>Não Liberados: <span className="font-bold text-red-600">{data.notReleased}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Por Tipo de Veículo</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {Object.entries(stats.byType).map(([type, data]) => (
              <div key={type} className="border-b pb-2">
                <p className="font-medium">{type}</p>
                <div className="pl-4 text-sm">
                  <p>Total: <span className="font-bold text-indigo-600">{data.total}</span></p>
                  <p>Liberados: <span className="font-bold text-green-600">{data.released}</span></p>
                  <p>Não Liberados: <span className="font-bold text-red-600">{data.notReleased}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Status das Chaves</h3>
          <div className="space-y-2">
            <p>Com Chave: <span className="font-bold text-green-600">{stats.byKey.yes}</span></p>
            <p>Sem Chave: <span className="font-bold text-red-600">{stats.byKey.no}</span></p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Por Estado</h3>
          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
            {Object.entries(stats.byState).map(([state, count]) => (
              <p key={state}>
                {state}: <span className="font-bold text-indigo-600">{count}</span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}