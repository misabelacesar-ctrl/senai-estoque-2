import React from 'react';
import {
  Boxes,
  Package,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  FolderTree,
  DollarSign,
  PlusCircle,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  MapPin,
  ExternalLink,
  Sparkles
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatCurrencyBRL, formatDateTimeBR } from '../utils/codeGenerator';
import { ActiveTab } from './Navbar';

interface DashboardViewProps {
  setActiveTab: (tab: ActiveTab) => void;
  openNewEntryModal: () => void;
  openNewExitModal: () => void;
  onOpenArticleModal: () => void;
  onLoadSampleData: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  setActiveTab,
  openNewEntryModal,
  openNewExitModal,
  onOpenArticleModal,
  onLoadSampleData,
}) => {
  const { database } = useInventory();

  const totalArticles = database.articles.length;
  const criticalItems = database.articles.filter(a => a.currentStock <= a.minStock);
  const outOfStockItems = database.articles.filter(a => a.currentStock === 0);
  const totalMovements = database.movements.length;

  // Cálculo do valor total estimado
  const totalStockValue = database.articles.reduce((acc, curr) => {
    const cost = curr.averageUnitCost || 0;
    return acc + curr.currentStock * cost;
  }, 0);

  const isDatabaseEmpty = totalArticles === 0 && database.types.length === 0;

  return (
    <div className="space-y-6">
      {/* Banner se banco estiver vazio (Requisito: Banco de dados com estrutura vazia pronta para testes) */}
      {isDatabaseEmpty && (
        <div className="bg-white border-l-4 border-[#E30613] p-6 rounded-lg shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="p-3 bg-red-50 text-[#E30613] rounded-lg">
                <Boxes className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Banco de Dados Vazio — Pronto para Teste e Validação
                </h3>
                <p className="text-xs text-neutral-600 mt-1 max-w-2xl leading-relaxed">
                  O sistema foi iniciado com a estrutura de dados 100% limpa, pronto para inserção de dados pelo usuário. Você pode iniciar criando a estrutura hierárquica (Tipo → Grupo → Subgrupo → Artigo) ou, se preferir testar os fluxos e relatórios imediatamente, carregar os dados de demonstração oficiais do SENAI-SP com 1 clique.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveTab('hierarchy')}
                className="px-4 py-2 bg-[#E30613] hover:bg-[#b8050f] text-white text-xs font-bold uppercase tracking-wider rounded transition-all shadow-sm"
              >
                1. Criar Hierarquia
              </button>
              <button
                onClick={onLoadSampleData}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded border border-neutral-700 transition-all flex items-center space-x-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Carregar Dados SENAI (Teste Rápido)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid de Métricas Principais (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Artigos */}
        <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm relative overflow-hidden group hover:border-neutral-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Total de Artigos
            </span>
            <div className="p-2 bg-neutral-100 text-neutral-700 rounded group-hover:bg-neutral-200 transition-colors">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-neutral-900 tracking-tight">
              {totalArticles}
            </span>
            <span className="text-xs text-neutral-500">itens cadastrados</span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-500 flex items-center space-x-1">
            <FolderTree className="w-3.5 h-3.5 text-neutral-400" />
            <span>
              {database.types.length} Tipos | {database.groups.length} Grupos | {database.subgroups.length} Subgrupos
            </span>
          </div>
        </div>

        {/* Itens Críticos / Mínimo */}
        <div
          onClick={() => setActiveTab('stock')}
          className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm relative overflow-hidden group hover:border-amber-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Abaixo do Mínimo
            </span>
            <div className={`p-2 rounded ${criticalItems.length > 0 ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-400'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className={`text-3xl font-black tracking-tight ${criticalItems.length > 0 ? 'text-amber-600' : 'text-neutral-900'}`}>
              {criticalItems.length}
            </span>
            <span className="text-xs text-neutral-500">
              {outOfStockItems.length > 0 ? `(${outOfStockItems.length} zerados)` : 'artigos críticos'}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-amber-700 flex items-center space-x-1">
            <span>{criticalItems.length > 0 ? 'Requer reposição via compras' : 'Estoque em níveis seguros'}</span>
          </div>
        </div>

        {/* Movimentações Registradas */}
        <div
          onClick={() => setActiveTab('movements')}
          className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm relative overflow-hidden group hover:border-neutral-400 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Movimentações
            </span>
            <div className="p-2 bg-neutral-100 text-neutral-700 rounded group-hover:bg-neutral-200 transition-colors">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-black text-neutral-900 tracking-tight">
              {totalMovements}
            </span>
            <span className="text-xs text-neutral-500">registros totais</span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-500 flex items-center space-x-2">
            <span className="text-emerald-700 font-medium">
              ↓ {database.movements.filter(m => m.type === 'ENTRADA').length} entradas
            </span>
            <span>•</span>
            <span className="text-red-700 font-medium">
              ↑ {database.movements.filter(m => m.type === 'SAIDA').length} saídas
            </span>
          </div>
        </div>

        {/* Valor Total Estimado */}
        <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm relative overflow-hidden group hover:border-neutral-400 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Valor em Estoque
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-neutral-900 tracking-tight block">
              {formatCurrencyBRL(totalStockValue)}
            </span>
          </div>
          <div className="mt-2 text-[11px] text-neutral-500">
            Baseado no custo médio unitário
          </div>
        </div>
      </div>

      {/* Ações Rápidas de Gestão */}
      <div className="bg-neutral-900 text-white p-4 rounded-lg shadow-sm border-l-4 border-[#E30613]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-[#E30613] block">
              Menu Rápido de Operação
            </span>
            <h4 className="text-sm font-semibold text-neutral-100">
              Acesso Direto aos Principais Módulos de Estoque SENAI
            </h4>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={openNewEntryModal}
              disabled={totalArticles === 0}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                totalArticles === 0
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <ArrowDownToLine className="w-4 h-4" />
              <span>Registrar Entrada</span>
            </button>

            <button
              onClick={openNewExitModal}
              disabled={totalArticles === 0}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all ${
                totalArticles === 0
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-[#E30613] hover:bg-[#b8050f] text-white'
              }`}
            >
              <ArrowUpFromLine className="w-4 h-4" />
              <span>Registrar Saída</span>
            </button>

            <button
              onClick={onOpenArticleModal}
              className="flex items-center space-x-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-xs font-semibold border border-neutral-700 transition-all"
            >
              <PlusCircle className="w-4 h-4 text-neutral-300" />
              <span>Novo Artigo</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className="flex items-center space-x-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-xs font-semibold border border-neutral-700 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-neutral-300" />
              <span>Emitir Relatórios</span>
            </button>
          </div>
        </div>
      </div>

      {/* Seção dupla: Artigos em Nível Crítico & Últimas Movimentações */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Itens em Nível Crítico */}
        <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-sm text-neutral-900">
                Alerta de Reposição de Estoque ({criticalItems.length})
              </h3>
            </div>
            {criticalItems.length > 0 && (
              <button
                onClick={() => setActiveTab('stock')}
                className="text-xs font-semibold text-[#E30613] hover:underline flex items-center space-x-1"
              >
                <span>Ver Todos</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="p-4">
            {criticalItems.length === 0 ? (
              <div className="py-8 text-center text-neutral-500">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-medium">Nenhum artigo com estoque crítico no momento.</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">Todos os itens atendem ao estoque mínimo configurado.</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 max-h-72 overflow-y-auto">
                {criticalItems.slice(0, 5).map(item => (
                  <div key={item.id} className="py-2.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-[11px] font-bold bg-neutral-100 text-neutral-700 px-1.5 py-0.5 rounded">
                          {item.code}
                        </span>
                        <span className="text-xs font-medium text-neutral-900 line-clamp-1">
                          {item.name}
                        </span>
                      </div>
                      <div className="text-[11px] text-neutral-500 mt-1 flex items-center space-x-2">
                        <span className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-neutral-400" />
                          <span>{item.locationDetails.warehouse} ({item.locationDetails.shelf})</span>
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-red-600">
                        {item.currentStock} {item.unit}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        Mínimo: {item.minStock} {item.unit}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Últimas Movimentações */}
        <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-neutral-600" />
              <h3 className="font-bold text-sm text-neutral-900">
                Últimas Movimentações Recentes
              </h3>
            </div>
            {database.movements.length > 0 && (
              <button
                onClick={() => setActiveTab('movements')}
                className="text-xs font-semibold text-[#E30613] hover:underline flex items-center space-x-1"
              >
                <span>Histórico Completo</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="p-4">
            {database.movements.length === 0 ? (
              <div className="py-8 text-center text-neutral-500">
                <Boxes className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                <p className="text-xs font-medium">Nenhuma movimentação registrada até o momento.</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">Utilize os botões de Entrada e Saída no menu superior.</p>
              </div>
            ) : (
              <div className="divide-y divide-neutral-100 max-h-72 overflow-y-auto">
                {database.movements.slice(0, 5).map(mov => {
                  const article = database.articles.find(a => a.id === mov.articleId);
                  const isEntry = mov.type === 'ENTRADA';
                  return (
                    <div key={mov.id} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-start space-x-2.5">
                        <span
                          className={`mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isEntry
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {mov.type}
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-neutral-900 line-clamp-1">
                            {article ? article.name : 'Artigo não localizado'}
                          </div>
                          <div className="text-[11px] text-neutral-500 mt-0.5">
                            {mov.originDestination} • {mov.reason}
                          </div>
                          <div className="text-[10px] text-neutral-400 mt-0.5">
                            {formatDateTimeBR(mov.date)} • Por {mov.operator}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs font-black ${
                            isEntry ? 'text-emerald-700' : 'text-red-700'
                          }`}
                        >
                          {isEntry ? '+' : '-'}
                          {mov.quantity} {article?.unit || ''}
                        </span>
                        <div className="text-[10px] text-neutral-400">
                          Saldo: {mov.newStock}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
