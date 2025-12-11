import React, { useState } from 'react';
import { RefreshCcw, DoorOpen, Plus, Pencil, Trash2, Lock, RefreshCw, MousePointer, Hammer } from 'lucide-react';
import { getFlattenedLocations } from '../utils/helpers';

const DoorCalculationArea = ({ items, setItems, onUpdateQuantities, locations }: any) => {
  const [newItem, setNewItem] = useState({ label: '', width: '', height: '', count: '', mahal: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const locationOptions = getFlattenedLocations(locations);

  const handleAddOrUpdateItem = () => {
    if (newItem.label && newItem.count) {
      if (editingId) {
        setItems(items.map((item: any) => item.id === editingId ? { ...newItem, id: editingId } : item));
        setEditingId(null);
      } else {
        setItems([...items, { ...newItem, id: Date.now() }]);
      }
      setNewItem({ label: '', width: '', height: '', count: '', mahal: '' });
    }
  };

  const handleEditItem = (item: any) => {
    setNewItem({ 
      label: item.label, 
      width: item.width, 
      height: item.height, 
      count: item.count,
      mahal: item.mahal || ''
    });
    setEditingId(item.id);
  };

  const handleRemoveItem = (id: number) => {
    setItems(items.filter((item: any) => item.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setNewItem({ label: '', width: '', height: '', count: '', mahal: '' });
    }
  };

  const calculateRowValues = (item: any) => {
    const widthM = (parseFloat(item.width) || 0) / 100;
    const heightM = (parseFloat(item.height) || 0) / 100;
    const count = parseFloat(item.count) || 0;
    const leafArea = widthM * heightM * count;
    const frameArea = ((2 * heightM) + widthM) * 0.34 * count;
    return { leafArea, frameArea };
  };

  const totalDoorCount = items.reduce((sum: number, item: any) => sum + (parseFloat(item.count) || 0), 0);
  const totalLeafArea = items.reduce((sum: number, item: any) => sum + calculateRowValues(item).leafArea, 0);
  const totalFrameArea = items.reduce((sum: number, item: any) => sum + calculateRowValues(item).frameArea, 0);

  const lockCount = totalDoorCount * 1;
  const hingeCount = totalDoorCount * 3;
  const handleCount = totalDoorCount * 1;
  const stopCount = totalDoorCount * 1;

  const handleTransfer = () => {
    const updates = {
      "15.510.1103": totalLeafArea,
      "15.510.1001": totalFrameArea,
      "15.510.1101": totalFrameArea,
      "15.465.1002": lockCount,
      "15.465.1010": hingeCount,
      "15.465.1008": handleCount,
      "15.465.1013": stopCount
    };
    onUpdateQuantities(updates);
    alert("Hesaplanan kapı metrajları listeye başarıyla aktarıldı!");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full">
      <div className="flex justify-between items-end border-b border-slate-200 pb-2">
         <h2 className="text-xl font-bold text-slate-800 flex items-center">
           <DoorOpen className="w-6 h-6 mr-2 text-indigo-600" />
           Kapı Metrajı
         </h2>
         <button onClick={handleTransfer} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold transition-all shadow-md active:scale-95">
          <RefreshCcw className="w-4 h-4 mr-2" /> Listeye Aktar
        </button>
      </div>
      
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 w-full">
        <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 tracking-wider flex items-center">
             {editingId ? <Pencil className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
             {editingId ? 'Kapı Düzenle' : 'Yeni Kapı Ekle'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">Mahal</label>
            <select value={newItem.mahal} onChange={e => setNewItem({...newItem, mahal: e.target.value})} className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="">Genel</option>
              {locationOptions.map((loc: any) => (<option key={loc.id} value={loc.name}>{loc.name}</option>))}
            </select>
          </div>
          <div><label className="block text-xs font-bold text-slate-500 mb-1">Tip (Örn: K1)</label><input type="text" value={newItem.label} onChange={e => setNewItem({...newItem, label: e.target.value})} className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="K1" /></div>
          <div><label className="block text-xs font-bold text-slate-500 mb-1">En (cm)</label><input type="number" value={newItem.width} onChange={e => setNewItem({...newItem, width: e.target.value})} className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="90" /></div>
          <div><label className="block text-xs font-bold text-slate-500 mb-1">Boy (cm)</label><input type="number" value={newItem.height} onChange={e => setNewItem({...newItem, height: e.target.value})} className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="220" /></div>
          <div><label className="block text-xs font-bold text-slate-500 mb-1">Adet</label><input type="number" value={newItem.count} onChange={e => setNewItem({...newItem, count: e.target.value})} className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0" /></div>
          <button onClick={handleAddOrUpdateItem} className={`flex items-center justify-center p-2.5 text-white rounded-lg font-bold transition-colors ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}>{editingId ? 'Güncelle' : 'Ekle'}</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
        <table className="w-full text-left text-sm table-fixed min-w-[800px]">
          <thead className="bg-slate-200 text-slate-600 text-xs font-bold uppercase">
            <tr>
              <th className="px-6 py-4 w-32">Mahal</th>
              <th className="px-6 py-4 w-32">Tip</th>
              <th className="px-6 py-4 w-32">Ebat (En/Boy)</th>
              <th className="px-6 py-4 w-24 text-center">Adet</th>
              <th className="px-6 py-4 w-40 text-right">Kapı Kanadı (m²)</th>
              <th className="px-6 py-4 w-40 text-right">Kasa+Pervaz (m²)</th>
              <th className="px-6 py-4 w-32 text-right">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-8 text-center text-slate-400">Henüz veri girişi yapılmadı.</td></tr>
            ) : items.map((item: any) => {
              const { leafArea, frameArea } = calculateRowValues(item);
              return (
                <tr key={item.id} className={`hover:bg-slate-50 ${editingId === item.id ? 'bg-orange-50' : ''}`}>
                  <td className="px-6 py-4 text-slate-500 text-xs font-mono">{item.mahal || '-'}</td>
                  <td className="px-6 py-4 font-bold text-indigo-700">{item.label}</td>
                  <td className="px-6 py-4">{item.width} / {item.height} cm</td>
                  <td className="px-6 py-4 text-center font-bold">{item.count}</td>
                  <td className="px-6 py-4 text-right font-mono text-slate-700">{leafArea.toFixed(2)} m²</td>
                  <td className="px-6 py-4 text-right font-mono text-slate-700">{frameArea.toFixed(2)} m²</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => handleEditItem(item)} className="text-blue-500 hover:text-blue-700 p-1 hover:bg-blue-50 rounded"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
           {items.length > 0 && (
            <tfoot className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300">
              <tr>
                <td colSpan={3} className="px-6 py-3 text-right uppercase tracking-wider">Genel Toplam:</td>
                <td className="px-6 py-3 text-center text-indigo-700">{totalDoorCount} Adet</td>
                <td className="px-6 py-3 text-right text-indigo-700">{totalLeafArea.toFixed(2)} m²</td>
                <td className="px-6 py-3 text-right text-indigo-700">{totalFrameArea.toFixed(2)} m²</td>
                <td></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="p-3 bg-blue-50 rounded-full mb-3 text-blue-600"><Lock className="w-6 h-6" /></div>
          <h4 className="text-sm font-bold text-slate-500 uppercase">Gömme Kilit</h4>
          <div className="text-xs text-slate-400 mb-2 font-mono bg-slate-100 px-2 py-0.5 rounded">Poz: 15.465.1002</div>
          <span className="text-2xl font-black text-slate-800">{lockCount}</span>
          <span className="text-xs text-slate-400">Adet</span>
        </div>
         <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="p-3 bg-green-50 rounded-full mb-3 text-green-600"><RefreshCw className="w-6 h-6" /></div>
          <h4 className="text-sm font-bold text-slate-500 uppercase">Menteşe (x3)</h4>
          <div className="text-xs text-slate-400 mb-2 font-mono bg-slate-100 px-2 py-0.5 rounded">Poz: 15.465.1010</div>
          <span className="text-2xl font-black text-slate-800">{hingeCount}</span>
          <span className="text-xs text-slate-400">Adet</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="p-3 bg-purple-50 rounded-full mb-3 text-purple-600"><MousePointer className="w-6 h-6" /></div>
          <h4 className="text-sm font-bold text-slate-500 uppercase">Kapı Kolu</h4>
          <div className="text-xs text-slate-400 mb-2 font-mono bg-slate-100 px-2 py-0.5 rounded">Poz: 15.465.1008</div>
          <span className="text-2xl font-black text-slate-800">{handleCount}</span>
          <span className="text-xs text-slate-400">Takım</span>
        </div>
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="p-3 bg-orange-50 rounded-full mb-3 text-orange-600"><Hammer className="w-6 h-6" /></div>
          <h4 className="text-sm font-bold text-slate-500 uppercase">Stop (Nikelaj)</h4>
          <div className="text-xs text-slate-400 mb-2 font-mono bg-slate-100 px-2 py-0.5 rounded">Poz: 15.465.1013</div>
          <span className="text-2xl font-black text-slate-800">{stopCount}</span>
          <span className="text-xs text-slate-400">Adet</span>
        </div>
      </div>
    </div>
  );
};