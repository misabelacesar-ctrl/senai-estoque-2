import React, { useState } from 'react';
import {
  MapPin,
  Building,
  Plus,
  Trash2,
  Package,
  Boxes,
  Compass,
  CheckCircle2
} from 'lucide-react';
import { useInventory } from '../context/InventoryContext';

export const LocationsManager: React.FC = () => {
  const { database, addLocationPreset, deleteLocationPreset } = useInventory();

  // Extract unique locations from existing articles
  const locationsMap = new Map<string, { count: number; warehouse: string; aisle: string; shelf: string; bin?: string }>();

  database.articles.forEach(art => {
    const key = art.locationDetails.fullCode;
    if (!locationsMap.has(key)) {
      locationsMap.set(key, {
        count: 1,
        warehouse: art.locationDetails.warehouse,
        aisle: art.locationDetails.aisle,
        shelf: art.locationDetails.shelf,
        bin: art.locationDetails.bin,
      });
    } else {
      const entry = locationsMap.get(key)!;
      entry.count += 1;
    }
  });

  const [warehouse, setWarehouse] = useState('');
  const [aisle, setAisle] = useState('');
  const [shelf, setShelf] = useState('');
  const [description, setDescription] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddPreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warehouse.trim()) return;

    await addLocationPreset({
      warehouse: warehouse.trim(),
      aisle: aisle.trim() || 'Rua 01',
      shelf: shelf.trim() || 'Estante 01',
      description: description.trim(),
    });

    setWarehouse('');
    setAisle('');
    setShelf('');
    setDescription('');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-[#E30613] text-white text-[11px] font-bold px-2 py-0.5 rounded uppercase">
              Mapeamento Físico
            </span>
            <h2 className="text-lg font-bold text-neutral-900">
              Galpões, Oficinas e Endereçamento de Estoque
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Gestão de prédios, corredores, estantes e gavetas para localização rápida dos materiais no SENAI.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#E30613] hover:bg-[#b8050f] text-white text-xs font-bold uppercase tracking-wider rounded transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>+ Nova Área / Galpão</span>
        </button>
      </div>

      {/* Formulário para Nova Localização Pré-definida */}
      {isAdding && (
        <div className="bg-white p-5 rounded-lg border border-neutral-200 shadow-sm">
          <h3 className="text-xs font-black uppercase tracking-wider text-neutral-800 mb-3 flex items-center space-x-2">
            <Building className="w-4 h-4 text-[#E30613]" />
            <span>Cadastrar Área de Armazenamento</span>
          </h3>

          <form onSubmit={handleAddPreset} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                Galpão / Prédio / Oficina *
              </label>
              <input
                type="text"
                placeholder="Ex: Galpão CNC / Soldagem"
                value={warehouse}
                onChange={e => setWarehouse(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded focus:border-[#E30613] outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                Corredor / Rua
              </label>
              <input
                type="text"
                placeholder="Ex: Rua 02 / Corredor A"
                value={aisle}
                onChange={e => setAisle(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded focus:border-[#E30613] outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-neutral-600 mb-1">
                Estante / Rack
              </label>
              <input
                type="text"
                placeholder="Ex: Estante 05 / Rack Vertical"
                value={shelf}
                onChange={e => setShelf(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-neutral-300 rounded focus:border-[#E30613] outline-none"
              />
            </div>

            <div className="flex items-end space-x-2">
              <button
                type="submit"
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors w-full"
              >
                Salvar Área
              </button>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-3 py-2 border border-neutral-300 text-neutral-600 text-xs rounded hover:bg-neutral-100"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid de Localizações Atualmente em Uso */}
      <div className="bg-white rounded-lg border border-neutral-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-neutral-900 text-white flex items-center justify-between text-xs font-bold uppercase tracking-wider">
          <div className="flex items-center space-x-2">
            <Compass className="w-4 h-4 text-[#E30613]" />
            <span>Endereços Físicos Ativos com Artigos Vinculados</span>
          </div>
          <span>{locationsMap.size} Posições Ativas</span>
        </div>

        <div className="p-5">
          {locationsMap.size === 0 ? (
            <div className="py-10 text-center text-neutral-500">
              <MapPin className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <p className="text-xs font-semibold">Nenhuma localização física com materiais no momento.</p>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Ao cadastrar artigos, a localização física (Galpão, Corredor, Estante e Box) é mapeada automaticamente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from(locationsMap.entries()).map(([code, loc]) => (
                <div
                  key={code}
                  className="p-4 border border-neutral-200 rounded-lg bg-neutral-50/50 hover:border-neutral-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold bg-[#E30613] text-white px-1.5 py-0.5 rounded">
                        {code}
                      </span>
                      <span className="text-[11px] font-bold text-neutral-700 bg-neutral-200 px-2 py-0.5 rounded">
                        {loc.count} material(is)
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-neutral-900 mt-2.5 flex items-center space-x-1.5">
                      <Building className="w-4 h-4 text-neutral-600" />
                      <span>{loc.warehouse}</span>
                    </h4>

                    <div className="mt-2 text-xs text-neutral-600 space-y-0.5 font-medium">
                      <div>Rua / Corredor: <strong>{loc.aisle}</strong></div>
                      <div>Estante / Prateleira: <strong>{loc.shelf}</strong></div>
                      {loc.bin && <div>Gaveta / Box: <strong>{loc.bin}</strong></div>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
