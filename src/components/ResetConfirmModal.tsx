import React, { useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { resetToEmpty } = useInventory();
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (confirmText.toLowerCase() !== 'zerar') return;
    setIsDeleting(true);
    await resetToEmpty();
    setIsDeleting(false);
    onClose();
    setConfirmText('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full border border-red-300 overflow-hidden">
        <div className="bg-red-700 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-white" />
            <h3 className="font-bold text-sm uppercase tracking-wide">
              Zerar Banco de Dados (Limpar Tudo)
            </h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-neutral-700 leading-relaxed">
            Esta ação apagará <strong>todos os Tipos, Grupos, Subgrupos, Artigos e Histórico de Movimentações</strong>, retornando o sistema à estrutura vazia inicial pronta para novos testes e validação.
          </p>

          <div className="bg-red-50 p-3 rounded border border-red-200 text-xs text-red-800">
            Digite a palavra <strong className="font-mono uppercase text-red-900">zerar</strong> no campo abaixo para confirmar:
          </div>

          <input
            type="text"
            placeholder="Digite 'zerar'"
            value={confirmText}
            onChange={e => setConfirmText(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-neutral-300 rounded focus:border-red-600 outline-none uppercase font-bold"
            autoFocus
          />

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-semibold rounded hover:bg-neutral-100"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={confirmText.toLowerCase() !== 'zerar' || isDeleting}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded text-white flex items-center space-x-1.5 transition-all ${
                confirmText.toLowerCase() === 'zerar' && !isDeleting
                  ? 'bg-red-700 hover:bg-red-800 shadow-md'
                  : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeleting ? 'Limpando...' : 'Confirmar e Zerar'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
