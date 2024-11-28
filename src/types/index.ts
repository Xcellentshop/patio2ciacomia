export type Vehicle = {
  id?: string;
  registrationNumber: number;
  plate: string;
  state: string;
  inspectionDate: string;
  brand: string;
  model: string;
  vehicleType: VehicleType;
  hasKey: boolean;
  chassisObservation: string;
  releaseDate: string | null;
  city: City;
  createdAt: string;
  bouTrv: string;
  hasNoPlate: boolean;
};

export type VehicleType =
  | 'Automóvel'
  | 'Motocicleta'
  | 'Camioneta'
  | 'Caminhonete'
  | 'Caminhão'
  | 'Ônibus'
  | 'Cam. Trator'
  | 'Triciclo'
  | 'Quadriciclo'
  | 'Trator de Rodas'
  | 'Semi-Reboque'
  | 'Motoneta'
  | 'Microônibus'
  | 'Reboque'
  | 'Ciclomotor'
  | 'Utilitário';

export type City = 'Medianeira' | 'SMI' | 'Missal' | 'Itaipulândia' | 'Serranópolis';

export type FilterOptions = {
  city?: City;
  startDate?: string;
  endDate?: string;
  vehicleType?: VehicleType;
  state?: string;
  hasKey?: boolean;
};

export type Sector =
  | 'Sargenteação'
  | 'Comando'
  | 'Subcomando'
  | 'Copom e RPA'
  | 'Cozinha'
  | 'Lavanderia'
  | 'Banheiros e Lavacar'
  | 'Sala de Aula'
  | 'Rotam'
  | 'Academia'
  | 'Associação'
  | 'Removido'
  | string;

export type AssetClass =
  | 'Mobiliário em geral'
  | 'Aparelhos e utensílios domésticos'
  | 'Equipamentos de processamento de dados'
  | 'Aparelhos e equipamentos para esporte e diversão'
  | 'Aparelhos ou equipamentos ou utensílios de médico-odontológico-hospitalar'
  | 'Equipamentos de proteção-segurança-socorro'
  | 'Equipamentos para áudio-vídeo-imagem'
  | 'Máquinas e equipamentos energéticos'
  | 'Máquinas e equipamentos agrícolas e rodoviários'
  | string;

export type ConservationState = 'Novo' | 'Bom' | 'Regular' | 'Ruim' | 'Inservível';

export type IncorporationType = 'Aquisição/compra' | 'Doação';

export type Asset = {
  id?: string;
  sector: Sector;
  generalTag: string;
  localTag: string;
  description: string;
  assetClass: AssetClass;
  conservationState: ConservationState;
  acquisitionDate: string;
  incorporationType: IncorporationType;
  acquisitionValue: number;
  evaluationValue: number;
  netValue: number;
  createdAt: string;
  updatedAt: string;
  transferHistory?: {
    fromSector: Sector;
    toSector: Sector;
    date: string;
    reason?: string;
  }[];
};