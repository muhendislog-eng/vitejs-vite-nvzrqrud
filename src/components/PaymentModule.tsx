import React, { useState, useMemo } from 'react';
import {
    PieChart,
    TrendingUp,
    Wallet,
    Calendar,
    Plus,
    Trash2,
    Printer,
    FileText,
    CreditCard,
    Building,
    CheckCircle2,
    FileSpreadsheet,
    Download,
    ArrowUpRight,
    ArrowDownRight,
    Search
} from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
export interface Poz {
    id: string;
    pozNo: string;
    tanim: string;
    birim: string;
    birimFiyat: number;
}

export interface YesilDefterEntry {
    id: number;
    pozId: string;
    tarih: string; // YYYY-MM-DD
    aciklama: string;
    adet: number;
    en: number;
    boy: number;
    yukseklik: number;
    tenzil: boolean; // if true, multiply quantity by -1
}

// --- Mock Data ---
const INITIAL_YESIL_DEFTER: YesilDefterEntry[] = [
    { id: 1, pozId: 'static-1', tarih: '2024-01-15', aciklama: 'A Blok Temel Betonu', adet: 1, en: 15, boy: 20, yukseklik: 0.5, tenzil: false },
    { id: 2, pozId: 'static-1', tarih: '2024-01-16', aciklama: 'Asansör Çukuru Minha', adet: 1, en: 2, boy: 2, yukseklik: 1.5, tenzil: true },
    { id: 3, pozId: 'arch-1', tarih: '2024-02-10', aciklama: 'Zemin Kat Duvarları', adet: 1, en: 50, boy: 3, yukseklik: 1, tenzil: false },
];

interface PaymentModuleProps {
    contractItems: Poz[]; // Aggregate of all items from App.tsx
    measurements: YesilDefterEntry[];
    onUpdateMeasurements: (data: YesilDefterEntry[]) => void;
}

type ModuleTab = 'dashboard' | 'greenbook' | 'report' | 'prices';

