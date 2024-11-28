import React, { useState, useEffect } from 'react';
import { collection, addDoc, doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Asset, Sector, AssetClass, ConservationState, IncorporationType } from '../../types';
import { toast } from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';

const SECTORS: Sector[] = [
  'Sargenteação', 'Comando', 'Subcomando', 'Copom e RPA',
  'Cozinha', 'Lavanderia', 'Banheiros e Lavacar', 'Sala de Aula',
  'Rotam', 'Academia', 'Associação'
];

const ASSET_CLASSES: AssetClass[] = [
  'Mobiliário em geral',
  'Aparelhos e utensílios domésticos',
  'Equipamentos de processamento de dados',
  'Aparelhos e equipamentos para esporte e diversão',
  'Aparelhos ou equipamentos ou utensílios de médico-odontológico-hospitalar',
  'Equipamentos de proteção-segurança-socorro',
  'Equipamentos para áudio-vídeo-imagem',
  'Máquinas e equipamentos energéticos',
  'Máquinas e equipamentos agrícolas e rodoviários'
];

const CONSERVATION_STATES: ConservationState[] = [
  'Novo', 'Bom', 'Regular', 'Ruim', 'Inservível'
];

const INCORPORATION_TYPES: IncorporationType[] = [
  'Aquisição/compra', 'Doação'
];

export default function AssetForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sector: '',
    generalTag: '',
    localTag: '',
    description: '',
    assetClass: '',
    conservationState: '',
    acquisitionDate: '',
    incorporationType: '',
    acquisitionValue: 0,
    evaluationValue: 0,
    netValue: 0
  });
  const [descriptions, setDescriptions] = useState<string[]>([]);

  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  useEffect(() => {
    if (isEditing) {
      fetchAsset();
    }
    fetchDescriptions();
  }, [id]);

  const fetchAsset = async () => {
    try {
      const assetDoc = await getDoc(doc(db, 'assets', id!));
      if (assetDoc.exists()) {
        const assetData = assetDoc.data() as Asset;
        const acquisitionDate = new Date(assetData.acquisitionDate);

        setFormData({
          sector: assetData.sector,
          generalTag: assetData.generalTag,
          localTag: assetData.localTag,
          description: assetData.description,
          assetClass: assetData.assetClass,
          conservationState: assetData.conservationState,
          acquisitionDate: acquisitionDate.toISOString().split('T')[0],
          incorporationType: assetData.incorporationType,
          acquisitionValue: assetData.acquisitionValue,
          evaluationValue: assetData.evaluationValue,
          netValue: assetData.netValue
        });
      }
    } catch (error) {
      console.error('Error fetching asset:', error);
      toast.error('Erro ao carregar dados do patrimônio');
    }
  };

  const fetchDescriptions = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'assets'));
      const uniqueDescriptions = new Set<string>();
      querySnapshot.forEach((doc) => {
        const asset = doc.data() as Asset;
        uniqueDescriptions.add(asset.description);
      });
      setDescriptions(Array.from(uniqueDescriptions));
    } catch (error) {
      console.error('Error fetching descriptions:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const acquisitionDate = new Date(formData.acquisitionDate);
      acquisitionDate.setUTCHours(12, 0, 0, 0);

      const assetData = {
        ...formData,
        acquisitionDate: acquisitionDate.toISOString(),
        acquisitionValue: Number(formData.acquisitionValue),
        evaluationValue: Number(formData.evaluationValue),
        netValue: Number(formData.netValue)
      };

      if (isEditing) {
        await updateDoc(doc(db, 'assets', id!), {
          ...assetData,
          updatedAt: new Date().toISOString()
        });
        toast.success('Patrimônio atualizado com sucesso!');
      } else {
        const newAssetData = {
          ...assetData,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          transferHistory: []
        };
        await addDoc(collection(db, 'assets'), newAssetData);
        toast.success('Patrimônio cadastrado com sucesso!');
      }
      navigate('/assets');
    } catch (error) {
      console.error('Error saving asset:', error);
      toast.error('Erro ao salvar patrimônio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
        {isEditing ? 'Editar Patrimônio' : 'Cadastrar Patrimônio'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Setor
          </label>
          <select
            required
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={formData.sector}
            onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
          >
            <option value="">Selecione o setor</option>
            {SECTORS.map(sector => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Plaqueta Geral
          </label>
          <input
            type="text"
            required
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={formData.generalTag}
            onChange={(e) => setFormData({ ...formData, generalTag: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Plaqueta Local
          </label>
          <input
            type="text"
            required
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={formData.localTag}
            onChange={(e) => setFormData({ ...formData, localTag: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descrição
          </label>
          <input
            type="text"
            required
            list="descriptions"
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <datalist id="descriptions">
            {descriptions.map((desc, index) => (
              <option key={index} value={desc} />
            ))}
          </datalist>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Classe
          </label>
          <select
            required
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={formData.assetClass}
            onChange={(e) => setFormData({ ...formData, assetClass: e.target.value })}
          >
            <option value="">Selecione a classe</option>
            {ASSET_CLASSES.map(assetClass => (
              <option key={assetClass} value={assetClass}>{assetClass}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Estado de Conservação
          </label>
          <select
            required
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={formData.conservationState}
            onChange={(e) => setFormData({ ...formData, conservationState: e.target.value })}
          >
            <option value="">Selecione o estado</option>
            {CONSERVATION_STATES.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Data de Aquisição
          </label>
          <input
            type="date"
            required
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={formData.acquisitionDate}
            onChange={(e) => setFormData({ ...formData, acquisitionDate: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo de Incorporação
          </label>
          <select
            required
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={formData.incorporationType}
            onChange={(e) => setFormData({ ...formData, incorporationType: e.target.value })}
          >
            <option value="">Selecione o tipo</option>
            {INCORPORATION_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Valor de Aquisição
          </label>
          <input
            type="number"
            required
            step="0.01"
            min="0"
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={formData.acquisitionValue}
            onChange={(e) => setFormData({ ...formData, acquisitionValue: parseFloat(e.target.value) })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Valor de Avaliação
          </label>
          <input
            type="number"
            required
            step="0.01"
            min="0"
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={formData.evaluationValue}
            onChange={(e) => setFormData({ ...formData, evaluationValue: parseFloat(e.target.value) })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Valor Líquido
          </label>
          <input
            type="number"
            required
            step="0.01"
            min="0"
            className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            value={formData.netValue}
            onChange={(e) => setFormData({ ...formData, netValue: parseFloat(e.target.value) })}
          />
        </div>
      </div>

      <div className="mt-6">
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-600"
        >
          {loading ? (isEditing ? 'Atualizando...' : 'Cadastrando...') : (isEditing ? 'Atualizar Patrimônio' : 'Cadastrar Patrimônio')}
        </button>
      </div>
    </form>
  );
}