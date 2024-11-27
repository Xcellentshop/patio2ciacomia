import React, { useState, useEffect, useRef } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Asset, Sector } from '../../types';
import { format } from 'date-fns';
import { FileText, Download, BarChart } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
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

const SECTORS: Sector[] = [
  'Sargenteação', 'Comando', 'Subcomando', 'Copom e RPA',
  'Cozinha', 'Lavanderia', 'Banheiros e Lavacar', 'Sala de Aula',
  'Rotam', 'Academia', 'Associação', 'Removido'
];

export default function AssetReports() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState<Sector | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCharts, setShowCharts] = useState(false);
  const chartsRef = useRef<HTMLDivElement>(null);

  const chartColors = [
    '#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  useEffect(() => {
    fetchAssets();
  }, [selectedSector]);

  const fetchAssets = async () => {
    try {
      const assetsRef = collection(db, 'assets');
      const q = selectedSector
        ? query(assetsRef, where('sector', '==', selectedSector))
        : assetsRef;
      
      const querySnapshot = await getDocs(q);
      const assetData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Asset[];
      
      setAssets(assetData);
    } catch (error) {
      console.error('Error fetching assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAssets = () => {
    return assets.filter(asset => {
      const acquisitionDate = new Date(asset.acquisitionDate);
      const matchesDateRange = (!startDate && !endDate) || 
        ((!startDate || acquisitionDate >= new Date(startDate)) &&
         (!endDate || acquisitionDate <= new Date(endDate)));
      return matchesDateRange;
    });
  };

  const generateStats = (filteredAssets: Asset[]) => {
    const stats = {
      total: filteredAssets.length,
      totalValue: filteredAssets.reduce((sum, asset) => sum + asset.netValue, 0),
      bySector: {} as Record<Sector, {
        count: number;
        value: number;
      }>,
      byState: {} as Record<string, number>,
      byClass: {} as Record<string, number>
    };

    filteredAssets.forEach(asset => {
      // By sector
      if (!stats.bySector[asset.sector]) {
        stats.bySector[asset.sector] = { count: 0, value: 0 };
      }
      stats.bySector[asset.sector].count++;
      stats.bySector[asset.sector].value += asset.netValue;

      // By conservation state
      stats.byState[asset.conservationState] = (stats.byState[asset.conservationState] || 0) + 1;

      // By class
      stats.byClass[asset.assetClass] = (stats.byClass[asset.assetClass] || 0) + 1;
    });

    return stats;
  };

  const generateChartData = (stats: ReturnType<typeof generateStats>) => {
    const sectorData = {
      labels: Object.keys(stats.bySector),
      datasets: [
        {
          data: Object.values(stats.bySector).map(s => s.count),
          backgroundColor: chartColors.slice(0, Object.keys(stats.bySector).length),
          borderWidth: 1
        }
      ]
    };

    const stateData = {
      labels: Object.keys(stats.byState),
      datasets: [
        {
          data: Object.values(stats.byState),
          backgroundColor: chartColors.slice(0, Object.keys(stats.byState).length),
          borderWidth: 1
        }
      ]
    };

    const classData = {
      labels: Object.keys(stats.byClass),
      datasets: [
        {
          data: Object.values(stats.byClass),
          backgroundColor: chartColors.slice(0, Object.keys(stats.byClass).length),
          borderWidth: 1
        }
      ]
    };

    return { sectorData, stateData, classData };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const exportChartsToPNG = async () => {
    if (!chartsRef.current) return;

    try {
      const canvas = await html2canvas(chartsRef.current);
      const link = document.createElement('a');
      link.download = 'graficos-patrimonio.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (error) {
      console.error('Error exporting charts:', error);
    }
  };

  const exportToPDF = (filteredAssets: Asset[]) => {
    const doc = new jsPDF();
    const stats = generateStats(filteredAssets);
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
    doc.text('Relatório de Patrimônio', margin, yPos);
    yPos += lineHeight * 2;

    doc.setFontSize(12);
    doc.text(`Setor: ${selectedSector || 'Todos'}`, margin, yPos);
    yPos += lineHeight;
    doc.text(`Período: ${startDate ? format(new Date(startDate), 'dd/MM/yyyy') : 'Início'} até ${endDate ? format(new Date(endDate), 'dd/MM/yyyy') : 'Fim'}`, margin, yPos);
    yPos += lineHeight * 2;

    // Summary
    doc.text('Resumo Geral:', margin, yPos);
    yPos += lineHeight;
    doc.text(`Total de Itens: ${stats.total}`, margin + 5, yPos);
    yPos += lineHeight;
    doc.text(`Valor Total: ${formatCurrency(stats.totalValue)}`, margin + 5, yPos);
    yPos += lineHeight * 2;

    // By sector
    addNewPageIfNeeded(Object.keys(stats.bySector).length * lineHeight + 20);
    doc.text('Por Setor:', margin, yPos);
    yPos += lineHeight;
    Object.entries(stats.bySector).forEach(([sector, data]) => {
      doc.text(`${sector}: ${data.count} itens - ${formatCurrency(data.value)}`, margin + 5, yPos);
      yPos += lineHeight;
    });
    yPos += lineHeight;

    // Detailed list
    addNewPageIfNeeded(40);
    doc.text('Lista Detalhada:', margin, yPos);
    yPos += lineHeight * 2;

    doc.autoTable({
      startY: yPos,
      head: [['Plaquetas', 'Descrição', 'Setor', 'Estado', 'Valor']],
      body: filteredAssets.map(asset => [
        `G: ${asset.generalTag}\nL: ${asset.localTag}`,
        `${asset.description}\n${asset.assetClass}`,
        asset.sector,
        asset.conservationState,
        formatCurrency(asset.netValue)
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save('relatorio-patrimonio.pdf');
  };

  const chartOptions = {
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const filteredAssets = filterAssets();
  const stats = generateStats(filteredAssets);
  const { sectorData, stateData, classData } = generateChartData(stats);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">Relatórios</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Setor
            </label>
            <select
              className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value as Sector)}
            >
              <option value="">Todos os setores</option>
              {SECTORS.map(sector => (
                <option key={sector} value={sector}>{sector}</option>
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

        <div className="flex space-x-4">
          <button
            onClick={() => exportToPDF(filteredAssets)}
            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition flex items-center justify-center"
          >
            <Download className="h-5 w-5 mr-2" />
            Exportar Relatório (PDF)
          </button>

          <button
            onClick={() => setShowCharts(!showCharts)}
            className="flex-1 bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 transition flex items-center justify-center"
          >
            <BarChart className="h-5 w-5 mr-2" />
            {showCharts ? 'Ocultar Gráficos' : 'Mostrar Gráficos'}
          </button>
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
            <div className="h-[400px] bg-white dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">Distribuição por Setor</h4>
              <Pie data={sectorData} options={chartOptions} />
            </div>

            <div className="h-[400px] bg-white dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">Estado de Conservação</h4>
              <Pie data={stateData} options={chartOptions} />
            </div>

            <div className="h-[400px] lg:col-span-2 bg-white dark:bg-gray-800 p-4 rounded-lg">
              <h4 className="text-lg font-medium mb-4 text-gray-800 dark:text-white">Distribuição por Classe</h4>
              <Bar data={classData} options={chartOptions} />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Resumo Geral</h3>
          <div className="space-y-2">
            <p className="text-gray-600 dark:text-gray-300">
              Total de Itens: <span className="font-bold text-indigo-600 dark:text-indigo-400">{stats.total}</span>
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Valor Total: <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(stats.totalValue)}</span>
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Por Setor</h3>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {Object.entries(stats.bySector).map(([sector, data]) => (
              <div key={sector} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                <p className="font-medium text-gray-800 dark:text-white">{sector}</p>
                <div className="pl-4 text-sm">
                  <p className="text-gray-600 dark:text-gray-300">
                    Quantidade: <span className="font-bold text-indigo-600 dark:text-indigo-400">{data.count}</span>
                  </p>
                  <p className="text-gray-600 dark:text-gray-300">
                    Valor: <span className="font-bold text-green-600 dark:text-green-400">{formatCurrency(data.value)}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Por Estado</h3>
          <div className="space-y-2">
            {Object.entries(stats.byState).map(([state, count]) => (
              <p key={state} className="text-gray-600 dark:text-gray-300">
                {state}: <span className="font-bold text-indigo-600 dark:text-indigo-400">{count}</span>
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}