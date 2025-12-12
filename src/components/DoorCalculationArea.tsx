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
  Hammer 
} from 'lucide-react';

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
    <div className="w-full max-w-full space-y-6 animate-in fade-in duration-500">
      
      {/* --- BAŞLIK VE AKTAR BUTONU --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-4 gap-4 w-full">
         <div className="flex flex-col">
           <h2 className="text-xl font-bold text-slate-800 flex items-center">
             <DoorOpen className="w-6 h-6 mr-2 text-indigo-600" />
             Kapı Metrajı Hesaplama
           </h2>
           <p className="text-sm text-slate-500 mt-1">Kapı tiplerine göre otomatik aksesuar ve alan hesabı</p>
         </div>
         
         <button 
          onClick={handleTransfer}
          className="flex items-center justify-center px-6 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 font-bold transition-all shadow-lg shadow-green-900/20 active:scale-95 whitespace-nowrap w-full md:w-auto"
        >
          <RefreshCcw className="w-4 h-4 mr-2" />
          Listeye Aktar
        </button>
      </div>
      
      {/* --- VERİ GİRİŞ FORMU --- */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 w-full relative overflow-hidden">
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-6 tracking-wider flex items-center">
             {editingId ? <Pencil className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
             {editingId ? 'Kapı Düzenle' : 'Yeni Kapı Ekle'}
        </h3>
        
        {/* RESPONSIVE GRID: 5 Sütunlu yapı (Mahal çıkarıldı) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 items-end w-full">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Tip (Örn: K1)</label>
            <input 
              type="text" 
              value={newItem.label}
              onChange={e => setNewItem({...newItem, label: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="K1"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">En (cm)</label>
            <input 
              type="number" 
              value={newItem.width}
              onChange={e => setNewItem({...newItem, width: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="90"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Boy (cm)</label>
            <input 
              type="number" 
              value={newItem.height}
              onChange={e => setNewItem({...newItem, height: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="220"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5">Adet</label>
            <input 
              type="number" 
              value={newItem.count}
              onChange={e => setNewItem({...newItem, count: e.target.value})}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              placeholder="0"
            />
          </div>

          {/* Ekle Butonu */}
          <button 
            onClick={handleAddOrUpdateItem}
            className={`flex items-center justify-center w-full p-3 text-white rounded-xl font-bold transition-colors shadow-lg active:scale-95 h-[48px] ${
              editingId ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-900/20' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-900/20'
            }`}
          >
            {editingId ? 'Güncelle' : 'Ekle'}
          </button>
        </div>
      </div>

      {/* --- TABLO --- */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
            <table className="w-full text-left text-sm table-fixed min-w-[800px]">
            <thead className="bg-slate-100 text-slate-600 text-xs font-bold uppercase border-b border-slate-200">
                <tr>
                <th className="px-6 py-4 w-32 sticky left-0 bg-slate-100 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Tip</th>
                <th className="px-6 py-4 w-32">Ebat (En/Boy)</th>
                <th className="px-6 py-4 w-24 text-center">Adet</th>
                <th className="px-6 py-4 w-40 text-right">Kapı Kanadı (m²)</th>
                <th className="px-6 py-4 w-40 text-right">Kasa+Pervaz (m²)</th>
                <th className="px-6 py-4 w-32 text-right">İşlem</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {items.length === 0 ? (
                <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">Henüz veri girişi yapılmadı.</td>
                </tr>
                ) : items.map((item) => {
                const { leafArea, frameArea } = calculateRowValues(item);
                return (
                    <tr key={item.id} className={`hover:bg-slate-50 ${editingId === item.id ? 'bg-orange-50' : ''}`}>
                    <td className="px-6 py-4 font-bold text-indigo-700 sticky left-0 bg-white group-hover:bg-slate-50 border-r border-slate-100 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                        {item.label}
                    </td>
                    <td className="px-6 py-4">{item.width} / {item.height} cm</td>
                    <td className="px-6 py-4 text-center font-bold">{item.count}</td>
                    <td className="px-6 py-4 text-right font-mono text-slate-700">
                        {leafArea.toFixed(2)} m²
                    </td>
                    <td className="px-6 py-4 text-right font-mono text-slate-700">
                        {frameArea.toFixed(2)} m²
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
                );
                })}
            </tbody>
            {items.length > 0 && (
                <tfoot className="bg-slate-50 font-bold text-slate-800 border-t-2 border-slate-300">
                <tr>
                    <td colSpan={2} className="px-6 py-4 text-right uppercase tracking-wider text-xs">Genel Toplam:</td>
                    <td className="px-6 py-4 text-center text-indigo-700 text-lg">{totalDoorCount} Adet</td>
                    <td className="px-6 py-4 text-right text-indigo-700">{totalLeafArea.toFixed(2)} m²</td>
                    <td className="px-6 py-4 text-right text-indigo-700">{totalFrameArea.toFixed(2)} m²</td>
                    <td></td>
                </tr>
                </tfoot>
            )}
            </table>
        </div>
      </div>

      {/* --- AKSESUAR ÖZET KARTLARI (Responsive Grid) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-all h-full group">
          <div className="p-3 bg-blue-50 rounded-full mb-3 text-blue-600 group-hover:scale-110 transition-transform">
            <Lock className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-500 uppercase mb-1">Gömme Kilit</h4>
          <div className="text-xs text-slate-400 mb-3 font-mono bg-slate-100 px-2 py-0.5 rounded">Poz: 15.465.1002</div>
          <span className="text-3xl font-black text-slate-800 tracking-tight">{lockCount}</span>
          <span className="text-xs text-slate-400 mt-1">Adet</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-all h-full group">
          <div className="p-3 bg-green-50 rounded-full mb-3 text-green-600 group-hover:scale-110 transition-transform">
            <RefreshCw className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-500 uppercase mb-1">Menteşe (x3)</h4>
          <div className="text-xs text-slate-400 mb-3 font-mono bg-slate-100 px-2 py-0.5 rounded">Poz: 15.465.1010</div>
          <span className="text-3xl font-black text-slate-800 tracking-tight">{hingeCount}</span>
          <span className="text-xs text-slate-400 mt-1">Adet</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-all h-full group">
          <div className="p-3 bg-purple-50 rounded-full mb-3 text-purple-600 group-hover:scale-110 transition-transform">
            <MousePointer className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-500 uppercase mb-1">Kapı Kolu</h4>
          <div className="text-xs text-slate-400 mb-3 font-mono bg-slate-100 px-2 py-0.5 rounded">Poz: 15.465.1008</div>
          <span className="text-3xl font-black text-slate-800 tracking-tight">{handleCount}</span>
          <span className="text-xs text-slate-400 mt-1">Takım</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-all h-full group">
          <div className="p-3 bg-orange-50 rounded-full mb-3 text-orange-600 group-hover:scale-110 transition-transform">
            <Hammer className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-500 uppercase mb-1">Stop (Nikelaj)</h4>
          <div className="text-xs text-slate-400 mb-3 font-mono bg-slate-100 px-2 py-0.5 rounded">Poz: 15.465.1013</div>
          <span className="text-3xl font-black text-slate-800 tracking-tight">{stopCount}</span>
          <span className="text-xs text-slate-400 mt-1">Adet</span>
        </div>
      </div>
    </div>
  );
};

export default DoorCalculationArea;