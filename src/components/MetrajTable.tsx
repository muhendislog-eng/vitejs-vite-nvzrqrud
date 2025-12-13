import React from 'react';
import {
  Layers,
  Hammer,
  DoorOpen,
  Building,
  Plus,
  RefreshCw,
  Pencil, // ✅ yeni
} from 'lucide-react';
import { formatCurrency, getFlattenedLocations } from '../utils/helpers';

const MetrajTable = ({
  data,
  onUpdateQuantity,
  onOpenSelector,
  onAddNewItem,
  locations,
  onUpdateLocation,

  // ✅ yeni prop: sadece manuel pozları düzenlemek için
  onEditManual,
}: any) => {
  // 1. Verileri Kategorilere Göre Gruplama
  const groupedData = data.reduce((acc: any, item: any) => {
    const cat = item.category || 'Genel';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // 2. Lokasyon Listesini Düzleştirme (Select kutusu için)
  // Not: Şu an tabloda location seçimi yok; mevcut kodun düzenini bozmamak için bırakıyorum.
  const locationOptions = getFlattenedLocations(locations);

  return (
    <div className="space-y-8 w-full animate-in fade-in duration-500">
      {Object.keys(groupedData).map((category) => {
        const items = groupedData[category];

        // Kategori Ara Toplamı
        const categoryTotal = items.reduce(
          (sum: number, item: any) => sum + item.price * item.quantity,
          0
        );

        // Kategoriye Göre İkon Seçimi
        let CategoryIcon = Layers;
        if (category.includes('Hafriyat')) CategoryIcon = Hammer;
        if (category.includes('Kapı')) CategoryIcon = DoorOpen;
        if (category.includes('Beton')) CategoryIcon = Building;

        return (
          <div
            key={category}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-shadow hover:shadow-md w-full"
          >
            {/* --- KATEGORİ BAŞLIĞI --- */}
            <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex justify-between items-center backdrop-blur-sm">
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

            {/* --- TABLO ALANI (Responsive Wrapper) --- */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left table-fixed min-w-[1000px]">
                <thead className="bg-slate-200 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-300">
                  <tr>
                    <th className="px-6 py-4 w-28 sticky left-0 bg-slate-200 z-20 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                      Poz No
                    </th>
                    <th className="px-6 py-4 w-auto min-w-[300px]">İmalat Adı</th>
                    <th className="px-6 py-4 w-20 text-center">Birim</th>
                    <th className="px-6 py-4 w-28 text-right">Birim Fiyat</th>
                    <th className="px-6 py-4 w-24 text-center">İşlem</th>
                    <th className="px-6 py-4 w-28 text-center">Miktar</th>
                    <th className="px-6 py-4 w-36 text-right">Tutar</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {items.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                      {/* 1. Poz No (Yapışkan Sütun) */}
                      <td className="px-6 py-4 sticky left-0 bg-white group-hover:bg-slate-50 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-r border-slate-100">
                        <span className="font-mono text-xs font-bold text-slate-600 bg-slate-200/50 px-2 py-1 rounded">
                          {item.pos}
                        </span>
                      </td>

                      {/* 2. Açıklama */}
                      <td className="px-6 py-4 whitespace-normal min-w-[300px]">
                        <div className="text-sm font-medium text-slate-700 leading-relaxed">
                          {item.desc}
                        </div>
                      </td>

                      {/* 3. Birim */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          {item.unit}
                        </span>
                      </td>

                      {/* 4. Birim Fiyat */}
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono text-sm text-slate-600 font-medium">
                          {formatCurrency(item.price)}
                        </span>
                      </td>

                      {/* 5. İşlem */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {/* Mevcut: Pozu Değiştir */}
                          <button
                            type="button"
                            onClick={() => onOpenSelector(item)}
                            className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-all active:scale-95"
                            title="Pozu Değiştir"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>

                          {/* ✅ Yeni: Sadece manuel eklenenlerde düzenle */}
                          {item?.isManual && typeof onEditManual === 'function' && (
                            <button
                              type="button"
                              onClick={() => onEditManual(item)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all active:scale-95"
                              title="Manuel pozu düzenle"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* 6. Miktar */}
                      <td className="px-6 py-4">
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.quantity || ''}
                            onChange={(e) =>
                              onUpdateQuantity(item.id, parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-3 py-2 text-sm text-center font-bold text-slate-800 bg-white border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all shadow-sm focus:shadow-md"
                            placeholder="0"
                          />
                        </div>
                      </td>

                      {/* 7. Tutar */}
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-slate-900">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </td>
                    </tr>
                  ))}
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
