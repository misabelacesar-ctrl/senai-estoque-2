import React, { createContext, useContext, useEffect, useState } from 'react';
import { ArtigoItem, GitHubSyncConfig, GrupoItem, InventoryDatabase, StockMovement, StorageLocationPreset, SubgrupoItem, TipoItem } from '../types/inventory';
import { generateNextArtigoCode, generateNextGrupoCode, generateNextSubgrupoCode, generateNextTipoCode, getSampleSenaiData } from '../utils/codeGenerator';

interface InventoryContextType {
  database: InventoryDatabase;
  loading: boolean;
  error: string | null;
  serverOnline: boolean;
  // Hierarquia
  addTipo: (tipo: Omit<TipoItem, 'id' | 'code' | 'createdAt'> & { code?: string }) => Promise<TipoItem>;
  updateTipo: (id: string, data: Partial<TipoItem>) => Promise<void>;
  deleteTipo: (id: string) => Promise<boolean>;
  addGrupo: (grupo: Omit<GrupoItem, 'id' | 'code' | 'createdAt'> & { code?: string }) => Promise<GrupoItem>;
  updateGrupo: (id: string, data: Partial<GrupoItem>) => Promise<void>;
  deleteGrupo: (id: string) => Promise<boolean>;
  addSubgrupo: (sub: Omit<SubgrupoItem, 'id' | 'code' | 'createdAt'> & { code?: string }) => Promise<SubgrupoItem>;
  updateSubgrupo: (id: string, data: Partial<SubgrupoItem>) => Promise<void>;
  deleteSubgrupo: (id: string) => Promise<boolean>;
  // Artigos
  addArtigo: (artigo: Omit<ArtigoItem, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'currentStock'> & { code?: string; initialStock?: number }) => Promise<ArtigoItem>;
  updateArtigo: (id: string, data: Partial<ArtigoItem>) => Promise<void>;
  deleteArtigo: (id: string) => Promise<boolean>;
  // Movimentações
  registerMovement: (data: {
    articleId: string;
    type: 'ENTRADA' | 'SAIDA' | 'AJUSTE';
    quantity: number;
    documentNumber?: string;
    originDestination: string;
    reason: string;
    operator: string;
    unitCost?: number;
    notes?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  // Localizações
  addLocationPreset: (loc: Omit<StorageLocationPreset, 'id'>) => Promise<void>;
  deleteLocationPreset: (id: string) => Promise<void>;
  // Nuvem e Utilitários
  saveGitHubConfig: (config: GitHubSyncConfig) => Promise<void>;
  syncToGitHub: () => Promise<{ success: boolean; message: string; url?: string }>;
  pullFromGitHub: () => Promise<{ success: boolean; message: string }>;
  resetToEmpty: () => Promise<void>;
  loadSampleData: () => Promise<void>;
  exportJsonBackup: () => void;
  importJsonBackup: (jsonData: InventoryDatabase) => Promise<void>;
  reloadDatabase: () => Promise<void>;
}

const LOCAL_STORAGE_KEY = 'SENAI_SP_ESTOQUE_DATABASE_V1';

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [database, setDatabase] = useState<InventoryDatabase>(() => {
    // Tenta carregar do localStorage como fallback inicial rápido
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        // ignora
      }
    }
    return {
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
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serverOnline, setServerOnline] = useState(true);

  // Sincroniza estado com o backend e localStorage
  const persistDatabase = async (newDb: InventoryDatabase) => {
    newDb.lastUpdated = new Date().toISOString();
    setDatabase(newDb);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newDb));

