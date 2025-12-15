import React, { useState } from 'react';
import {
  RefreshCcw,
  Maximize,
  Plus,
  Pencil,
  Trash2,
  Box,
  Grid,
  MousePointer,
  RefreshCw,
  Hammer,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Veri Tipleri
interface WindowItem {
  id: number;
  label: string;
  width: string;
  height: string;
  count: string;
  middleRegister: string;
  type: 'pvc' | 'alu';
}

interface WindowCalculationAreaProps {
  items: WindowItem[];
  setItems: React.Dispatch<React.SetStateAction<WindowItem[]>>;
  onUpdateQuantities: (updates: { [key: string]: number }) => void;
}

const WindowCalculationArea: React.FC<WindowCalculationAreaProps> = ({
  items,
  setItems,
  onUpdateQuantities,
}) => {
  const [newItem, setNewItem] = useState<Omit<WindowItem, 'id' | 'type'>>({
    label: '',
    width: '',
    height: '',
    count: '',
    middleRegister: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [windowType, setWindowType] = useState<'pvc' | 'alu'>('pvc');

  // Pencere Ekleme / Güncelleme
  const handleAddOrUpdateItem = () => {
    if (newItem.label && newItem.count) {
      const itemToSave = { ...newItem, type: windowType };

      if (editingId) {
        setItems(
          items.map((item) =>
            item.id === editingId ? { ...itemToSave, id: editingId } : item
          )
        );
        setEditingId(null);
      } else {
        setItems([...items, { ...itemToSave, id: Date.now() }]);
      }

      setNewItem({ label: '', width: '', height: '', count: '', middleRegister: '' });
    }
  };

  // Düzenleme Modunu Açma
  const handleEditItem = (item: WindowItem) => {
    setWindowType(item.type);
    setNewItem({
      label: item.label,
      width: item.width,
      height: item.height,
      count: item.count,
      middleRegister: item.middleRegister || '',
    });
    setEditingId(item.id);
  };

  // Silme İşlemi
  const handleRemoveItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setNewItem({ label: '', width: '', height: '', count: '', middleRegister: '' });
    }
  };

  // Hesaplama Mantığı
  const calculateWindowValues = (item: WindowItem) => {
    const widthM = (parseFloat(item.width) || 0) / 100;
    const heightM = (parseFloat(item.height) || 0) / 100;
    const count = parseFloat(item.count) || 0;
    const midReg = parseFloat(item.middleRegister) || 0;

    let weight = 0;

    // Cam Alanı: (En-20cm) * (Boy-20cm) * Adet
    const glassArea = Math.max(0, (widthM - 0.2) * (heightM - 0.2)) * count;

    if (item.type === 'pvc') {
      // PVC Formülü: Çevre * 1.1 * 2 * Adet
      weight = 2 * (widthM + heightM) * 1.1 * 2 * count;
    } else if (item.type === 'alu') {
      // Alüminyum Hesaplama Mantığı
      if (midReg > 0) {
        // Orta Kayıt VARSA (Eski Formül)
        const term1 = widthM * heightM * 2 * 1.596;
        const term2 = (heightM - 0.2) * 2.038;
        const term3 = (((widthM / 2) - 0.16) + (heightM - 0.16)) * 2 * 2.186;
        weight = (term1 + term2 + term3) * count;
      } else {
        // Orta Kayıt YOKSA (Yeni Formül)
        const term1 = (widthM + heightM) * 2 * 1.596;
        const term2 = ((widthM - 0.16) + (heightM - 0.16)) * 2 * 2.186;
        weight = (term1 + term2) * count;
      }
    }

    return { weight, glassArea };
  };

  // Özet İstatistikler
  const pvcWindows = items.filter((i) => i.type === 'pvc');
  const aluWindows = items.filter((i) => i.type === 'alu');

  const totalPVCCount = pvcWindows.reduce((acc, i) => acc + (parseFloat(i.count) || 0), 0);
  const totalAluCount = aluWindows.reduce((acc, i) => acc + (parseFloat(i.count) || 0), 0);

  const totalPVCWeight = pvcWindows.reduce((acc, item) => acc + calculateWindowValues(item).weight, 0);
  const totalAluWeight = aluWindows.reduce((acc, item) => acc + calculateWindowValues(item).weight, 0);

  const totalWindowCount = items.reduce((sum, item) => sum + (parseFloat(item.count) || 0), 0);
  const windowHandleCount = totalWindowCount * 1;
  const windowHingeCount = totalWindowCount * 3;

  const totalGlassArea = items.reduce((sum, item) => sum + calculateWindowValues(item).glassArea, 0);

  // Ana Listeye Aktarma
  const handleTransfer = () => {
    const updates = {
      '15.455.1001': totalPVCWeight, // PVC Profil Ağırlığı
      '15.460.1010': totalAluWeight, // Alüminyum Profil Ağırlığı
      '15.465.1101': windowHandleCount, // Pencere Kolu
      '15.465.1116': windowHingeCount, // Pencere Menteşesi
      '15.470.1010': totalGlassArea, // Isıcam
    };
    onUpdateQuantities(updates);
    alert('Hesaplanan pencere metrajları listeye başarıyla aktarıldı!');
  };

  return (
    <div className="w-full max-w-full space-y-8">

      {/* --- HEADER --- */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/80 backdrop-blur-md p-6 rounded-[2rem] border border-white/20 shadow-xl shadow-indigo-500/5 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600 shadow-inner">
            <Maximize className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Pencere Metrajı</h2>
            <p className="text-sm font-medium text-slate-500">PVC ve Alüminyum doğrama hesaplama modülü</p>
          </div>
        </div>

        {/* TYPE TOGGLE */}
        <div className="relative z-10 bg-slate-100 p-1.5 rounded-xl flex gap-1 shadow-inner">
          {(['pvc', 'alu'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setWindowType(type)}
              className={`relative px-6 py-2.5 text-sm font-bold rounded-lg transition-colors z-10 ${windowType === type ? 'text-indigo-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {type === 'pvc' ? 'PVC Doğrama' : 'Alüminyum'}
              {windowType === type && (
                <motion.div
                  layoutId="windowTypeTab"
                  className="absolute inset-0 bg-white shadow-sm rounded-lg border border-slate-200/50 -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          ))}
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

      <div className="flex flex-col gap-8">
        {/* --- INPUT FORM --- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/90 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-xl p-8 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
            <Grid className="w-64 h-64" />
          </div>

          <div className="flex items-center justify-between mb-8 relative z-10">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${editingId ? 'bg-orange-100 text-orange-600' : 'bg-indigo-100 text-indigo-600'}`}>
                {editingId ? <Pencil className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </div>
              <h3 className="font-bold text-slate-800 text-lg">
                {editingId ? 'Pencereyi Düzenle' : `Yeni ${windowType === 'pvc' ? 'PVC' : 'Alüminyum'} Pencere`}
              </h3>
            </div>
            {editingId && (
              <button onClick={() => { setEditingId(null); setNewItem({ label: '', width: '', height: '', count: '', middleRegister: '' }); }} className="text-xs font-bold text-slate-400 hover:text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                Vazgeç
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 items-end relative z-10">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Tip</label>
              <input
                type="text"
                value={newItem.label}
                onChange={e => setNewItem({ ...newItem, label: e.target.value })}
                className="w-full px-4 py-3.5 bg-slate-50/50 border-2 border-slate-100 rounded-xl focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-700 placeholder:font-normal placeholder:text-slate-300"
                placeholder="P1"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">En (cm)</label>
              <input
                type="number"
                value={newItem.width}
                onChange={e => setNewItem({ ...newItem, width: e.target.value })}
                className="w-full px-4 py-3.5 bg-slate-50/50 border-2 border-slate-100 rounded-xl focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-700 placeholder:font-normal placeholder:text-slate-300"
                placeholder="150"
                title="Pencere genişliği"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Boy (cm)</label>
              <input
                type="number"
                value={newItem.height}
                onChange={e => setNewItem({ ...newItem, height: e.target.value })}
                className="w-full px-4 py-3.5 bg-slate-50/50 border-2 border-slate-100 rounded-xl focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-700 placeholder:font-normal placeholder:text-slate-300"
                placeholder="150"
                title="Pencere yüksekliği"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Orta K. (cm)</label>
              <input
                type="number"
                value={newItem.middleRegister}
                onChange={e => setNewItem({ ...newItem, middleRegister: e.target.value })}
                className="w-full px-4 py-3.5 bg-slate-50/50 border-2 border-slate-100 rounded-xl focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-slate-700 placeholder:font-normal placeholder:text-slate-300"
                placeholder="0"
                title="Orta Kayıt uzunluğu"
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
                : 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-indigo-500/30 hover:shadow-indigo-500/40'
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

        {/* --- SUMMARY CARDS ROW --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-lg hover:shadow-xl transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-700" />
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl mb-4 shadow-inner group-hover:scale-110 transition-transform duration-300">
                <Box className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-600 uppercase tracking-tight mb-1">PVC Ağırlık</h4>
              <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md mb-4 font-mono">Toplam</div>
              <div className="text-4xl font-black text-blue-600 tracking-tighter tabular-nums mb-1">
                {totalPVCWeight.toFixed(1)}
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase">Kg</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-lg hover:shadow-xl transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-slate-500/5 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-700" />
            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="p-4 bg-slate-100 text-slate-600 rounded-2xl mb-4 shadow-inner group-hover:scale-110 transition-transform duration-300">
                <Grid className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-600 uppercase tracking-tight mb-1">Alüminyum</h4>
              <div className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md mb-4 font-mono">Toplam</div>
              <div className="text-4xl font-black text-slate-600 tracking-tighter tabular-nums mb-1">
                {totalAluWeight.toFixed(1)}
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase">Kg</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="col-span-1 sm:col-span-2 bg-gradient-to-br from-indigo-500 to-violet-600 p-6 rounded-[2rem] text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none group-hover:scale-110 transition-transform duration-700" />

            <div className="relative z-10 flex justify-between items-center h-full">
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <Maximize className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-bold text-indigo-100 uppercase tracking-wider">Toplam Isıcam Alanı</span>
                </div>
                <span className="text-5xl font-black text-white tracking-tighter mb-1">{totalGlassArea.toFixed(2)}</span>
                <span className="text-lg font-medium text-indigo-100/80">Metrekare (m²)</span>
              </div>

              <div className="hidden sm:flex flex-col items-end text-right">
                <div className="text-xs font-medium text-indigo-200 mb-1">Otomatik Hesaplanan Poz</div>
                <div className="font-mono text-xl font-bold text-white bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10">
                  15.470.1010
                </div>
                <div className="mt-4 flex gap-4">
                  <div>
                    <span className="block text-xs text-indigo-200">PVC Adet</span>
                    <span className="text-xl font-bold">{totalPVCCount}</span>
                  </div>
                  <div>
                    <span className="block text-xs text-indigo-200">ALU Adet</span>
                    <span className="text-xl font-bold">{totalAluCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* --- TABLE --- */}
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
                  <th className="px-8 py-5 w-32 text-xs font-extrabold text-slate-500 uppercase tracking-widest sticky left-0 bg-slate-50 z-10">Poz No</th>
                  <th className="px-8 py-5 w-auto text-xs font-extrabold text-slate-500 uppercase tracking-widest">Tip Adı</th>
                  <th className="px-8 py-5 w-32 text-xs font-extrabold text-slate-500 uppercase tracking-widest">Malzeme</th>
                  <th className="px-8 py-5 w-40 text-xs font-extrabold text-slate-500 uppercase tracking-widest">Ebat</th>
                  <th className="px-8 py-5 w-24 text-center text-xs font-extrabold text-slate-500 uppercase tracking-widest">Adet</th>
                  <th className="px-8 py-5 text-right w-48 text-xs font-extrabold text-slate-500 uppercase tracking-widest">
                    Hesaplanan Ağırlık
                  </th>
                  <th className="px-8 py-5 text-right w-40 text-xs font-extrabold text-slate-500 uppercase tracking-widest">İşlem</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                <AnimatePresence>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-8 py-16 text-center">
                        <div className="flex flex-col items-center justify-center opacity-40">
                          <Box className="w-16 h-16 text-slate-300 mb-4" />
                          <p className="text-lg font-medium text-slate-900">Henüz pencere eklenmedi</p>
                          <p className="text-sm text-slate-500">PVC veya Alüminyum pencere tiplerini ekleyebilirsiniz</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => {
                      const calc = calculateWindowValues(item);
                      const posNo = item.type === 'pvc' ? '15.455.1001' : '15.460.1010';

                      return (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                          transition={{ delay: index * 0.05 }}
                          className={`group transition-colors ${editingId === item.id ? 'bg-orange-50/50' : 'hover:bg-slate-50/80'}`}
                        >
                          <td className="px-8 py-5 font-mono text-xs font-bold text-slate-400 sticky left-0 bg-white group-hover:bg-slate-50/80 transition-colors border-r border-transparent group-hover:border-slate-100">
                            {posNo}
                          </td>

                          <td className="px-8 py-5 font-black text-slate-700 text-lg">
                            {item.label}
                          </td>

                          <td className="px-8 py-5">
                            <span
                              className={`text-[10px] uppercase tracking-wider px-3 py-1 rounded-full font-black border ${item.type === 'pvc'
                                ? 'bg-blue-50 text-blue-600 border-blue-100'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}
                            >
                              {item.type === 'pvc' ? 'PVC' : 'ALU'}
                            </span>
                          </td>

                          <td className="px-8 py-5 font-medium text-slate-600">
                            {item.width} x {item.height} <span className="text-xs text-slate-400">cm</span>
                          </td>

                          <td className="px-8 py-5 text-center">
                            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md">{item.count}</span>
                          </td>

                          <td className="px-8 py-5 text-right font-mono font-bold text-slate-700 text-lg">
                            {calc.weight.toFixed(2)} <span className="text-xs text-slate-400 font-sans font-normal">kg</span>
                          </td>

                          <td className="px-8 py-5 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                              <button
                                onClick={() => handleEditItem(item)}
                                className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors shadow-sm"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors shadow-sm"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      <div className="mt-8 w-full">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2 text-indigo-500" />
          Pencere Aksesuarları (Listeye Aktarılacak)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <div className="p-3 bg-purple-50 rounded-full mb-3 text-purple-600">
              <MousePointer className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-500 uppercase">Pencere Kolu</h4>
            <div className="text-xs text-slate-400 mb-2 font-mono bg-slate-100 px-2 py-0.5 rounded">
              Poz: 15.465.1101
            </div>
            <span className="text-2xl font-black text-slate-800">{windowHandleCount}</span>
            <span className="text-xs text-slate-400">Adet</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <div className="p-3 bg-green-50 rounded-full mb-3 text-green-600">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-500 uppercase">Menteşe (x3)</h4>
            <div className="text-xs text-slate-400 mb-2 font-mono bg-slate-100 px-2 py-0.5 rounded">
              Poz: 15.465.1116
            </div>
            <span className="text-2xl font-black text-slate-800">{windowHingeCount}</span>
            <span className="text-xs text-slate-400">Adet</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WindowCalculationArea;
