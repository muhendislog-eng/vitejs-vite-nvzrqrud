import React, { useState } from 'react';
import { 
  RefreshCcw, 
  Maximize, 
  Plus, 
  Pencil, 
  Trash2, 
  Box, 
  Grid, 
  Settings, 
  MousePointer, 
  RefreshCw 
} from 'lucide-react';
import { getFlattenedLocations, formatCurrency } from '../utils/helpers';

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
  locations: any[];
}

const WindowCalculationArea: React.FC<WindowCalculationAreaProps> = ({ items, setItems, onUpdateQuantities, locations }) => {
  const [newItem, setNewItem] = useState<Omit<WindowItem, 'id' | 'type'>>({ 
    label: '', 
    width: '', 
    height: '', 
    count: '', 
    middleRegister: ''
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [windowType, setWindowType] = useState<'pvc' | 'alu'>('pvc'); 
  
  const locationOptions = getFlattenedLocations(locations);

  // --- Ekleme / Güncelleme ---
  const handleAddOrUpdateItem = () => {
    if (newItem.label && newItem.count) {
      const itemToSave = { ...newItem, type: windowType };
      if (editingId) {
        setItems(items.map((item) => item.id === editingId ? { ...itemToSave, id: editingId } : item));
        setEditingId(null);
      } else {
        setItems([...items, { ...itemToSave, id: Date.now() }]);
      }
    }
  };

  // --- Düzenleme Modu ---
  const handleEditItem = (item: WindowItem) => {
    setWindowType(item.type);
    setNewItem({ 
      label: item.label, 
      width: item.width, 
      height: item.height, 
      count: item.count,
      middleRegister: item.middleRegister || ''
    });
    setEditingId(item.id);
  };

  // --- Silme ---
  const handleRemoveItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setNewItem({ label: '', width: '', height: '', count: '', middleRegister: '' });
    }
  };

  // --- Hesaplama Motoru ---
  const calculateWindowValues = (item: WindowItem) => {
    const widthM = (parseFloat(item.width) || 0) / 100;
    const heightM = (parseFloat(item.height) || 0) / 100;
    const count = parseFloat(item.count) || 0;
    const midReg = parseFloat(item.middleRegister) || 0;
    
    let weight = 0;
    // Cam Alanı
    const glassArea = Math.max(0, (widthM - 0.2) * (heightM - 0.2)) * count;

    if (item.type === 'pvc') {
       // PVC: Çevre * 1.1 * 2 * Adet
       weight = 2 * (widthM + heightM) * 1.1 * 2 * count;
    } else if (item.type === 'alu') {
       // Alüminyum
       if (midReg > 0) {
         // Orta Kayıtlı
         const term1 = (widthM * heightM) * 2 * 1.596;
         const term2 = (heightM - 0.2) * 2.038;
         const term3 = (((widthM / 2) - 0.16) + (heightM - 0.16)) * 2 * 2.186;
         weight = (term1 + term2 + term3) * count;
       } else {
         // Orta Kayıtsız
         const term1 = (widthM + heightM) * 2 * 1.596;
         const term2 = ((widthM - 0.16) + (heightM - 0.16)) * 2 * 2.186;
         weight = (term1 + term2) * count;
       }
    }
    
    return { weight, glassArea };
  };

  // --- Toplamlar ---
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

  // --- Listeye Aktar ---
  const handleTransfer = () => {
    const updates = {
      "15.455.1001": totalPVCWeight,  // PVC
      "15.460.1010": totalAluWeight,  // Alu
      "15.465.1101": windowHandleCount,
      "15.465.1116": windowHingeCount,
      "15.470.1010": totalGlassArea   // Cam
    };
    onUpdateQuantities(updates);
    alert("Hesaplanan pencere metrajları listeye başarıyla aktarıldı!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full max-w-full">
      
      {/* --- BAŞLIK --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-4 gap-4">
         <div className="flex flex-col">
            <h2 className="text-xl font-bold text-slate-800 flex items-center">
              <Maximize className="w-6 h-6 mr-2 text-blue-600" />
              Pencere Metrajı
            </h2>
            <p className="text-sm text-slate-500 mt-1">PVC ve Alüminyum doğrama ağırlık hesabı</p>
         </div>
         
         <button 
          onClick={handleTransfer}
          className="flex items-center px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold transition-all shadow-lg shadow-green-900/20 active:scale-95"
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          Listeye Aktar
        </button>
      </div>

      {/* --- SEKMELER --- */}
      <div className="flex space-x-2 bg-slate-100 p-1.5 rounded-xl w-fit">
        <button 
          onClick={() => setWindowType('pvc')}
          className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
            windowType === 'pvc' 
            ? 'bg-white text-blue-600 shadow-sm' 
            : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          PVC Doğrama
        </button>
        <button 
          onClick={() => setWindowType('alu')}
          className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
            windowType === 'alu' 
            ? 'bg-white text-blue-600 shadow-sm' 
            : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Isı Yal. Al. Doğrama
        </button>
      </div>

      {/* --- VERİ GİRİŞ FORMU --- */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden w-full">
        {/* Arkaplan İkonu */}
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
            <Box className="w-40 h-40" />
        </div>
        
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-6 tracking-wider flex items-center">
            {editingId ? <Pencil className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {editingId ? 'Pencere Düzenle' : `Yeni ${windowType === 'pvc' ? 'PVC' : 'Alüminyum'} Pencere Ekle`}
        </h3>
        
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Tip (Örn: P1)</label>
            <input 
              type="text" 
              value={newItem.label}
              onChange={e => setNewItem({...newItem, label: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="P1"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">En (cm)</label>
            <input 
              type="number" 
              value={newItem.width}
              onChange={e => setNewItem({...newItem, width: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="150"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Boy (cm)</label>
            <input 
              type="number" 
              value={newItem.height}
              onChange={e => setNewItem({...newItem, height: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="150"
            />
          </div>
           <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Orta Kayıt (cm)</label>
            <input 
              type="number" 
              value={newItem.middleRegister}
              onChange={e => setNewItem({...newItem, middleRegister: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Adet</label>
            <input 
              type="number" 
              value={newItem.count}
              onChange={e => setNewItem({...newItem, count: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              placeholder="0"
            />
          </div>
          
          <button 
            onClick={handleAddOrUpdateItem}
            className={`flex items-center justify-center w-full p-3 text-white rounded-xl font-bold transition-colors shadow-lg active:scale-95 ${
              editingId 
                ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-900/20' 
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20'
            }`}
          >
            {editingId ? 'Güncelle' : 'Ekle'}
          </button>
        </div>
      </div>

      {/* --- TABLO --- */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm table-fixed min-w-[1000px]">
              <thead className="bg-slate-200 text-slate-600 text-xs font-bold uppercase">
                <tr>
                  <th className="px-6 py-4 w-32 sticky left-0 bg-slate-200 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Poz No</th>
                  <th className="px-6 py-4">Tip</th>
                  <th className="px-6 py-4">Çeşit</th>
                  <th className="px-6 py-4">Ebat (En/Boy)</th>
                  <th className="px-6 py-4 text-center">Adet</th>
                  <th className="px-6 py-4 text-right">
                    {windowType === 'pvc' ? 'PVC Profil (kg)' : 'Alüminyum Profil (kg)'}
                  </th>
                  <th className="px-6 py-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-12 text-center text-slate-400">Veri girişi bulunmamaktadır.</td></tr>
                ) : items.map((item) => {
                    const weight = calculateWindowValues(item);
                    const posNo = item.type === 'pvc' ? '15.455.1001' : '15.460.1010';
                    
                    return (
                  <tr key={item.id} className={`hover:bg-slate-50 ${editingId === item.id ? 'bg-orange-50' : ''}`}>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500 sticky left-0 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] group-hover:bg-slate-50">
                       {posNo}
                    </td>
                    <td className="px-6 py-4 font-bold text-blue-700">{item.label}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${item.type === 'pvc' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                        {item.type === 'pvc' ? 'PVC' : 'Alüminyum'}
                      </span>
                    </td>
                    <td className="px-6 py-4">{item.width} / {item.height}</td>
                    <td className="px-6 py-4 text-center font-bold">{item.count}</td>
                    <td className="px-6 py-4 text-right font-mono text-slate-700">
                      {weight.weight.toFixed(2)} kg
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => handleEditItem(item)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleRemoveItem(item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
        </div>
      </div>

      {/* --- ÖZET KARTLARI --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {/* PVC ÖZET */}
          <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-blue-600 uppercase">PVC Toplamı</span>
              <Box className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <span className="text-3xl font-black text-blue-900 tracking-tight">{totalPVCWeight.toFixed(2)}</span>
              <span className="text-sm font-medium text-blue-600 ml-1">kg</span>
            </div>
          </div>
          
          <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-blue-600 uppercase">PVC Adedi</span>
              <Grid className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-3xl font-black text-blue-900 tracking-tight">{totalPVCCount}</span>
          </div>

          {/* ALÜMİNYUM ÖZET */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-600 uppercase">Alüminyum Toplamı</span>
              <Box className="w-5 h-5 text-slate-400" />
            </div>
            <div>
                <span className="text-3xl font-black text-slate-800 tracking-tight">{totalAluWeight.toFixed(2)}</span>
                <span className="text-sm font-medium text-slate-600 ml-1">kg</span>
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-slate-600 uppercase">Alüminyum Adedi</span>
              <Grid className="w-5 h-5 text-slate-400" />
            </div>
            <span className="text-3xl font-black text-slate-800 tracking-tight">{totalAluCount}</span>
          </div>
      </div>

      <div className="bg-teal-50 p-5 rounded-2xl border border-teal-200 shadow-sm flex items-center justify-between w-full">
         <div>
            <span className="text-xs font-bold text-teal-700 uppercase block mb-1">Toplam Cam (Isıcam)</span>
            <span className="text-xs text-teal-600 font-mono">Poz No: 15.470.1010</span>
         </div>
         <div>
            <span className="text-3xl font-black text-teal-900 tracking-tight">{totalGlassArea.toFixed(2)}</span>
            <span className="text-sm font-medium text-teal-700 ml-1">m²</span>
         </div>
      </div>

      {/* --- AKSESUARLAR --- */}
      <div className="w-full">
        <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
          <Settings className="w-5 h-5 mr-2 text-indigo-600" />
          Pencere Aksesuarları (Otomatik)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center hover:shadow-lg transition-all duration-300">
            <div className="p-4 bg-purple-50 rounded-full mb-4 text-purple-600">
              <MousePointer className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-bold text-slate-600 uppercase mb-2">Pencere Kolu</h4>
            <div className="text-xs text-slate-400 mb-4 font-mono bg-slate-50 px-2 py-1 rounded">Poz: 15.465.1101</div>
            <span className="text-4xl font-black text-slate-800 tracking-tight">{windowHandleCount}</span>
            <span className="text-sm font-medium text-slate-500 mt-1">Adet</span>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center hover:shadow-lg transition-all duration-300">
            <div className="p-4 bg-green-50 rounded-full mb-4 text-green-600">
              <RefreshCw className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-bold text-slate-600 uppercase mb-2">Menteşe (x3)</h4>
            <div className="text-xs text-slate-400 mb-4 font-mono bg-slate-50 px-2 py-1 rounded">Poz: 15.465.1116</div>
            <span className="text-4xl font-black text-slate-800 tracking-tight">{windowHingeCount}</span>
            <span className="text-sm font-medium text-slate-500 mt-1">Adet</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default WindowCalculationArea;