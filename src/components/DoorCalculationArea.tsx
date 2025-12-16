import React, { useState } from 'react';
import {
  RefreshCcw,
  DoorOpen,
  Plus,
  Pencil,
  Trash2,
  Lock,
  RefreshCw,
  MousePointer,
  Hammer,
  Check,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Kapı Veri Tipi (Mahal kaldırıldı)
interface DoorItem {
  id: number;
  label: string;
  width: string;
  height: string;
  count: string;
}

interface DoorCalculationAreaProps {
  items: DoorItem[];
  setItems: React.Dispatch<React.SetStateAction<DoorItem[]>>;
  onUpdateQuantities: (updates: { [key: string]: number }) => void;
}

const DoorCalculationArea: React.FC<DoorCalculationAreaProps> = ({ items, setItems, onUpdateQuantities }) => {
  const [newItem, setNewItem] = useState<Omit<DoorItem, 'id'>>({
    label: '',
    width: '',
    height: '',
    count: ''
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  // --- Ekleme / Güncelleme ---
  const handleAddOrUpdateItem = () => {
    if (newItem.label && newItem.count) {
      if (editingId) {
        // Düzenleme
        setItems(items.map(item => item.id === editingId ? { ...newItem, id: editingId } : item));
        setEditingId(null);
      } else {
        // Yeni Ekleme
        setItems([...items, { ...newItem, id: Date.now() }]);
      }
      // Formu Sıfırla
      setNewItem({ label: '', width: '', height: '', count: '' });
    }
  };

  // --- Düzenleme Modunu Açma ---
  const handleEditItem = (item: DoorItem) => {
    setNewItem({
      label: item.label,
      width: item.width,
      height: item.height,
      count: item.count
    });
    setEditingId(item.id);
  };

  // --- Silme ---
  const handleRemoveItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setNewItem({ label: '', width: '', height: '', count: '' });
    }
  };

  // --- Hesaplama Fonksiyonu ---
  const calculateRowValues = (item: DoorItem) => {
    const widthM = (parseFloat(item.width) || 0) / 100;
    const heightM = (parseFloat(item.height) || 0) / 100;
    const count = parseFloat(item.count) || 0;

    // Kapı Kanadı Alanı
    const leafArea = widthM * heightM * count;

    // Kasa + Pervaz Alanı Formülü: ((2 * h) + w) * 0.34 * adet
    const frameArea = ((2 * heightM) + widthM) * 0.34 * count;

    return { leafArea, frameArea };
  };

  // --- Toplam Hesaplamaları ---
  const totalDoorCount = items.reduce((sum, item) => sum + (parseFloat(item.count) || 0), 0);
  const totalLeafArea = items.reduce((sum, item) => sum + calculateRowValues(item).leafArea, 0);
  const totalFrameArea = items.reduce((sum, item) => sum + calculateRowValues(item).frameArea, 0);

  // Aksesuar (Hırdavat) Hesaplamaları
  const lockCount = totalDoorCount * 1;    // Her kapıya 1 kilit
  const hingeCount = totalDoorCount * 3;   // Her kapıya 3 menteşe
  const handleCount = totalDoorCount * 1;  // Her kapıya 1 kol
  const stopCount = totalDoorCount * 1;    // Her kapıya 1 stop

  // --- Listeye Aktar ---
  const handleTransfer = () => {
    const updates = {
      "15.510.1103": totalLeafArea,  // Laminat Kapı Kanadı
      "15.510.1001": totalFrameArea, // Kapı Kasası
      "15.465.1002": lockCount,      // Kilit
      "15.465.1010": hingeCount,     // Menteşe
      "15.465.1008": handleCount,    // Kapı Kolu
      "15.465.1013": stopCount       // Kapı Stopu
    };
    onUpdateQuantities(updates);
    alert("Hesaplanan kapı metrajları ve aksesuarlar ana listeye aktarıldı!");
  };

  return (
    <div className="w-full max-w-full space-y-8">

      {/* --- HEADER --- */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/80 backdrop-blur-md p-6 rounded-[2rem] border border-white/20 shadow-xl shadow-indigo-500/5 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="p-4 bg-orange-50 rounded-2xl text-orange-600 shadow-inner">
            <DoorOpen className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Kapı Metrajı</h2>
            <p className="text-sm font-medium text-slate-500">Otomatik aksesuar ve alan hesaplama modülü</p>
          </div>
        </div>

        <div className="relative z-10 w-full md:w-auto">
          <button
            onClick={handleTransfer}
            className="flex items-center justify-center w-full md:w-auto px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:-translate-y-0.5 active:scale-95 group"
          >
            <RefreshCcw className="w-5 h-5 mr-2 group-hover:rotate-180 transition-transform duration-500" />
            Listeye Aktar
          </button>
        </div>
      </motion.div>

      {/* --- INPUT FORM --- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/90 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-xl p-8 relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${editingId ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-600'}`}>
              {editingId ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </div>
            <h3 className="font-bold text-slate-800 text-lg">
              {editingId ? 'Mevcut Kapıyı Düzenle' : 'Yeni Kapı Tanımla'}
            </h3>
          </div>
          {editingId && (
            <button onClick={() => { setEditingId(null); setNewItem({ label: '', width: '', height: '', count: '' }); }} className="text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              Vazgeç
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Tip Kodu</label>
            <input
              type="text"
              value={newItem.label}
              onChange={e => setNewItem({ ...newItem, label: e.target.value })}
              className="w-full px-4 py-3.5 bg-slate-50/50 border-2 border-slate-100 rounded-xl focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all font-bold text-slate-700 placeholder:font-normal placeholder:text-slate-300"
              placeholder="Örn: K1"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">En (cm)</label>
            <input
              type="number"
              value={newItem.width}
              onChange={e => setNewItem({ ...newItem, width: e.target.value })}
              className="w-full px-4 py-3.5 bg-slate-50/50 border-2 border-slate-100 rounded-xl focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-700 placeholder:font-normal placeholder:text-slate-300"
              placeholder="90"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Boy (cm)</label>
            <input
              type="number"
              value={newItem.height}
              onChange={e => setNewItem({ ...newItem, height: e.target.value })}
              className="w-full px-4 py-3.5 bg-slate-50/50 border-2 border-slate-100 rounded-xl focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-700 placeholder:font-normal placeholder:text-slate-300"
              placeholder="220"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Adet</label>
            <input
              type="number"
              value={newItem.count}
              onChange={e => setNewItem({ ...newItem, count: e.target.value })}
              className="w-full px-4 py-3.5 bg-slate-50/50 border-2 border-slate-100 rounded-xl focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-700 placeholder:font-normal placeholder:text-slate-300"
              placeholder="1"
            />
          </div>

          <button
            onClick={handleAddOrUpdateItem}
            className={`h-[54px] w-full rounded-xl font-black text-sm transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 ${editingId
              ? 'bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-orange-500/30 hover:shadow-orange-500/40'
              : 'bg-gradient-to-r from-slate-800 to-slate-900 text-white shadow-slate-900/30 hover:shadow-slate-900/40'
              }`}
          >
            {editingId ? (
              <><RefreshCw className="w-5 h-5" /> GÜNCELLE</>
            ) : (
              <><Plus className="w-5 h-5" /> LİSTEYE EKLE</>
            )}
          </button>
        </div>
      </motion.div>

      {/* --- DATA TABLE --- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left table-fixed min-w-[1000px]">
            <thead className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-200">
              <tr>
                <th className="px-8 py-5 w-40 text-xs font-extrabold text-slate-500 uppercase tracking-widest sticky left-0 bg-slate-50 z-10">Tip Kodu</th>
                <th className="px-8 py-5 w-auto text-xs font-extrabold text-slate-500 uppercase tracking-widest">Ebat Bilgisi</th>
                <th className="px-8 py-5 w-32 text-center text-xs font-extrabold text-slate-500 uppercase tracking-widest">Adet</th>
                <th className="px-8 py-5 w-48 text-right text-xs font-extrabold text-slate-500 uppercase tracking-widest">Kanat Alanı</th>
                <th className="px-8 py-5 w-48 text-right text-xs font-extrabold text-slate-500 uppercase tracking-widest">Kasa/Pervaz</th>
                <th className="px-8 py-5 w-40 text-center text-xs font-extrabold text-slate-500 uppercase tracking-widest">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <AnimatePresence>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-16 text-center">
                      <div className="flex flex-col items-center justify-center opacity-40">
                        <DoorOpen className="w-16 h-16 text-slate-300 mb-4" />
                        <p className="text-lg font-medium text-slate-900">Henüz kapı eklenmedi</p>
                        <p className="text-sm text-slate-500">Yukarıdaki formdan yeni kapı tipleri tanımlayabilirsiniz</p>
                      </div>
                    </td>
                  </tr>
                ) : items.map((item, index) => {
                  const { leafArea, frameArea } = calculateRowValues(item);
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ delay: index * 0.05 }}
                      className={`group transition-colors ${editingId === item.id ? 'bg-orange-50/50' : 'hover:bg-slate-50/80'}`}
                    >
                      <td className="px-8 py-5 font-black text-slate-800 sticky left-0 bg-white group-hover:bg-slate-50/80 transition-colors border-r border-transparent group-hover:border-slate-100">
                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg border border-slate-200">{item.label}</span>
                      </td>
                      <td className="px-8 py-5 font-medium text-slate-600">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{item.width}</span>
                          <span className="text-slate-400">x</span>
                          <span className="font-bold text-slate-800">{item.height}</span>
                          <span className="text-xs text-slate-400">cm</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className="font-black text-slate-800 text-lg bg-slate-100 px-3 py-1 rounded-lg">{item.count}</span>
                      </td>
                      <td className="px-8 py-5 text-right font-mono font-bold text-slate-600">
                        {leafArea.toFixed(2)} <span className="text-xs text-slate-400 font-sans font-normal">m²</span>
                      </td>
                      <td className="px-8 py-5 text-right font-mono font-bold text-slate-600">
                        {frameArea.toFixed(2)} <span className="text-xs text-slate-400 font-sans font-normal">m²</span>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                          <button onClick={() => handleEditItem(item)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors shadow-sm">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleRemoveItem(item.id)} className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors shadow-sm">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
            {items.length > 0 && (
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td className="px-8 py-6 text-right font-black text-slate-500 uppercase tracking-widest text-xs" colSpan={2}>Toplamlar:</td>
                  <td className="px-8 py-6 text-center font-black text-xl text-slate-800">{totalDoorCount}</td>
                  <td className="px-8 py-6 text-right font-black text-lg text-slate-800">{totalLeafArea.toFixed(2)} <span className="text-sm font-normal text-slate-400">m²</span></td>
                  <td className="px-8 py-6 text-right font-black text-lg text-slate-800">{totalFrameArea.toFixed(2)} <span className="text-sm font-normal text-slate-400">m²</span></td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </motion.div>

      {/* --- ACCESSORY CARDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Gömme Kilit", code: "15.465.1002", val: lockCount, icon: Lock, color: "blue" },
          { title: "Menteşe (x3)", code: "15.465.1010", val: hingeCount, icon: RefreshCw, color: "emerald" },
          { title: "Kapı Kolu", code: "15.465.1008", val: handleCount, icon: MousePointer, color: "violet" },
          { title: "Stop", code: "15.465.1013", val: stopCount, icon: Hammer, color: "orange" }
        ].map((acc, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + (i * 0.1) }}
            className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-lg hover:shadow-xl transition-all group relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-24 h-24 bg-${acc.color}-500/5 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-700`} />

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className={`p-4 bg-${acc.color}-50 text-${acc.color}-600 rounded-2xl mb-4 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                <acc.icon className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-600 uppercase tracking-tight mb-1">{acc.title}</h4>
              <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md mb-4 font-mono">
                {acc.code}
              </div>
              <div className={`text-4xl font-black text-${acc.color}-600 tracking-tighter tabular-nums mb-1`}>
                {acc.val}
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase">Adet</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DoorCalculationArea;