    try {
      const res = await fetch('/api/inventory/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDb),
      });
      if (!res.ok) {
        setServerOnline(false);
      } else {
        setServerOnline(true);
      }
    } catch (err) {
      console.warn('Backend offline or unreachable, persisted to localStorage:', err);
      setServerOnline(false);
    }

    // Auto-sync com GitHub se configurado
    if (newDb.githubConfig?.enabled && newDb.githubConfig?.autoSync && newDb.githubConfig?.token) {
      try {
        await fetch('/api/inventory/github-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newDb.githubConfig),
        });
      } catch (e) {
        console.warn('Auto-sync to GitHub failed silently:', e);
      }
    }
  };

  const loadFromBackend = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/inventory');
      if (res.ok) {
        const data: InventoryDatabase = await res.json();
        setDatabase(data);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        setServerOnline(true);
      } else {
        setServerOnline(false);
      }
    } catch (err: any) {
      console.warn('Could not reach backend API, using local storage state:', err);
      setServerOnline(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFromBackend();
  }, []);

  // --- CRUD HIERARQUIA ---

  const addTipo = async (tipoData: Omit<TipoItem, 'id' | 'code' | 'createdAt'> & { code?: string }): Promise<TipoItem> => {
    const code = tipoData.code?.trim() || generateNextTipoCode(database.types);
    const newTipo: TipoItem = {
      id: `tip-${Date.now()}`,
      code,
      name: tipoData.name.trim(),
      description: tipoData.description?.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = {
      ...database,
      types: [...database.types, newTipo],
    };
    await persistDatabase(updated);
    return newTipo;
  };

  const updateTipo = async (id: string, data: Partial<TipoItem>) => {
    const updated = {
      ...database,
      types: database.types.map(t => (t.id === id ? { ...t, ...data } : t)),
    };
    await persistDatabase(updated);
  };

  const deleteTipo = async (id: string): Promise<boolean> => {
    // Verifica se há grupos vinculados
    const hasGroups = database.groups.some(g => g.tipoId === id);
    if (hasGroups) {
      return false;
    }
    const updated = {
      ...database,
      types: database.types.filter(t => t.id !== id),
    };
    await persistDatabase(updated);
    return true;
  };

  const addGrupo = async (grupoData: Omit<GrupoItem, 'id' | 'code' | 'createdAt'> & { code?: string }): Promise<GrupoItem> => {
    const parentTipo = database.types.find(t => t.id === grupoData.tipoId);
    const parentCode = parentTipo?.code || 'TIP-01';
    const code = grupoData.code?.trim() || generateNextGrupoCode(parentCode, database.groups);

    const newGrupo: GrupoItem = {
      id: `grp-${Date.now()}`,
      tipoId: grupoData.tipoId,
      code,
      name: grupoData.name.trim(),
      description: grupoData.description?.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = {
      ...database,
      groups: [...database.groups, newGrupo],
    };
    await persistDatabase(updated);
    return newGrupo;
  };

  const updateGrupo = async (id: string, data: Partial<GrupoItem>) => {
    const updated = {
      ...database,
      groups: database.groups.map(g => (g.id === id ? { ...g, ...data } : g)),
    };
    await persistDatabase(updated);
  };

  const deleteGrupo = async (id: string): Promise<boolean> => {
    const hasSubgroups = database.subgroups.some(s => s.grupoId === id);
    if (hasSubgroups) return false;

    const updated = {
      ...database,
      groups: database.groups.filter(g => g.id !== id),
    };
    await persistDatabase(updated);
    return true;
  };

  const addSubgrupo = async (subData: Omit<SubgrupoItem, 'id' | 'code' | 'createdAt'> & { code?: string }): Promise<SubgrupoItem> => {
    const parentGrupo = database.groups.find(g => g.id === subData.grupoId);
    const parentCode = parentGrupo?.code || 'GRP-01-01';
    const code = subData.code?.trim() || generateNextSubgrupoCode(parentCode, database.subgroups);

    const newSub: SubgrupoItem = {
      id: `sub-${Date.now()}`,
      grupoId: subData.grupoId,
      code,
      name: subData.name.trim(),
      description: subData.description?.trim(),
      createdAt: new Date().toISOString(),
    };
    const updated = {
      ...database,
      subgroups: [...database.subgroups, newSub],
    };
    await persistDatabase(updated);
    return newSub;
  };

  const updateSubgrupo = async (id: string, data: Partial<SubgrupoItem>) => {
    const updated = {
      ...database,
      subgroups: database.subgroups.map(s => (s.id === id ? { ...s, ...data } : s)),
    };
    await persistDatabase(updated);
  };

  const deleteSubgrupo = async (id: string): Promise<boolean> => {
    const hasArticles = database.articles.some(a => a.subgrupoId === id);
    if (hasArticles) return false;

    const updated = {
      ...database,
      subgroups: database.subgroups.filter(s => s.id !== id),
    };
    await persistDatabase(updated);
    return true;
  };

  // --- CRUD ARTIGOS ---

  const addArtigo = async (
    artigoData: Omit<ArtigoItem, 'id' | 'code' | 'createdAt' | 'updatedAt' | 'currentStock'> & {
      code?: string;
      initialStock?: number;
    }
  ): Promise<ArtigoItem> => {
    const parentSub = database.subgroups.find(s => s.id === artigoData.subgrupoId);
    const parentCode = parentSub?.code || 'SUB-01-01-01';
    const code = artigoData.code?.trim() || generateNextArtigoCode(parentCode, database.articles);
    const initialStock = Number(artigoData.initialStock) || 0;
    const now = new Date().toISOString();

    const newArtigo: ArtigoItem = {
      id: `art-${Date.now()}`,
      subgrupoId: artigoData.subgrupoId,
      code,
      name: artigoData.name.trim(),
      description: artigoData.description?.trim(),
      unit: artigoData.unit || 'UN',
      currentStock: initialStock,
      minStock: Number(artigoData.minStock) || 0,
      locationDetails: artigoData.locationDetails,
      averageUnitCost: artigoData.averageUnitCost ? Number(artigoData.averageUnitCost) : undefined,
      createdAt: now,
      updatedAt: now,
    };

    let movements = [...database.movements];
    if (initialStock > 0) {
      movements.unshift({
        id: `mov-${Date.now()}-init`,
        articleId: newArtigo.id,
        type: 'ENTRADA',
        quantity: initialStock,
        previousStock: 0,
        newStock: initialStock,
        date: now,
        documentNumber: 'CAD-INICIAL',
        originDestination: 'Inventário Inicial de Implantação',
        reason: 'Cadastro Inicial do Artigo',
        operator: 'Almoxarife Responsável',
        unitCost: newArtigo.averageUnitCost,
      });
    }

    const updated: InventoryDatabase = {
      ...database,
      articles: [...database.articles, newArtigo],
      movements,
    };
    await persistDatabase(updated);
    return newArtigo;
  };

  const updateArtigo = async (id: string, data: Partial<ArtigoItem>) => {
    const updated = {
      ...database,
      articles: database.articles.map(a =>
        a.id === id
          ? {
              ...a,
              ...data,
              updatedAt: new Date().toISOString(),
            }
          : a
      ),
    };
    await persistDatabase(updated);
  };

  const deleteArtigo = async (id: string): Promise<boolean> => {
    // Permite excluir se não houver histórico de movimentações recente ou se usuário desejar
    const updated = {
      ...database,
      articles: database.articles.filter(a => a.id !== id),
      movements: database.movements.filter(m => m.articleId !== id),
    };
    await persistDatabase(updated);
    return true;
  };

  // --- MOVIMENTAÇÕES DE ESTOQUE ---

  const registerMovement = async (data: {
    articleId: string;
    type: 'ENTRADA' | 'SAIDA' | 'AJUSTE';
    quantity: number;
    documentNumber?: string;
    originDestination: string;
    reason: string;
    operator: string;
    unitCost?: number;
    notes?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      // Tenta via backend se online
      if (serverOnline) {
        const res = await fetch('/api/inventory/movement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        const resData = await res.json();
        if (!res.ok) {
          return { success: false, error: resData.error || 'Erro ao registrar movimentação' };
        }
        if (resData.db) {
          setDatabase(resData.db);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(resData.db));
          return { success: true };
        }
      }

      // Fallback local caso o backend esteja off
      const article = database.articles.find(a => a.id === data.articleId);
      if (!article) return { success: false, error: 'Artigo não encontrado' };

      const prevStock = Number(article.currentStock) || 0;
      let newStock = prevStock;

      if (data.type === 'ENTRADA') {
        newStock = prevStock + Number(data.quantity);
      } else if (data.type === 'SAIDA') {
        if (prevStock < Number(data.quantity)) {
          return {
            success: false,
            error: `Saldo insuficiente! Saldo atual: ${prevStock} ${article.unit}. Tentativa de saída: ${data.quantity} ${article.unit}.`,
          };
        }
        newStock = prevStock - Number(data.quantity);
      } else if (data.type === 'AJUSTE') {
        newStock = Number(data.quantity);
      }

      const newMov: StockMovement = {
        id: `mov-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        articleId: data.articleId,
        type: data.type,
        quantity: Number(data.quantity),
        previousStock: prevStock,
        newStock,
        date: new Date().toISOString(),
        documentNumber: data.documentNumber?.trim(),
        originDestination: data.originDestination.trim(),
        reason: data.reason.trim(),
        operator: data.operator.trim(),
        unitCost: data.unitCost,
        notes: data.notes?.trim(),
      };

      const updatedArticles = database.articles.map(a =>
        a.id === data.articleId
          ? {
              ...a,
              currentStock: newStock,
              updatedAt: new Date().toISOString(),
              averageUnitCost: data.unitCost && data.type === 'ENTRADA' ? Number(data.unitCost) : a.averageUnitCost,
            }
          : a
      );

      const updatedDb: InventoryDatabase = {
        ...database,
        articles: updatedArticles,
        movements: [newMov, ...database.movements],
      };

      await persistDatabase(updatedDb);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Falha ao processar movimentação' };
    }
  };

  // --- LOCALIZAÇÕES ---

  const addLocationPreset = async (loc: Omit<StorageLocationPreset, 'id'>) => {
    const newLoc: StorageLocationPreset = {
      ...loc,
      id: `loc-${Date.now()}`,
    };
    const updated = {
      ...database,
      locations: [...database.locations, newLoc],
    };
    await persistDatabase(updated);
  };

  const deleteLocationPreset = async (id: string) => {
    const updated = {
      ...database,
      locations: database.locations.filter(l => l.id !== id),
    };
    await persistDatabase(updated);
  };

  // --- NUVEM (GITHUB / DRIVE) & MANUTENÇÃO ---

  const saveGitHubConfig = async (config: GitHubSyncConfig) => {
    const updated = {
      ...database,
      githubConfig: config,
    };
    await persistDatabase(updated);
  };

  const syncToGitHub = async (): Promise<{ success: boolean; message: string; url?: string }> => {
    try {
      const res = await fetch('/api/inventory/github-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(database.githubConfig),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.details || data.error || 'Erro na API do GitHub');
      }

      // Atualiza estado local com novos dados de sync
      const updatedConfig = {
        ...database.githubConfig,
        gistId: data.gistId || database.githubConfig.gistId,
        lastSync: new Date().toISOString(),
        lastStatus: 'success' as const,
        lastMessage: data.message || 'Sincronizado com sucesso',
      };
      setDatabase(prev => ({ ...prev, githubConfig: updatedConfig }));

      return {
        success: true,
        message: data.message,
        url: data.url,
      };
    } catch (err: any) {
      const updatedConfig = {
        ...database.githubConfig,
        lastSync: new Date().toISOString(),
        lastStatus: 'error' as const,
        lastMessage: err.message,
      };
      setDatabase(prev => ({ ...prev, githubConfig: updatedConfig }));
      return { success: false, message: err.message };
    }
  };

  const pullFromGitHub = async (): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/inventory/github-pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(database.githubConfig),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.details || data.error || 'Erro ao restaurar do GitHub');
      }
      if (data.db) {
        setDatabase(data.db);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.db));
      }
      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const resetToEmpty = async () => {
    try {
      const res = await fetch('/api/inventory/reset', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setDatabase(data.db);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.db));
      } else {
        const empty: InventoryDatabase = {
          version: '1.0.0',
          lastUpdated: new Date().toISOString(),
          types: [],
          groups: [],
          subgroups: [],
          articles: [],
          movements: [],
          locations: [],
          githubConfig: database.githubConfig,
        };
        await persistDatabase(empty);
      }
    } catch {
      const empty: InventoryDatabase = {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        types: [],
        groups: [],
        subgroups: [],
        articles: [],
        movements: [],
        locations: [],
        githubConfig: database.githubConfig,
      };
      await persistDatabase(empty);
    }
  };

  const loadSampleData = async () => {
    try {
      const res = await fetch('/api/inventory/seed', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setDatabase(data.db);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.db));
      } else {
        const seed = getSampleSenaiData();
        await persistDatabase(seed);
      }
    } catch {
      const seed = getSampleSenaiData();
      await persistDatabase(seed);
    }
  };

  const exportJsonBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(database, null, 2));
    const downloadAnchor = document.createElement('a');
    const filename = `senai-sp-estoque-backup-${new Date().toISOString().slice(0, 10)}.json`;
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importJsonBackup = async (importedData: InventoryDatabase) => {
    if (!importedData.articles || !importedData.types) {
      throw new Error('Arquivo de backup inválido');
    }
    await persistDatabase(importedData);
  };

  return (
    <InventoryContext.Provider
      value={{
        database,
        loading,
        error,
        serverOnline,
        addTipo,
        updateTipo,
        deleteTipo,
        addGrupo,
        updateGrupo,
        deleteGrupo,
        addSubgrupo,
        updateSubgrupo,
        deleteSubgrupo,
        addArtigo,
        updateArtigo,
        deleteArtigo,
        registerMovement,
        addLocationPreset,
        deleteLocationPreset,
        saveGitHubConfig,
        syncToGitHub,
        pullFromGitHub,
        resetToEmpty,
        loadSampleData,
        exportJsonBackup,
        importJsonBackup,
        reloadDatabase: loadFromBackend,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
