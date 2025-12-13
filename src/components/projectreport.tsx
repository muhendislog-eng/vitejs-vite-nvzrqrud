import React, { useMemo } from 'react';
import { 
  FileText, 
  Printer, 
  FileSpreadsheet, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Building2,
  HardHat,
  Info
} from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface MetrajItem {
  id?: number | string;
  pos: string;
  desc: string;
  unit: string;
  price: number;
  quantity: number;
  category?: string;
  [key: string]: any;
}

interface ProjectReportProps {
  staticItems: MetrajItem[];
  architecturalItems: MetrajItem[];
  projectInfo: {
    name: string;
    city: string;
    area: string;
    floors: string;
  };
}

const COLORS = ['#F97316', '#3B82F6', '#EAB308', '#6366F1'];

const ProjectReport: React.FC<ProjectReportProps> = ({ staticItems, architecturalItems, projectInfo }) => {
  
  // --- HESAPLAMALAR ---
  const { 
    staticTotal, 
    archTotal, 
    grandTotal, 
    estimatedGrandTotal, 
    electricTotal, 
    mechanicalTotal,
    categoryBreakdown 
  } = useMemo(() => {
    // 1. Ana Toplamlar
    const sTotal = staticItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const aTotal = architecturalItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const gTotal = sTotal + aTotal;

    // 2. Tahmini Diğer Giderler (%20 Kuralı: Statik+Mimari=%80 ise)
    const estGrandTotal = gTotal > 0 ? gTotal / 0.8 : 0;
    const eTotal = estGrandTotal * 0.1;
    const mTotal = estGrandTotal * 0.1;

    // 3. Kategori Bazlı Kırılım (Detaylı Analiz İçin)
    const breakdown: Record<string, number> = {};
    
    // Statik Kategoriler
    staticItems.forEach(item => {
      const cat = item.category || 'Diğer (Statik)';
      const total = item.price * item.quantity;
      if (total > 0) breakdown[cat] = (breakdown[cat] || 0) + total;
    });

    // Mimari Kategoriler
    architecturalItems.forEach(item => {
      const cat = item.category || 'Diğer (Mimari)';
      const total = item.price * item.quantity;
      if (total > 0) breakdown[cat] = (breakdown[cat] || 0) + total;
    });

    // En yüksek maliyetli 5 kategoriyi alıp grafik için hazırla
    const sortedCats = Object.entries(breakdown)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return { 
      staticTotal: sTotal, 
      archTotal: aTotal, 
      grandTotal: gTotal, 
      estimatedGrandTotal: estGrandTotal,
      electricTotal: eTotal, 
      mechanicalTotal: mTotal,
      categoryBreakdown: sortedCats
    };
  }, [staticItems, architecturalItems]);

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    // @ts-ignore
    if (!window.XLSX) {
      alert("Excel modülü yüklenemedi.");
      return;
    }

    const data = [
      ["PROJE SONUÇ RAPORU"],
      ["Tarih:", new Date().toLocaleDateString()],
      ["Proje Adı:", projectInfo.name],
      ["Şehir:", projectInfo.city],
      ["Kapalı Alan:", projectInfo.area],
      [],
      ["ÖZET TABLOSU"],
      ["Kalem", "Tutar (TL)", "Oran (%)"],
      ["Kaba İnşaat (Statik)", staticTotal, ((staticTotal / estimatedGrandTotal) * 100).toFixed(2)],
      ["Mimari İmalatlar", archTotal, ((archTotal / estimatedGrandTotal) * 100).toFixed(2)],
      ["Elektrik Tesisatı (Tahmini)", electricTotal, "10.00"],
      ["Mekanik Tesisat (Tahmini)", mechanicalTotal, "10.00"],
      ["GENEL TOPLAM", estimatedGrandTotal, "100.00"],
    ];

    // @ts-ignore
    const wb = window.XLSX.utils.book_new();
    // @ts-ignore
    const ws = window.XLSX.utils.aoa_to_sheet(data);
    
    ws['!cols'] = [{wch: 30}, {wch: 20}, {wch: 15}];

    // @ts-ignore
    window.XLSX.utils.book_append_sheet(wb, ws, "Sonuç Raporu");
    // @ts-ignore
    window.XLSX.writeFile(wb, `Proje_Raporu_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  return (
    <div className="w-full max-w-full space-y-8 animate-in fade-in duration-500 project-report-container">
       <style>
          {`
            @media print {
              body * { visibility: hidden; }
              .project-report-container, .project-report-container * { visibility: visible; }
              .project-report-container { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; }
              .print-hidden { display: none !important; }
              .bg-slate-900 { background-color: #1e293b !important; color: white !important; -webkit-print-color-adjust: exact; }
              .bg-white { background-color: white !important; }
            }
          `}
        </style>

      {/* --- BAŞLIK VE BUTONLAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-6 gap-4 print-hidden w-full">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center">
            <FileText className="w-7 h-7 mr-3 text-indigo-600" />
            Proje Sonuç Raporu
          </h2>
          <p className="text-slate-500 mt-1">
            {projectInfo.name || "İsimsiz Proje"} - Maliyet Analizi ve Bütçe Özeti
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
           <button 
            onClick={handleExportExcel}
            className="flex-1 md:flex-none flex items-center justify-center px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors shadow-lg shadow-green-900/20 active:scale-95 font-bold text-sm"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel İndir
          </button>
          <button 
            onClick={handlePrint}
            className="flex-1 md:flex-none flex items-center justify-center px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors shadow-lg shadow-slate-900/20 active:scale-95 font-bold text-sm"
          >
            <Printer className="w-4 h-4 mr-2" /> Yazdır
          </button>
        </div>
      </div>

      {/* --- PROJE KİMLİK KARTI --- */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm w-full">
         <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center border-b border-slate-100 pb-2">
            <Building2 className="w-4 h-4 mr-2" /> Proje Künyesi
         </h3>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
                <span className="block text-xs text-slate-500 mb-1">Proje Adı</span>
                <span className="block text-lg font-bold text-slate-800">{projectInfo.name || "-"}</span>
            </div>
            <div>
                <span className="block text-xs text-slate-500 mb-1">Lokasyon</span>
                <span className="block text-lg font-bold text-slate-800">{projectInfo.city || "-"}</span>
            </div>
             <div>
                <span className="block text-xs text-slate-500 mb-1">Kapalı Alan</span>
                <span className="block text-lg font-bold text-slate-800">{projectInfo.area ? `${projectInfo.area} m²` : "-"}</span>
            </div>
             <div>
                <span className="block text-xs text-slate-500 mb-1">Kat Sayısı</span>
                <span className="block text-lg font-bold text-slate-800">{projectInfo.floors || "-"}</span>
            </div>
         </div>
      </div>

      {/* --- MALİYET TABLOSU VE ANALİZ --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
         
         {/* Sol Taraf: Detaylı Tablo */}
         <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                 <h3 className="font-bold text-slate-700 flex items-center">
                    <DollarSign className="w-5 h-5 mr-2 text-green-600"/> Bütçe Dağılımı
                 </h3>
                 <span className="text-xs font-mono bg-white border border-slate-200 px-2 py-1 rounded text-slate-500">
                    {new Date().toLocaleDateString()}
                 </span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 text-slate-500 bg-slate-50/50">
                            <th className="px-6 py-3 font-medium">İş Kalemi Grubu</th>
                            <th className="px-6 py-3 font-medium text-center">Oran</th>
                            <th className="px-6 py-3 font-medium text-right">Tutar (TL)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        <tr className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-bold text-orange-600">Kaba İnşaat (Statik)</td>
                            <td className="px-6 py-4 text-center text-slate-600">
                                %{estimatedGrandTotal > 0 ? ((staticTotal / estimatedGrandTotal) * 100).toFixed(1) : '0.0'}
                            </td>
                            <td className="px-6 py-4 text-right font-mono font-bold text-slate-700">
                                {formatCurrency(staticTotal)}
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-50">
                            <td className="px-6 py-4 font-bold text-blue-600">Mimari İmalatlar</td>
                            <td className="px-6 py-4 text-center text-slate-600">
                                %{estimatedGrandTotal > 0 ? ((archTotal / estimatedGrandTotal) * 100).toFixed(1) : '0.0'}
                            </td>
                            <td className="px-6 py-4 text-right font-mono font-bold text-slate-700">
                                {formatCurrency(archTotal)}
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-50 bg-yellow-50/30">
                            <td className="px-6 py-4 font-bold text-yellow-600">Elektrik Tesisatı (Tahmini)</td>
                            <td className="px-6 py-4 text-center text-slate-600">%10.0</td>
                            <td className="px-6 py-4 text-right font-mono font-bold text-slate-700">
                                {formatCurrency(electricTotal)}
                            </td>
                        </tr>
                        <tr className="hover:bg-slate-50 bg-indigo-50/30">
                            <td className="px-6 py-4 font-bold text-indigo-600">Mekanik Tesisat (Tahmini)</td>
                            <td className="px-6 py-4 text-center text-slate-600">%10.0</td>
                            <td className="px-6 py-4 text-right font-mono font-bold text-slate-700">
                                {formatCurrency(mechanicalTotal)}
                            </td>
                        </tr>
                    </tbody>
                    <tfoot className="bg-slate-900 text-white">
                        <tr>
                            <td className="px-6 py-4 font-bold uppercase tracking-wider">Genel Toplam</td>
                            <td className="px-6 py-4 text-center font-bold text-green-400">%100</td>
                            <td className="px-6 py-4 text-right font-black text-lg tracking-tight">
                                {formatCurrency(estimatedGrandTotal)}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
         </div>

         {/* Sağ Taraf: Metrekare Maliyeti ve Özet */}
         <div className="space-y-6">
            
            {/* Metrekare Maliyet Kartı */}
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden w-full">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <TrendingUp className="w-24 h-24 text-white" />
                </div>
                <h4 className="text-indigo-100 text-sm font-bold uppercase mb-2">m² Birim Maliyeti</h4>
                <div className="text-4xl font-black tracking-tight mb-1">
                    {projectInfo.area && parseFloat(projectInfo.area) > 0 
                        ? formatCurrency(estimatedGrandTotal / parseFloat(projectInfo.area)).replace('₺', '') 
                        : "0,00"} 
                    <span className="text-xl font-medium text-indigo-200 ml-1">TL/m²</span>
                </div>
                <p className="text-xs text-indigo-200 opacity-80">Toplam Bütçe / Kapalı Alan</p>
            </div>

            {/* En Pahalı Kalemler Grafiği */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm h-[300px] flex flex-col w-full">
                <h4 className="text-slate-700 font-bold text-sm mb-4">En Yüksek Maliyetli Kalemler</h4>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="99%" height="100%">
                        <PieChart>
                            <Pie
                                data={categoryBreakdown}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {categoryBreakdown.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(val: number) => formatCurrency(val)} />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

         </div>
      </div>

      {/* --- ALT NOT --- */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3 w-full">
          <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
              <p className="font-bold mb-1">Önemli Not:</p>
              <p>Bu rapor, <strong>2025 yılı Çevre, Şehircilik ve İklim Değişikliği Bakanlığı</strong> birim fiyatları baz alınarak oluşturulmuştur. Elektrik ve Mekanik tesisat giderleri, inşaat sektöründeki genel kabullere dayanarak toplam maliyetin %20'si olarak tahmin edilmiştir.</p>
          </div>
      </div>

    </div>
  );
};

export default ProjectReport;