import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Filter,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  Calendar,
  CheckCircle,
  Building,
  ShieldCheck
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import {
  formatCurrencyBRL,
  formatDateTimeBR,
  formatDateOnlyBR
} from '../utils/codeGenerator';

type ReportTab = 'inventory' | 'movements' | 'critical';

export const ReportsView: React.FC = () => {
  const { database } = useInventory();

  const [activeReport, setActiveReport] = useState<ReportTab>('inventory');
  const [filterWarehouse, setFilterWarehouse] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const warehouses = Array.from(
    new Set(database.articles.map(a => a.locationDetails.warehouse).filter(Boolean))
  );

  // Filtered inventory articles
  const filteredArticles = database.articles.filter(art => {
    if (filterWarehouse !== 'all' && art.locationDetails.warehouse !== filterWarehouse) {
      return false;
    }
    return true;
  });

  // Filtered movements
  const filteredMovements = database.movements.filter(mov => {
    if (filterStartDate) {
      const movDate = new Date(mov.date).toISOString().slice(0, 10);
      if (movDate < filterStartDate) return false;
    }
    if (filterEndDate) {
      const movDate = new Date(mov.date).toISOString().slice(0, 10);
      if (movDate > filterEndDate) return false;
    }
    return true;
  });

  // Critical articles (needs restock)
  const criticalArticles = filteredArticles.filter(a => a.currentStock <= a.minStock);

  // Totais
  const totalStockItems = filteredArticles.reduce((acc, curr) => acc + curr.currentStock, 0);
  const totalFinancialValue = filteredArticles.reduce((acc, curr) => {
    return acc + curr.currentStock * (curr.averageUnitCost || 0);
  }, 0);

  // Export to CSV
  const exportToCSV = () => {
    let csvRows: string[] = [];

    if (activeReport === 'inventory') {
      csvRows.push(['Código', 'Descrição do Artigo', 'Família (Subgrupo)', 'Localização Física', 'Saldo Atual', 'Unidade', 'Estoque Mínimo', 'Custo Unit.', 'Valor Total'].join(';'));
      filteredArticles.forEach(a => {
        const sub = database.subgroups.find(s => s.id === a.subgrupoId);
        const total = a.currentStock * (a.averageUnitCost || 0);
        csvRows.push([
          `"${a.code}"`,
          `"${a.name.replace(/"/g, '""')}"`,
          `"${sub?.name || ''}"`,
          `"${a.locationDetails.warehouse} - ${a.locationDetails.shelf} (${a.locationDetails.bin || ''})"`,
          a.currentStock,
          a.unit,
          a.minStock,
          (a.averageUnitCost || 0).toFixed(2),
          total.toFixed(2),
        ].join(';'));
      });
    } else if (activeReport === 'movements') {
      csvRows.push(['Data e Hora', 'Tipo', 'Código Artigo', 'Artigo', 'Quantidade', 'Unidade', 'Doc/Requisição', 'Origem/Destino', 'Motivo', 'Operador'].join(';'));
      filteredMovements.forEach(m => {
        const art = database.articles.find(a => a.id === m.articleId);
        csvRows.push([
          `"${formatDateTimeBR(m.date)}"`,
          `"${m.type}"`,
          `"${art?.code || ''}"`,
          `"${(art?.name || '').replace(/"/g, '""')}"`,
          m.quantity,
          art?.unit || '',
          `"${m.documentNumber || ''}"`,
          `"${m.originDestination.replace(/"/g, '""')}"`,
          `"${m.reason.replace(/"/g, '""')}"`,
          `"${m.operator.replace(/"/g, '""')}"`,
        ].join(';'));
      });
    } else {
      csvRows.push(['Código', 'Descrição do Artigo', 'Localização Física', 'Saldo Atual', 'Estoque Mínimo', 'Déficit (Reposição Recomendada)', 'Unidade'].join(';'));
      criticalArticles.forEach(a => {
        const deficit = Math.max(0, a.minStock - a.currentStock);
        csvRows.push([
          `"${a.code}"`,
          `"${a.name.replace(/"/g, '""')}"`,
          `"${a.locationDetails.warehouse} - ${a.locationDetails.shelf}"`,
          a.currentStock,
          a.minStock,
          deficit,
          a.unit,
        ].join(';'));
      });
    }

    const csvContent = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-senai-${activeReport}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions (Escondido na impressão) */}
      <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-[#E30613] text-white text-[11px] font-bold px-2 py-0.5 rounded uppercase">
              Relatórios e Auditoria
            </span>
            <h2 className="text-lg font-bold text-neutral-900">
              Emissão de Relatórios Oficiais de Estoque
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Exportação e impressão com cabeçalho timbrado do SENAI-SP, auditoria física de materiais e extrato de movimentações.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={exportToCSV}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Exportar CSV / Excel</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#E30613] hover:bg-[#b8050f] text-white rounded text-xs font-bold uppercase tracking-wider transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Relatório</span>
          </button>
        </div>
      </div>

      {/* Seletor de Tipo de Relatório (Escondido na impressão) */}
      <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-sm space-y-4 print:hidden">
        <div className="flex flex-wrap gap-2 border-b border-neutral-200 pb-3">
          <button
            onClick={() => setActiveReport('inventory')}
            className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 ${
              activeReport === 'inventory'
                ? 'bg-neutral-900 text-white shadow-sm border-b-2 border-[#E30613]'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <Package className="w-4 h-4 text-[#E30613]" />
            <span>1. Posição Completa de Estoque & Localização</span>
          </button>

          <button
            onClick={() => setActiveReport('movements')}
            className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 ${
              activeReport === 'movements'
                ? 'bg-neutral-900 text-white shadow-sm border-b-2 border-[#E30613]'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <ArrowDownToLine className="w-4 h-4 text-emerald-500" />
            <span>2. Extrato Cronológico de Movimentações</span>
          </button>

          <button
            onClick={() => setActiveReport('critical')}
            className={`px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all flex items-center space-x-2 ${
              activeReport === 'critical'
                ? 'bg-neutral-900 text-white shadow-sm border-b-2 border-[#E30613]'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span>3. Relatório de Reposição Crítica</span>
          </button>
        </div>

        {/* Filtros contextuais */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {activeReport !== 'movements' && (
            <div className="flex items-center space-x-2">
              <span className="text-neutral-500 font-medium">Filtrar Galpão:</span>
              <select
                value={filterWarehouse}
                onChange={e => setFilterWarehouse(e.target.value)}
                className="px-2.5 py-1.5 border border-neutral-300 rounded outline-none bg-white font-medium"
              >
                <option value="all">Todos os Galpões e Setores</option>
                {warehouses.map(w => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          )}

          {activeReport === 'movements' && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-1.5">
                <span className="text-neutral-500 font-medium">De:</span>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={e => setFilterStartDate(e.target.value)}
                  className="px-2 py-1 border border-neutral-300 rounded outline-none text-xs"
                />
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="text-neutral-500 font-medium">Até:</span>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={e => setFilterEndDate(e.target.value)}
                  className="px-2 py-1 border border-neutral-300 rounded outline-none text-xs"
                />
              </div>
              {(filterStartDate || filterEndDate) && (
                <button
                  onClick={() => {
                    setFilterStartDate('');
                    setFilterEndDate('');
                  }}
                  className="text-[#E30613] hover:underline font-semibold"
                >
                  Limpar Datas
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ÁREA DO RELATÓRIO TIMBRADO OFICIAL (FORMATO PARA IMPRESSÃO) */}
      <div className="bg-white rounded-lg border border-neutral-300 shadow-md p-6 sm:p-8 print:border-none print:shadow-none print:p-0">
        {/* Cabeçalho Oficial do SENAI-SP */}
        <div className="border-b-2 border-[#E30613] pb-4 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-[#E30613] text-white font-black text-2xl px-3 py-1 rounded-sm select-none">
                SENAI
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-black uppercase text-neutral-900 tracking-wide">
                  SERVIÇO NACIONAL DE APRENDIZAGEM INDUSTRIAL — SÃO PAULO
                </h1>
                <p className="text-xs text-neutral-600 font-medium">
                  Departamento Regional de São Paulo • Sistema Integrado de Controle de Estoque
                </p>
              </div>
            </div>

            <div className="text-right text-[11px] text-neutral-500">
              <div className="font-bold text-neutral-800">
                Data de Emissão: {formatDateTimeBR(new Date().toISOString())}
              </div>
              <div>Documento Oficial de Inventário</div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs">
            <div>
              <span className="font-bold uppercase tracking-wider text-neutral-700">
                Tipo do Documento:{' '}
              </span>
              <span className="font-black text-[#E30613]">
                {activeReport === 'inventory'
                  ? 'POSIÇÃO COMPLETA DE INVENTÁRIO FÍSICO'
                  : activeReport === 'movements'
                  ? 'EXTRATO OFICIAL DE MOVIMENTAÇÕES DE ESTOQUE'
                  : 'RELATÓRIO DE REPOSIÇÃO E COMPRAS CRÍTICAS'}
              </span>
            </div>
            <div className="mt-1 sm:mt-0 text-neutral-500">
              Responsável Técnico: <strong>Equipe de Engenharia SENAI-SP</strong>
            </div>
          </div>
        </div>

        {/* 1. RELATÓRIO DE INVENTÁRIO COMPLETO */}
        {activeReport === 'inventory' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-50 p-3 rounded border border-neutral-200 text-xs">
              <div>
                <span className="text-neutral-500 block">Total de Artigos:</span>
                <span className="font-bold text-neutral-900">{filteredArticles.length} itens</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Total de Peças/Unidades:</span>
                <span className="font-bold text-neutral-900">{totalStockItems} unidades</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Itens em Alerta Crítico:</span>
                <span className="font-bold text-amber-700">{criticalArticles.length} itens</span>
              </div>
              <div>
                <span className="text-neutral-500 block">Valor Financeiro Imobilizado:</span>
                <span className="font-black text-neutral-900">{formatCurrencyBRL(totalFinancialValue)}</span>
              </div>
            </div>

            {filteredArticles.length === 0 ? (
              <div className="py-8 text-center text-neutral-500 italic text-xs">
                Nenhum artigo cadastrado na base de dados para emissão do relatório.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-900 text-white font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-2 border border-neutral-700">Código</th>
                    <th className="p-2 border border-neutral-700">Descrição do Artigo</th>
                    <th className="p-2 border border-neutral-700">Família / Subgrupo</th>
                    <th className="p-2 border border-neutral-700">Localização Física</th>
                    <th className="p-2 border border-neutral-700 text-center">Saldo</th>
                    <th className="p-2 border border-neutral-700 text-center">Mínimo</th>
                    <th className="p-2 border border-neutral-700 text-right">Custo Médio</th>
                    <th className="p-2 border border-neutral-700 text-right">Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredArticles.map(art => {
                    const sub = database.subgroups.find(s => s.id === art.subgrupoId);
                    const totalItem = art.currentStock * (art.averageUnitCost || 0);
                    const isCrit = art.currentStock <= art.minStock;

                    return (
                      <tr key={art.id} className="border-b border-neutral-200 hover:bg-neutral-50">
                        <td className="p-2 font-mono font-bold whitespace-nowrap border-x border-neutral-200">
                          {art.code}
                        </td>
                        <td className="p-2 font-medium text-neutral-900 border-r border-neutral-200">
                          {art.name}
                        </td>
                        <td className="p-2 text-neutral-600 border-r border-neutral-200 whitespace-nowrap">
                          {sub?.name || '—'}
                        </td>
                        <td className="p-2 text-neutral-700 border-r border-neutral-200 whitespace-nowrap">
                          {art.locationDetails.warehouse} ({art.locationDetails.shelf})
                        </td>
                        <td
                          className={`p-2 text-center font-bold border-r border-neutral-200 whitespace-nowrap ${
                            isCrit ? 'text-red-700' : 'text-neutral-900'
                          }`}
                        >
                          {art.currentStock} {art.unit}
                        </td>
                        <td className="p-2 text-center text-neutral-500 border-r border-neutral-200 whitespace-nowrap">
                          {art.minStock} {art.unit}
                        </td>
                        <td className="p-2 text-right font-mono border-r border-neutral-200 whitespace-nowrap">
                          {art.averageUnitCost ? formatCurrencyBRL(art.averageUnitCost) : '—'}
                        </td>
                        <td className="p-2 text-right font-mono font-bold border-r border-neutral-200 whitespace-nowrap">
                          {formatCurrencyBRL(totalItem)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 2. RELATÓRIO DE MOVIMENTAÇÕES */}
        {activeReport === 'movements' && (
          <div className="space-y-4">
            <div className="bg-neutral-50 p-3 rounded border border-neutral-200 text-xs flex items-center justify-between">
              <div>
                <span className="text-neutral-500">Total de Registros de Movimentação: </span>
                <span className="font-bold text-neutral-900">{filteredMovements.length}</span>
              </div>
              <div className="text-neutral-500">
                Entradas: <strong>{filteredMovements.filter(m => m.type === 'ENTRADA').length}</strong> | Saídas: <strong>{filteredMovements.filter(m => m.type === 'SAIDA').length}</strong>
              </div>
            </div>

            {filteredMovements.length === 0 ? (
              <div className="py-8 text-center text-neutral-500 italic text-xs">
                Nenhuma movimentação registrada para o período selecionado.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-900 text-white font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-2 border border-neutral-700">Data/Hora</th>
                    <th className="p-2 border border-neutral-700">Tipo</th>
                    <th className="p-2 border border-neutral-700">Artigo</th>
                    <th className="p-2 border border-neutral-700 text-center">Qtd.</th>
                    <th className="p-2 border border-neutral-700 text-center">Saldo Result.</th>
                    <th className="p-2 border border-neutral-700">Doc / Requisição</th>
                    <th className="p-2 border border-neutral-700">Origem / Destino & Motivo</th>
                    <th className="p-2 border border-neutral-700">Operador</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovements.map(mov => {
                    const art = database.articles.find(a => a.id === mov.articleId);
                    const isEntry = mov.type === 'ENTRADA';

                    return (
                      <tr key={mov.id} className="border-b border-neutral-200 hover:bg-neutral-50">
                        <td className="p-2 font-mono text-[11px] whitespace-nowrap border-x border-neutral-200">
                          {formatDateTimeBR(mov.date)}
                        </td>
                        <td className="p-2 whitespace-nowrap border-r border-neutral-200">
                          <span
                            className={`font-black text-[10px] uppercase px-1.5 py-0.5 rounded ${
                              isEntry ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {mov.type}
                          </span>
                        </td>
                        <td className="p-2 font-medium border-r border-neutral-200">
                          <span className="font-mono text-neutral-500 mr-1">[{art?.code}]</span>
                          {art?.name || 'Excluído'}
                        </td>
                        <td className="p-2 text-center font-bold border-r border-neutral-200 whitespace-nowrap">
                          {isEntry ? '+' : '-'}
                          {mov.quantity} {art?.unit}
                        </td>
                        <td className="p-2 text-center font-mono border-r border-neutral-200 whitespace-nowrap">
                          {mov.newStock} {art?.unit}
                        </td>
                        <td className="p-2 font-mono text-neutral-700 border-r border-neutral-200 whitespace-nowrap">
                          {mov.documentNumber || '—'}
                        </td>
                        <td className="p-2 border-r border-neutral-200">
                          <div className="font-semibold text-neutral-800">{mov.originDestination}</div>
                          <div className="text-[10px] text-neutral-500">{mov.reason}</div>
                        </td>
                        <td className="p-2 border-r border-neutral-200 whitespace-nowrap text-neutral-600">
                          {mov.operator}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* 3. RELATÓRIO DE REPOSIÇÃO CRÍTICA */}
        {activeReport === 'critical' && (
          <div className="space-y-4">
            <div className="bg-amber-50 p-3 rounded border border-amber-200 text-xs flex items-center justify-between text-amber-900">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span className="font-bold">
                  {criticalArticles.length} Artigo(s) com Necessidade Urgente de Reposição
                </span>
              </div>
              <span>Critério: Saldo em Estoque ≤ Estoque Mínimo Estabelecido</span>
            </div>

            {criticalArticles.length === 0 ? (
              <div className="py-8 text-center text-emerald-700 text-xs">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="font-bold">Excelente! Todos os artigos estão acima do estoque de segurança.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-900 text-white font-bold uppercase text-[10px] tracking-wider">
                    <th className="p-2 border border-neutral-700">Código</th>
                    <th className="p-2 border border-neutral-700">Descrição do Artigo</th>
                    <th className="p-2 border border-neutral-700">Localização Física</th>
                    <th className="p-2 border border-neutral-700 text-center">Saldo Atual</th>
                    <th className="p-2 border border-neutral-700 text-center">Estoque Mínimo</th>
                    <th className="p-2 border border-neutral-700 text-center">Déficit (Reposição)</th>
                    <th className="p-2 border border-neutral-700 text-right">Custo Unitário Estimado</th>
                  </tr>
                </thead>
                <tbody>
                  {criticalArticles.map(art => {
                    const deficit = Math.max(0, art.minStock - art.currentStock);
                    return (
                      <tr key={art.id} className="border-b border-neutral-200 hover:bg-neutral-50">
                        <td className="p-2 font-mono font-bold whitespace-nowrap border-x border-neutral-200">
                          {art.code}
                        </td>
                        <td className="p-2 font-medium text-neutral-900 border-r border-neutral-200">
                          {art.name}
                        </td>
                        <td className="p-2 text-neutral-700 border-r border-neutral-200 whitespace-nowrap">
                          {art.locationDetails.warehouse} ({art.locationDetails.shelf})
                        </td>
                        <td className="p-2 text-center font-bold text-red-600 border-r border-neutral-200 whitespace-nowrap">
                          {art.currentStock} {art.unit}
                        </td>
                        <td className="p-2 text-center text-neutral-500 border-r border-neutral-200 whitespace-nowrap">
                          {art.minStock} {art.unit}
                        </td>
                        <td className="p-2 text-center font-black text-amber-700 border-r border-neutral-200 whitespace-nowrap bg-amber-50/50">
                          {deficit} {art.unit}
                        </td>
                        <td className="p-2 text-right font-mono border-r border-neutral-200 whitespace-nowrap">
                          {art.averageUnitCost ? formatCurrencyBRL(art.averageUnitCost) : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Rodapé de Assinatura Oficial (Visível na impressão) */}
        <div className="mt-12 pt-6 border-t border-neutral-300 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <div className="border-b border-neutral-400 w-3/4 mx-auto mb-2" />
            <p className="font-bold text-neutral-800">Almoxarifado & Gestão de Materiais</p>
            <p className="text-[10px] text-neutral-500">SENAI São Paulo — Unidade Operacional</p>
          </div>
          <div>
            <div className="border-b border-neutral-400 w-3/4 mx-auto mb-2" />
            <p className="font-bold text-neutral-800">Responsável Técnico / Engenharia</p>
            <p className="text-[10px] text-neutral-500">Equipe de Desenvolvimento e Controle de Estoques</p>
          </div>
        </div>
      </div>
    </div>
  );
};
