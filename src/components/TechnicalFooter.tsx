import React from 'react';
import { ShieldCheck, HardDrive, RefreshCw, Trash2, Database, HelpCircle } from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

interface TechnicalFooterProps {
  onOpenResetConfirm: () => void;
  onLoadSampleData: () => void;
}

export const TechnicalFooter: React.FC<TechnicalFooterProps> = ({
  onOpenResetConfirm,
  onLoadSampleData,
}) => {
  const { database, serverOnline } = useInventory();

  return (
    <footer className="bg-[#121212] text-neutral-300 border-t-2 border-[#E30613] mt-16 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-6 border-b border-neutral-800">
          {/* Identificação Institucional */}
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-[#E30613] text-white text-xs font-black px-2 py-0.5 rounded-sm">
                SENAI-SP
              </span>
              <span className="text-white font-bold text-sm tracking-wide">
                Sistema de Gestão de Estoques
              </span>
            </div>
            <p className="mt-2 text-xs text-neutral-400 leading-relaxed">
              Plataforma desenvolvida para controle rigoroso de insumos, matérias-primas e ferramentas nas oficinas e laboratórios do SENAI São Paulo, com rastreabilidade de entradas, saídas e posições físicas.
            </p>
            <div className="mt-3 flex items-center space-x-2 text-[11px] text-neutral-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Ambiente Validador em Conformidade Técnica</span>
            </div>
          </div>

          {/* Responsabilidade Técnica Obrigatória */}
          <div className="bg-neutral-900/80 p-4 rounded-lg border border-neutral-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#E30613] flex items-center space-x-1.5">
              <span>Responsabilidade Técnica</span>
            </h4>
            <div className="mt-2 text-xs text-neutral-200">
              <p className="font-semibold text-white">Engenharia de Software Full-Stack</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Responsável Técnico: <span className="text-white font-medium">Equipe de Desenvolvimento de Sistemas SENAI-SP</span>
              </p>
              <p className="text-[11px] text-neutral-400">
                Arquitetura: Full-Stack React + Node.js Express + Nuvem GitHub / Drive
              </p>
              <p className="text-[10px] text-neutral-400 mt-2 font-mono">
                Versão: 1.0.0-PROD | Status DB: {database.articles.length} Artigos | {database.movements.length} Movimentações
              </p>
            </div>
          </div>

          {/* Ações de Teste e Validação */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
              Ambiente de Validação & Testes
            </h4>
            <p className="text-xs text-neutral-400 mt-1">
              O banco de dados foi fornecido com estrutura vazia para testes. Use os botões abaixo para validação:
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={onLoadSampleData}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-medium text-white rounded border border-neutral-700 transition-colors"
                title="Carrega 3 itens de exemplo reais do SENAI para testes rápidos"
              >
                <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                <span>Carregar Exemplo SENAI</span>
              </button>

              <button
                onClick={onOpenResetConfirm}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-red-950/60 text-xs font-medium text-red-400 rounded border border-red-900/50 transition-colors"
                title="Zerar todos os dados e retornar à estrutura 100% vazia"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                <span>Zerar Banco (Vazio)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Linha final de copyright */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-neutral-400">
          <div>
            © {new Date().getFullYear()} SENAI São Paulo - Serviço Nacional de Aprendizagem Industrial. Todos os direitos reservados.
          </div>
          <div className="mt-2 sm:mt-0 flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <HardDrive className="w-3.5 h-3.5 text-neutral-400" />
              <span>Persistência Ativa</span>
            </span>
            <span>Segurança & Rastreabilidade Industrial</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
