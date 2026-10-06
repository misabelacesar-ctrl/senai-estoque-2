import React, { useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Search,
  Filter,
  Calendar,
  Package,
  User,
  FileText,
  Clock,
  Download,
  Boxes
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatCurrencyBRL, formatDateTimeBR } from '../utils/codeGenerator';

interface MovementsViewProps {
  onOpenEntry: () => void;
  onOpenExit: () => void;
}

export const MovementsView: React.FC<MovementsViewProps> = ({
  onOpenEntry,
  onOpenExit,
}) => {
  const { database } = useInventory();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'ENTRADA' | 'SAIDA'>('ALL');
  const [selectedArticleId, setSelectedArticleId] = useState<string>('all');

  const filteredMovements = database.movements.filter(mov => {
    // Type filter
    if (filterType !== 'ALL' && mov.type !== filterType) return false;

    // Article filter
    if (selectedArticleId !== 'all' && mov.articleId !== selectedArticleId) return false;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const article = database.articles.find(a => a.id === mov.articleId);
      const matchesDoc = mov.documentNumber?.toLowerCase().includes(term);
      const matchesOrig = mov.originDestination.toLowerCase().includes(term);
      const matchesReason = mov.reason.toLowerCase().includes(term);
      const matchesOp = mov.operator.toLowerCase().includes(term);
      const matchesArt =
        article?.name.toLowerCase().includes(term) || article?.code.toLowerCase().includes(term);

      if (!matchesDoc && !matchesOrig && !matchesReason && !matchesOp && !matchesArt) {
        return false;
      }
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
              Rastreabilidade Industrial
            </span>
            <h2 className="text-lg font-bold text-neutral-900">
              Histórico de Entradas & Saídas
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Auditoria completa de todas as movimentações de materiais, com registro de solicitante, nota fiscal e operador.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onOpenEntry}
            disabled={database.articles.length === 0}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
              database.articles.length === 0
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>+ Registrar Entrada</span>
          </button>
          <button
            onClick={onOpenExit}
            disabled={database.articles.length === 0}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
              database.articles.length === 0
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : 'bg-[#E30613] hover:bg-[#b8050f] text-white'
            }`}
          >
            <ArrowUpFromLine className="w-4 h-4" />
            <span>- Registrar Saída</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Busca textual */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por doc, solicitante, motivo ou material..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-neutral-300 rounded focus:border-[#E30613] outline-none"
            />
          </div>

          {/* Tipo de Operação */}
          <div>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded focus:border-[#E30613] outline-none bg-white font-medium"
            >
              <option value="ALL">Todas as Operações (Entradas e Saídas)</option>
              <option value="ENTRADA">Somente Entradas (+)</option>
              <option value="SAIDA">Somente Saídas (-)</option>
            </select>
          </div>

          {/* Filtro por Artigo */}
          <div>
            <select
              value={selectedArticleId}
              onChange={e => setSelectedArticleId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded focus:border-[#E30613] outline-none bg-white"
            >
              <option value="all">Todos os Artigos</option>
              {database.articles.map(a => (
                <option key={a.id} value={a.id}>
                  {a.code} - {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-2.5 mt-2.5 border-t border-neutral-100">
          <span>
            Mostrando <strong>{filteredMovements.length}</strong> de <strong>{database.movements.length}</strong> registros
          </span>
          {(searchTerm || filterType !== 'ALL' || selectedArticleId !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterType('ALL');
                setSelectedArticleId('all');
              }}
              className="text-[#E30613] hover:underline font-semibold"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabela de Movimentações */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
        {filteredMovements.length === 0 ? (
          <div className="py-12 text-center">
            <Boxes className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-neutral-800">
              Nenhuma Movimentação Encontrada
            </h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              {database.movements.length === 0
                ? 'Nenhuma entrada ou saída foi registrada ainda. Utilize os botões no topo para registrar a primeira movimentação.'
                : 'Nenhum registro corresponde aos filtros selecionados.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-900 text-white font-bold uppercase text-[10px] tracking-wider border-b border-neutral-800">
                  <th className="p-3">Data / Hora</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Artigo de Estoque</th>
                  <th className="p-3 text-center">Qtd.</th>
                  <th className="p-3 text-center">Histórico Saldo</th>
                  <th className="p-3">Doc / Requisição</th>
                  <th className="p-3">Origem / Destino & Motivo</th>
                  <th className="p-3">Responsável</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredMovements.map(mov => {
                  const article = database.articles.find(a => a.id === mov.articleId);
                  const isEntry = mov.type === 'ENTRADA';

                  return (
                    <tr key={mov.id} className="hover:bg-neutral-50/80 transition-colors">
                      {/* Data */}
                      <td className="p-3 whitespace-nowrap text-neutral-600 font-mono text-[11px]">
                        {formatDateTimeBR(mov.date)}
                      </td>

                      {/* Tipo */}
                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-flex items-center space-x-1 ${
                            isEntry
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {isEntry ? (
                            <ArrowDownToLine className="w-3 h-3 text-emerald-700" />
                          ) : (
                            <ArrowUpFromLine className="w-3 h-3 text-red-700" />
                          )}
                          <span>{mov.type}</span>
                        </span>
                      </td>

                      {/* Artigo */}
                      <td className="p-3">
                        <div className="font-semibold text-neutral-900">
                          {article ? article.name : 'Artigo Excluído'}
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                          {article?.code} • {article?.locationDetails.warehouse}
                        </div>
                      </td>

                      {/* Quantidade */}
                      <td className="p-3 text-center whitespace-nowrap">
                        <span
                          className={`font-black text-xs ${
                            isEntry ? 'text-emerald-700' : 'text-red-700'
                          }`}
                        >
                          {isEntry ? '+' : '-'}
                          {mov.quantity} {article?.unit || ''}
                        </span>
                        {mov.unitCost && isEntry && (
                          <div className="text-[10px] text-neutral-400">
                            {formatCurrencyBRL(mov.unitCost)} / un
                          </div>
                        )}
                      </td>

                      {/* Histórico Saldo (De -> Para) */}
                      <td className="p-3 text-center whitespace-nowrap font-mono text-[11px]">
                        <span className="text-neutral-400">{mov.previousStock}</span>
                        <span className="text-neutral-300 mx-1">→</span>
                        <span className="font-bold text-neutral-900">{mov.newStock}</span>
                      </td>

                      {/* Documento */}
                      <td className="p-3 whitespace-nowrap text-neutral-800 font-mono text-[11px]">
                        {mov.documentNumber || '—'}
                      </td>

                      {/* Origem / Destino & Motivo */}
                      <td className="p-3">
                        <div className="font-semibold text-neutral-900 text-xs">
                          {mov.originDestination}
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">
                          {mov.reason}
                          {mov.notes && (
                            <span className="italic text-neutral-400 block mt-0.5">
                              Obs: {mov.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Responsável */}
                      <td className="p-3 whitespace-nowrap text-neutral-600 text-[11px]">
                        {mov.operator}
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
