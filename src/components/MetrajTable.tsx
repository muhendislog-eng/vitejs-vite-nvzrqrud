import React, { useMemo, useState } from 'react';
import {
  Layers,
  Hammer,
  DoorOpen,
  Building,
  Plus,
  RefreshCw,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

type MetrajItem = {
  id: number | string;
  pos: string;
  desc: string;
  unit: string;
  price: number;
  quantity: number;
  category?: string;
  isManual?: boolean; // ✅ manuel poz flag'i
  [key: string]: any;
};

const MetrajTable = ({
  data,
  onUpdateQuantity,
  onOpenSelector,
  onAddNewItem,

  // ✅ yeni: manuel poz güncelle/sil
  onUpdateManualItem,
  onDeleteManualItem,
}: {
  data: MetrajItem[];
  onUpdateQuantity: (id: number | string, quantity: number) => void;
  onOpenSelector: (item: MetrajItem) => void;
  onAddNewItem: (category: string) => void;

  onUpdateManualItem: (id: number | string, patch: Partial<MetrajItem>) => void;
  onDeleteManualItem: (id: number | string) => void;
}) => {
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [draft, setDraft] = useState<{ pos: string; desc: string; unit: string; price: string }>({
    pos: '',
    desc: '',
    unit: '',
    price: '',
  });

  // 1) Verileri kategorilere göre grupla
  const groupedData = useMemo(() => {
    return data.reduce((acc: Record<string, MetrajItem[]>, item) => {
      const cat = item.category || 'Genel';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    }, {});
  }, [data]);

  const beginEdit = (item: MetrajItem) => {
    setEditingId(item.id);
    setDraft({
      pos: item.pos ?? '',
      desc: item.desc ?? '',
      unit: item.unit ?? '',
      price: String(item.price ?? 0),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({ pos: '', desc: '', unit: '', price: '' });
  };

  const saveEdit = (item: MetrajItem) => {
    const priceNumber = Number(String(draft.price).replace(',', '.'));
    if (!draft.pos.trim()) return alert('Poz No boş olamaz.');
    if (!draft.desc.trim()) return alert('Tanım boş olamaz.');
    if (!draft.unit.trim()) return alert('Birim boş olamaz.');
    if (Number.isNaN(priceNumber) || priceNumber < 0) return alert('Birim fiyat geçersiz.');

    onUpdateManualItem(item.id, {
      pos: draft.pos.trim(),
      desc: draft.desc.trim(),
      unit: draft.unit.trim(),
      price: priceNumber,
    });

    cancelEdit();
  };

  const handleDelete = (item: MetrajItem) => {
    const ok = confirm(`"${item.pos}" numaralı manuel poz silinsin mi?`);
    if (!ok) return;
    onDeleteManualItem(item.id);
    if (editingId === item.id) cancelEdit();
  };

  return (
    <div className="space-y-8 w-full animate-in fade-in duration-500">
      {Object.keys(groupedData).map((category) => {
        const items = groupedData[category];

        const categoryTotal = items.reduce(
          (sum, it) => sum + (it.price * it.quantity),
          0
        );

        let CategoryIcon: any = Layers;
        if (category.includes('Hafriyat')) CategoryIcon = Hammer;
        if (category.includes('Kapı')) CategoryIcon = DoorOpen;
        if (category.includes('Beton')) CategoryIcon = Building;

        return (
          <div
            key={category}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-shadow hover:shadow-md w-full"
          >
            {/* Kategori başlığı */}
            <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-lg border border-slate-200 shadow-sm">
                  <CategoryIcon className="w-5 h-5 text-slate-700" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg">{category}</h3>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => onAddNewItem(category)}
                  className="flex items-center px-4 py-2 bg-white text-orange-600 text-xs font-bold rounded-lg hover:bg-orange-50 transition-all border border-orange-200 shadow-sm hover:shadow active:scale-95"
                >
                  <Plus className="w-3 h-3 mr-1.5" />
                  Poz Ekle
                </button>

                <div className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm shadow-md hidden sm:block">
                  Ara Toplam:{' '}
                  <span className="font-bold text-orange-400 ml-2">
                    {formatCurrency(categoryTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Tablo */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left table-fixed min-w-[1100px]">
                <thead className="bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-300">
                  <tr>
                    <th className="px-6 py-4 w-28 sticky left-0 bg-slate-200 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">Poz No</th>
                    <th className="px-6 py-4 w-auto min-w-[320px]">İmalat Adı</th>
                    <th className="px-6 py-4 w-24 text-center">Birim</th>
                    <th className="px-6 py-4 w-32 text-right">Birim Fiyat</th>
                    <th className="px-6 py-4 w-40 text-center">İşlem</th>
                    <th className="px-6 py-4 w-28 text-center">Miktar</th>
                    <th className="px-6 py-4 w-36 text-right">Tutar</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const isEditing = editingId === item.id;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                        {/* Poz No */}
                        <td className="px-6 py-4 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-slate-100">
                          {isEditing ? (
                            <input
                              value={draft.pos}
                              onChange={(e) => setDraft((d) => ({ ...d, pos: e.target.value }))}
                              className="w-full px-2 py-1 text-xs font-mono font-bold border-2 border-indigo-200 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                              placeholder="Poz No"
                            />
                          ) : (
                            <span className="font-mono text-xs font-bold text-slate-600 bg-slate-200/50 px-2 py-1 rounded">
                              {item.pos}
                            </span>
                          )}
                        </td>

                        {/* Tanım */}
                        <td className="px-6 py-4 whitespace-normal min-w-[320px]">
                          {isEditing ? (
                            <textarea
                              value={draft.desc}
                              onChange={(e) => setDraft((d) => ({ ...d, desc: e.target.value }))}
                              className="w-full px-3 py-2 text-sm border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                              rows={2}
                              placeholder="Tanım"
                            />
                          ) : (
                            <div className="text-sm font-medium text-slate-700 leading-relaxed">
                              {item.desc}
                            </div>
                          )}
                        </td>

                        {/* Birim */}
                        <td className="px-6 py-4 text-center">
                          {isEditing ? (
                            <input
                              value={draft.unit}
                              onChange={(e) => setDraft((d) => ({ ...d, unit: e.target.value }))}
                              className="w-full px-3 py-2 text-sm text-center font-bold border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                              placeholder="Birim"
                            />
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                              {item.unit}
                            </span>
                          )}
                        </td>

                        {/* Birim Fiyat */}
                        <td className="px-6 py-4 text-right">
                          {isEditing ? (
                            <input
                              value={draft.price}
                              onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
                              className="w-full px-3 py-2 text-sm text-right font-mono font-bold border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                              placeholder="0"
                            />
                          ) : (
                            <span className="font-mono text-sm text-slate-600 font-medium">
                              {formatCurrency(item.price)}
                            </span>
                          )}
                        </td>

                        {/* İşlem */}
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* Değiştir: her zaman */}
                            <button
                              type="button"
                              onClick={() => onOpenSelector(item)}
                              className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all active:scale-95"
                              title="Pozu Değiştir"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>

                            {/* ✅ Manuel ise: Edit + Sil */}
                            {item.isManual && (
                              <>
                                {!isEditing ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => beginEdit(item)}
                                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all active:scale-95"
                                      title="Manuel pozu düzenle"
                                    >
                                      <Pencil className="w-4 h-4" />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDelete(item)}
                                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all active:scale-95"
                                      title="Manuel pozu sil"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => saveEdit(item)}
                                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all active:scale-95"
                                      title="Kaydet"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={cancelEdit}
                                      className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-all active:scale-95"
                                      title="İptal"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </td>

                        {/* Miktar */}
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity || ''}
                            onChange={(e) => onUpdateQuantity(item.id, Number(e.target.value) || 0)}
                            className="w-full px-3 py-2 text-sm text-center font-bold text-slate-800 bg-white border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm focus:shadow-md"
                            placeholder="0"
                          />
                        </td>

                        {/* Tutar */}
                        <td className="px-6 py-4 text-right">
                          <span className="font-bold text-slate-900">
                            {formatCurrency(item.price * item.quantity)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        );
      })}
    </div>
  );
};

export default MetrajTable;
