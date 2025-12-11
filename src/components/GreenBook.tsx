import React, { useState, useEffect } from 'react';
import { 
  Book, 
  FileSpreadsheet, 
  Printer 
} from 'lucide-react';

// Tip tanımları (Diğer dosyalarla uyumlu olması için)
interface MetrajItem {
  id?: number | string;
  pos: string;
  desc: string;
  unit: string;
  price: number;
  quantity: number;
  [key: string]: any;
}

interface DoorItem {
  label: string;
  width: string;
  height: string;
  count: string;
  [key: string]: any;
}

interface WindowItem {
  type: 'pvc' | 'alu';
  label: string;
  width: string;
  height: string;
  count: string;
  middleRegister?: string;
  [key: string]: any;
}

interface GreenBookProps {
  staticItems: MetrajItem[];
  architecturalItems: MetrajItem[];
  doorItems: DoorItem[];
  windowItems: WindowItem[];
}

const GreenBook: React.FC<GreenBookProps> = ({ 
  staticItems, 
  architecturalItems, 
  doorItems, 
  windowItems 
}) => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    // Generate Green Book Data
    let generatedData: any[] = [];
    
    // 1. Statik Kalemler
    staticItems.forEach(item => {
        if(item.quantity > 0) {
            generatedData.push({
                type: 'static',
                pos: item.pos,
                desc: item.desc,
                unit: item.unit,
                width: '-',
                height: '-',
                count: '1',
                deduction: '-',
                total: item.quantity
            });
        }
    });

    // 2. Mimari Kalemler
    architecturalItems.forEach(item => {
         if(item.quantity > 0) {
            generatedData.push({
                type: 'arch',
                pos: item.pos,
                desc: item.desc,
                unit: item.unit,
                width: '-',
                height: '-',
                count: '1',
                deduction: '-',
                total: item.quantity
            });
        }
    });

    // 3. Kapılar (Detailed)
    doorItems.forEach(item => {
        const widthM = (parseFloat(item.width) || 0) / 100;
        const heightM = (parseFloat(item.height) || 0) / 100;
        const count = parseFloat(item.count) || 0;
        const label = item.label || 'Kapı';

        // 3a. Kapı Kanadı (Alan)
        const leafArea = widthM * heightM;
        if (leafArea > 0) {
             generatedData.push({
                type: 'door',
                pos: '15.510.1103',
                desc: `${label} - Kapı Kanadı`,
                unit: 'm²',
                width: widthM.toFixed(2),
                height: heightM.toFixed(2),
                count: count,
                deduction: '-',
                total: (leafArea * count).toFixed(2)
            });
        }
        // ... (Diğer kapı hesaplamaları)
         // 3c. Kilit (Basitleştirilmiş örnek için)
         generatedData.push({
            type: 'door',
            pos: '15.465.1002',
            desc: `${label} - Kilit`,
            unit: 'Adet',
            width: '-',
            height: '-',
            count: count,
            deduction: '-',
            total: count
         });
    });
    
    // 4. Pencereler (Detailed)
    windowItems.forEach(item => {
        const widthM = (parseFloat(item.width) || 0) / 100;
        const heightM = (parseFloat(item.height) || 0) / 100;
        const count = parseFloat(item.count) || 0;
        const label = item.label || 'Pencere';
        
        let weight = 0;
        let pos = '';
        let desc = '';

        if (item.type === 'pvc') {
            pos = '15.455.1001';
            desc = `${label} - PVC Doğrama`;
            weight = 2 * (widthM + heightM) * 1.1 * 2;
        } else {
            pos = '15.460.1010';
            desc = `${label} - Alüminyum Doğrama`;
            // Basitleştirilmiş Alüminyum hesabı (Detaylar App.tsx'deki lojik ile aynı olmalı)
            const term1 = (widthM * heightM) * 2 * 1.596;
            const term2 = ((widthM - 0.16) + (heightM - 0.16)) * 2 * 2.186;
            weight = term1 + term2;
        }

        if (weight > 0) {
             generatedData.push({
                type: 'window',
                pos: pos,
                desc: desc,
                unit: 'kg',
                width: widthM.toFixed(2),
                height: heightM.toFixed(2),
                count: count,
                deduction: '-',
                total: (weight * count).toFixed(2)
            });
        }
    });

    setData(generatedData);

  }, [staticItems, architecturalItems, doorItems, windowItems]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportToExcel = () => {
      // @ts-ignore
      if (!window.XLSX) {
        alert("Excel modülü henüz yüklenmedi.");
        return;
      }

      const excelData = data.map(item => ({
        "Poz No": item.pos,
        "İmalatın Cinsi / Açıklama": item.desc,
        "Birim": item.unit,
        "En": item.width,
        "Boy": item.height,
        "Yükseklik": "-",
        "Adet": item.count,
        "Azı (Tenhilat)": item.deduction,
        "Çoğu (Toplam)": item.total
      }));

      // @ts-ignore
      const wb = window.XLSX.utils.book_new();
      // @ts-ignore
      const ws = window.XLSX.utils.json_to_sheet(excelData);
      
      ws['!cols'] = [
        {wch: 15}, {wch: 50}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 10}, {wch: 15}, {wch: 15}
      ];

      // @ts-ignore
      window.XLSX.utils.book_append_sheet(wb, ws, "Yeşil Defter");
      // @ts-ignore
      window.XLSX.writeFile(wb, "Yesil_Defter.xlsx");
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 w-full print:border-none print:shadow-none print:w-full print:p-0 dashboard-container">
        <style>
          {`
            @media print {
              body * { visibility: hidden; }
              .dashboard-container, .dashboard-container * { visibility: visible; }
              .dashboard-container { position: absolute; left: 0; top: 0; width: 100%; }
              .print-hidden { display: none !important; }
            }
          `}
        </style>
        <div className="green-book-container w-full">
            <div className="flex justify-between items-center mb-6 print-hidden">
                <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                    <Book className="w-6 h-6 mr-2 text-green-600"/> Yeşil Defter
                </h2>
                <div className="flex space-x-2">
                    <button 
                        onClick={handleExportToExcel} 
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md"
                    >
                        <FileSpreadsheet className="w-4 h-4 mr-2"/> Excel İndir
                    </button>
                    <button 
                        onClick={handlePrint} 
                        className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-md"
                    >
                        <Printer className="w-4 h-4 mr-2"/> Yazdır / PDF
                    </button>
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block mb-8 text-center">
                <h1 className="text-2xl font-bold border-b-2 border-black pb-2 mb-2">YEŞİL DEFTER (METRAJ CETVELİ)</h1>
                <div className="flex justify-between text-sm">
                    <span>Tarih: {new Date().toLocaleDateString()}</span>
                    <span>Sayfa No: 1</span>
                </div>
            </div>

            <div className="overflow-x-auto w-full">
                <table className="w-full text-left border-collapse border border-slate-300 text-sm table-fixed min-w-[1000px]">
                    <thead>
                        <tr className="bg-slate-100 text-slate-700">
                            <th className="border border-slate-300 px-4 py-2 w-24">Poz No</th>
                            <th className="border border-slate-300 px-4 py-2 w-auto">İmalatın Cinsi / Açıklama</th>
                            <th className="border border-slate-300 px-2 py-2 w-16 text-center">Birim</th>
                            <th className="border border-slate-300 px-2 py-2 w-16 text-center">En</th>
                            <th className="border border-slate-300 px-2 py-2 w-16 text-center">Boy</th>
                            <th className="border border-slate-300 px-2 py-2 w-16 text-center">Yük.</th>
                            <th className="border border-slate-300 px-2 py-2 w-16 text-center">Adet</th>
                            <th className="border border-slate-300 px-4 py-2 w-24 text-right">Azı (Tenhilat)</th>
                            <th className="border border-slate-300 px-4 py-2 w-24 text-right bg-green-50">Çoğu (Toplam)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr><td colSpan={9} className="text-center py-8 text-slate-400">Veri bulunamadı.</td></tr>
                        ) : (
                            data.map((row, index) => (
                                <tr key={index} className="hover:bg-slate-50 break-inside-avoid">
                                    <td className="border border-slate-300 px-4 py-2 font-mono text-xs font-bold">{row.pos}</td>
                                    <td className="border border-slate-300 px-4 py-2">{row.desc}</td>
                                    <td className="border border-slate-300 px-2 py-2 text-center">{row.unit}</td>
                                    <td className="border border-slate-300 px-2 py-2 text-center font-mono">{row.width}</td>
                                    <td className="border border-slate-300 px-2 py-2 text-center font-mono">{row.height}</td>
                                    <td className="border border-slate-300 px-2 py-2 text-center font-mono">-</td>
                                    <td className="border border-slate-300 px-2 py-2 text-center font-bold">{row.count}</td>
                                    <td className="border border-slate-300 px-4 py-2 text-right font-mono text-red-600">{row.deduction !== '-' ? row.deduction : ''}</td>
                                    <td className="border border-slate-300 px-4 py-2 text-right font-bold bg-green-50 font-mono">{formatCurrency(row.total).replace('₺', '')}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            <div className="mt-8 text-sm text-slate-500 hidden print:block text-center">
                Bu belge otomatik olarak oluşturulmuştur.
            </div>
        </div>
    </div>
  );
};

export default GreenBook;