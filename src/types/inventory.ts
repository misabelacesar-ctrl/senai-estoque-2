export interface TipoItem {
  id: string;
  code: string; // e.g. TIP-01
  name: string;
  description?: string;
  createdAt: string;
}

export interface GrupoItem {
  id: string;
  tipoId: string;
  code: string; // e.g. GRP-01-01
  name: string;
  description?: string;
  createdAt: string;
}

export interface SubgrupoItem {
  id: string;
  grupoId: string;
  code: string; // e.g. SUB-01-01-01
  name: string;
  description?: string;
  createdAt: string;
}

export interface LocationDetails {
  warehouse: string; // Prédio / Galpão / Almoxarifado (e.g. "Galpão A - Usinagem")
  aisle: string;     // Corredor / Rua (e.g. "Rua 02")
  shelf: string;     // Estante / Prateleira (e.g. "Estante 05")
  level?: string;    // Nível / Altura (e.g. "Nível B")
  bin?: string;      // Box / Gaveta / Vão (e.g. "Box 14")
  fullCode: string;  // e.g. "GLP-A-R02-E05-NB-B14"
}

export interface ArtigoItem {
  id: string;
  subgrupoId: string;
  code: string; // e.g. ART-01-01-01-001
  name: string;
  description?: string;
  unit: string; // UN, KG, M, M2, L, CX, PC, PACOTE, BARRA, ROLO
  currentStock: number;
  minStock: number;
  locationDetails: LocationDetails;
  averageUnitCost?: number; // Custo unitário médio estimado em R$
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 'ENTRADA' | 'SAIDA' | 'AJUSTE';

export interface StockMovement {
  id: string;
  articleId: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  date: string;
  documentNumber?: string; // Nota Fiscal, Requisição, OS, Pedido
  originDestination: string; // Fornecedor / Doador (entrada) OU Turma / Aluno / Laboratório / Setor (saída)
  reason: string; // Compra, Doação, Devolução, Aula Prática, Manutenção, Descarte
  operator: string; // Nome do almoxarife / responsável técnico
  unitCost?: number;
  notes?: string;
}

export interface StorageLocationPreset {
  id: string;
  warehouse: string;
  aisle: string;
  shelf: string;
  description?: string;
}

export interface GitHubSyncConfig {
  enabled: boolean;
  token: string;
  mode: 'gist' | 'repo';
  gistId?: string;
  repoOwner?: string;
  repoName?: string;
  filePath?: string;
  autoSync: boolean;
  lastSync?: string;
  lastStatus?: 'idle' | 'success' | 'error';
  lastMessage?: string;
}

export interface InventoryDatabase {
  version: string;
  lastUpdated: string;
  types: TipoItem[];
  groups: GrupoItem[];
  subgroups: SubgrupoItem[];
  articles: ArtigoItem[];
  movements: StockMovement[];
  locations: StorageLocationPreset[];
  githubConfig: GitHubSyncConfig;
}

export const EMPTY_DATABASE: InventoryDatabase = {
  version: '1.0.0',
  lastUpdated: new Date().toISOString(),
  types: [],
  groups: [],
  subgroups: [],
  articles: [],
  movements: [],
  locations: [],
  githubConfig: {
    enabled: false,
    token: '',
    mode: 'gist',
    gistId: '',
    repoOwner: '',
    repoName: 'senai-estoque-backup',
    filePath: 'senai_estoque_data.json',
    autoSync: false,
    lastStatus: 'idle',
    lastMessage: 'Aguardando configuração de persistência em nuvem',
  },
};
