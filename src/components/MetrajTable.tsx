import React from 'react';
import {
  Layers,
  Hammer,
  DoorOpen,
  Building,
  Plus,
  RefreshCw,
  Pencil,
} from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

const MetrajTable = ({
  data,
  onUpdateQuantity,
  onOpenSelector,
  onAddNewItem,
  locations,
  onUpdateLocation,

  // ✅ sadece manuel pozlar için
  onEditManual,
}: any) => {

  // 1️⃣ KATEGORİYE GÖRE GRUPLAMA
  const groupedData = data.reduce((acc: any, item: any) => {
    const cat = item.category || 'Genel';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-8 w-full animate-in fade-in duration-500">
      {Object.keys(groupedData).map((category) => {
        const items = groupedData[category];

        const categoryTotal = items.reduce(
          (sum: number, item: any) => sum + item.price * item.quantity,
          0
        );

        let CategoryIcon = Layers;
        if (category.includes('Hafriyat')) CategoryIcon = Hammer;
        if (category.includes('Kapı')) CategoryIcon = DoorOpen;
        if (category.includes('Beton')) CategoryIcon = Building;

        return (
          <div
            key={category}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md w-full"
          >
            {/* KATEGORİ HEADER */}
            <div className="bg-slate-100 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white rounded-lg border border-slate-200">
                  <CategoryIcon className="w-5 h-5 text-slate-700" />
                </div>
                <h3 className="font-bold text-slate-800 text-lg">{category}</h3>
              </div>

              <div className="flex items-center space-x-4">
                <button
                  onClick={() => onAddNewItem(category)}
                  className="flex items-center px-4 py-2 bg-white text-orange-600 text-xs font-bold rounded-lg hover:bg-orange-50 border border-orange-200"
                >
                  <Plus className="w-3 h-3 mr-1.5" />
                  Poz Ekle
                </button>

                <div className="bg-slate-800 text-white px-4 py-2 rounded-lg text-sm hidden sm:block">
                  Ara Toplam:
                  <span className="font-bold text-orange-400 ml-2">
                    {formatCurrency(categoryTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* TABLO */}
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left table-fixed min-w-[1000px]">
                <thead className="bg-slate-200 text-slate-600 text-xs font-bold uppercase border-b border-slate-300">
                  <tr>
                    <th className="px-6 py-4 w-28 sticky left-0 bg-slate-200 z-20">Poz No</th>
                    <th className="px-6 py-4 min-w-[300px]">İmalat Adı</th>
                    <th className="px-6 py-4 w-20 text-center">Birim</th>
                    <th className="px-6 py-4 w-28 text-right">Birim Fiyat</th>
                    <th className="px-6 py-4 w-24 text-center">İşlem</th>
                    <th className="px-6 py-4 w-28 text-center">Miktar</th>
                    <th className="px-6 py-4 w-36 text-right">Tutar</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {items.map((item: any) => (
                    <tr key={item.id} className="hover:bg-slate-50 group">
                      {/* Poz No */}
                      <td className="px-6 py-4 sticky left-0 bg-white">
                        <span className="font-mono text-xs font-bold bg-slate-200/50 px-2 py-1 rounded">
                          {item.pos}
                        </span>
                      </td>

                      {/* Açıklama */}
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-700">
                          {item.desc}
                        </div>
                      </td>

                      {/* Birim */}
                      <td className="px-6 py-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border">
                          {item.unit}
                        </span>
                      </td>

                      {/* Birim Fiyat */}
                      <td className="px-6 py-4 text-right font-mono text-sm">
                        {formatCurrency(item.price)}
                      </td>

                      {/* İŞLEM */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          {/* DB POZ → değiştir */}
                          {!item.isManual && (
                            <button
                              onClick={() => onOpenSelector(item)}
                              className="p-2 text-slate-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg"
                              title="Pozu Değiştir"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}

                          {/* MANUEL POZ → edit */}
                          {item.isManual && (
                            <button
                              onClick={() => onEditManual(item)}
                              className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg"
                              title="Manuel Pozu Düzenle"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Miktar */}
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity || ''}
                          onChange={(e) =>
                            onUpdateQuantity(item.id, Number(e.target.value) || 0)
                          }
                          className="w-full px-3 py-2 text-sm text-center font-bold border-2 rounded-lg focus:ring-orange-500"
                        />
                      </td>

                      {/* Tutar */}
                      <td className="px-6 py-4 text-right font-bold">
                        {formatCurrency(item.price * item.quantity)}
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
