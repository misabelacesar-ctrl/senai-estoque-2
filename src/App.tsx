/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { ActiveTab, Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { HierarchyManager } from './components/HierarchyManager';
import { ArticlesView } from './components/ArticlesView';
import { StockPositionView } from './components/StockPositionView';
import { MovementsView } from './components/MovementsView';
import { ReportsView } from './components/ReportsView';
import { LocationsManager } from './components/LocationsManager';
import { CloudSyncView } from './components/CloudSyncView';
import { MovementModal } from './components/MovementModal';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { TechnicalFooter } from './components/TechnicalFooter';

function MainApp() {
  const { loading, loadSampleData } = useInventory();

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Movement modal states
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementInitialType, setMovementInitialType] = useState<'ENTRADA' | 'SAIDA'>('ENTRADA');
  const [preselectedArticleId, setPreselectedArticleId] = useState<string | undefined>();

  // Reset modal state
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Subgroup preselection for article creation
  const [preselectedSubgroup, setPreselectedSubgroup] = useState<string | undefined>();
  const [openArticleModalInitially, setOpenArticleModalInitially] = useState(false);

  const handleOpenEntry = (articleId?: string) => {
    setMovementInitialType('ENTRADA');
    setPreselectedArticleId(articleId);
    setIsMovementModalOpen(true);
  };

  const handleOpenExit = (articleId?: string) => {
    setMovementInitialType('SAIDA');
    setPreselectedArticleId(articleId);
    setIsMovementModalOpen(true);
  };

  const handleSelectSubgroupForArticle = (subgroupId: string) => {
    setPreselectedSubgroup(subgroupId);
    setOpenArticleModalInitially(true);
    setActiveTab('articles');
  };

  const handleOpenArticleModal = () => {
    setPreselectedSubgroup(undefined);
    setOpenArticleModalInitially(true);
    setActiveTab('articles');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-[#E30613] text-white font-black text-2xl px-3 py-1 rounded select-none shadow-md">
            SENAI
          </div>
          <div className="text-left">
            <div className="text-xs font-bold uppercase tracking-widest text-[#E30613]">
              São Paulo
            </div>
            <div className="text-sm font-semibold text-neutral-800">
              Controle e Gestão de Inventário
            </div>
          </div>
        </div>
        <div className="w-12 h-12 border-4 border-[#E30613]/20 border-t-[#E30613] rounded-full animate-spin" />
        <p className="mt-4 text-xs font-semibold text-neutral-600 tracking-wider uppercase">
          Carregando base de estoque...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-neutral-900 selection:bg-[#E30613] selection:text-white">
      {/* Barra de Navegação Superior */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openNewEntryModal={() => handleOpenEntry()}
        openNewExitModal={() => handleOpenExit()}
      />

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            setActiveTab={setActiveTab}
            openNewEntryModal={() => handleOpenEntry()}
            openNewExitModal={() => handleOpenExit()}
            onOpenArticleModal={handleOpenArticleModal}
            onLoadSampleData={loadSampleData}
          />
        )}

        {activeTab === 'hierarchy' && (
          <HierarchyManager
            onSelectSubgroupForArticle={handleSelectSubgroupForArticle}
          />
        )}

        {activeTab === 'articles' && (
          <ArticlesView
            onOpenEntry={handleOpenEntry}
            onOpenExit={handleOpenExit}
            isAddModalOpenInitially={openArticleModalInitially}
            preselectedSubgroupId={preselectedSubgroup}
          />
        )}

        {activeTab === 'stock' && (
          <StockPositionView
            onOpenEntry={handleOpenEntry}
            onOpenExit={handleOpenExit}
          />
        )}

        {activeTab === 'movements' && (
          <MovementsView
            onOpenEntry={() => handleOpenEntry()}
            onOpenExit={() => handleOpenExit()}
          />
        )}

        {activeTab === 'reports' && <ReportsView />}

        {activeTab === 'locations' && <LocationsManager />}

        {activeTab === 'cloud' && <CloudSyncView />}
      </main>

      {/* Modal de Movimentação (Entrada / Saída) */}
      <MovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        initialType={movementInitialType}
        preselectedArticleId={preselectedArticleId}
      />

      {/* Modal de Confirmação para Zerar Banco */}
      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
      />

      {/* Rodapé Técnico Institucional */}
      <TechnicalFooter
        onOpenResetConfirm={() => setIsResetModalOpen(true)}
        onLoadSampleData={loadSampleData}
      />
    </div>
  );
}

export default function App() {
  return (
    <InventoryProvider>
      <MainApp />
    </InventoryProvider>
  );
}
