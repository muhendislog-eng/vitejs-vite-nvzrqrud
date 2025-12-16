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
  Search
} from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';

type MetrajItem = {
  id: number | string;
  pos: string;
  desc: string;
  unit: string;
  price: number;
  quantity: number;
  category?: string;
  isManual?: boolean;
  locationId?: string | number | null;
  [key: string]: any;
};

// Location Interface (adapted from App.tsx usage)
interface Location {
  id: number;
  name: string;
  type: string;
  children: any[];
}

const UNIT_OPTIONS = ['m²', 'm³', 'm', 'mt', 'kg', 'Ton', 'Adet', 'sa', 'km'];

const MetrajTable = ({
  data,
  onUpdateQuantity,
  onOpenSelector,
  onAddNewItem,
  // Props required by App.tsx but seemingly unused in logic currently
  locations = [],
  onUpdateLocation,
  onUpdateManualItem,
  onDeleteManualItem,
}: {
  data: MetrajItem[];
  onUpdateQuantity: (id: number | string, quantity: number) => void;
  onOpenSelector: (item: MetrajItem) => void;
  onAddNewItem: (category: string) => void;
  locations?: Location[];
  onUpdateLocation?: (id: number | string, locId: any) => void;
  onUpdateManualItem: (id: number | string, patch: Partial<MetrajItem>) => void;
  onDeleteManualItem: (id: number | string) => void;
}) => {
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [draft, setDraft] = useState<{ pos: string; desc: string; unit: string; price: string }>({
    pos: '',
    desc: '',
    unit: UNIT_OPTIONS[0],
    price: '',
  });

  const inputBase =
    'bg-slate-50 text-slate-900 placeholder:text-slate-400 ' +
    'border-2 border-transparent hover:border-slate-200 focus:border-indigo-500 rounded-xl focus:ring-0 outline-none transition-all font-medium';

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
      unit: UNIT_OPTIONS.includes(item.unit) ? item.unit : UNIT_OPTIONS[0],
      price: String(item.price ?? 0),
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({ pos: '', desc: '', unit: UNIT_OPTIONS[0], price: '' });
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

  // ✅ Calculate Page Total
  const pageGrandTotal = data.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // ✅ Premium Pastel Colors for Categories
  const CATEGORY_COLORS = [
    { bg: 'bg-slate-100', border: 'border-blue-200', text: 'text-blue-900', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', shadow: 'shadow-blue-500/5' },
    { bg: 'bg-slate-100', border: 'border-orange-200', text: 'text-orange-900', iconBg: 'bg-orange-100', iconColor: 'text-orange-600', shadow: 'shadow-orange-500/5' },
    { bg: 'bg-slate-100', border: 'border-emerald-200', text: 'text-emerald-900', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', shadow: 'shadow-emerald-500/5' },
    { bg: 'bg-slate-100', border: 'border-indigo-200', text: 'text-indigo-900', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', shadow: 'shadow-indigo-500/5' },
    { bg: 'bg-slate-100', border: 'border-rose-200', text: 'text-rose-900', iconBg: 'bg-rose-100', iconColor: 'text-rose-600', shadow: 'shadow-rose-500/5' },
    { bg: 'bg-slate-100', border: 'border-violet-200', text: 'text-violet-900', iconBg: 'bg-violet-100', iconColor: 'text-violet-600', shadow: 'shadow-violet-500/5' },
  ];

  return (
    <div className="space-y-12 w-full">
      {/* --- PAGE SUMMARY CARD --- */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2rem] border border-slate-200 shadow-xl shadow-slate-200/40 p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-orange-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 flex items-center gap-6">
          <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 shadow-inner">
            <Building className="w-8 h-8 text-orange-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Sayfa Toplamı</h2>
            <div className="text-3xl sm:text-5xl font-black text-slate-800 tracking-tighter tabular-nums">
              {formatCurrency(pageGrandTotal)}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 relative z-10">
          <div className="text-right hidden sm:block">
            <div className="text-3xl font-bold text-slate-800">{data.filter(i => i.quantity > 0).length}</div>
            <div className="text-xs font-bold text-slate-400 uppercase">Girilen Poz</div>
          </div>
          <div className="h-10 w-px bg-slate-200 hidden sm:block" />
          <div className="flex gap-2">
            <div className="px-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-500" />
              Güncel
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {Object.keys(groupedData).map((category, catIndex) => {
          const items = groupedData[category];
          const categoryTotal = items.reduce((sum, it) => sum + it.price * it.quantity, 0);

          // Select color style based on index
          const style = CATEGORY_COLORS[catIndex % CATEGORY_COLORS.length];

          let CategoryIcon: any = Layers;
          if (category.includes('Hafriyat')) CategoryIcon = Hammer;
          if (category.includes('Kapı')) CategoryIcon = DoorOpen;
          if (category.includes('Beton')) CategoryIcon = Building;
          if (category.includes('Duvar')) CategoryIcon = Building;

          return (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: catIndex * 0.1 }}
              key={category}
              className={`rounded-[2rem] border ${style.border} shadow-xl ${style.shadow} overflow-hidden w-full relative group ${style.bg} backdrop-blur-sm`}
            >
              {/* Background gradient decoration */}
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/40 rounded-full blur-3xl opacity-50 pointer-events-none -translate-y-1/2 translate-x-1/2"></div>

              {/* --- HEADER --- */}
              <div className={`px-4 sm:px-8 py-4 sm:py-6 border-b ${style.border} flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 z-30 bg-white/60 backdrop-blur-xl transition-all`}>
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-2xl shadow-sm ${style.iconBg} group-hover:scale-110 transition-transform`}>
                    <CategoryIcon className={`w-6 h-6 ${style.iconColor}`} />
                  </div>
                  <div>
                    <h3 className={`font-black text-xl tracking-tight ${style.text}`}>{category}</h3>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{items.length} Kalem</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => onAddNewItem(category)}
                    className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2.5 bg-white/80 hover:bg-white text-slate-600 hover:text-orange-600 text-xs font-bold rounded-xl transition-all border border-slate-200 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-500/10 active:scale-95 group/btn"
                  >
                    <Plus className="w-4 h-4 mr-2 group-hover/btn:rotate-90 transition-transform" />
                    Yeni Poz
                  </button>

                  <div className="hidden sm:flex items-center bg-white text-slate-800 px-5 py-2.5 rounded-xl text-sm shadow-sm border border-slate-200">
                    <span className="text-slate-400 font-medium mr-2">Toplam:</span>
                    <span className="font-bold tabular-nums tracking-tight">{formatCurrency(categoryTotal)}</span>
                  </div>
                </div>
              </div>

              {/* --- TABLE --- */}
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left table-fixed min-w-[1100px]">
                  <thead className={`text-slate-500 text-[10px] sm:text-[11px] font-extrabold uppercase tracking-widest border-b ${style.border}`}>
                    <tr>
                      <th className={`px-3 sm:px-8 py-3 sm:py-4 w-24 sm:w-32 sticky left-0 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] bg-white/80 backdrop-blur-md`}>Poz No</th>

                      <th className="px-3 sm:px-8 py-3 sm:py-4 w-auto min-w-[200px] sm:min-w-[320px]">İmalat Adı</th>
                      <th className="px-2 sm:px-8 py-3 sm:py-4 w-20 sm:w-28 text-center">Birim</th>
                      <th className="px-3 sm:px-8 py-3 sm:py-4 w-28 sm:w-40 text-right">Birim Fiyat</th>
                      <th className="px-3 sm:px-8 py-3 sm:py-4 w-28 sm:w-40 text-center">İşlem</th>
                      <th className="px-3 sm:px-8 py-3 sm:py-4 w-28 sm:w-48 text-center bg-orange-50/50 text-orange-600">Miktar</th>
                      <th className="px-3 sm:px-8 py-3 sm:py-4 w-28 sm:w-40 text-right">Tutar</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-50">
                    {items.map((item, index) => {
                      const isEditing = editingId === item.id;
                      return (
                        <motion.tr
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 * index }}
                          key={item.id}
                          className="hover:bg-slate-50/80 transition-colors group relative"
                        >
                          {/* Poz No */}
                          <td className="px-3 sm:px-8 py-3 sm:py-5 sticky left-0 bg-white group-hover:bg-slate-50 transition-colors z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] border-r border-slate-50">
                            {isEditing ? (
                              <input
                                value={draft.pos}
                                onChange={(e) => setDraft((d) => ({ ...d, pos: e.target.value }))}
                                className={`w-full px-3 py-2 text-xs font-mono font-bold ${inputBase}`}
                                placeholder="Poz No"
                                autoFocus
                              />
                            ) : (
                              <span className="font-mono text-xs font-black text-slate-700 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                                {item.pos}
                              </span>
                            )}
                          </td>

                          {/* Tanım */}
                          <td className="px-3 sm:px-8 py-3 sm:py-5">
                            {isEditing ? (
                              <textarea
                                value={draft.desc}
                                onChange={(e) => setDraft((d) => ({ ...d, desc: e.target.value }))}
                                className={`w-full px-3 py-2 text-sm ${inputBase}`}
                                rows={2}
                                placeholder="Tanım"
                              />
                            ) : (
                              <p className="text-sm font-medium text-slate-600 leading-relaxed line-clamp-2 hover:line-clamp-none transition-all duration-300">
                                {item.desc}
                              </p>
                            )}
                          </td>

                          {/* Birim */}
                          <td className="px-2 sm:px-8 py-3 sm:py-5 text-center">
                            {isEditing ? (
                              <select
                                value={draft.unit}
                                onChange={(e) => setDraft((d) => ({ ...d, unit: e.target.value }))}
                                className={`w-full px-3 py-2 text-xs font-bold text-center ${inputBase}`}
                              >
                                {UNIT_OPTIONS.map((u) => (
                                  <option key={u} value={u}>{u}</option>
                                ))}
                              </select>
                            ) : (
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border
                                ${['m²', 'm³'].includes(item.unit) ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-slate-100 text-slate-500 border-slate-200'}
                              `}>
                                {item.unit}
                              </span>
                            )}
                          </td>

                          {/* Fiyat */}
                          <td className="px-3 sm:px-8 py-3 sm:py-5 text-right">
                            {isEditing ? (
                              <input
                                value={draft.price}
                                onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
                                className={`w-full px-3 py-2 text-sm text-right font-mono font-bold ${inputBase}`}
                                placeholder="0"
                              />
                            ) : (
                              <span className="font-mono text-sm font-bold text-slate-500">
                                {formatCurrency(item.price)}
                              </span>
                            )}
                          </td>

                          {/* İşlem Butonları */}
                          <td className="px-3 sm:px-8 py-3 sm:py-5">
                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0">
                              <button
                                onClick={() => onOpenSelector(item)}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                                title="Pozu Değiştir"
                              >
                                <RefreshCw className="w-4 h-4" />
                              </button>

                              {item.isManual && (
                                !isEditing ? (
                                  <>
                                    <button onClick={() => beginEdit(item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all">
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(item)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => saveEdit(item)} className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-all"><Check className="w-4 h-4" /></button>
                                    <button onClick={cancelEdit} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-all"><X className="w-4 h-4" /></button>
                                  </>
                                )
                              )}
                            </div>
                          </td>

                          {/* Miktar Input */}
                          <td className="px-3 sm:px-8 py-3 sm:py-5">
                            <div className="relative group/input">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.quantity || ''}
                                onChange={(e) => onUpdateQuantity(item.id, Number(e.target.value) || 0)}
                                className="w-full h-10 px-3 text-center font-bold text-slate-700 bg-slate-50 border-2 border-transparent hover:border-slate-200 focus:border-orange-500 focus:bg-white rounded-xl outline-none transition-all shadow-sm focus:shadow-orange-500/20"
                                placeholder="-"
                              />
                            </div>
                          </td>

                          {/* Tutar */}
                          <td className="px-3 sm:px-8 py-3 sm:py-5 text-right">
                            <div className="font-bold text-slate-800 tabular-nums tracking-tight">
                              {item.quantity > 0 ? formatCurrency(item.price * item.quantity) : <span className="text-slate-300">-</span>}
                            </div>
                          </td>

                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default MetrajTable;
