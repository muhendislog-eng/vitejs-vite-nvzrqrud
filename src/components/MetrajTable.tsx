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

const UNIT_OPTIONS = ['m²', 'm³', 'mt', 'Adet', 'Takım'];

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

  const cancelEdit = () => setEditingId(null);

  const saveEdit = (item: MetrajItem) => {
    const price = Number(draft.price.replace(',', '.'));
    if (!draft.pos.trim()) return alert('Poz No boş olamaz');
    if (!draft.desc.trim()) return alert('Tanım boş olamaz');
    if (!UNIT_OPTIONS.includes(draft.unit)) return alert('Birim geçersiz');
    if (isNaN(price)) return alert('Birim fiyat geçersiz');

    onUpdateManualItem(item.id, {
      pos: draft.pos.trim(),
      desc: draft.desc.trim(),
      unit: draft.unit,
      price,
    });

    cancelEdit();
  };

  const handleDelete = (item: MetrajItem) => {
    if (!confirm(`${item.pos} silinsin mi?`)) return;
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
          <div key={category} className="bg-white border rounded-2xl shadow-sm">
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 bg-slate-100">
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-slate-700" />
                <h3 className="font-bold text-slate-800">{category}</h3>
              </div>
              <button
                onClick={() => onAddNewItem(category)}
                className="px-4 py-2 text-xs font-bold bg-white border rounded-lg text-orange-600"
              >
                <Plus className="w-3 h-3 inline mr-1" />
                Poz Ekle
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-[1100px] w-full">
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

                    const inputBase =
                      'w-full px-2 py-1 rounded border bg-white text-slate-900 dark:bg-white dark:text-slate-900';

                    return (
                      <tr key={item.id} className="border-t">
                        {/* Poz */}
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              className={inputBase}
                              value={draft.pos}
                              onChange={(e) =>
                                setDraft({ ...draft, pos: e.target.value })
                              }
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
                              className={inputBase}
                              value={draft.desc}
                              onChange={(e) =>
                                setDraft({ ...draft, desc: e.target.value })
                              }
                            />
                          ) : (
                            item.desc
                          )}
                        </td>

                        {/* Birim */}
                        <td className="px-4 py-3 text-center">
                          {isEditing ? (
                            <select
                              className={inputBase}
                              value={draft.unit}
                              onChange={(e) =>
                                setDraft({ ...draft, unit: e.target.value })
                              }
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
                              className={`${inputBase} text-right`}
                              value={draft.price}
                              onChange={(e) =>
                                setDraft({ ...draft, price: e.target.value })
                              }
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
                            className={`${inputBase} text-center`}
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
