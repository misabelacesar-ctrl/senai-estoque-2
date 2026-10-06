import { ArtigoItem, GrupoItem, InventoryDatabase, SubgrupoItem, TipoItem } from '../types/inventory';

// Helpers para geração automática de códigos únicos
export function generateNextTipoCode(existingTypes: TipoItem[]): string {
  const numbers = existingTypes
    .map(t => {
      const match = t.code.match(/TIP-(\d+)/i);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => !isNaN(n));

  const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `TIP-${String(nextNum).padStart(2, '0')}`;
}

export function generateNextGrupoCode(tipoCode: string, existingGroups: GrupoItem[]): string {
  const tipoPrefix = tipoCode.replace(/^TIP-/i, '');
  const prefixPattern = new RegExp(`^GRP-${tipoPrefix}-(\\d+)`, 'i');

  const numbers = existingGroups
    .map(g => {
      const match = g.code.match(prefixPattern);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => !isNaN(n));

  const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `GRP-${tipoPrefix}-${String(nextNum).padStart(2, '0')}`;
}

export function generateNextSubgrupoCode(grupoCode: string, existingSubgroups: SubgrupoItem[]): string {
  const grupoPrefix = grupoCode.replace(/^GRP-/i, '');
  const prefixPattern = new RegExp(`^SUB-${grupoPrefix}-(\\d+)`, 'i');

  const numbers = existingSubgroups
    .map(s => {
      const match = s.code.match(prefixPattern);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => !isNaN(n));

  const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `SUB-${grupoPrefix}-${String(nextNum).padStart(2, '0')}`;
}

export function generateNextArtigoCode(subgrupoCode: string, existingArticles: ArtigoItem[]): string {
  const subPrefix = subgrupoCode.replace(/^SUB-/i, '');
  const prefixPattern = new RegExp(`^ART-${subPrefix}-(\\d+)`, 'i');

  const numbers = existingArticles
    .map(a => {
      const match = a.code.match(prefixPattern);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(n => !isNaN(n));

  const nextNum = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `ART-${subPrefix}-${String(nextNum).padStart(3, '0')}`;
}

export function generateFullLocationCode(details: {
  warehouse: string;
  aisle: string;
  shelf: string;
  level?: string;
  bin?: string;
}): string {
  const clean = (val?: string) => (val ? val.trim().replace(/\s+/g, '-').toUpperCase() : '');
  const w = clean(details.warehouse) || 'GERAL';
  const a = clean(details.aisle) || '01';
  const s = clean(details.shelf) || '01';
  const l = clean(details.level) || '01';
  const b = clean(details.bin) || '01';

  return `LOC-${w}-${a}-${s}-${l}-${b}`;
}

export function formatCurrencyBRL(value?: number): string {
  if (value === undefined || value === null) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDateTimeBR(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoString;
  }
}

export function formatDateOnlyBR(isoString: string): string {
  try {
    const d = new Date(isoString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return isoString;
  }
}

// Estrutura demonstrativa do SENAI SP (Carregável apenas se o usuário desejar testar)
export function getSampleSenaiData(): InventoryDatabase {
  const now = new Date().toISOString();

  const types: TipoItem[] = [
    {
      id: 'tip-1',
      code: 'TIP-01',
      name: 'Matéria-Prima Industrial',
      description: 'Metais, polímeros e insumos brutos para usinagem e caldeiraria',
      createdAt: now,
    },
    {
      id: 'tip-2',
      code: 'TIP-02',
      name: 'Ferramental e Acessórios',
      description: 'Insertos, brocas, fresas e ferramentas manuais para oficinas mecânicas',
      createdAt: now,
    },
    {
      id: 'tip-3',
      code: 'TIP-03',
      name: 'Componentes Eletroeletrônicos',
      description: 'Sensores, atuadores, contatores e condutores para automação',
      createdAt: now,
    },
  ];

  const groups: GrupoItem[] = [
    {
      id: 'grp-1',
      tipoId: 'tip-1',
      code: 'GRP-01-01',
      name: 'Aços e Ligas Ferrosas',
      description: 'Aços carbono SAE 1020, SAE 1045 e aços ferramenta',
      createdAt: now,
    },
    {
      id: 'grp-2',
      tipoId: 'tip-2',
      code: 'GRP-02-01',
      name: 'Ferramentas de Corte',
      description: 'Brocas de aço rápido e pastilhas de metal duro',
      createdAt: now,
    },
    {
      id: 'grp-3',
      tipoId: 'tip-3',
      code: 'GRP-03-01',
      name: 'Dispositivos de Comando e Potência',
      description: 'Relés, disjuntores e contatores industriais',
      createdAt: now,
    },
  ];

  const subgroups: SubgrupoItem[] = [
    {
      id: 'sub-1',
      grupoId: 'grp-1',
      code: 'SUB-01-01-01',
      name: 'Barras Redondas Laminadas',
      description: 'Barras redondas para usinagem em torno mecânico e CNC',
      createdAt: now,
    },
    {
      id: 'sub-2',
      grupoId: 'grp-2',
      code: 'SUB-02-01-01',
      name: 'Insertos e Pastilhas Intercambiáveis',
      description: 'Pastilhas de torneamento e fresamento',
      createdAt: now,
    },
    {
      id: 'sub-3',
      grupoId: 'grp-3',
      code: 'SUB-03-01-01',
      name: 'Contatores Tripolares AC3',
      description: 'Contatores de acionamento de motores trifásicos',
      createdAt: now,
    },
  ];

  const articles: ArtigoItem[] = [
    {
      id: 'art-1',
      subgrupoId: 'sub-1',
      code: 'ART-01-01-01-001',
      name: 'Barra Redonda Aço SAE 1020 Ø 1" x 3000mm',
      description: 'Aço carbono trefilado para práticas de torneamento mecânico',
      unit: 'BARRA',
      currentStock: 45,
      minStock: 15,
      averageUnitCost: 85.5,
      locationDetails: {
        warehouse: 'Galpão Mecânica A',
        aisle: 'Rua 01',
        shelf: 'Rack de Barras 03',
        level: 'Nível Inferior',
        bin: 'Posição B2',
        fullCode: 'LOC-GALPAO-MEC-A-R01-RACK03-POSB2',
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'art-2',
      subgrupoId: 'sub-2',
      code: 'ART-02-01-01-001',
      name: 'Inserto Metal Duro TNMG 160408-PM',
      description: 'Pastilha triangular revestida para desbaste de aços em torno CNC',
      unit: 'CX',
      currentStock: 8,
      minStock: 10,
      averageUnitCost: 220.0,
      locationDetails: {
        warehouse: 'Almoxarifado Central',
        aisle: 'Corredor C',
        shelf: 'Estante 02',
        level: 'Nível 3',
        bin: 'Gaveteiro G14',
        fullCode: 'LOC-ALMOX-CENTRAL-CC-E02-N3-G14',
      },
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'art-3',
      subgrupoId: 'sub-3',
      code: 'ART-03-01-01-001',
      name: 'Contator Tripolar 18A 220V 1NA+1NF (CWM18)',
      description: 'Contator industrial WEG para montagem de comandos elétricos',
      unit: 'UN',
      currentStock: 18,
      minStock: 5,
      averageUnitCost: 115.0,
      locationDetails: {
        warehouse: 'Lab Eletrotécnica',
        aisle: 'Corredor E',
        shelf: 'Armário Blindado 01',
        level: 'Prateleira 2',
        bin: 'Box Elétrico 08',
        fullCode: 'LOC-LAB-ELETRO-CE-ARM01-PR2-BX08',
      },
      createdAt: now,
      updatedAt: now,
    },
  ];

  return {
    version: '1.0.0',
    lastUpdated: now,
    types,
    groups,
    subgroups,
    articles,
    movements: [
      {
        id: 'mov-1',
        articleId: 'art-1',
        type: 'ENTRADA',
        quantity: 50,
        previousStock: 0,
        newStock: 50,
        date: new Date(Date.now() - 86400000 * 3).toISOString(),
        documentNumber: 'NF-89234',
        originDestination: 'Gerdau Aços Especiais S.A.',
        reason: 'Aquisição Regular Semestre Letivo',
        operator: 'Prof. Coordenador Mecânica',
        unitCost: 85.5,
        notes: 'Material recebido e conferido com certificado de qualidade',
      },
      {
        id: 'mov-2',
        articleId: 'art-1',
        type: 'SAIDA',
        quantity: 5,
        previousStock: 50,
        newStock: 45,
        date: new Date(Date.now() - 86400000).toISOString(),
        documentNumber: 'REQ-AULA-104',
        originDestination: 'Turma Mecânico de Usinagem 2026/1',
        reason: 'Aula Prática: Torneamento Cilíndrico e Recartilho',
        operator: 'Instrutor Técnico Silva',
        notes: 'Corte efetuado na serra fita em pedaços de 150mm',
      },
      {
        id: 'mov-3',
        articleId: 'art-2',
        type: 'ENTRADA',
        quantity: 8,
        previousStock: 0,
        newStock: 8,
        date: new Date(Date.now() - 86400000 * 2).toISOString(),
        documentNumber: 'NF-110293',
        originDestination: 'Sandvik Coromant Brasil',
        reason: 'Reposição de Ferramental CNC',
        operator: 'Almoxarife SENAI',
        unitCost: 220.0,
      },
      {
        id: 'mov-4',
        articleId: 'art-3',
        type: 'ENTRADA',
        quantity: 18,
        previousStock: 0,
        newStock: 18,
        date: new Date(Date.now() - 86400000 * 4).toISOString(),
        documentNumber: 'NF-449102',
        originDestination: 'WEG Equipamentos Elétricos',
        reason: 'Kit de Bancadas Didáticas',
        operator: 'Almoxarife SENAI',
        unitCost: 115.0,
      },
    ],
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
      lastMessage: 'Dados de demonstração carregados com sucesso',
    },
  };
}
