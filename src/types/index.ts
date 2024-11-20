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