export const PaymentModule: React.FC<PaymentModuleProps> = ({ contractItems, measurements = [], onUpdateMeasurements }) => {
    const [activeTab, setActiveTab] = useState<ModuleTab>('dashboard');
    // Removed internal measurements state
    const [formData, setFormData] = useState<Partial<YesilDefterEntry>>({
        tarih: new Date().toISOString().slice(0, 10),
        en: 1, boy: 1, yukseklik: 1, adet: 1, tenzil: false
    });
    const [searchTerm, setSearchTerm] = useState('');

    // --- Calculations ---
    const calculateQuantity = (m: YesilDefterEntry) => {
        const vol = (m.adet || 0) * (m.en || 1) * (m.boy || 1) * (m.yukseklik || 1);
        return m.tenzil ? -vol : vol;
    };

    const enrichedMeasurements = useMemo(() => {
        return measurements.map(m => {
            const poz = contractItems.find(p => p.id === m.pozId);
            const quantity = calculateQuantity(m);
            const price = poz?.birimFiyat || 0;
            const total = quantity * price;
            return { ...m, quantity, price, total, poz };
        }).sort((a, b) => new Date(b.tarih).getTime() - new Date(a.tarih).getTime()); // Sort by date desc
    }, [measurements, contractItems]);

    const cashFlowData = useMemo(() => {
        const groups: { [key: string]: number } = {};
        enrichedMeasurements.forEach(m => {
            const month = m.tarih.slice(0, 7); // YYYY-MM
            groups[month] = (groups[month] || 0) + m.total;
        });
        return Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0]));
    }, [enrichedMeasurements]);

    const totalProjectAmount = enrichedMeasurements.reduce((acc, curr) => acc + curr.total, 0);

    // --- Handlers ---
    const handleAddMeasurement = (entry: Omit<YesilDefterEntry, 'id'>) => {
        const newItem = { ...entry, id: Date.now() };
        onUpdateMeasurements([...measurements, newItem]);
        // Reset non-fixed fields
        setFormData(prev => ({ ...prev, aciklama: '', en: 1, boy: 1, yukseklik: 1, adet: 1, tenzil: false }));
    };

    const handleDeleteMeasurement = (id: number) => {
        if (confirm('Bu kaydı silmek istediğinize emin misiniz?')) {
            onUpdateMeasurements(measurements.filter(m => m.id !== id));
        }
    };

    // --- EXCEL EXPORT HANDLERS ---
    const handleExportGreenBook = () => {
        // @ts-ignore
        if (!window.XLSX) return alert('Excel modülü yüklenemedi.');

        const data = enrichedMeasurements.map(m => ({
            'Tarih': m.tarih,
            'Poz No': m.poz?.pozNo,
            'Açıklama': m.aciklama,
            'Ölçüler': `${m.en}x${m.boy}x${m.yukseklik}`,
            'Miktar': m.quantity,
            'Birim': m.poz?.birim,
            'Tutar': m.total,
            'Durum': m.tenzil ? 'MİNHA' : 'NORMAL'
        }));

        // @ts-ignore
        const ws = window.XLSX.utils.json_to_sheet(data);
        // @ts-ignore
        const wb = window.XLSX.utils.book_new();
        // @ts-ignore
        window.XLSX.utils.book_append_sheet(wb, ws, "Yesil Defter");
        // @ts-ignore
        window.XLSX.writeFile(wb, `Yesil_Defter_${new Date().toLocaleDateString()}.xlsx`);
    };

    const handleExportReport = () => {
        // @ts-ignore
        if (!window.XLSX) return alert('Excel modülü yüklenemedi.');

        const aggregated = Object.values(enrichedMeasurements.reduce((acc: any, curr) => {
            if (!acc[curr.pozId]) {
                acc[curr.pozId] = { ...curr.poz, quantity: 0, total: 0 };
            }
            acc[curr.pozId].quantity += curr.quantity;
            acc[curr.pozId].total += curr.total;
            return acc;
        }, {}));

        const data = aggregated.map((row: any) => ({
            'Poz No': row.pozNo,
            'Tanım': row.tanim,
            'Birim': row.birim,
            'Birim Fiyat': row.birimFiyat,
            'Toplam Miktar': row.quantity,
            'Toplam Tutar': row.total
        }));

        // @ts-ignore
        const ws = window.XLSX.utils.json_to_sheet(data);
        // @ts-ignore
        const wb = window.XLSX.utils.book_new();
        // @ts-ignore
        window.XLSX.utils.book_append_sheet(wb, ws, "Hakedis Icmal");
        // @ts-ignore
        window.XLSX.writeFile(wb, `Hakedis_Raporu_${new Date().toLocaleDateString()}.xlsx`);
    };


    // --- Render Sections (Premium UI) ---

    const renderDashboard = () => (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Total Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-[2rem] shadow-2xl relative overflow-hidden text-white group hover:scale-[1.02] transition-transform duration-300">
                    <div className="absolute right-0 top-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/10 transition-colors"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4 text-slate-400">
                            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                                <Wallet className="w-6 h-6 text-orange-400" />
                            </div>
                            <span className="font-semibold tracking-wide text-sm uppercase">Toplam Hakediş</span>
                        </div>
                        <h3 className="text-4xl font-black tracking-tight mb-2">
                            {formatCurrency(totalProjectAmount)}
                        </h3>
                        <div className="flex items-center gap-2 text-green-400 text-sm font-bold bg-green-900/30 w-fit px-3 py-1.5 rounded-lg border border-green-500/20">
                            <TrendingUp className="w-4 h-4" />
                            <span>Proje Başlangıcından Beri</span>
                        </div>
                    </div>
                </div>

                {/* Approved Items Card */}
                <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
                    <div className="absolute right-0 top-0 w-40 h-40 bg-blue-50 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-blue-100 transition-colors"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4 text-slate-500">
                            <div className="p-2 bg-blue-50 rounded-xl">
                                <CheckCircle2 className="w-6 h-6 text-blue-600" />
                            </div>
                            <span className="font-bold text-sm uppercase tracking-wide">Onaylı İmalatlar</span>
                        </div>
                        <h3 className="text-4xl font-black text-slate-800 tracking-tight mb-2">
                            {measurements.length}
                            <span className="text-xl text-slate-400 font-medium ml-2">Kalem</span>
                        </h3>
                        <p className="text-slate-400 text-sm font-medium">Yeşil deftere işlenmiş kayıtlar</p>
                    </div>
                </div>

                {/* Last Activity Card */}
                <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 relative overflow-hidden group hover:shadow-2xl transition-all duration-300">
                    <div className="absolute right-0 top-0 w-40 h-40 bg-orange-50 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-orange-100 transition-colors"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4 text-slate-500">
                            <div className="p-2 bg-orange-50 rounded-xl">
                                <Calendar className="w-6 h-6 text-orange-600" />
                            </div>
                            <span className="font-bold text-sm uppercase tracking-wide">Son İşlem</span>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
                            {measurements.length > 0 ? new Date(measurements[0].tarih).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                        </h3>
                        <p className="text-slate-400 text-sm font-medium">Son kayıt tarihi</p>
                    </div>
                </div>
            </div>

            {/* Premium Chart Section */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-indigo-50 rounded-2xl">
                            <TrendingUp className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Nakit Akış Analizi</h3>
                            <p className="text-slate-500 text-sm">Aylık hakediş ilerleme grafiği</p>
                        </div>
                    </div>
                </div>

                <div className="relative h-96 w-full bg-slate-50/50 rounded-3xl p-6 pt-16 border border-slate-100 flex items-end gap-6 overflow-x-auto">
                    {cashFlowData.length === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center text-slate-400 font-medium">
                            Veri bulunamadı.
                        </div>
                    )}
                    {cashFlowData.map(([period, amount], idx) => {
                        const maxAmount = Math.max(...cashFlowData.map(d => d[1]));
                        const heightPercent = maxAmount > 0 ? (amount / maxAmount) * 100 : 0;
                        const colors = ['bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500'];

                        return (
                            <div key={period} className="flex flex-col items-center gap-3 min-w-[100px] flex-1 group h-full justify-end">
                                <div className="relative w-full flex justify-center items-end h-full">
                                    <div
                                        style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                                        className={`w-full max-w-[60px] ${colors[idx % colors.length]} rounded-2xl shadow-lg shadow-indigo-200 opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300 relative`}
                                    >
                                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold py-2 px-3 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap z-20 pointer-events-none transform translate-y-2 group-hover:translate-y-0">
                                            {formatCurrency(amount).replace('₺', '')}
                                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45"></div>
                                        </div>
                                    </div>
                                </div>
                                <span className="text-sm font-bold text-slate-500 bg-white px-3 py-1 rounded-lg shadow-sm border border-slate-100 group-hover:border-indigo-100 group-hover:text-indigo-600 transition-colors capitalize">
                                    {new Date(period + '-01').toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );

    const renderGreenBook = () => {
        return (
            <div className="space-y-8 animate-in fade-in duration-500">
                {/* Premium Form Card */}
                <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-slate-800 to-slate-900"></div>
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">Yeni Kayıt</h3>
                            <p className="text-slate-500 font-medium">Yeşil deftere yeni metraj ekleyin</p>
                        </div>
                        <button
                            onClick={handleExportGreenBook}
                            className="hidden md:flex items-center gap-2 px-5 py-3 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl font-bold transition-all"
                        >
                            <FileSpreadsheet className="w-5 h-5" />
                            Excel'e Aktar
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
                        {/* Date */}
                        <div className="lg:col-span-2 space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Tarih</label>
                            <input
                                type="date"
                                value={formData.tarih}
                                onChange={e => setFormData({ ...formData, tarih: e.target.value })}
                                className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-green-500/20 font-bold text-slate-700 transition-all hover:bg-slate-100"
                            />
                        </div>

                        {/* Poz Selector */}
                        <div className="lg:col-span-4 space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Poz Seçimi</label>
                                {formData.pozId && (
                                    <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-wide animate-in fade-in slide-in-from-left-2">
                                        Birim: {contractItems.find(p => p.id === formData.pozId)?.birim}
                                    </span>
                                )}
                            </div>
                            <select
                                className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-green-500/20 font-bold text-slate-700 transition-all hover:bg-slate-100 appearance-none cursor-pointer"
                                onChange={e => setFormData({ ...formData, pozId: e.target.value })}
                                value={formData.pozId || ''}
                            >
                                <option value="">Bir poz seçin...</option>
                                {contractItems.map(p => (
                                    <option key={p.id} value={p.id}>{p.pozNo} - {p.tanim.substring(0, 30)}... ({formatCurrency(p.birimFiyat)})</option>
                                ))}
                            </select>
                        </div>

                        {/* Description */}
                        <div className="lg:col-span-6 space-y-2">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-1">Açıklama</label>
                            <input
                                type="text"
                                placeholder="İmalat açıklaması giriniz..."
                                className="w-full p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-green-500/20 font-medium text-slate-700 transition-all hover:bg-slate-100"
                                value={formData.aciklama || ''}
                                onChange={e => setFormData({ ...formData, aciklama: e.target.value })}
                            />
                        </div>

                        {/* Quantity Row */}
                        <div className="lg:col-span-6 grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <div className="space-y-1 col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase text-center block">
                                    Miktar ({formData.pozId ? contractItems.find(p => p.id === formData.pozId)?.birim : 'Birim'})
                                </label>
                                <input
                                    type="number"
                                    value={formData.adet}
                                    onChange={e => setFormData({ ...formData, adet: parseFloat(e.target.value) })}
                                    className="w-full text-center bg-white rounded-xl p-3 font-bold text-2xl text-slate-700 border-none shadow-sm focus:ring-2 focus:ring-blue-500/20"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="lg:col-span-6 flex items-center gap-4">
                            <label className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${formData.tenzil ? 'border-red-500 bg-red-50 text-red-600' : 'border-slate-200 bg-white text-slate-400 hover:border-red-200'}`}>
                                <input type="checkbox" checked={formData.tenzil || false} onChange={e => setFormData({ ...formData, tenzil: e.target.checked })} className="w-5 h-5 accent-red-500" />
                                <span className="font-bold">Minha (Düşülecek)</span>
                            </label>

                            <button
                                onClick={() => {
                                    if (formData.pozId && formData.tarih && formData.adet) {
                                        handleAddMeasurement({
                                            pozId: formData.pozId!,
                                            tarih: formData.tarih!,
                                            aciklama: formData.aciklama || '',
                                            adet: formData.adet,
                                            en: 1, // Defaulting dimensions to 1
                                            boy: 1,
                                            yukseklik: 1,
                                            tenzil: formData.tenzil || false
                                        } as any);
                                    } else {
                                        alert('Lütfen Tarih, Poz ve Miktar giriniz.');
                                    }
                                }}
                                className="flex-[2] bg-slate-900 text-white p-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Plus className="w-5 h-5" />
                                Kaydı Ekle
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Kayılarda ara..."
                                    className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 w-64"
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <strong>{enrichedMeasurements.length}</strong> kayıt listeleniyor
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs tracking-wider">
                                <tr>
                                    <th className="p-4 pl-6">Tarih</th>
                                    <th className="p-4">Poz No</th>
                                    <th className="p-4">Açıklama</th>
                                    <th className="p-4 text-right">Miktar</th>
                                    <th className="p-4 text-right">Tutar</th>
                                    <th className="p-4 text-center">İşlem</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {enrichedMeasurements.filter(m =>
                                    m.aciklama.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                    m.poz?.pozNo.toLowerCase().includes(searchTerm.toLowerCase())
                                ).map(m => (
                                    <tr key={m.id} className={`group hover:bg-indigo-50/30 transition-colors duration-200 ${m.tenzil ? 'bg-red-50/30' : ''}`}>
                                        <td className="p-4 pl-6 font-bold text-slate-600">
                                            {new Date(m.tarih).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-lg font-mono text-xs font-bold border border-slate-200">
                                                {m.poz?.pozNo}
                                            </span>
                                        </td>
                                        <td className="p-4 font-medium text-slate-700">
                                            {m.aciklama}
                                            {m.tenzil && (
                                                <span className="ml-2 inline-flex items-center gap-1 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide">
                                                    <ArrowDownRight className="w-3 h-3" /> Minha
                                                </span>
                                            )}
                                        </td>
                                        <td className={`p-4 text-right font-bold font-mono ${m.tenzil ? 'text-red-500' : 'text-slate-700'}`}>
                                            {m.quantity.toFixed(2)} <span className="text-xs text-slate-400 ml-1">{m.poz?.birim}</span>
                                        </td>
                                        <td className="p-4 text-right font-bold font-mono text-slate-800">
                                            {formatCurrency(m.total)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => handleDeleteMeasurement(m.id)}
                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                title="Kaydı Sil"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    const renderReport = () => (
        <div className="bg-white p-10 rounded-[2rem] shadow-xl border border-slate-100 animate-in fade-in report-print-container relative">

            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4 print:hidden">
                <div>
                    <h3 className="text-2xl font-black text-slate-800">Hakediş Raporu</h3>
                    <p className="text-slate-500 font-medium">Resmi hakediş icmali ve onay sayfası</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={handleExportReport}
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-50 text-green-700 border border-green-100 rounded-xl hover:bg-green-100 transition-all font-bold"
                    >
                        <FileSpreadsheet className="w-4 h-4" /> Excel Oluştur
                    </button>
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold shadow-lg shadow-slate-900/20"
                    >
                        <Printer className="w-4 h-4" /> Yazdır
                    </button>
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block text-center mb-12 border-b-2 border-black pb-4">
                <h1 className="text-3xl font-bold uppercase tracking-widest mb-2">Hakediş İcmal Raporu</h1>
                <div className="flex justify-between items-end text-sm font-medium mt-4">
                    <span>Proje: GK Metraj Demo</span>
                    <span>Tarih: {new Date().toLocaleDateString()}</span>
                </div>
            </div>

            <table className="w-full text-sm text-left border-collapse">
                <thead>
                    <tr className="bg-slate-50 border-y-2 border-slate-200 text-slate-600 uppercase text-xs tracking-wider">
                        <th className="p-4 font-bold border-x border-transparent">Poz No</th>
                        <th className="p-4 font-bold border-x border-transparent">İmalat Açıklaması</th>
                        <th className="p-4 font-bold text-center border-x border-transparent">Birim</th>
                        <th className="p-4 font-bold text-right border-x border-transparent">Birim Fiyat</th>
                        <th className="p-4 font-bold text-right border-x border-transparent">Toplam Miktar</th>
                        <th className="p-4 font-bold text-right border-x border-transparent">Toplam Tutar</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {/* Aggregate by Poz */}
                    {Object.values(enrichedMeasurements.reduce((acc: any, curr) => {
                        if (!acc[curr.pozId]) {
                            acc[curr.pozId] = { ...curr.poz, quantity: 0, total: 0 };
                        }
                        acc[curr.pozId].quantity += curr.quantity;
                        acc[curr.pozId].total += curr.total;
                        return acc;
                    }, {})).map((row: any, idx) => (
                        <tr key={row.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}>
                            <td className="p-4 font-mono font-bold text-slate-700">{row.pozNo}</td>
                            <td className="p-4 font-medium text-slate-600">{row.tanim}</td>
                            <td className="p-4 text-center text-slate-500">{row.birim}</td>
                            <td className="p-4 text-right font-mono text-slate-500">{formatCurrency(row.birimFiyat)}</td>
                            <td className="p-4 text-right font-mono font-bold text-slate-800">{row.quantity.toFixed(2)}</td>
                            <td className="p-4 text-right font-mono font-bold text-slate-900">{formatCurrency(row.total)}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                    <tr>
                        <td colSpan={5} className="p-4 text-right font-black text-slate-600 uppercase tracking-widest text-xs">Genel Toplam</td>
                        <td className="p-4 text-right font-black text-2xl text-slate-900">{formatCurrency(totalProjectAmount)}</td>
                    </tr>
                    <tr className="print:hidden">
                        <td colSpan={5} className="p-4 text-right font-bold text-slate-400 text-xs">KDV (%20)</td>
                        <td className="p-4 text-right font-bold text-lg text-slate-500">{formatCurrency(totalProjectAmount * 0.2)}</td>
                    </tr>
                    <tr className="bg-slate-900 text-white print:bg-transparent print:text-black">
                        <td colSpan={5} className="p-4 text-right font-black uppercase tracking-widest text-xs">Genel Yekün (KDV Dahil)</td>
                        <td className="p-4 text-right font-black text-2xl">{formatCurrency(totalProjectAmount * 1.2)}</td>
                    </tr>
                </tfoot>
            </table>

            {/* Signatures */}
            <div className="hidden print:flex justify-between mt-32 text-center text-sm">
                <div className="w-1/3 px-4">
                    <p className="font-bold mb-16 uppercase tracking-widest">Düzenleyen</p>
                    <div className="border-t-2 border-black w-3/4 mx-auto pt-2">
                        <p>Adı Soyadı</p>
                        <p className="font-light">Unvan</p>
                    </div>
                </div>
                <div className="w-1/3 px-4">
                    <p className="font-bold mb-16 uppercase tracking-widest">Kontrol Eden</p>
                    <div className="border-t-2 border-black w-3/4 mx-auto pt-2">
                        <p>Adı Soyadı</p>
                        <p className="font-light">Şantiye Şefi</p>
                    </div>
                </div>
                <div className="w-1/3 px-4">
                    <p className="font-bold mb-16 uppercase tracking-widest">Onaylayan</p>
                    <div className="border-t-2 border-black w-3/4 mx-auto pt-2">
                        <p>Adı Soyadı</p>
                        <p className="font-light">Proje Müdürü</p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="w-full max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 pb-32">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">Hakediş ve Nakit Akış</h1>
                    <p className="text-slate-500 font-medium text-lg max-w-xl">
                        Projenizin finansal durumunu takip edin, hakedişlerinizi profesyonelce yönetin ve raporlayın.
                    </p>
                </div>

                {/* Navigation Tabs */}
                <div className="flex p-1.5 bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-x-auto max-w-full">
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                    >
                        <TrendingUp className="w-4 h-4" /> Genel Bakış
                    </button>
                    <button
                        onClick={() => setActiveTab('greenbook')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'greenbook' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                    >
                        <FileText className="w-4 h-4" /> Yeşil Defter
                    </button>
                    <button
                        onClick={() => setActiveTab('report')}
                        className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'report' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                    >
                        <CreditCard className="w-4 h-4" /> Hakediş Raporu
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'greenbook' && renderGreenBook()}
            {activeTab === 'report' && renderReport()}
        </div>
    );
};
