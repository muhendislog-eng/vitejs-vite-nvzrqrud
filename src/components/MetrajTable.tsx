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

/* ✅ Sabit birim listesi (manuel pozlar için) */
const UNIT_OPTIONS = ['m²', 'm³', 'mt', 'Adet', 'Takım', 'Adet'];

type MetrajItem = {
  id: number | string;
  pos: string;
  desc: string;
  unit: string;
  price: number;
  quantity: number;
  category?: string;
  isManual?: boolean;
};

const MetrajTable = ({
  data,
  onUpdateQuantity,
  onOpenSelector,
  onAddNewItem,
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
  const [draft, setDraft] = useState({
    pos: '',
    desc: '',
    unit: UNIT_OPTIONS[0],
    price: '',
  });

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
      pos: item.pos,
      desc: item.desc,
      unit: UNIT_OPTIONS.includes(item.unit) ? item.unit : UNIT_OPTIONS[0],
      price: String(item.price),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (item: MetrajItem) => {
    const priceNumber = Number(draft.price.replace(',', '.'));

    if (!draft.pos.trim()) return alert('Poz No boş olamaz.');
    if (!draft.desc.trim()) return alert('Tanım boş olamaz.');
    if (!UNIT_OPTIONS.includes(draft.unit)) return alert('Geçersiz birim.');
    if (isNaN(priceNumber) || priceNumber < 0) return alert('Birim fiyat geçersiz.');

    onUpdateManualItem(item.id, {
      pos: draft.pos.trim(),
      desc: draft.desc.trim(),
      unit: draft.unit,
      price: priceNumber,
    });

    cancelEdit();
  };

  const handleDelete = (item: MetrajItem) => {
    if (!confirm(`"${item.pos}" numaralı manuel poz silinsin mi?`)) return;
    onDeleteManualItem(item.id);
    cancelEdit();
  };

  return (
    <div className="space-y-8 w-full">
      {Object.keys(groupedData).map((category) => {
        const items = groupedData[category];

        let Icon: any = Layers;
        if (category.includes('Hafriyat')) Icon = Hammer;
        if (category.includes('Kapı')) Icon = DoorOpen;
        if (category.includes('Beton')) Icon = Building;

        return (
          <div key={category} className="bg-white rounded-2xl border shadow-sm">
            {/* Başlık */}
            <div className="bg-slate-100 px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-slate-700" />
                <h3 className="font-bold">{category}</h3>
              </div>
              <button
                onClick={() => onAddNewItem(category)}
                className="px-4 py-2 text-xs font-bold text-orange-600 bg-white border rounded-lg"
              >
                <Plus className="inline w-3 h-3 mr-1" />
                Poz Ekle
              </button>
            </div>

            {/* Tablo */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead className="bg-slate-200 text-xs font-bold text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Poz</th>
                    <th className="px-4 py-3">Tanım</th>
                    <th className="px-4 py-3 text-center">Birim</th>
                    <th className="px-4 py-3 text-right">Birim Fiyat</th>
                    <th className="px-4 py-3 text-center">İşlem</th>
                    <th className="px-4 py-3 text-center">Miktar</th>
                    <th className="px-4 py-3 text-right">Tutar</th>
                  </tr>
                </thead>

                <tbody>
                  {items.map((item) => {
                    const isEditing = editingId === item.id;

                    return (
                      <tr key={item.id} className="border-t">
                        {/* Poz */}
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              value={draft.pos}
                              onChange={(e) => setDraft({ ...draft, pos: e.target.value })}
                              className="w-full border rounded px-2 py-1 bg-white text-slate-900"
                            />
                          ) : (
                            <span className="font-mono text-xs">{item.pos}</span>
                          )}
                        </td>

                        {/* Tanım */}
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <textarea
                              rows={2}
                              value={draft.desc}
                              onChange={(e) => setDraft({ ...draft, desc: e.target.value })}
                              className="w-full border rounded px-2 py-1 bg-white text-slate-900"
                            />
                          ) : (
                            item.desc
                          )}
                        </td>

                        {/* ✅ BİRİM (SELECT) */}
                        <td className="px-4 py-3 text-center">
                          {isEditing ? (
                            <select
                              value={draft.unit}
                              onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                              className="w-full border rounded px-2 py-1 bg-white text-slate-900 font-bold"
                            >
                              {UNIT_OPTIONS.map((u) => (
                                <option key={u} value={u}>
                                  {u}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-xs font-bold bg-blue-50 px-2 py-1 rounded">
                              {item.unit}
                            </span>
                          )}
                        </td>

                        {/* Fiyat */}
                        <td className="px-4 py-3 text-right">
                          {isEditing ? (
                            <input
                              value={draft.price}
                              onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                              className="w-full border rounded px-2 py-1 text-right bg-white text-slate-900"
                            />
                          ) : (
                            formatCurrency(item.price)
                          )}
                        </td>

                        {/* İşlem */}
                        <td className="px-4 py-3 text-center">
                          <div className="flex justify-center gap-2">
                            <button onClick={() => onOpenSelector(item)}>
                              <RefreshCw className="w-4 h-4" />
                            </button>

                            {item.isManual && (
                              <>
                                {!isEditing ? (
                                  <>
                                    <button onClick={() => beginEdit(item)}>
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(item)}>
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => saveEdit(item)}>
                                      <Check className="w-4 h-4 text-green-600" />
                                    </button>
                                    <button onClick={cancelEdit}>
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </td>

                        {/* Miktar */}
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={item.quantity || ''}
                            onChange={(e) =>
                              onUpdateQuantity(item.id, Number(e.target.value) || 0)
                            }
                            className="w-full border rounded px-2 py-1 text-center"
                          />
                        </td>

                        {/* Tutar */}
                        <td className="px-4 py-3 text-right font-bold">
                          {formatCurrency(item.price * item.quantity)}
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
