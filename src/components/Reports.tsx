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
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import html2canvas from 'html2canvas';

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

interface ChartOptions {
  byCity: boolean;
  byVehicleType: boolean;
  byReleaseStatus: boolean;
  byState: boolean;
}

export default function Reports() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCity, setSelectedCity] = useState<City | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCharts, setShowCharts] = useState(false);
  const [chartOptions, setChartOptions] = useState<ChartOptions>({
    byCity: true,
    byVehicleType: true,
    byReleaseStatus: true,
    byState: true
  });
  const chartsRef = useRef<HTMLDivElement>(null);

  const chartColors = [
    '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  const chartConfig = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: {
        color: '#fff',
        formatter: (value: number, ctx: any) => {
          const total = ctx.dataset.data.reduce((a: number, b: number) => a + b, 0);
          const percentage = ((value * 100) / total).toFixed(1);
          return `${value}\n(${percentage}%)`;
        }
      },
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgb(156, 163, 175)'
        }
      }
    }
  };

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
      byCity: {} as Record<City, number>,
      byVehicleType: {} as Record<VehicleType, number>,
      byState: {} as Record<string, number>,
      byReleaseStatus: {
        released: 0,
        notReleased: 0
      }
    };

    filteredVehicles.forEach(vehicle => {
      // Por cidade
      stats.byCity[vehicle.city] = (stats.byCity[vehicle.city] || 0) + 1;
      
      // Por tipo de veículo
      stats.byVehicleType[vehicle.vehicleType] = (stats.byVehicleType[vehicle.vehicleType] || 0) + 1;
      
      // Por estado
      stats.byState[vehicle.state] = (stats.byState[vehicle.state] || 0) + 1;
      
      // Por status de liberação
      if (vehicle.releaseDate) {
        stats.byReleaseStatus.released++;
      } else {
        stats.byReleaseStatus.notReleased++;
      }
    });

    return stats;
  };

  const generateChartData = (stats: ReturnType<typeof generateStats>) => {
    const cityData = {
      labels: Object.keys(stats.byCity),
      datasets: [{
        data: Object.values(stats.byCity),
        backgroundColor: chartColors.slice(0, Object.keys(stats.byCity).length),
        borderWidth: 1
      }]
    };

    const vehicleTypeData = {
      labels: Object.keys(stats.byVehicleType),
      datasets: [{
        data: Object.values(stats.byVehicleType),
        backgroundColor: chartColors.slice(0, Object.keys(stats.byVehicleType).length),
        borderWidth: 1
      }]
    };

    const releaseStatusData = {
      labels: ['Liberados', 'Não Liberados'],
      datasets: [{
        data: [stats.byReleaseStatus.released, stats.byReleaseStatus.notReleased],
        backgroundColor: ['#10B981', '#EF4444'],
        borderWidth: 1
      }]
    };

    const stateData = {
      labels: Object.keys(stats.byState),
      datasets: [{
        data: Object.values(stats.byState),
        backgroundColor: chartColors.slice(0, Object.keys(stats.byState).length),
        borderWidth: 1
      }]
    };

    return { cityData, vehicleTypeData, releaseStatusData, stateData };
  };

  const handleChartOptionChange = (option: keyof ChartOptions) => {
    setChartOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
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
    const margin = 14;
    let yPos = margin;
    const lineHeight = 7;

    const addNewPageIfNeeded = (requiredSpace: number) => {
      if (yPos + requiredSpace > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        yPos = margin;
        return true;
      }
      return false;
    };

    // Title and filters
    doc.setFontSize(16);
    doc.text('Relatório de Veículos', margin, yPos);
    yPos += lineHeight * 2;

    doc.setFontSize(12);
    doc.text(`Cidade: ${selectedCity || 'Todas'}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Período: ${startDate ? format(new Date(startDate), 'dd/MM/yyyy') : 'Início'} até ${endDate ? format(new Date(endDate), 'dd/MM/yyyy') : 'Fim'}`, margin, yPos);
    yPos += lineHeight * 2;

    // Summary
    doc.text('Resumo Geral:', margin, yPos);
    yPos += lineHeight;
    doc.text(`Total de Veículos: ${stats.total}`, margin + 5, yPos);
    yPos += lineHeight;
    doc.text(`Liberados: ${stats.released}`, margin + 5, yPos);
    yPos += lineHeight;
    doc.text(`Não Liberados: ${stats.notReleased}`, margin + 5, yPos);
    yPos += lineHeight * 2;

    // By city
    addNewPageIfNeeded(Object.keys(stats.byCity).length * lineHeight + 20);
    doc.text('Por Cidade:', margin, yPos);
    yPos += lineHeight;
    Object.entries(stats.byCity).forEach(([city, count]) => {
      doc.text(`${city}: ${count} veículos`, margin + 5, yPos);
      yPos += lineHeight;
    });
    yPos += lineHeight;

    // By vehicle type
    addNewPageIfNeeded(Object.keys(stats.byVehicleType).length * lineHeight + 20);
    doc.text('Por Tipo de Veículo:', margin, yPos);
    yPos += lineHeight;
    Object.entries(stats.byVehicleType).forEach(([type, count]) => {
      doc.text(`${type}: ${count} veículos`, margin + 5, yPos);
      yPos += lineHeight;
    });
    yPos += lineHeight;

    // By state
    addNewPageIfNeeded(Object.keys(stats.byState).length * lineHeight + 20);
    doc.text('Por Estado:', margin, yPos);
    yPos += lineHeight;
    Object.entries(stats.byState).forEach(([state, count]) => {
      doc.text(`${state}: ${count} veículos`, margin + 5, yPos);
      yPos += lineHeight;
    });
    yPos += lineHeight;

    // Detailed list
    addNewPageIfNeeded(40);
    doc.text('Lista Detalhada:', margin, yPos);
    yPos += lineHeight * 2;

    doc.autoTable({
      startY: yPos,
      head: [['Placa', 'Tipo', 'Cidade', 'Data Vistoria', 'Liberação']],
      body: filteredVehicles.map(vehicle => [
        `${vehicle.plate} (${vehicle.state})`,
        vehicle.vehicleType,
        vehicle.city,
        format(new Date(vehicle.inspectionDate), 'dd/MM/yyyy'),
        vehicle.releaseDate ? format(new Date(vehicle.releaseDate), 'dd/MM/yyyy') : 'Não liberado'
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save('relatorio-veiculos.pdf');
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
  const { cityData, vehicleTypeData, releaseStatusData, stateData } = generateChartData(stats);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Relatórios</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Cidade
            </label>
            <select
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value as City)}
            >
              <option value="">Todas as cidades</option>
              {Object.keys(stats.byCity).map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Data Final
            </label>
            <input
              type="date"
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={chartOptions.byCity}
              onChange={() => handleChartOptionChange('byCity')}
              className="h-4 w-4 text-indigo-600 rounded border-gray-300"
            />
            <span className="text-gray-700 dark:text-gray-300">Por Cidade</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={chartOptions.byVehicleType}
              onChange={() => handleChartOptionChange('byVehicleType')}
              className="h-4 w-4 text-indigo-600 rounded border-gray-300"
            />
            <span className="text-gray-700 dark:text-gray-300">Por Tipo de Veículo</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={chartOptions.byReleaseStatus}
              onChange={() => handleChartOptionChange('byReleaseStatus')}
              className="h-4 w-4 text-indigo-600 rounded border-gray-300"
            />
            <span className="text-gray-700 dark:text-gray-300">Por Status de Liberação</span>
          </label>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={chartOptions.byState}
              onChange={() => handleChartOptionChange('byState')}
              className="h-4 w-4 text-indigo-600 rounded border-gray-300"
            />
            <span className="text-gray-700 dark:text-gray-300">Por Estado</span>
          </label>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => exportToPDF(filteredVehicles)}
            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition flex items-center justify-center"
          >
            <FileText className="h-5 w-5 mr-2" />
            Exportar Relatório (PDF)
          </button>

          <button
            onClick={() => setShowCharts(!showCharts)}
            className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 transition flex items-center justify-center"
            disabled={!Object.values(chartOptions).some(v => v)}
          >
            <BarChart className="h-5 w-5 mr-2" />
            {showCharts ? 'Ocultar Gráficos' : 'Mostrar Gráficos'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Resumo Geral</h3>
          <div className="space-y-2">
            <p className="text-gray-600 dark:text-gray-300">
              Total de Veículos: <span className="font-bold text-indigo-600 dark:text-indigo-400">{stats.total}</span>
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Liberados: <span className="font-bold text-green-600 dark:text-green-400">{stats.released}</span>
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Não Liberados: <span className="font-bold text-red-600 dark:text-red-400">{stats.notReleased}</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Por Cidade</h3>
          <div className="space-y-2">
            {Object.entries(stats.byCity).map(([city, count]) => (
              <p key={city} className="text-gray-600 dark:text-gray-300">
                {city}: <span className="font-bold text-indigo-600 dark:text-indigo-400">{count}</span>
              </p>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Por Tipo</h3>
          <div className="space-y-2">
            {Object.entries(stats.byVehicleType).map(([type, count]) => (
              <p key={type} className="text-gray-600 dark:text-gray-300">
                {type}: <span className="font-bold text-indigo-600 dark:text-indigo-400">{count}</span>
              </p>
            ))}
          </div>
        </div>
      </div>

      {showCharts && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md" ref={chartsRef}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white">Gráficos</h3>
            <button
              onClick={exportChartsToPNG}
              className="bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar Gráficos (PNG)
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {chartOptions.byCity && (
              <div className="h-[400px] bg-white dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">
                  Distribuição por Cidade
                </h4>
                <Pie data={cityData} options={chartConfig} />
              </div>
            )}

            {chartOptions.byVehicleType && (
              <div className="h-[400px] bg-white dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">
                  Distribuição por Tipo de Veículo
                </h4>
                <Pie data={vehicleTypeData} options={chartConfig} />
              </div>
            )}

            {chartOptions.byReleaseStatus && (
              <div className="h-[400px] bg-white dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">
                  Status de Liberação
                </h4>
                <Pie data={releaseStatusData} options={chartConfig} />
              </div>
            )}

            {chartOptions.byState && (
              <div className="h-[400px] bg-white dark:bg-gray-800 p-4 rounded-lg">
                <h4 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">
                  Distribuição por Estado
                </h4>
                <Pie data={stateData} options={chartConfig} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}