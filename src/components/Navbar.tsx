import React from 'react';
import {
  Boxes,
  FolderTree,
  Package,
  Layers,
  ArrowDownToLine,
  ArrowUpFromLine,
  FileSpreadsheet,
  MapPin,
  Cloud,
  PlusCircle,
  Database
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

export type ActiveTab =
  | 'dashboard'
  | 'hierarchy'
  | 'articles'
  | 'stock'
  | 'movements'
  | 'reports'
  | 'locations'
  | 'cloud';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  openNewEntryModal: () => void;
  openNewExitModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openNewEntryModal,
  openNewExitModal,
}) => {
  const { database, serverOnline } = useInventory();
  const totalArticles = database.articles.length;
  const criticalArticles = database.articles.filter(
    a => a.currentStock <= a.minStock
  ).length;

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Painel Geral',
      icon: Boxes,
      badge: null,
    },
    {
      id: 'hierarchy' as ActiveTab,
      label: 'Hierarquia (Tipo/Grupo/Sub)',
      icon: FolderTree,
      badge: database.types.length > 0 ? `${database.types.length} Tipos` : null,
    },
    {
      id: 'articles' as ActiveTab,
      label: 'Artigos / Catálogo',
      icon: Package,
      badge: totalArticles > 0 ? `${totalArticles}` : null,
    },
    {
      id: 'stock' as ActiveTab,
      label: 'Posição em Tempo Real',
      icon: Layers,
      badge: criticalArticles > 0 ? `${criticalArticles} crítico(s)` : null,
      badgeColor: 'bg-amber-500',
    },
    {
      id: 'movements' as ActiveTab,
      label: 'Entradas & Saídas',
      icon: ArrowDownToLine,
      badge: database.movements.length > 0 ? `${database.movements.length}` : null,
    },
    {
      id: 'reports' as ActiveTab,
      label: 'Relatórios Oficiais',
      icon: FileSpreadsheet,
      badge: null,
    },
    {
      id: 'locations' as ActiveTab,
      label: 'Localizações Físicas',
      icon: MapPin,
      badge: null,
    },
    {
      id: 'cloud' as ActiveTab,
      label: 'Nuvem & GitHub',
      icon: Cloud,
      badge: database.githubConfig.lastStatus === 'success' ? 'Sinc' : null,
      badgeColor: 'bg-emerald-600',
    },
  ];

  return (
    <header className="bg-[#121212] text-white border-b-4 border-[#E30613] shadow-lg sticky top-0 z-40">
      {/* Top utility bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 border-b border-neutral-800">
          {/* Logo SENAI SP */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <div className="bg-[#E30613] text-white font-black tracking-tighter text-2xl px-2.5 py-0.5 rounded-sm shadow-sm select-none">
                SENAI
              </div>
              <div className="ml-2 pl-2 border-l border-neutral-700">
                <span className="text-xs uppercase tracking-widest text-[#E30613] font-black block">
                  São Paulo
                </span>
                <span className="text-[11px] text-neutral-400 font-medium hidden sm:inline">
                  Controle e Gestão de Inventário
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons & Status */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Server persistence indicator */}
            <div className="hidden md:flex items-center space-x-2 bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-xs">
              <span
                className={`inline-block w-2 h-2 rounded-full ${
                  serverOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="text-neutral-300 font-medium">
                {serverOnline ? 'Persistência Ativa (Servidor + Local)' : 'Modo Offline (LocalStorage)'}
              </span>
            </div>

            {/* Quick action buttons */}
            <button
              onClick={openNewEntryModal}
              disabled={database.articles.length === 0}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
                database.articles.length === 0
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-emerald-700 hover:bg-emerald-600 text-white shadow-emerald-900/30 active:scale-95'
              }`}
              title={database.articles.length === 0 ? 'Cadastre ao menos 1 artigo para registrar movimentação' : 'Registrar Entrada de Material'}
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>+ Entrada</span>
            </button>

            <button
              onClick={openNewExitModal}
              disabled={database.articles.length === 0}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
                database.articles.length === 0
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-[#E30613] hover:bg-[#b8050f] text-white shadow-red-950/40 active:scale-95'
              }`}
              title={database.articles.length === 0 ? 'Cadastre ao menos 1 artigo para registrar movimentação' : 'Registrar Saída de Material'}
            >
              <ArrowUpFromLine className="w-3.5 h-3.5" />
              <span>- Saída</span>
            </button>
          </div>
        </div>

        {/* Primary Navigation Menus */}
        <nav className="flex space-x-1 overflow-x-auto py-2 scrollbar-none">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded font-semibold text-xs transition-all whitespace-nowrap cursor-pointer select-none ${
                  isActive
                    ? 'bg-[#E30613] text-white shadow-md'
                    : 'text-neutral-300 hover:text-white hover:bg-neutral-800/80'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-neutral-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      item.badgeColor || (isActive ? 'bg-black/40 text-white' : 'bg-neutral-800 text-neutral-300')
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
