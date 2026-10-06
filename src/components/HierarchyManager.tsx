import React, { useState } from 'react';
import {
  FolderTree,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Trash2,
  Edit2,
  Package,
  Plus,
  Layers,
  Search,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';
import {
  generateNextGrupoCode,
  generateNextSubgrupoCode,
  generateNextTipoCode
} from '../utils/codeGenerator';

interface HierarchyManagerProps {
  onSelectSubgroupForArticle?: (subgroupId: string) => void;
}

export const HierarchyManager: React.FC<HierarchyManagerProps> = ({
  onSelectSubgroupForArticle,
}) => {
  const {
    database,
    addTipo,
    updateTipo,
    deleteTipo,
    addGrupo,
    updateGrupo,
    deleteGrupo,
    addSubgrupo,
    updateSubgrupo,
    deleteSubgrupo,
  } = useInventory();

  // Search query
  const [searchTerm, setSearchTerm] = useState('');

  // Expand state
  const [expandedTypes, setExpandedTypes] = useState<Record<string, boolean>>({});
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Modals / forms state
  const [modalMode, setModalMode] = useState<
    | { type: 'TIPO'; parentId?: string; editId?: string }
    | { type: 'GRUPO'; parentId: string; editId?: string }
    | { type: 'SUBGRUPO'; parentId: string; editId?: string }
    | null
  >(null);

  const [formName, setFormName] = useState('');
  const [formCode, setFormCode] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const toggleType = (id: string) => {
    setExpandedTypes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleGroup = (id: string) => {
    setExpandedGroups(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleOpenAddTipo = () => {
    const nextCode = generateNextTipoCode(database.types);
    setFormCode(nextCode);
    setFormName('');
    setFormDescription('');
    setErrorMessage('');
    setModalMode({ type: 'TIPO' });
  };

  const handleOpenAddGrupo = (tipoId: string) => {
    const parentTipo = database.types.find(t => t.id === tipoId);
    const nextCode = generateNextGrupoCode(parentTipo?.code || 'TIP-01', database.groups);
    setFormCode(nextCode);
    setFormName('');
    setFormDescription('');
    setErrorMessage('');
    setModalMode({ type: 'GRUPO', parentId: tipoId });
  };

  const handleOpenAddSubgrupo = (grupoId: string) => {
    const parentGrupo = database.groups.find(g => g.id === grupoId);
    const nextCode = generateNextSubgrupoCode(parentGrupo?.code || 'GRP-01-01', database.subgroups);
    setFormCode(nextCode);
    setFormName('');
    setFormDescription('');
    setErrorMessage('');
    setModalMode({ type: 'SUBGRUPO', parentId: grupoId });
  };

  const handleOpenEdit = (level: 'TIPO' | 'GRUPO' | 'SUBGRUPO', item: any) => {
    setFormCode(item.code);
    setFormName(item.name);
    setFormDescription(item.description || '');
    setErrorMessage('');
    if (level === 'TIPO') {
      setModalMode({ type: 'TIPO', editId: item.id });
    } else if (level === 'GRUPO') {
      setModalMode({ type: 'GRUPO', parentId: item.tipoId, editId: item.id });
    } else {
      setModalMode({ type: 'SUBGRUPO', parentId: item.grupoId, editId: item.id });
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMessage('Por favor, informe o nome para este nível hierárquico.');
      return;
    }

    try {
      if (modalMode?.type === 'TIPO') {
        if (modalMode.editId) {
          await updateTipo(modalMode.editId, {
            name: formName,
            description: formDescription,
          });
        } else {
          const created = await addTipo({
            code: formCode,
            name: formName,
            description: formDescription,
          });
          setExpandedTypes(prev => ({ ...prev, [created.id]: true }));
        }
      } else if (modalMode?.type === 'GRUPO') {
        if (modalMode.editId) {
          await updateGrupo(modalMode.editId, {
            name: formName,
            description: formDescription,
          });
        } else {
          const created = await addGrupo({
            tipoId: modalMode.parentId,
            code: formCode,
            name: formName,
            description: formDescription,
          });
          setExpandedGroups(prev => ({ ...prev, [created.id]: true }));
          setExpandedTypes(prev => ({ ...prev, [modalMode.parentId]: true }));
        }
      } else if (modalMode?.type === 'SUBGRUPO') {
        if (modalMode.editId) {
          await updateSubgrupo(modalMode.editId, {
            name: formName,
            description: formDescription,
          });
        } else {
          await addSubgrupo({
            grupoId: modalMode.parentId,
            code: formCode,
            name: formName,
            description: formDescription,
          });
          setExpandedGroups(prev => ({ ...prev, [modalMode.parentId]: true }));
        }
      }
      setModalMode(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar nível hierárquico');
    }
  };

  const handleDelete = async (level: 'TIPO' | 'GRUPO' | 'SUBGRUPO', id: string) => {
    if (level === 'TIPO') {
      const hasChildren = database.groups.some(g => g.tipoId === id);
      if (hasChildren) {
        alert('Não é possível excluir este Tipo pois existem Grupos vinculados a ele.');
        return;
      }
      if (confirm('Confirma a exclusão deste Tipo?')) {
        await deleteTipo(id);
      }
    } else if (level === 'GRUPO') {
      const hasChildren = database.subgroups.some(s => s.grupoId === id);
      if (hasChildren) {
        alert('Não é possível excluir este Grupo pois existem Subgrupos vinculados a ele.');
        return;
      }
      if (confirm('Confirma a exclusão deste Grupo?')) {
        await deleteGrupo(id);
      }
    } else if (level === 'SUBGRUPO') {
      const hasChildren = database.articles.some(a => a.subgrupoId === id);
      if (hasChildren) {
        alert('Não é possível excluir este Subgrupo pois existem Artigos cadastrados nele.');
        return;
      }
      if (confirm('Confirma a exclusão deste Subgrupo?')) {
        await deleteSubgrupo(id);
      }
    }
  };

  // Filter types by search
  const filteredTypes = database.types.filter(t => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const matchesTipo = t.name.toLowerCase().includes(term) || t.code.toLowerCase().includes(term);
    const matchesGrupo = database.groups.some(
      g => g.tipoId === t.id && (g.name.toLowerCase().includes(term) || g.code.toLowerCase().includes(term))
    );
    const matchesSub = database.subgroups.some(s => {
      const parentGroup = database.groups.find(g => g.id === s.grupoId);
      return (
        parentGroup?.tipoId === t.id &&
        (s.name.toLowerCase().includes(term) || s.code.toLowerCase().includes(term))
      );
    });
    return matchesTipo || matchesGrupo || matchesSub;
  });

  return (
    <div className="space-y-6">
      {/* Header com Descrição e Ação */}
      <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-[#E30613] text-white text-[11px] font-bold px-2 py-0.5 rounded uppercase">
              Classificação SENAI
            </span>
            <h2 className="text-lg font-bold text-neutral-900">
              Estrutura Hierárquica de Materiais
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Organização oficial em 4 níveis: <strong>Tipo → Grupo → Subgrupo → Artigo</strong> com códigos automáticos e padronizados.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar na hierarquia..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs border border-neutral-300 rounded focus:border-[#E30613] focus:ring-1 focus:ring-[#E30613] outline-none w-56"
            />
          </div>
          <button
            onClick={handleOpenAddTipo}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-[#E30613] hover:bg-[#b8050f] text-white text-xs font-bold uppercase tracking-wider rounded transition-all shadow-sm"
          >
            <FolderPlus className="w-4 h-4" />
            <span>+ Novo Tipo</span>
          </button>
        </div>
      </div>

      {/* Árvore Hierárquica */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-neutral-900 text-white flex items-center justify-between text-xs font-bold uppercase tracking-wider">
          <div className="flex items-center space-x-2">
            <FolderTree className="w-4 h-4 text-[#E30613]" />
            <span>Árvore de Categorias e Famílias ({database.types.length} Tipos)</span>
          </div>
          <div className="text-[11px] text-neutral-400 font-normal">
            Clique no ícone para expandir/recolher
          </div>
        </div>

        <div className="p-4">
          {database.types.length === 0 ? (
            <div className="py-12 text-center">
              <FolderTree className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-neutral-800">
                Nenhum Tipo Hierárquico Cadastrado
              </h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
                Inicie criando o primeiro Tipo (exemplo: "Matéria-Prima", "Ferramental", "Componentes Elétricos").
              </p>
              <button
                onClick={handleOpenAddTipo}
                className="mt-4 px-4 py-2 bg-[#E30613] hover:bg-[#b8050f] text-white text-xs font-bold uppercase tracking-wider rounded transition-all"
              >
                Cadastrar Primeiro Tipo
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTypes.map(tipo => {
                const isTypeExpanded = expandedTypes[tipo.id] ?? true;
                const groupsForTipo = database.groups.filter(g => g.tipoId === tipo.id);

                return (
                  <div
                    key={tipo.id}
                    className="border border-neutral-200 rounded-lg overflow-hidden bg-white shadow-xs"
                  >
                    {/* Linha do TIPO (Nível 1) */}
                    <div className="bg-neutral-50 p-3 flex items-center justify-between border-b border-neutral-200 hover:bg-neutral-100/70 transition-colors">
                      <div className="flex items-center space-x-2.5">
                        <button
                          onClick={() => toggleType(tipo.id)}
                          className="p-1 hover:bg-neutral-200 rounded text-neutral-600 transition-colors"
                        >
                          {isTypeExpanded ? (
                            <ChevronDown className="w-4 h-4 text-neutral-700" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-neutral-700" />
                          )}
                        </button>
                        <span className="font-mono text-xs font-black bg-[#E30613] text-white px-2 py-0.5 rounded">
                          {tipo.code}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-neutral-900">
                            {tipo.name}
                          </span>
                          {tipo.description && (
                            <span className="text-[11px] text-neutral-500 ml-2 hidden sm:inline">
                              — {tipo.description}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenAddGrupo(tipo.id)}
                          className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 text-white text-[11px] font-semibold rounded flex items-center space-x-1"
                          title="Adicionar Grupo vinculado a este Tipo"
                        >
                          <Plus className="w-3 h-3 text-[#E30613]" />
                          <span>+ Grupo</span>
                        </button>
                        <button
                          onClick={() => handleOpenEdit('TIPO', tipo)}
                          className="p-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200 rounded"
                          title="Editar Tipo"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete('TIPO', tipo.id)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Excluir Tipo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* GRUPOS do Tipo (Nível 2) */}
                    {isTypeExpanded && (
                      <div className="p-3 pl-6 sm:pl-8 space-y-2 bg-neutral-50/30">
                        {groupsForTipo.length === 0 ? (
                          <div className="text-[11px] text-neutral-400 italic py-2 pl-4 border-l-2 border-neutral-300">
                            Nenhum grupo cadastrado neste tipo. Clique em "+ Grupo".
                          </div>
                        ) : (
                          groupsForTipo.map(grupo => {
                            const isGroupExpanded = expandedGroups[grupo.id] ?? true;
                            const subgroupsForGroup = database.subgroups.filter(
                              s => s.grupoId === grupo.id
                            );

                            return (
                              <div
                                key={grupo.id}
                                className="border border-neutral-200 rounded bg-white shadow-2xs overflow-hidden"
                              >
                                {/* Linha do GRUPO */}
                                <div className="p-2.5 flex items-center justify-between bg-neutral-100/50 hover:bg-neutral-100 transition-colors">
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => toggleGroup(grupo.id)}
                                      className="p-0.5 hover:bg-neutral-200 rounded text-neutral-600"
                                    >
                                      {isGroupExpanded ? (
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      ) : (
                                        <ChevronRight className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                    <span className="font-mono text-[11px] font-bold bg-neutral-800 text-white px-1.5 py-0.5 rounded">
                                      {grupo.code}
                                    </span>
                                    <span className="text-xs font-semibold text-neutral-800">
                                      {grupo.name}
                                    </span>
                                    {grupo.description && (
                                      <span className="text-[10px] text-neutral-500 hidden md:inline">
                                        ({grupo.description})
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center space-x-1.5">
                                    <button
                                      onClick={() => handleOpenAddSubgrupo(grupo.id)}
                                      className="px-2 py-0.5 bg-neutral-800 hover:bg-neutral-700 text-white text-[10px] font-medium rounded flex items-center space-x-1"
                                      title="Adicionar Subgrupo vinculado a este Grupo"
                                    >
                                      <Plus className="w-3 h-3 text-red-400" />
                                      <span>+ Subgrupo</span>
                                    </button>
                                    <button
                                      onClick={() => handleOpenEdit('GRUPO', grupo)}
                                      className="p-1 text-neutral-400 hover:text-neutral-700 rounded"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete('GRUPO', grupo.id)}
                                      className="p-1 text-neutral-400 hover:text-red-600 rounded"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>

                                {/* SUBGRUPOS (Nível 3) */}
                                {isGroupExpanded && (
                                  <div className="p-2.5 pl-6 space-y-1.5 border-t border-neutral-100">
                                    {subgroupsForGroup.length === 0 ? (
                                      <div className="text-[10px] text-neutral-400 italic py-1 pl-2 border-l border-neutral-200">
                                        Nenhum subgrupo cadastrado. Clique em "+ Subgrupo".
                                      </div>
                                    ) : (
                                      subgroupsForGroup.map(sub => {
                                        const articlesCount = database.articles.filter(
                                          a => a.subgrupoId === sub.id
                                        ).length;

                                        return (
                                          <div
                                            key={sub.id}
                                            className="p-2 bg-neutral-50 border border-neutral-200 rounded flex items-center justify-between text-xs hover:border-neutral-300"
                                          >
                                            <div className="flex items-center space-x-2">
                                              <span className="font-mono text-[10px] font-bold bg-neutral-200 text-neutral-800 px-1.5 py-0.5 rounded">
                                                {sub.code}
                                              </span>
                                              <span className="font-medium text-neutral-900">
                                                {sub.name}
                                              </span>
                                              <span className="text-[10px] bg-red-50 text-[#E30613] font-bold px-1.5 py-0.5 rounded border border-red-100">
                                                {articlesCount} Artigo(s)
                                              </span>
                                            </div>

                                            <div className="flex items-center space-x-1">
                                              {onSelectSubgroupForArticle && (
                                                <button
                                                  onClick={() => onSelectSubgroupForArticle(sub.id)}
                                                  className="px-2 py-0.5 bg-[#E30613] hover:bg-[#b8050f] text-white text-[10px] font-bold rounded flex items-center space-x-1"
                                                >
                                                  <Package className="w-3 h-3" />
                                                  <span>+ Artigo</span>
                                                </button>
                                              )}
                                              <button
                                                onClick={() => handleOpenEdit('SUBGRUPO', sub)}
                                                className="p-1 text-neutral-400 hover:text-neutral-700 rounded"
                                              >
                                                <Edit2 className="w-3 h-3" />
                                              </button>
                                              <button
                                                onClick={() => handleDelete('SUBGRUPO', sub.id)}
                                                className="p-1 text-neutral-400 hover:text-red-600 rounded"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            </div>
                                          </div>
                                        );
                                      })
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal para Adicionar / Editar Nível Hierárquico */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full border border-neutral-300 overflow-hidden">
            <div className="bg-neutral-900 text-white p-4 flex items-center justify-between border-b-2 border-[#E30613]">
              <div className="flex items-center space-x-2">
                <FolderPlus className="w-5 h-5 text-[#E30613]" />
                <h3 className="font-bold text-sm uppercase tracking-wide">
                  {modalMode.editId ? 'Editar' : 'Novo'} {modalMode.type}
                </h3>
              </div>
              <button
                onClick={() => setModalMode(null)}
                className="text-neutral-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Código Único (Gerado Automaticamente)
                </label>
                <input
                  type="text"
                  value={formCode}
                  onChange={e => setFormCode(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono font-bold bg-neutral-100 border border-neutral-300 rounded focus:border-[#E30613] outline-none"
                  required
                />
                <span className="text-[10px] text-neutral-500 mt-1 block">
                  Padrão SENAI: {modalMode.type === 'TIPO' ? 'TIP-XX' : modalMode.type === 'GRUPO' ? 'GRP-XX-YY' : 'SUB-XX-YY-ZZ'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Nome do {modalMode.type} *
                </label>
                <input
                  type="text"
                  placeholder={
                    modalMode.type === 'TIPO'
                      ? 'Ex: Matéria-Prima Metálica'
                      : modalMode.type === 'GRUPO'
                      ? 'Ex: Aços Carbono e Ferrosos'
                      : 'Ex: Barras Redondas Trefiladas'
                  }
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded focus:border-[#E30613] focus:ring-1 focus:ring-[#E30613] outline-none"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Descrição / Observações Técnicas
                </label>
                <textarea
                  rows={2}
                  placeholder="Especificações complementares ou diretrizes para a oficina..."
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-neutral-300 rounded focus:border-[#E30613] outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalMode(null)}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs font-semibold rounded hover:bg-neutral-100 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E30613] hover:bg-[#b8050f] text-white text-xs font-bold uppercase tracking-wider rounded transition-all shadow-sm"
                >
                  Salvar {modalMode.type}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
