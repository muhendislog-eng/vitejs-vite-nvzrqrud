import React, { useState } from 'react';
import { RefreshCcw, Maximize, Plus, Pencil, Trash2, Box, Grid, Settings, MousePointer, RefreshCw } from 'lucide-react';
import { getFlattenedLocations } from '../utils/helpers';

// Veri Tipleri
interface WindowItem {
  id: number;
  label: string;
  width: string;
  height: string;
  count: string;
  middleRegister: string;
  mahal: string;
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
    middleRegister: '', 
    mahal: '' 
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [windowType, setWindowType] = useState<'pvc' | 'alu'>('pvc'); 
  
  const locationOptions = getFlattenedLocations(locations);

  // Pencere Ekleme / Güncelleme
  const handleAddOrUpdateItem = () => {
    if (newItem.label && newItem.count) {
      const itemToSave = { ...newItem, type: windowType };
      if (editingId) {
        setItems(items.map((item) => item.id === editingId ? { ...itemToSave, id: editingId } : item));
        setEditingId(null);
      } else {
        setItems([...items, { ...itemToSave, id: Date.now() }]);
      }
      setNewItem({ label: '', width: '', height: '', count: '', middleRegister: '', mahal: '' });
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
      mahal: item.mahal || ''
    });
    setEditingId(item.id);
  };

  // Silme İşlemi
  const handleRemoveItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setNewItem({ label: '', width: '', height: '', count: '', middleRegister: '', mahal: '' });
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
         const term1 = (widthM * heightM) * 2 * 1.596;
         const term2 = (heightM - 0.2) * 2.038;
         const term3 = (((widthM / 2) - 0.16) + (heightM - 0.16)) * 2 * 2.186;
         weight = (term1 + term2 + term3) * count;
       } else {
         // Orta Kayıt YOKSA (Yeni Formül: [(En+Boy)*2*1.596] + [((En-0.16)+(Boy-0.16))*2*2.186])
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
      "15.455.1001": totalPVCWeight,  // PVC Profil Ağırlığı
      "15.460.1010": totalAluWeight,  // Alüminyum Profil Ağırlığı
      "15.465.1101": windowHandleCount, // Pencere Kolu
      "15.465.1116": windowHingeCount, // Pencere Menteşesi
      "15.470.1010": totalGlassArea   // Isıcam
    };
    onUpdateQuantities(updates);
    alert("Hesaplanan pencere metrajları listeye başarıyla aktarıldı!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full">
      
      {/* --- BAŞLIK --- */}
      <div className="flex justify-between items-end border-b border-slate-200 pb-2">
           <h2 className="text-xl font-bold text-slate-800 flex items-center">
             <Maximize className="w-6 h-6 mr-2 text-blue-600" />
             Pencere Metrajı
           </h2>
           <button 
            onClick={handleTransfer}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold transition-all shadow-md active:scale-95"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Listeye Aktar
          </button>
      </div>

      {/* --- TİP SEÇİMİ --- */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button 
          onClick={() => setWindowType('pvc')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${windowType === 'pvc' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          PVC Doğrama
        </button>
        <button 
          onClick={() => setWindowType('alu')}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${windowType === 'alu' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Isı Yal. Al. Doğrama
        </button>
      </div>

      {/* --- VERİ GİRİŞ FORMU --- */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden w-full">
        <div className={`absolute top-0 right-0 p-4 opacity-5 pointer-events-none`}>
            <Box className="w-32 h-32" />
        </div>
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 tracking-wider flex items-center">
            {editingId ? <Pencil className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
            {editingId ? 'Pencere Düzenle' : `Yeni ${windowType === 'pvc' ? 'PVC' : 'Alüminyum'} Pencere Ekle`}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end relative z-10">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Mahal</label>
            <select 
              value={newItem.mahal}
              onChange={e => setNewItem({...newItem, mahal: e.target.value})}
              className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">Genel</option>
              {locationOptions.map((loc: any) => (
                <option key={loc.id} value={loc.name}>{loc.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Tip (Örn: P1)</label>
            <input 
              type="text" 
              value={newItem.label}
              onChange={e => setNewItem({...newItem, label: e.target.value})}
              className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="P1"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">En (cm)</label>
            <input 
              type="number" 
              value={newItem.width}
              onChange={e => setNewItem({...newItem, width: e.target.value})}
              className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="150"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Boy (cm)</label>
            <input 
              type="number" 
              value={newItem.height}
              onChange={e => setNewItem({...newItem, height: e.target.value})}
              className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="150"
            />
          </div>
           <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Orta Kayıt (cm)</label>
            <input 
              type="number" 
              value={newItem.middleRegister}
              onChange={e => setNewItem({...newItem, middleRegister: e.target.value})}
              className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Adet</label>
            <input 
              type="number" 
              value={newItem.count}
              onChange={e => setNewItem({...newItem, count: e.target.value})}
              className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="0"
            />
          </div>
          <button 
            onClick={handleAddOrUpdateItem}
            className={`flex items-center justify-center p-2.5 text-white rounded-lg font-bold transition-colors ${
              editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {editingId ? 'Güncelle' : 'Ekle'}
          </button>
        </div>
      </div>

      {/* --- TABLO --- */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
        <table className="w-full text-left text-sm table-fixed min-w-[800px]">
          <thead className="bg-slate-200 text-slate-600 text-xs font-bold uppercase">
            <tr>
              <th className="px-6 py-3 w-32">Poz No</th>
              <th className="px-6 py-3 w-32">Mahal</th>
              <th className="px-6 py-3">Tip</th>
              <th className="px-6 py-3">Çeşit</th>
              <th className="px-6 py-3">Ebat</th>
              <th className="px-6 py-3 text-center">Adet</th>
              <th className="px-6 py-3 text-right">
                {windowType === 'pvc' ? 'PVC Profil (kg)' : 'Alüminyum Profil (kg)'}
              </th>
              <th className="px-6 py-3 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr><td colSpan={8} className="px-6 py-8 text-center text-slate-400">Veri yok.</td></tr>
            ) : items.map((item) => {
                const weight = calculateWindowValues(item);
                const posNo = item.type === 'pvc' ? '15.455.1001' : '15.460.1010';
                
                return (
              <tr key={item.id} className={`hover:bg-slate-50 ${editingId === item.id ? 'bg-orange-50' : ''}`}>
                <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">
                   {posNo}
                </td>
                <td className="px-6 py-4 text-slate-500 text-xs font-mono">{item.mahal || '-'}</td>
                <td className="px-6 py-4 font-bold text-blue-700">{item.label}</td>
                <td className="px-6 py-4">
                  <span className={`text-xs px-2 py-1 rounded-full font-bold ${item.type === 'pvc' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
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
                    <button onClick={() => handleEditItem(item)} className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>

      {/* --- ÖZET KARTLARI --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-blue-500 uppercase">PVC Toplamı</span>
              <Box className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <span className="text-2xl font-black text-blue-800">{totalPVCWeight.toFixed(2)}</span>
              <span className="text-sm font-medium text-blue-600 ml-1">kg</span>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-blue-500 uppercase">PVC Adedi</span>
              <Grid className="w-5 h-5 text-blue-400" />
            </div>
            <span className="text-2xl font-black text-blue-800">{totalPVCCount}</span>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between opacity-70">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Alüminyum Toplamı</span>
              <Box className="w-5 h-5 text-gray-400" />
            </div>
            <div>
                <span className="text-2xl font-black text-gray-800">{totalAluWeight.toFixed(2)}</span>
                <span className="text-sm font-medium text-gray-600 ml-1">kg</span>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between opacity-70">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase">Alüminyum Adedi</span>
              <Grid className="w-5 h-5 text-gray-400" />
            </div>
            <span className="text-2xl font-black text-gray-800">{totalAluCount}</span>
          </div>
      </div>

      <div className="bg-teal-50 p-4 rounded-xl border border-teal-200 shadow-sm flex items-center justify-between mt-6 w-full">
         <div>
            <span className="text-xs font-bold text-teal-600 uppercase block mb-1">Toplam Cam (Isıcam)</span>
            <span className="text-xs text-teal-500">Poz No: 15.470.1010</span>
         </div>
         <div>
            <span className="text-3xl font-black text-teal-800">{totalGlassArea.toFixed(2)}</span>
            <span className="text-sm font-medium text-teal-600 ml-1">m²</span>
         </div>
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
            <div className="text-xs text-slate-400 mb-2 font-mono bg-slate-100 px-2 py-0.5 rounded">Poz: 15.465.1101</div>
            <span className="text-2xl font-black text-slate-800">{windowHandleCount}</span>
            <span className="text-xs text-slate-400">Adet</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <div className="p-3 bg-green-50 rounded-full mb-3 text-green-600">
              <RefreshCw className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-500 uppercase">Menteşe (x3)</h4>
            <div className="text-xs text-slate-400 mb-2 font-mono bg-slate-100 px-2 py-0.5 rounded">Poz: 15.465.1116</div>
            <span className="text-2xl font-black text-slate-800">{windowHingeCount}</span>
            <span className="text-xs text-slate-400">Adet</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default WindowCalculationArea;