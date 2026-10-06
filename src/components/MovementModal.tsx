import React, { useState, useEffect } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertCircle,
  Package,
  MapPin,
  CheckCircle2,
  Calendar,
  User,
  FileText,
  DollarSign
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { formatCurrencyBRL } from '../utils/codeGenerator';

interface MovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'ENTRADA' | 'SAIDA';
  preselectedArticleId?: string;
}

export const MovementModal: React.FC<MovementModalProps> = ({
  isOpen,
  onClose,
  initialType = 'ENTRADA',
  preselectedArticleId,
}) => {
  const { database, registerMovement } = useInventory();

  const [type, setType] = useState<'ENTRADA' | 'SAIDA'>(initialType);
  const [articleId, setArticleId] = useState(preselectedArticleId || '');
  const [quantity, setQuantity] = useState('1');
  const [documentNumber, setDocumentNumber] = useState('');
  const [originDestination, setOriginDestination] = useState('');
  const [reason, setReason] = useState('');
  const [operator, setOperator] = useState('Almoxarife SENAI-SP');
  const [unitCost, setUnitCost] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      const chosenId = preselectedArticleId || database.articles[0]?.id || '';
      setArticleId(chosenId);
      setQuantity('1');
      setDocumentNumber('');
      setOriginDestination('');
      setReason(initialType === 'ENTRADA' ? 'Aquisição Regular Semestre' : 'Aula Prática Oficina');
      setOperator('Almoxarife SENAI-SP');
      setUnitCost('');
      setNotes('');
      setErrorMessage('');
    }
  }, [isOpen, initialType, preselectedArticleId, database.articles]);

  if (!isOpen) return null;

  const selectedArticle = database.articles.find(a => a.id === articleId);
  const currentStock = Number(selectedArticle?.currentStock) || 0;
  const numQuantity = Number(quantity) || 0;

  const isInvalidStockExit = type === 'SAIDA' && numQuantity > currentStock;
  const projectedStock =
    type === 'ENTRADA' ? currentStock + numQuantity : Math.max(0, currentStock - numQuantity);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleId) {
      setErrorMessage('Selecione um artigo para a movimentação.');
      return;
    }
    if (numQuantity <= 0) {
      setErrorMessage('A quantidade movimentada deve ser maior que zero.');
      return;
    }
    if (isInvalidStockExit) {
      setErrorMessage(
        `Saldo insuficiente para baixa! Saldo atual em estoque: ${currentStock} ${selectedArticle?.unit}.`
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const res = await registerMovement({
        articleId,
        type,
        quantity: numQuantity,
        documentNumber,
        originDestination:
          originDestination.trim() ||
          (type === 'ENTRADA' ? 'Fornecedor Externo / Doação' : 'Turma SENAI-SP'),
        reason:
          reason.trim() || (type === 'ENTRADA' ? 'Entrada no almoxarifado' : 'Consumo em aula prática'),
        operator: operator.trim() || 'Almoxarife SENAI',
        unitCost: unitCost ? Number(unitCost) : undefined,
        notes,
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Erro ao registrar movimentação.');
      } else {
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha na requisição');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl max-w-xl w-full border border-neutral-300 overflow-hidden my-6">
        {/* Header com Abas Entrada / Saída */}
        <div className="bg-neutral-900 text-white p-4 border-b-2 border-[#E30613]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {type === 'ENTRADA' ? (
                <ArrowDownToLine className="w-5 h-5 text-emerald-400" />
              ) : (
                <ArrowUpFromLine className="w-5 h-5 text-red-500" />
              )}
              <h3 className="font-bold text-sm uppercase tracking-wide">
                Registrar Movimentação de Estoque
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>

          {/* Toggle Type */}
          <div className="mt-3 grid grid-cols-2 gap-2 bg-neutral-800 p-1 rounded">
            <button
              type="button"
              onClick={() => {
                setType('ENTRADA');
                setReason('Aquisição Regular Semestre');
              }}
              className={`py-1.5 text-xs font-bold uppercase tracking-wider rounded flex items-center justify-center space-x-1.5 transition-all ${
                type === 'ENTRADA'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>Entrada (+)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setType('SAIDA');
                setReason('Aula Prática Oficina');
              }}
              className={`py-1.5 text-xs font-bold uppercase tracking-wider rounded flex items-center justify-center space-x-1.5 transition-all ${
                type === 'SAIDA'
                  ? 'bg-[#E30613] text-white shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <ArrowUpFromLine className="w-3.5 h-3.5" />
              <span>Saída (-)</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Seleção do Artigo */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Selecionar Artigo de Estoque *
            </label>
            <select
              value={articleId}
              onChange={e => setArticleId(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded bg-white focus:border-[#E30613] outline-none font-medium"
              required
            >
              {database.articles.length === 0 ? (
                <option value="">Nenhum artigo cadastrado no banco</option>
              ) : (
                database.articles.map(art => (
                  <option key={art.id} value={art.id}>
                    [{art.code}] {art.name} — Saldo: {art.currentStock} {art.unit} ({art.locationDetails.warehouse})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Card com Detalhes do Artigo e Localização Física */}
          {selectedArticle && (
            <div className="bg-neutral-50 p-3 rounded border border-neutral-200 text-xs">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-neutral-900">{selectedArticle.name}</div>
                  <div className="text-neutral-500 text-[11px] mt-0.5 flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-[#E30613]" />
                    <span>
                      Local: <strong>{selectedArticle.locationDetails.warehouse}</strong> • {selectedArticle.locationDetails.aisle} • {selectedArticle.locationDetails.shelf} ({selectedArticle.locationDetails.bin})
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-neutral-400 block uppercase">Saldo Atual</span>
                  <span className="font-black text-sm text-neutral-900">
                    {currentStock} {selectedArticle.unit}
                  </span>
                </div>
              </div>

              {/* Simulação em Tempo Real do Saldo */}
              <div className="mt-3 pt-2 border-t border-neutral-200 flex items-center justify-between text-[11px]">
                <span className="text-neutral-600">
                  Saldo Projetado após {type === 'ENTRADA' ? 'Entrada' : 'Saída'}:
                </span>
                <span
                  className={`font-black ${
                    isInvalidStockExit ? 'text-red-600' : type === 'ENTRADA' ? 'text-emerald-700' : 'text-neutral-900'
                  }`}
                >
                  {isInvalidStockExit
                    ? 'INSUFICIENTE'
                    : `${projectedStock} ${selectedArticle.unit}`}
                </span>
              </div>
            </div>
          )}

          {/* Quantidade e Documento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Quantidade a {type === 'ENTRADA' ? 'Inserir' : 'Baixar'} *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  className={`w-full px-3 py-2 text-xs border rounded outline-none font-bold text-sm ${
                    isInvalidStockExit
                      ? 'border-red-500 bg-red-50 text-red-900'
                      : 'border-neutral-300 focus:border-[#E30613]'
                  }`}
                  required
                />
                <span className="absolute right-3 top-2.5 text-xs text-neutral-400 font-bold">
                  {selectedArticle?.unit || 'UN'}
                </span>
              </div>
              {isInvalidStockExit && (
                <span className="text-[10px] text-red-600 mt-0.5 block font-medium">
                  Aviso: Quantidade excede o saldo disponível ({currentStock} {selectedArticle?.unit}).
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Documento / Requisição
              </label>
              <input
                type="text"
                placeholder={type === 'ENTRADA' ? 'Ex: NF-104928' : 'Ex: REQ-AULA-204'}
                value={documentNumber}
                onChange={e => setDocumentNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded focus:border-[#E30613] outline-none"
              />
            </div>
          </div>

          {/* Origem / Destino & Motivo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                {type === 'ENTRADA' ? 'Origem / Fornecedor' : 'Destino / Turma / Solicitante'} *
              </label>
              <input
                type="text"
                placeholder={
                  type === 'ENTRADA'
                    ? 'Ex: Gerdau Aços / WEG'
                    : 'Ex: Turma Mecânica 2026/1 - Prof. Silva'
                }
                value={originDestination}
                onChange={e => setOriginDestination(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded focus:border-[#E30613] outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Motivo da Operação *
              </label>
              <input
                type="text"
                placeholder={
                  type === 'ENTRADA'
                    ? 'Ex: Reposição Semestral / Doação'
                    : 'Ex: Aula Prática de Fresamento / Manutenção'
                }
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded focus:border-[#E30613] outline-none"
                required
              />
            </div>
          </div>

          {/* Operador & Custo (Entrada) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Operador / Almoxarife *
              </label>
              <input
                type="text"
                value={operator}
                onChange={e => setOperator(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-neutral-300 rounded focus:border-[#E30613] outline-none"
                required
              />
            </div>

            {type === 'ENTRADA' && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Custo Unitário NF (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={unitCost}
                  onChange={e => setUnitCost(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded focus:border-[#E30613] outline-none"
                />
              </div>
            )}
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
              Observações Complementares
            </label>
            <textarea
              rows={2}
              placeholder="Instruções de lote, estado do material, corte prévio..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-neutral-300 rounded focus:border-[#E30613] outline-none"
            />
          </div>

          {/* Botões */}
          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-semibold rounded hover:bg-neutral-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isInvalidStockExit}
              className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded transition-all shadow-md text-white ${
                isInvalidStockExit
                  ? 'bg-neutral-400 cursor-not-allowed'
                  : type === 'ENTRADA'
                  ? 'bg-emerald-600 hover:bg-emerald-500'
                  : 'bg-[#E30613] hover:bg-[#b8050f]'
              }`}
            >
              {isSubmitting
                ? 'Processando...'
                : type === 'ENTRADA'
                ? 'Confirmar Entrada (+)'
                : 'Confirmar Baixa (-)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
