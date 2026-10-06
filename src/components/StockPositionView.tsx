import React, { useState } from 'react';
import {
  Layers,
  Search,
  Filter,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowDownToLine,
  ArrowUpFromLine,
  DollarSign,
  PackageCheck,
  Building,
  TrendingDown,
  Printer
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatCurrencyBRL } from '../utils/codeGenerator';

interface StockPositionViewProps {
  onOpenEntry: (articleId: string) => void;
  onOpenExit: (articleId: string) => void;
}

export const StockPositionView: React.FC<StockPositionViewProps> = ({
  onOpenEntry,
  onOpenExit,
}) => {
  const { database } = useInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'normal' | 'zero'>('all');

  // Warehouses list
  const warehouses = Array.from(
    new Set(database.articles.map(a => a.locationDetails.warehouse).filter(Boolean))
  );

  const totalArticles = database.articles.length;
  const criticalItems = database.articles.filter(a => a.currentStock <= a.minStock && a.currentStock > 0);
  const zeroItems = database.articles.filter(a => a.currentStock === 0);
  const normalItems = database.articles.filter(a => a.currentStock > a.minStock);

  const totalValue = database.articles.reduce((acc, curr) => {
    return acc + curr.currentStock * (curr.averageUnitCost || 0);
  }, 0);

  const filteredArticles = database.articles.filter(art => {
    // Warehouse
    if (warehouseFilter !== 'all' && art.locationDetails.warehouse !== warehouseFilter) {
      return false;
    }

    // Status
    if (statusFilter === 'critical') {
      if (art.currentStock > art.minStock || art.currentStock === 0) return false;
    } else if (statusFilter === 'zero') {
      if (art.currentStock > 0) return false;
    } else if (statusFilter === 'normal') {
      if (art.currentStock <= art.minStock) return false;
    }

    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = art.name.toLowerCase().includes(term);
      const matchCode = art.code.toLowerCase().includes(term);
      const matchLoc = art.locationDetails.fullCode.toLowerCase().includes(term) ||
        art.locationDetails.warehouse.toLowerCase().includes(term) ||
        art.locationDetails.aisle.toLowerCase().includes(term) ||
        art.locationDetails.shelf.toLowerCase().includes(term);

      if (!matchName && !matchCode && !matchLoc) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-[#E30613] text-white text-[11px] font-bold px-2 py-0.5 rounded uppercase">
              Tempo Real
            </span>
            <h2 className="text-lg font-bold text-neutral-900">
              Posição Física e Saldo Atual do Estoque
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Visão consolidada em tempo real com saldos, alertas de estoque mínimo e mapeamento físico por galpão e prateleira.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.print()}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-xs font-semibold border border-neutral-700 transition-all shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 text-neutral-300" />
            <span>Imprimir Posição</span>
          </button>
        </div>
      </div>

      {/* Cards de Resumo Rápido */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-bold uppercase tracking-wider">
            <span>Regular</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-neutral-900">
            {normalItems.length}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1">
            Saldo acima do estoque mínimo
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-bold uppercase tracking-wider">
            <span>Abaixo do Mínimo</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600">
            {criticalItems.length}
          </div>
          <div className="text-[11px] text-amber-700 mt-1">
            Necessita pedido de compra
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-bold uppercase tracking-wider">
            <span>Sem Estoque (Zerado)</span>
            <XCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="mt-2 text-2xl font-black text-red-600">
            {zeroItems.length}
          </div>
          <div className="text-[11px] text-red-700 mt-1">
            Itens com saldo 0
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-xs">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-bold uppercase tracking-wider">
            <span>Valor Total Avaliado</span>
            <DollarSign className="w-4 h-4 text-neutral-700" />
          </div>
          <div className="mt-2 text-xl font-black text-neutral-900">
            {formatCurrencyBRL(totalValue)}
          </div>
          <div className="text-[11px] text-neutral-500 mt-1">
            {totalArticles} artigos cadastrados
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por código, material ou localização..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-neutral-300 rounded focus:border-[#E30613] outline-none"
            />
          </div>

          <div>
            <select
              value={warehouseFilter}
              onChange={e => setWarehouseFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded focus:border-[#E30613] outline-none bg-white font-medium"
            >
              <option value="all">Todos os Galpões / Setores</option>
              {warehouses.map(w => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded focus:border-[#E30613] outline-none bg-white font-medium"
            >
              <option value="all">Todos os Status de Saldo</option>
              <option value="normal">Estoque Regular (&gt; Mínimo)</option>
              <option value="critical">Estoque Abaixo do Mínimo</option>
              <option value="zero">Itens Zerados (0 em Estoque)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2 border-t border-neutral-100">
          <span>
            Exibindo <strong>{filteredArticles.length}</strong> artigos na posição atual
          </span>
          {(searchTerm || warehouseFilter !== 'all' || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setWarehouseFilter('all');
                setStatusFilter('all');
              }}
              className="text-[#E30613] hover:underline font-semibold"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabela de Posição de Estoque */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
        {filteredArticles.length === 0 ? (
          <div className="py-12 text-center text-neutral-500">
            <PackageCheck className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-neutral-800">
              Nenhum Artigo Encontrado na Posição
            </h3>
            <p className="text-xs text-neutral-500 mt-1">
              Ajuste seus filtros ou adicione novos artigos ao estoque.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-900 text-white font-bold uppercase text-[10px] tracking-wider border-b border-neutral-800">
                  <th className="p-3">Código</th>
                  <th className="p-3">Artigo de Estoque</th>
                  <th className="p-3">Localização Física Detalhada</th>
                  <th className="p-3 text-center">Saldo Atual</th>
                  <th className="p-3 text-center">Estoque Mínimo</th>
                  <th className="p-3 text-center">Nível / Cobertura</th>
                  <th className="p-3 text-right">Valor Total (R$)</th>
                  <th className="p-3 text-right print:hidden">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredArticles.map(art => {
                  const isZero = art.currentStock === 0;
                  const isCritical = art.currentStock <= art.minStock && !isZero;
                  const totalItemValue = art.currentStock * (art.averageUnitCost || 0);

                  const ratio = art.minStock > 0 ? (art.currentStock / art.minStock) * 100 : 100;

                  return (
                    <tr key={art.id} className="hover:bg-neutral-50/80 transition-colors">
                      {/* Código */}
                      <td className="p-3 whitespace-nowrap font-mono font-bold text-neutral-900">
                        <span className="bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded border border-neutral-200">
                          {art.code}
                        </span>
                      </td>

                      {/* Nome e Classificação */}
                      <td className="p-3">
                        <div className="font-semibold text-neutral-900 line-clamp-1">
                          {art.name}
                        </div>
                        <div className="text-[10px] text-neutral-400 font-mono mt-0.5">
                          Unidade: {art.unit} {art.averageUnitCost ? `• Custo: ${formatCurrencyBRL(art.averageUnitCost)}` : ''}
                        </div>
                      </td>

                      {/* Localização Física */}
                      <td className="p-3 whitespace-nowrap text-[11px]">
                        <div className="flex items-center space-x-1 font-semibold text-neutral-800">
                          <MapPin className="w-3.5 h-3.5 text-[#E30613]" />
                          <span>{art.locationDetails.warehouse}</span>
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                          {art.locationDetails.aisle} • {art.locationDetails.shelf} ({art.locationDetails.bin || 'Box'})
                        </div>
                      </td>

                      {/* Saldo Atual */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <span
                          className={`text-sm font-black ${
                            isZero
                              ? 'text-red-700'
                              : isCritical
                              ? 'text-amber-700'
                              : 'text-neutral-900'
                          }`}
                        >
                          {art.currentStock}
                        </span>
                        <span className="text-[10px] text-neutral-500 ml-1 font-bold">
                          {art.unit}
                        </span>
                      </td>

                      {/* Estoque Mínimo */}
                      <td className="p-3 text-center whitespace-nowrap text-neutral-500 font-mono text-xs">
                        {art.minStock} {art.unit}
                      </td>

                      {/* Nível de Cobertura */}
                      <td className="p-3 text-center whitespace-nowrap">
                        {isZero ? (
                          <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center space-x-1">
                            <span>Zerado</span>
                          </span>
                        ) : isCritical ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Crítico ({Math.round(ratio)}%)
                            </span>
                          </div>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Normal ({Math.round(ratio)}%)
                          </span>
                        )}
                      </td>

                      {/* Valor Total */}
                      <td className="p-3 text-right whitespace-nowrap font-mono text-xs font-semibold text-neutral-800">
                        {formatCurrencyBRL(totalItemValue)}
                      </td>

                      {/* Ações */}
                      <td className="p-3 text-right whitespace-nowrap space-x-1 print:hidden">
                        <button
                          onClick={() => onOpenEntry(art.id)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[10px] transition-colors"
                          title="Registrar Entrada"
                        >
                          + Entrada
                        </button>
                        <button
                          onClick={() => onOpenExit(art.id)}
                          disabled={art.currentStock <= 0}
                          className={`px-2 py-1 rounded font-bold text-[10px] transition-colors ${
                            art.currentStock <= 0
                              ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                              : 'bg-[#E30613] hover:bg-[#b8050f] text-white'
                          }`}
                          title="Registrar Saída"
                        >
                          - Saída
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
