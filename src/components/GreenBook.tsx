import React, { useState, useEffect } from 'react';
import { Book, FileSpreadsheet, Printer, Calculator } from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

// --- TİP TANIMLARI ---
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
    id: number;
    label: string;
    width: string;
    height: string;
    count: string;
    [key: string]: any;
}

interface WindowItem {
    id: number;
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
    mechanicalItems: MetrajItem[];
    electricalItems: MetrajItem[];
    doorItems: DoorItem[];
    windowItems: WindowItem[];
}

const GreenBook: React.FC<GreenBookProps> = ({
    staticItems,
    architecturalItems,
    mechanicalItems,
    electricalItems,
    doorItems,
    windowItems
}) => {
    const [data, setData] = useState<any[]>([]);

    // Verileri işleyip tek bir liste haline getiren useEffect
    useEffect(() => {
        let generatedData: any[] = [];

        // --- 1. STATİK İMALATLAR ---
        staticItems.forEach((item: any) => {
            // Miktarı 0 olanları listeye almıyoruz
            if (item.quantity > 0) {
                generatedData.push({
                    source: 'Statik',
                    pos: item.pos,
                    desc: item.desc,
                    unit: item.unit,
                    width: '-', // Statik metrajda genellikle en/boy detayı girilmez, direkt miktar girilir
                    height: '-',
                    count: '1', // Toplam miktar girildiği için adet 1 kabul edilir
                    deduction: '-', // Minha
                    total: item.quantity
                });
            }
        });

        // --- 2. MİMARİ İMALATLAR ---
        architecturalItems.forEach((item: any) => {
            if (item.quantity > 0) {
                generatedData.push({
                    source: 'Mimari',
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

        // --- 3. MEKANİK İMALATLAR ---
        mechanicalItems.forEach((item: any) => {
            if (item.quantity > 0) {
                generatedData.push({
                    source: 'Mekanik',
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

        // --- 4. ELEKTRİK İMALATLAR ---
        electricalItems.forEach((item: any) => {
            if (item.quantity > 0) {
                generatedData.push({
                    source: 'Elektrik',
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

        // --- 3. KAPI İMALATLARI (Detaylı Analiz) ---
        // Kapı modülünden gelen her bir kapı tipi için alt imalatları oluşturuyoruz
        doorItems.forEach((item: any) => {
            const widthM = (parseFloat(item.width) || 0) / 100; // cm -> m
            const heightM = (parseFloat(item.height) || 0) / 100; // cm -> m
            const count = parseFloat(item.count) || 0;
            const label = item.label || 'Tanımsız Kapı';

            if (count > 0) {
                // 3a. Kapı Kanadı (Alan Hesabı: En x Boy)
                // Poz: 15.510.1103 (Laminat Kapı Kanadı)
                const leafArea = widthM * heightM;
                generatedData.push({
                    source: 'Kapı',
                    pos: '15.510.1103',
                    desc: `${label} Tipi Kapı Kanadı (${item.width}x${item.height}cm)`,
                    unit: 'm²',
                    width: widthM.toFixed(2),
                    height: heightM.toFixed(2),
                    count: count,
                    deduction: '-',
                    total: (leafArea * count).toFixed(2)
                });

                // 3b. Kapı Kasası ve Pervazı (Alan Hesabı: ((2*h)+w)*0.34)
                // Poz: 15.510.1001
                const frameArea = ((2 * heightM) + widthM) * 0.34;
                generatedData.push({
                    source: 'Kapı',
                    pos: '15.510.1001',
                    desc: `${label} Tipi Kapı Kasa+Pervaz`,
                    unit: 'm²',
                    width: '-', // Formül karmaşık olduğu için en/boy yerine direkt yazıyoruz
                    height: '-',
                    count: count,
                    deduction: '-',
                    total: (frameArea * count).toFixed(2)
                });

                // 3c. Kapı Aksesuarları (Adet Hesabı)
                // Kilit (15.465.1002)
                generatedData.push({
                    source: 'Kapı',
                    pos: '15.465.1002',
                    desc: `${label} Tipi Kapı Kilidi (Gömme)`,
                    unit: 'Adet',
                    width: '-',
                    height: '-',
                    count: count,
                    deduction: '-',
                    total: count
                });
                // Kapı Kolu (15.465.1008)
                generatedData.push({
                    source: 'Kapı',
                    pos: '15.465.1008',
                    desc: `${label} Tipi Kapı Kolu`,
                    unit: 'Adet',
                    width: '-',
                    height: '-',
                    count: count,
                    deduction: '-',
                    total: count
                });
                // Menteşe (Her kapıya 3 adet) (15.465.1010)
                generatedData.push({
                    source: 'Kapı',
                    pos: '15.465.1010',
                    desc: `${label} Tipi Kapı Menteşesi`,
                    unit: 'Adet',
                    width: '-',
                    height: '-',
                    count: count * 3, // 3 adet
                    deduction: '-',
                    total: count * 3
                });
            }
        });

        // --- 4. PENCERE İMALATLARI (Detaylı Analiz) ---
        windowItems.forEach((item: any) => {
            const widthM = (parseFloat(item.width) || 0) / 100;
            const heightM = (parseFloat(item.height) || 0) / 100;
            const count = parseFloat(item.count) || 0;
            const midReg = parseFloat(item.middleRegister) || 0;
            const label = item.label || 'Tanımsız Pencere';

            if (count > 0) {
                let weight = 0;
                let pos = '';
                let desc = '';

                // 4a. Profil Ağırlığı (kg)
                if (item.type === 'pvc') {
                    pos = '15.455.1001';
                    desc = `${label} Tipi PVC Doğrama Profili`;
                    // Basit Formül: Çevre * 1.1 * 2 * Adet (Yaklaşık kg)
                    weight = 2 * (widthM + heightM) * 1.1 * 2;
                } else {
                    pos = '15.460.1010';
                    desc = `${label} Tipi Alüminyum Doğrama Profili`;
                    // Alüminyum Formülü (Orta kayıtlı/kayıtsız)
                    if (midReg > 0) {
                        const term1 = (widthM * heightM) * 2 * 1.596;
                        const term2 = (heightM - 0.2) * 2.038;
                        const term3 = (((widthM / 2) - 0.16) + (heightM - 0.16)) * 2 * 2.186;
                        weight = term1 + term2 + term3;
                    } else {
                        const term1 = (widthM + heightM) * 2 * 1.596;
                        const term2 = ((widthM - 0.16) + (heightM - 0.16)) * 2 * 2.186;
                        weight = term1 + term2;
                    }
                }

                generatedData.push({
                    source: 'Pencere',
                    pos: pos,
                    desc: desc,
                    unit: 'kg',
                    width: '-',
                    height: '-',
                    count: count,
                    deduction: '-',
                    total: (weight * count).toFixed(2)
                });

                // 4b. Cam Alanı (Isıcam) (m²)
                // Poz: 15.470.1010
                // Formül: (En-20cm) * (Boy-20cm)
                const glassArea = Math.max(0, (widthM - 0.2) * (heightM - 0.2));
                generatedData.push({
                    source: 'Pencere',
                    pos: '15.470.1010',
                    desc: `${label} Tipi Isıcam`,
                    unit: 'm²',
                    width: (widthM - 0.2).toFixed(2),
                    height: (heightM - 0.2).toFixed(2),
                    count: count,
                    deduction: '-',
                    total: (glassArea * count).toFixed(2)
                });

                // 4c. Pencere Aksesuarları
                // Kol (15.465.1101)
                generatedData.push({
                    source: 'Pencere',
                    pos: '15.465.1101',
                    desc: `${label} Tipi Pencere Kolu`,
                    unit: 'Adet',
                    width: '-',
                    height: '-',
                    count: count, // Her pencereye 1 kol
                    deduction: '-',
                    total: count
                });
                // Menteşe (15.465.1116)
                generatedData.push({
                    source: 'Pencere',
                    pos: '15.465.1116',
                    desc: `${label} Tipi Pencere Menteşesi`,
                    unit: 'Adet',
                    width: '-',
                    height: '-',
                    count: count * 3, // Her pencereye 3 menteşe (varsayım)
                    deduction: '-',
                    total: count * 3
                });
            }
        });

        setData(generatedData);

    }, [staticItems, architecturalItems, mechanicalItems, electricalItems, doorItems, windowItems]);

    const handlePrint = () => {
        window.print();
    };

    const handleExportToExcel = () => {
        // @ts-ignore
        if (!window.XLSX) {
            alert("Excel modülü henüz yüklenmedi. Lütfen sayfayı yenileyip tekrar deneyin.");
            return;
        }

        // Excel için veriyi hazırla (Görünmesini istediğimiz sütunlar)
        const excelData = data.map(item => ({
            "Kaynak": item.source,
            "Poz No": item.pos,
            "İmalatın Cinsi / Açıklama": item.desc,
            "Birim": item.unit,
            "En (m)": item.width,
            "Boy/Yük. (m)": item.height,
            "Adet/Benzer": item.count,
            "Azı (Düşülen)": item.deduction,
            "Çoğu (Toplam)": item.total
        }));

        // @ts-ignore
        const wb = window.XLSX.utils.book_new();
        // @ts-ignore
        const ws = window.XLSX.utils.json_to_sheet(excelData);

        // Sütun genişliklerini ayarla (Estetik görünüm için)
        ws['!cols'] = [
            { wch: 10 }, // Kaynak
            { wch: 15 }, // Poz No
            { wch: 60 }, // Açıklama
            { wch: 8 },  // Birim
            { wch: 8 },  // En
            { wch: 8 },  // Boy
            { wch: 8 },  // Adet
            { wch: 12 }, // Azı
            { wch: 15 }  // Çoğu
        ];

        // @ts-ignore
        window.XLSX.utils.book_append_sheet(wb, ws, "Yeşil Defter");
        // @ts-ignore
        window.XLSX.writeFile(wb, `Yesil_Defter_${new Date().toISOString().slice(0, 10)}.xlsx`);
    };

    return (
        <div className="w-full max-w-full space-y-6 dashboard-container animate-in fade-in duration-500">
            {/* Yazdırma Stilleri */}
            <style>
                {`
            @media print {
              body * { visibility: hidden; }
              .dashboard-container, .dashboard-container * { visibility: visible; }
              .dashboard-container { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; }
              .print-hidden { display: none !important; }
              table { width: 100% !important; border-collapse: collapse; font-size: 10pt; }
              th, td { border: 1px solid #ddd; padding: 4px; }
              th { background-color: #f3f4f6; -webkit-print-color-adjust: exact; }
            }
          `}
            </style>

            {/* --- KAPSAYICI (BEYAZ KUTU) --- */}
            <div className="green-book-container w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">

                {/* --- BAŞLIK VE BUTONLAR --- */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print-hidden">
                    <div className="flex items-center">
                        <div className="p-3 bg-green-100 rounded-xl mr-4">
                            <Book className="w-8 h-8 text-green-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Yeşil Defter</h2>
                            <p className="text-sm text-slate-500 font-medium mt-1">
                                Tüm metrajların detaylı icmali
                            </p>
                        </div>
                    </div>

                    <div className="flex w-full md:w-auto gap-3">
                        <button
                            onClick={handleExportToExcel}
                            className="flex-1 md:flex-none items-center justify-center px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg shadow-green-900/20 active:scale-95 font-bold text-sm"
                        >
                            <FileSpreadsheet className="w-4 h-4 mr-2" /> Excel İndir
                        </button>
                        <button
                            onClick={handlePrint}
                            className="flex-1 md:flex-none items-center justify-center px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all shadow-lg shadow-slate-900/20 active:scale-95 font-bold text-sm"
                        >
                            <Printer className="w-4 h-4 mr-2" /> Yazdır
                        </button>
                    </div>
                </div>

                {/* --- BASKI BAŞLIĞI (Sadece Yazdırırken Görünür) --- */}
                <div className="hidden print:block mb-8 text-center">
                    <h1 className="text-2xl font-bold border-b-2 border-black pb-2 mb-2">YEŞİL DEFTER (METRAJ CETVELİ)</h1>
                    <div className="flex justify-between text-sm">
                        <span>Tarih: {new Date().toLocaleDateString()}</span>
                        <span>Sayfa No: 1</span>
                    </div>
                </div>

                {/* --- TABLO --- */}
                <div className="overflow-x-auto w-full border border-slate-200 rounded-xl">
                    <table className="w-full text-left border-collapse text-sm table-fixed min-w-[1000px]">
                        <thead>
                            <tr className="bg-slate-100 text-slate-700 border-b border-slate-200">
                                <th className="px-4 py-3 font-bold w-24">Kaynak</th>
                                <th className="px-4 py-3 font-bold w-32 border-l border-slate-200">Poz No</th>
                                <th className="px-4 py-3 font-bold w-auto border-l border-slate-200">İmalatın Cinsi / Açıklama</th>
                                <th className="px-2 py-3 font-bold w-16 text-center border-l border-slate-200">Birim</th>
                                <th className="px-2 py-3 font-bold w-16 text-center border-l border-slate-200">En</th>
                                <th className="px-2 py-3 font-bold w-16 text-center border-l border-slate-200">Boy</th>
                                <th className="px-2 py-3 font-bold w-16 text-center border-l border-slate-200">Adet</th>
                                <th className="px-4 py-3 font-bold w-24 text-right border-l border-slate-200">Azı (Minha)</th>
                                <th className="px-4 py-3 font-bold w-28 text-right bg-green-50 border-l border-green-100 text-green-800">Çoğu (Toplam)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.length === 0 ? (
                                <tr><td colSpan={9} className="text-center py-12 text-slate-400 font-medium">Henüz veri girişi yapılmamış.</td></tr>
                            ) : (
                                data.map((row: any, index: number) => (
                                    <tr key={index} className="hover:bg-slate-50 break-inside-avoid transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-500 text-xs uppercase tracking-wide">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${row.source === 'Statik' ? 'bg-orange-100 text-orange-700' :
                                                row.source === 'Mimari' ? 'bg-blue-100 text-blue-700' :
                                                    row.source === 'Mekanik' ? 'bg-slate-100 text-slate-700' :
                                                        row.source === 'Elektrik' ? 'bg-yellow-100 text-yellow-700' :
                                                            row.source === 'Kapı' ? 'bg-purple-100 text-purple-700' :
                                                                'bg-teal-100 text-teal-700' // Pencere
                                                }`}>
                                                {row.source}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs font-bold text-slate-600 border-l border-slate-100">{row.pos}</td>
                                        <td className="px-4 py-3 text-slate-700 border-l border-slate-100">{row.desc}</td>
                                        <td className="px-2 py-3 text-center text-slate-500 border-l border-slate-100">{row.unit}</td>
                                        <td className="px-2 py-3 text-center font-mono text-slate-500 border-l border-slate-100">{row.width}</td>
                                        <td className="px-2 py-3 text-center font-mono text-slate-500 border-l border-slate-100">{row.height}</td>
                                        <td className="px-2 py-3 text-center font-bold text-slate-700 border-l border-slate-100">{row.count}</td>
                                        <td className="px-4 py-3 text-right font-mono text-red-500 border-l border-slate-100">{row.deduction !== '-' ? row.deduction : '-'}</td>
                                        <td className="px-4 py-3 text-right font-bold bg-green-50/50 text-green-700 font-mono border-l border-green-50">{formatCurrency(row.total).replace('₺', '')}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="mt-6 text-xs text-slate-400 text-center font-medium print:block">
                    Bu belge "GKmetraj" yazılımı tarafından otomatik olarak oluşturulmuştur.
                </div>
            </div>
        </div>
    );
};

export default GreenBook;