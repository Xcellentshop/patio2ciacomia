import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Vehicle, City, VehicleType } from '../types';
import { FileText, Download, BarChart } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import html2canvas from 'html2canvas';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

export default function Reports() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<City | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCharts, setShowCharts] = useState(false);
  const chartsRef = useRef<HTMLDivElement>(null);

  const chartColors = [
    '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

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

  const generateChartData = (stats: ReturnType<typeof generateStats>) => {
    const cityData = {
      labels: Object.keys(stats.byCity),
      datasets: [
        {
          label: 'Total de Veículos',
          data: Object.values(stats.byCity).map(city => city.total),
          backgroundColor: chartColors.slice(0, Object.keys(stats.byCity).length),
          borderWidth: 1
        }
      ]
    };

    const vehicleTypeData = {
      labels: Object.keys(stats.byType),
      datasets: [
        {
          label: 'Liberados',
          data: Object.values(stats.byType).map(type => type.released),
          backgroundColor: '#10B981',
          borderColor: '#059669',
          borderWidth: 1,
          type: 'bar'
        },
        {
          label: 'Não Liberados',
          data: Object.values(stats.byType).map(type => type.notReleased),
          backgroundColor: '#EF4444',
          borderColor: '#DC2626',
          borderWidth: 1,
          type: 'bar'
        },
        {
          label: 'Total',
          data: Object.values(stats.byType).map(type => type.total),
          borderColor: '#4F46E5',
          borderWidth: 2,
          type: 'line',
          fill: false
        }
      ]
    };

    const keyStatusData = {
      labels: ['Com Chave', 'Sem Chave'],
      datasets: [
        {
          data: [stats.byKey.yes, stats.byKey.no],
          backgroundColor: ['#10B981', '#EF4444'],
          borderWidth: 1
        }
      ]
    };

    return { cityData, vehicleTypeData, keyStatusData };
  };

  const exportChartsToPNG = async () => {
    if (!chartsRef.current) return;

    try {
      const canvas = await html2canvas(chartsRef.current);
      const link = document.createElement('a');
      link.download = 'graficos-relatorio.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error exporting charts:', error);
    }
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
        yPos = margin;
      }
      doc.text(text, margin + indent, yPos);
      yPos += lineHeight;
    };

    doc.setFontSize(16);
    writeText('Relatório de Veículos');
    
    doc.setFontSize(12);
    writeText(`Período: ${startDate ? format(new Date(startDate), 'dd/MM/yyyy') : 'Início'} até ${endDate ? format(new Date(endDate), 'dd/MM/yyyy') : 'Fim'}`);
    writeText(`Cidade: ${selectedCity || 'Todas'}`);
    yPos += lineHeight;

    writeText('Resumo Geral:');
    writeText(`Total de Veículos: ${stats.total}`, 6);
    writeText(`Veículos Liberados: ${stats.released}`, 6);
    writeText(`Veículos Não Liberados: ${stats.notReleased}`, 6);
    yPos += lineHeight;

    addNewPageIfNeeded(20 + (Object.keys(stats.byCity).length * lineHeight * 3));
    writeText('Por Cidade:');
    Object.entries(stats.byCity).forEach(([city, data]) => {
      writeText(`${city}:`, 6);
      writeText(`Total: ${data.total} | Liberados: ${data.released} | Não Liberados: ${data.notReleased}`, 12);
      yPos += 2;
    });
    yPos += lineHeight;

    addNewPageIfNeeded(20 + (Object.keys(stats.byType).length * lineHeight * 3));
    writeText('Por Tipo de Veículo:');
    Object.entries(stats.byType).forEach(([type, data]) => {
      writeText(`${type}:`, 6);
      writeText(`Total: ${data.total} | Liberados: ${data.released} | Não Liberados: ${data.notReleased}`, 12);
      yPos += 2;
    });
    yPos += lineHeight;

    addNewPageIfNeeded(30);
    writeText('Status das Chaves:');
    writeText(`Com Chave: ${stats.byKey.yes}`, 6);
    writeText(`Sem Chave: ${stats.byKey.no}`, 6);
    yPos += lineHeight;

    addNewPageIfNeeded(20 + (Object.keys(stats.byState).length * lineHeight));
    writeText('Por Estado:');
    Object.entries(stats.byState).forEach(([state, count]) => {
      writeText(`${state}: ${count}`, 6);
    });

    addNewPageIfNeeded(40);
    yPos += lineHeight;
    writeText('Lista Detalhada de Veículos:');
    yPos += lineHeight;

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
  const { cityData, vehicleTypeData, keyStatusData } = generateChartData(stats);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        color: '#fff',
        formatter: (value: number) => `${value}`,
        display: (context: any) => context.dataset.data[context.dataIndex] > 0
      },
      legend: {
        position: 'bottom' as const
      }
    }
  };

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

        <div className="flex space-x-4">
          <button
            onClick={() => exportToPDF(filteredVehicles)}
            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition flex items-center justify-center"
          >
            <Download className="h-5 w-5 mr-2" />
            Exportar Relatório (PDF)
          </button>

          <button
            onClick={() => setShowCharts(!showCharts)}
            className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 transition flex items-center justify-center"
          >
            <BarChart className="h-5 w-5 mr-2" />
            {showCharts ? 'Ocultar Gráficos' : 'Mostrar Gráficos'}
          </button>
        </div>
      </div>

      {showCharts && (
        <div className="bg-white p-6 rounded-lg shadow-md" ref={chartsRef}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold">Gráficos</h3>
            <button
              onClick={exportChartsToPNG}
              className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Gráficos (PNG)
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="h-[400px]">
              <h4 className="text-lg font-medium mb-4">Distribuição por Cidade</h4>
              <Pie data={cityData} options={chartOptions} />
            </div>

            <div className="h-[400px]">
              <h4 className="text-lg font-medium mb-4">Status das Chaves</h4>
              <Pie data={keyStatusData} options={chartOptions} />
            </div>

            <div className="h-[400px] lg:col-span-2">
              <h4 className="text-lg font-medium mb-4">Análise por Tipo de Veículo</h4>
              <Bar data={vehicleTypeData} options={{
                ...chartOptions,
                scales: {
                  y: {
                    beginAtZero: true
                  }
                }
              }} />
            </div>
          </div>
        </div>
      )}

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
