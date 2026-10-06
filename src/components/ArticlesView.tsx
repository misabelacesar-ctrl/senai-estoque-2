import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Filter,
  MapPin,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  Edit2,
  Trash2,
  CheckCircle2,
  Boxes,
  HelpCircle
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import { ArtigoItem, LocationDetails } from '../types/inventory';
import {
  formatCurrencyBRL,
  formatDateTimeBR,
  generateFullLocationCode,
  generateNextArtigoCode
} from '../utils/codeGenerator';

interface ArticlesViewProps {
  onOpenEntry: (articleId: string) => void;
  onOpenExit: (articleId: string) => void;
  isAddModalOpenInitially?: boolean;
  preselectedSubgroupId?: string;
}

const COMMON_UNITS = [
  'UN',
  'KG',
  'M',
  'M²',
  'M³',
  'L',
  'ML',
  'CX',
  'PACOTE',
  'BARRA',
  'ROLO',
  'PAR',
  'CONJ',
  'FOLHA',
];

export const ArticlesView: React.FC<ArticlesViewProps> = ({
  onOpenEntry,
  onOpenExit,
  isAddModalOpenInitially = false,
  preselectedSubgroupId,
}) => {
  const { database, addArtigo, updateArtigo, deleteArtigo } = useInventory();

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTipoId, setSelectedTipoId] = useState<string>('all');
  const [selectedSubgroupId, setSelectedSubgroupId] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'critical' | 'normal' | 'zero'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(isAddModalOpenInitially);
  const [editingArticle, setEditingArticle] = useState<ArtigoItem | null>(null);

  // Form Fields
  const [formSubgroupId, setFormSubgroupId] = useState(preselectedSubgroupId || '');
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formUnit, setFormUnit] = useState('UN');
  const [formMinStock, setFormMinStock] = useState('5');
  const [formInitialStock, setFormInitialStock] = useState('0');
  const [formCost, setFormCost] = useState('');

  // Location Fields
  const [formWarehouse, setFormWarehouse] = useState('Almoxarifado Central');
  const [formAisle, setFormAisle] = useState('Corredor 01');
  const [formShelf, setFormShelf] = useState('Estante 01');
  const [formLevel, setFormLevel] = useState('Nível 1');
  const [formBin, setFormBin] = useState('Box 01');

  const [formError, setFormError] = useState('');

  // Open modal for new article
  const handleOpenAddModal = (defaultSubgroupId?: string) => {
    setEditingArticle(null);
    const subId = defaultSubgroupId || database.subgroups[0]?.id || '';
    setFormSubgroupId(subId);

    const sub = database.subgroups.find(s => s.id === subId);
    const nextCode = sub ? generateNextArtigoCode(sub.code, database.articles) : 'ART-01-01-01-001';
    setFormCode(nextCode);

    setFormName('');
    setFormDescription('');
    setFormUnit('UN');
    setFormMinStock('5');
    setFormInitialStock('0');
    setFormCost('');
    setFormWarehouse('Almoxarifado Central');
    setFormAisle('Rua 01');
    setFormShelf('Estante 01');
    setFormLevel('Nível 1');
    setFormBin('Box 01');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (article: ArtigoItem) => {
    setEditingArticle(article);
    setFormSubgroupId(article.subgrupoId);
    setFormCode(article.code);
    setFormName(article.name);
    setFormDescription(article.description || '');
    setFormUnit(article.unit);
    setFormMinStock(String(article.minStock));
    setFormInitialStock(String(article.currentStock));
    setFormCost(article.averageUnitCost ? String(article.averageUnitCost) : '');
    setFormWarehouse(article.locationDetails.warehouse || 'Almoxarifado');
    setFormAisle(article.locationDetails.aisle || 'Rua 01');
    setFormShelf(article.locationDetails.shelf || 'Estante 01');
    setFormLevel(article.locationDetails.level || 'Nível 1');
    setFormBin(article.locationDetails.bin || 'Box 01');
    setFormError('');
    setIsModalOpen(true);
  };

  // Update code when subgroup changes in creation
  const handleSubgroupChange = (newSubId: string) => {
    setFormSubgroupId(newSubId);
    if (!editingArticle) {
      const sub = database.subgroups.find(s => s.id === newSubId);
      if (sub) {
        setFormCode(generateNextArtigoCode(sub.code, database.articles));
      }
    }
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSubgroupId) {
      setFormError('Selecione o Subgrupo correspondente para o artigo.');
      return;
    }
    if (!formName.trim()) {
      setFormError('Informe o nome ou descrição do material.');
      return;
    }

    const locationDetails: LocationDetails = {
      warehouse: formWarehouse.trim() || 'Geral',
      aisle: formAisle.trim() || 'Rua 01',
      shelf: formShelf.trim() || 'Estante 01',
      level: formLevel.trim() || 'Nível 1',
      bin: formBin.trim() || 'Box 01',
      fullCode: generateFullLocationCode({
        warehouse: formWarehouse,
        aisle: formAisle,
        shelf: formShelf,
        level: formLevel,
        bin: formBin,
      }),
    };

    try {
      if (editingArticle) {
        await updateArtigo(editingArticle.id, {
          name: formName,
          description: formDescription,
          unit: formUnit,
          minStock: Number(formMinStock) || 0,
          averageUnitCost: formCost ? Number(formCost) : undefined,
          locationDetails,
        });
      } else {
        await addArtigo({
          subgrupoId: formSubgroupId,
          code: formCode,
          name: formName,
          description: formDescription,
          unit: formUnit,
          minStock: Number(formMinStock) || 0,
          initialStock: Number(formInitialStock) || 0,
          averageUnitCost: formCost ? Number(formCost) : undefined,
          locationDetails,
        });
      }
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Erro ao gravar artigo');
    }
  };

  const handleDeleteArticle = async (id: string, name: string) => {
    if (confirm(`Confirma a exclusão do artigo "${name}" e todo seu histórico de movimentações?`)) {
      await deleteArtigo(id);
    }
  };

  // Filtered Articles
  const filteredArticles = database.articles.filter(art => {
    // Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesName = art.name.toLowerCase().includes(term);
      const matchesCode = art.code.toLowerCase().includes(term);
      const matchesLoc = art.locationDetails.fullCode.toLowerCase().includes(term) ||
        art.locationDetails.warehouse.toLowerCase().includes(term);
      if (!matchesName && !matchesCode && !matchesLoc) return false;
    }

    // Tipo filter
    if (selectedTipoId !== 'all') {
      const sub = database.subgroups.find(s => s.id === art.subgrupoId);
      const grp = database.groups.find(g => g.id === sub?.grupoId);
      if (grp?.tipoId !== selectedTipoId) return false;
    }

    // Subgroup filter
    if (selectedSubgroupId !== 'all' && art.subgrupoId !== selectedSubgroupId) {
      return false;
    }

    // Stock Status filter
    if (stockStatusFilter === 'critical') {
      if (art.currentStock > art.minStock) return false;
    } else if (stockStatusFilter === 'zero') {
      if (art.currentStock > 0) return false;
    } else if (stockStatusFilter === 'normal') {
      if (art.currentStock <= art.minStock) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-[#E30613] text-white text-[11px] font-bold px-2 py-0.5 rounded uppercase">
              Catálogo de Materiais
            </span>
            <h2 className="text-lg font-bold text-neutral-900">
              Artigos e Especificações Técnicas
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Cadastro de itens de estoque com identificação de localização física detalhada e parâmetros de reposição.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => handleOpenAddModal()}
            disabled={database.subgroups.length === 0}
            className={`flex items-center space-x-1.5 px-4 py-2 rounded text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
              database.subgroups.length === 0
                ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                : 'bg-[#E30613] hover:bg-[#b8050f] text-white'
            }`}
            title={
              database.subgroups.length === 0
                ? 'Crie primeiro um Tipo, Grupo e Subgrupo no menu Hierarquia'
                : 'Cadastrar Novo Artigo'
            }
          >
            <Plus className="w-4 h-4" />
            <span>+ Novo Artigo</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-neutral-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por código, nome ou local..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-neutral-300 rounded focus:border-[#E30613] focus:ring-1 focus:ring-[#E30613] outline-none"
            />
          </div>

          {/* Filter by Tipo */}
          <div>
            <select
              value={selectedTipoId}
              onChange={e => {
                setSelectedTipoId(e.target.value);
                setSelectedSubgroupId('all');
              }}
              className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded focus:border-[#E30613] outline-none bg-white"
            >
              <option value="all">Todos os Tipos</option>
              {database.types.map(t => (
                <option key={t.id} value={t.id}>
                  {t.code} - {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Subgroup */}
          <div>
            <select
              value={selectedSubgroupId}
              onChange={e => setSelectedSubgroupId(e.target.value)}
              className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded focus:border-[#E30613] outline-none bg-white"
            >
              <option value="all">Todos os Subgrupos</option>
              {database.subgroups.map(s => (
                <option key={s.id} value={s.id}>
                  {s.code} - {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Status */}
          <div>
            <select
              value={stockStatusFilter}
              onChange={e => setStockStatusFilter(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded focus:border-[#E30613] outline-none bg-white font-medium"
            >
              <option value="all">Todos os Níveis de Estoque</option>
              <option value="normal">Estoque Regular (&gt; Mínimo)</option>
              <option value="critical">Estoque Crítico (≤ Mínimo)</option>
              <option value="zero">Zerados (Sem Estoque)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1 border-t border-neutral-100">
          <span>
            Exibindo <strong>{filteredArticles.length}</strong> de <strong>{database.articles.length}</strong> artigos
          </span>
          {(searchTerm || selectedTipoId !== 'all' || selectedSubgroupId !== 'all' || stockStatusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedTipoId('all');
                setSelectedSubgroupId('all');
                setStockStatusFilter('all');
              }}
              className="text-[#E30613] hover:underline font-semibold"
            >
              Limpar Filtros
            </button>
          )}
        </div>
      </div>

      {/* Tabela de Artigos */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
        {filteredArticles.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-neutral-800">
              Nenhum Artigo Encontrado
            </h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              {database.articles.length === 0
                ? 'O catálogo de artigos está vazio. Clique em "+ Novo Artigo" para cadastrar seu primeiro item.'
                : 'Nenhum artigo corresponde aos critérios de busca selecionados.'}
            </p>
            {database.subgroups.length > 0 && database.articles.length === 0 && (
              <button
                onClick={() => handleOpenAddModal()}
                className="mt-4 px-4 py-2 bg-[#E30613] hover:bg-[#b8050f] text-white text-xs font-bold uppercase tracking-wider rounded transition-all"
              >
                Cadastrar Primeiro Artigo
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-900 text-white font-bold uppercase text-[10px] tracking-wider border-b border-neutral-800">
                  <th className="p-3">Código</th>
                  <th className="p-3">Descrição do Artigo</th>
                  <th className="p-3">Família / Subgrupo</th>
                  <th className="p-3">Localização Física</th>
                  <th className="p-3 text-center">Saldo Atual</th>
                  <th className="p-3 text-center">Mínimo</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Ações Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredArticles.map(art => {
                  const sub = database.subgroups.find(s => s.id === art.subgrupoId);
                  const grp = database.groups.find(g => g.id === sub?.grupoId);
                  const tipo = database.types.find(t => t.id === grp?.tipoId);

                  const isCritical = art.currentStock <= art.minStock;
                  const isZero = art.currentStock === 0;

                  return (
                    <tr
                      key={art.id}
                      className="hover:bg-neutral-50/80 transition-colors group"
                    >
                      {/* Código */}
                      <td className="p-3 whitespace-nowrap font-mono font-bold text-neutral-900">
                        <span className="bg-neutral-100 text-neutral-800 px-2 py-0.5 rounded border border-neutral-200">
                          {art.code}
                        </span>
                      </td>

                      {/* Nome e Descrição */}
                      <td className="p-3">
                        <div className="font-semibold text-neutral-900 max-w-xs sm:max-w-sm line-clamp-1">
                          {art.name}
                        </div>
                        {art.description && (
                          <div className="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                            {art.description}
                          </div>
                        )}
                        {art.averageUnitCost && (
                          <div className="text-[10px] text-neutral-400 mt-0.5">
                            Custo Médio: {formatCurrencyBRL(art.averageUnitCost)} / {art.unit}
                          </div>
                        )}
                      </td>

                      {/* Família */}
                      <td className="p-3 text-[11px] text-neutral-600 whitespace-nowrap">
                        <div className="font-medium text-neutral-800">{sub?.name || '—'}</div>
                        <div className="text-[10px] text-neutral-400">
                          {tipo?.name} &gt; {grp?.name}
                        </div>
                      </td>

                      {/* Localização Física */}
                      <td className="p-3 whitespace-nowrap text-[11px]">
                        <div className="flex items-center space-x-1 font-semibold text-neutral-800">
                          <MapPin className="w-3.5 h-3.5 text-[#E30613]" />
                          <span>{art.locationDetails.warehouse}</span>
                        </div>
                        <div className="text-[10px] text-neutral-500 font-mono mt-0.5">
                          {art.locationDetails.aisle} • {art.locationDetails.shelf} ({art.locationDetails.bin || 'Vão'})
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

                      {/* Mínimo */}
                      <td className="p-3 text-center whitespace-nowrap text-neutral-500 font-mono text-xs">
                        {art.minStock} {art.unit}
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center whitespace-nowrap">
                        {isZero ? (
                          <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                            <span>Zerado</span>
                          </span>
                        ) : isCritical ? (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                            <span>Crítico</span>
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center space-x-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>Regular</span>
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="p-3 text-right whitespace-nowrap space-x-1">
                        <button
                          onClick={() => onOpenEntry(art.id)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[10px] transition-colors"
                          title="Registrar Entrada deste material"
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
                          title="Registrar Saída deste material"
                        >
                          - Saída
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(art)}
                          className="p-1 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded"
                          title="Editar Artigo e Localização"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteArticle(art.id, art.name)}
                          className="p-1 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Excluir Artigo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal para Cadastro / Edição de Artigo */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full border border-neutral-300 my-8 overflow-hidden">
            <div className="bg-neutral-900 text-white p-4 flex items-center justify-between border-b-2 border-[#E30613]">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-[#E30613]" />
                <h3 className="font-bold text-sm uppercase tracking-wide">
                  {editingArticle ? 'Editar Artigo de Estoque' : 'Cadastrar Novo Artigo (SENAI-SP)'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="p-6 space-y-5">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Seção 1: Classificação e Código */}
              <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-neutral-700 border-b border-neutral-200 pb-1">
                  1. Classificação Hierárquica e Código Único
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                      Subgrupo Correspondente *
                    </label>
                    <select
                      value={formSubgroupId}
                      onChange={e => handleSubgroupChange(e.target.value)}
                      disabled={!!editingArticle}
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded bg-white focus:border-[#E30613] outline-none"
                      required
                    >
                      {database.subgroups.length === 0 ? (
                        <option value="">Nenhum subgrupo cadastrado</option>
                      ) : (
                        database.subgroups.map(s => {
                          const grp = database.groups.find(g => g.id === s.grupoId);
                          return (
                            <option key={s.id} value={s.id}>
                              {s.code} - {s.name} ({grp?.name})
                            </option>
                          );
                        })
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                      Código Único do Artigo *
                    </label>
                    <input
                      type="text"
                      value={formCode}
                      onChange={e => setFormCode(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono font-bold bg-neutral-100 border border-neutral-300 rounded focus:border-[#E30613] outline-none"
                      required
                    />
                    <span className="text-[10px] text-neutral-400 mt-0.5 block">
                      Padrão Automático: ART-XX-YY-ZZ-WWW
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Nome / Descrição Principal do Material *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Barra Redonda Aço SAE 1020 Ø 1/2' x 3000mm"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded focus:border-[#E30613] focus:ring-1 focus:ring-[#E30613] outline-none font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Especificação Técnica / Observações
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Normas ABNT, acabamento, tolerância, fornecedor de referência..."
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-neutral-300 rounded focus:border-[#E30613] outline-none"
                  />
                </div>
              </div>

              {/* Seção 2: Unidade e Controle de Estoque */}
              <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-neutral-700 border-b border-neutral-200 pb-1">
                  2. Parâmetros de Estoque e Unidade
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                      Unidade *
                    </label>
                    <select
                      value={formUnit}
                      onChange={e => setFormUnit(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded bg-white focus:border-[#E30613] outline-none font-bold"
                    >
                      {COMMON_UNITS.map(u => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                      Estoque Mínimo *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formMinStock}
                      onChange={e => setFormMinStock(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded focus:border-[#E30613] outline-none"
                      required
                    />
                  </div>

                  {!editingArticle && (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                        Estoque Inicial
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formInitialStock}
                        onChange={e => setFormInitialStock(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-neutral-300 rounded focus:border-[#E30613] outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                      Custo Unit. (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={formCost}
                      onChange={e => setFormCost(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded focus:border-[#E30613] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Seção 3: Identificação e Registro de Localização de Armazenamento */}
              <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 space-y-4">
                <div className="flex items-center justify-between border-b border-neutral-200 pb-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-neutral-700 flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#E30613]" />
                    <span>3. Localização Física de Armazenamento</span>
                  </h4>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    {generateFullLocationCode({
                      warehouse: formWarehouse,
                      aisle: formAisle,
                      shelf: formShelf,
                      level: formLevel,
                      bin: formBin,
                    })}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                      Galpão / Prédio / Setor *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Almoxarifado Central"
                      value={formWarehouse}
                      onChange={e => setFormWarehouse(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded focus:border-[#E30613] outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                      Corredor / Rua *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Rua 02 / Corredor C"
                      value={formAisle}
                      onChange={e => setFormAisle(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded focus:border-[#E30613] outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                      Estante / Prateleira / Rack *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Estante 04"
                      value={formShelf}
                      onChange={e => setFormShelf(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded focus:border-[#E30613] outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                      Nível / Altura
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Nível 2 / Prateleira Média"
                      value={formLevel}
                      onChange={e => setFormLevel(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded focus:border-[#E30613] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 mb-1">
                      Gaveta / Box / Vão
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Gaveta G14 / Box B"
                      value={formBin}
                      onChange={e => setFormBin(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-neutral-300 rounded focus:border-[#E30613] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Botões do Rodapé */}
              <div className="pt-2 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-semibold rounded hover:bg-neutral-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#E30613] hover:bg-[#b8050f] text-white text-xs font-bold uppercase tracking-wider rounded transition-all shadow-md"
                >
                  {editingArticle ? 'Salvar Alterações' : 'Concluir Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
