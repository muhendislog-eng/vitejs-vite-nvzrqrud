import React, { useMemo } from 'react';
import {
  FileText,
  Printer,
  FileSpreadsheet,
  TrendingUp,
  DollarSign,
  Building2,
  Info,
  Wallet,
  Layers,
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
  const {
    staticTotal,
    archTotal,
    grandTotal,
    estimatedGrandTotal,
    electricTotal,
    mechanicalTotal,
    categoryBreakdown,
  } = useMemo(() => {
    const sTotal = staticItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const aTotal = architecturalItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const gTotal = sTotal + aTotal;

    const estGrandTotal = gTotal > 0 ? gTotal / 0.8 : 0;
    const eTotal = estGrandTotal * 0.1;
    const mTotal = estGrandTotal * 0.1;

    const breakdown: Record<string, number> = {};

    staticItems.forEach((item) => {
      const cat = item.category || 'Diğer (Statik)';
      const total = item.price * item.quantity;
      if (total > 0) breakdown[cat] = (breakdown[cat] || 0) + total;
    });

    architecturalItems.forEach((item) => {
      const cat = item.category || 'Diğer (Mimari)';
      const total = item.price * item.quantity;
      if (total > 0) breakdown[cat] = (breakdown[cat] || 0) + total;
    });

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
      categoryBreakdown: sortedCats,
    };
  }, [staticItems, architecturalItems]);

  const areaNum = useMemo(() => {
    const v = (projectInfo.area || '').replace(',', '.');
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [projectInfo.area]);

  const costPerM2 = areaNum > 0 ? estimatedGrandTotal / areaNum : 0;

  const handlePrint = () => window.print();

  const handleExportExcel = () => {
    // @ts-ignore
    if (!window.XLSX) {
      alert('Excel modülü yüklenemedi.');
      return;
    }

    const data = [
      ['PROJE SONUÇ RAPORU'],
      ['Tarih:', new Date().toLocaleDateString()],
      ['Proje Adı:', projectInfo.name],
      ['Şehir:', projectInfo.city],
      ['Kapalı Alan:', projectInfo.area],
      [],
      ['ÖZET TABLOSU'],
      ['Kalem', 'Tutar (TL)', 'Oran (%)'],
      ['Kaba İnşaat (Statik)', staticTotal, estimatedGrandTotal > 0 ? ((staticTotal / estimatedGrandTotal) * 100).toFixed(2) : '0.00'],
      ['Mimari İmalatlar', archTotal, estimatedGrandTotal > 0 ? ((archTotal / estimatedGrandTotal) * 100).toFixed(2) : '0.00'],
      ['Elektrik Tesisatı (Tahmini)', electricTotal, '10.00'],
      ['Mekanik Tesisat (Tahmini)', mechanicalTotal, '10.00'],
      ['GENEL TOPLAM', estimatedGrandTotal, '100.00'],
    ];

    // @ts-ignore
    const wb = window.XLSX.utils.book_new();
    // @ts-ignore
    const ws = window.XLSX.utils.aoa_to_sheet(data);

    ws['!cols'] = [{ wch: 34 }, { wch: 20 }, { wch: 12 }];

    // @ts-ignore
    window.XLSX.utils.book_append_sheet(wb, ws, 'Sonuç Raporu');
    // @ts-ignore
    window.XLSX.writeFile(wb, `Proje_Raporu_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="w-full">
      {/* PRINT: sadece #print-area görünür */}
      <style>
        {`
          /* kartların sayfa bölünmesini azalt */
          .print-card { break-inside: avoid; page-break-inside: avoid; }

          @media print {
            @page { margin: 12mm; }
            body * { visibility: hidden !important; }
            #print-area, #print-area * { visibility: visible !important; }
            #print-area { position: absolute; left: 0; top: 0; width: 100%; }
            .print-hidden { display: none !important; }
            .print-no-shadow { box-shadow: none !important; }
          }
        `}
      </style>

      {/* Sayfa konteyneri: responsive genişlik */}
      <div className="mx-auto w-full max-w-screen-2xl px-3 sm:px-6 lg:px-8 py-5 sm:py-6">
        {/* ÜST BAR (ekranda var, yazdırmada yok) */}
        <div className="print-hidden flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-200 pb-5 mb-6">
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-3">
              <span className="p-2 rounded-xl bg-indigo-50 border border-indigo-100">
                <FileText className="w-5 h-5 text-indigo-600" />
              </span>
              Proje Sonuç Raporu
            </h2>
            <p className="text-slate-500 mt-1 text-sm sm:text-base truncate">
              {projectInfo.name || 'İsimsiz Proje'} — Maliyet Analizi ve Bütçe Özeti
            </p>
          </div>

          <div className="flex gap-3 w-full lg:w-auto">
            <button
              onClick={handleExportExcel}
              className="flex-1 lg:flex-none inline-flex items-center justify-center px-4 sm:px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-900/20 active:scale-95 font-bold text-sm"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel İndir
            </button>

            <button
              onClick={handlePrint}
              className="flex-1 lg:flex-none inline-flex items-center justify-center px-4 sm:px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors shadow-lg shadow-slate-900/20 active:scale-95 font-bold text-sm"
            >
              <Printer className="w-4 h-4 mr-2" />
              Yazdır
            </button>
          </div>
        </div>

        {/* ===== PRINT AREA BAŞLANGIÇ ===== */}
        <div id="print-area" className="space-y-6 sm:space-y-8">
          {/* ÜST KPI / HERO */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Proje Künyesi */}
            <div className="print-card print-no-shadow lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm min-w-0">
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-sm font-black text-slate-700 flex items-center">
                  <Building2 className="w-4 h-4 mr-2 text-slate-400" />
                  Proje Künyesi
                </h3>
                <span className="text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md">
                  {new Date().toLocaleDateString()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="min-w-0">
                  <div className="text-xs text-slate-500 font-bold mb-1">Proje Adı</div>
                  <div className="text-base sm:text-lg font-black text-slate-800 truncate">
                    {projectInfo.name || '-'}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-slate-500 font-bold mb-1">Lokasyon</div>
                  <div className="text-base sm:text-lg font-black text-slate-800 truncate">
                    {projectInfo.city || '-'}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-slate-500 font-bold mb-1">Kapalı Alan</div>
                  <div className="text-base sm:text-lg font-black text-slate-800">
                    {projectInfo.area ? `${projectInfo.area} m²` : '-'}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-slate-500 font-bold mb-1">Kat Sayısı</div>
                  <div className="text-base sm:text-lg font-black text-slate-800">
                    {projectInfo.floors || '-'}
                  </div>
                </div>
              </div>

              {/* Mini özet satırı */}
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Statik</div>
                  <div className="font-black text-slate-800">{formatCurrency(staticTotal)}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Mimari</div>
                  <div className="font-black text-slate-800">{formatCurrency(archTotal)}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Toplam</div>
                  <div className="font-black text-slate-800">{formatCurrency(grandTotal)}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
                  <div className="text-[11px] font-bold text-slate-500 uppercase">Tahmini</div>
                  <div className="font-black text-slate-800">{formatCurrency(estimatedGrandTotal)}</div>
                </div>
              </div>
            </div>

            {/* m² Birim maliyet kartı */}
            <div className="print-card print-no-shadow bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden min-w-0">
              <div className="absolute -top-6 -right-6 opacity-15">
                <TrendingUp className="w-24 h-24 text-white" />
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="p-2 rounded-xl bg-white/10 border border-white/10">
                  <Wallet className="w-4 h-4 text-white" />
                </span>
                <div className="text-xs font-bold text-indigo-100 uppercase tracking-wider">m² Birim Maliyeti</div>
              </div>

              <div className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                {areaNum > 0 ? formatCurrency(costPerM2).replace('₺', '') : '0,00'}
                <span className="text-base sm:text-lg font-bold text-indigo-200 ml-1">TL/m²</span>
              </div>

              <p className="text-xs sm:text-sm text-indigo-100/80 mt-2">
                Toplam Bütçe / Kapalı Alan
              </p>

              <div className="mt-5 bg-white/10 border border-white/10 rounded-xl p-3 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-indigo-100 font-bold">Tahmini Genel Toplam</span>
                  <span className="font-black">{formatCurrency(estimatedGrandTotal)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bütçe dağılımı + Grafik */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
            {/* Tablo */}
            <div className="print-card print-no-shadow xl:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm min-w-0">
              <div className="bg-slate-50 px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-3">
                <h3 className="font-black text-slate-700 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2 text-emerald-600" />
                  Bütçe Dağılımı
                </h3>
                <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md inline-flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5" />
                  Statik + Mimari = %80 varsayımı
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[620px]">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500 bg-slate-50/50">
                      <th className="px-5 sm:px-6 py-3 font-bold">İş Kalemi Grubu</th>
                      <th className="px-5 sm:px-6 py-3 font-bold text-center">Oran</th>
                      <th className="px-5 sm:px-6 py-3 font-bold text-right">Tutar (TL)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="px-5 sm:px-6 py-4 font-black text-orange-600">Kaba İnşaat (Statik)</td>
                      <td className="px-5 sm:px-6 py-4 text-center text-slate-600 font-bold">
                        %{estimatedGrandTotal > 0 ? ((staticTotal / estimatedGrandTotal) * 100).toFixed(1) : '0.0'}
                      </td>
                      <td className="px-5 sm:px-6 py-4 text-right font-mono font-black text-slate-800">
                        {formatCurrency(staticTotal)}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50">
                      <td className="px-5 sm:px-6 py-4 font-black text-blue-600">Mimari İmalatlar</td>
                      <td className="px-5 sm:px-6 py-4 text-center text-slate-600 font-bold">
                        %{estimatedGrandTotal > 0 ? ((archTotal / estimatedGrandTotal) * 100).toFixed(1) : '0.0'}
                      </td>
                      <td className="px-5 sm:px-6 py-4 text-right font-mono font-black text-slate-800">
                        {formatCurrency(archTotal)}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 bg-amber-50/40">
                      <td className="px-5 sm:px-6 py-4 font-black text-amber-700">Elektrik Tesisatı (Tahmini)</td>
                      <td className="px-5 sm:px-6 py-4 text-center text-slate-600 font-bold">%10.0</td>
                      <td className="px-5 sm:px-6 py-4 text-right font-mono font-black text-slate-800">
                        {formatCurrency(electricTotal)}
                      </td>
                    </tr>

                    <tr className="hover:bg-slate-50 bg-indigo-50/40">
                      <td className="px-5 sm:px-6 py-4 font-black text-indigo-700">Mekanik Tesisat (Tahmini)</td>
                      <td className="px-5 sm:px-6 py-4 text-center text-slate-600 font-bold">%10.0</td>
                      <td className="px-5 sm:px-6 py-4 text-right font-mono font-black text-slate-800">
                        {formatCurrency(mechanicalTotal)}
                      </td>
                    </tr>
                  </tbody>

                  <tfoot className="bg-slate-900 text-white">
                    <tr>
                      <td className="px-5 sm:px-6 py-4 font-black uppercase tracking-wider">Genel Toplam</td>
                      <td className="px-5 sm:px-6 py-4 text-center font-black text-emerald-300">%100</td>
                      <td className="px-5 sm:px-6 py-4 text-right font-black text-lg tracking-tight">
                        {formatCurrency(estimatedGrandTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Grafik kartı */}
            <div className="print-card print-no-shadow bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm min-w-0 overflow-hidden">
              <div className="flex items-center justify-between gap-3 mb-4 border-b border-slate-100 pb-3">
                <h4 className="text-slate-800 font-black text-sm flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <TrendingUp className="w-4 h-4 text-slate-500" />
                  </span>
                  En Yüksek Maliyetli Kalemler
                </h4>
                <span className="text-[11px] font-bold text-slate-500">Top 5</span>
              </div>

              <div className="w-full h-[260px] sm:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={6}
                      dataKey="value"
                    >
                      {categoryBreakdown.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: number) => formatCurrency(val)} />
                    <Legend verticalAlign="bottom" height={44} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* küçük özet */}
              <div className="mt-3 text-xs text-slate-500">
                Toplam kalem sayısı: <span className="font-bold">{staticItems.length + architecturalItems.length}</span>
              </div>
            </div>
          </div>

          {/* Alt Not */}
          <div className="print-card print-no-shadow bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <p className="font-black mb-1">Önemli Not</p>
              <p className="leading-relaxed">
                Bu rapor, <strong>2025 yılı Çevre, Şehircilik ve İklim Değişikliği Bakanlığı</strong> birim fiyatları
                baz alınarak oluşturulmuştur. Elektrik ve Mekanik tesisat giderleri, sektördeki genel kabule göre
                toplam maliyetin <strong>%20</strong>&apos;si olarak tahmin edilmiştir.
              </p>
            </div>
          </div>
        </div>
        {/* ===== PRINT AREA BİTİŞ ===== */}
      </div>
    </div>
  );
};

export default ProjectReport;
