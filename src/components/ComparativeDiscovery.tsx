import React, { useState } from 'react';

import {
    FileText,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Calculator,
    LayoutDashboard,
    HardHat,
    Zap,
    Wrench,
    Download
} from 'lucide-react';
import { formatCurrency } from '../utils/helpers';

interface ComparativeDiscoveryProps {
    staticItems: any[];
    architecturalItems: any[];
    mechanicalItems: any[];
    electricalItems: any[];
    onUpdateRealizedQuantity: (id: number | string, category: string, quantity: number) => void;
}

export const ComparativeDiscovery: React.FC<ComparativeDiscoveryProps> = ({
    staticItems,
    architecturalItems,
    mechanicalItems,
    electricalItems,
    onUpdateRealizedQuantity
}) => {
    const [activeTab, setActiveTab] = useState<'static' | 'architectural' | 'mechanical' | 'electrical'>('static');

    const getItems = (tab: string) => {
        switch (tab) {
            case 'static': return staticItems;
            case 'architectural': return architecturalItems;
            case 'mechanical': return mechanicalItems;
            case 'electrical': return electricalItems;
            default: return [];
        }
    };

    const calculateStats = () => {
        let totalContractAmount = 0;
        let totalRealizedAmount = 0;

        const allItems = [
            ...staticItems.map(i => ({ ...i, cat: 'static' })),
            ...architecturalItems.map(i => ({ ...i, cat: 'architectural' })),
            ...mechanicalItems.map(i => ({ ...i, cat: 'mechanical' })),
            ...electricalItems.map(i => ({ ...i, cat: 'electrical' }))
        ];

        allItems.forEach(item => {
            if (item.subcontractorId) return; // Skip subcontractor items

            const contractQty = item.quantity || 0; // Existing quantity is Contract
            const realizedQty = item.realizedQuantity || 0; // New input is Realized
            const price = item.price || 0;

            totalContractAmount += contractQty * price;
            totalRealizedAmount += realizedQty * price;
        });

        const difference = totalRealizedAmount - totalContractAmount;
        const increasePercentage = totalContractAmount > 0 ? (difference / totalContractAmount) * 100 : 0;
        const isOverLimit = increasePercentage > 20;

        return { totalContractAmount, totalRealizedAmount, difference, increasePercentage, isOverLimit };
    };

    const stats = calculateStats();
    const currentItems = getItems(activeTab).filter(item => item.quantity && item.quantity > 0 && !item.subcontractorId);

    // Calculate tab specific stats
    const getTabStats = (items: any[]) => {
        let contract = 0;
        let realized = 0;
        items.forEach(i => {
            contract += (i.quantity || 0) * i.price;
            realized += (i.realizedQuantity || 0) * i.price;
        });
        return { contract, realized };
    };

    const tabStats = getTabStats(currentItems);

    const handleExportExcel = () => {
        // @ts-ignore
        if (!window.XLSX) {
            alert('Excel kütüphanesi henüz yüklenmedi, lütfen bekleyiniz.');
            return;
        }

        const allCategories = [
            { id: 'static', label: 'Statik', items: staticItems },
            { id: 'architectural', label: 'Mimari', items: architecturalItems },
            { id: 'mechanical', label: 'Mekanik', items: mechanicalItems },
            { id: 'electrical', label: 'Elektrik', items: electricalItems },
        ];

        let exportData: any[] = [];

        allCategories.forEach(cat => {
            cat.items.forEach(item => {
                if (item.subcontractorId) return; // Skip subcontractor items
                if (!item.quantity || item.quantity <= 0) return; // Skip empty items

                const contractQty = item.quantity || 0;
                const realizedQty = item.realizedQuantity || 0;
                const contractAmt = contractQty * item.price;
                const realizedAmt = realizedQty * item.price;
                const diffAmt = realizedAmt - contractAmt;
                const percent = contractAmt > 0 ? (diffAmt / contractAmt) * 100 : 0;

                exportData.push({
                    'Kategori': cat.label,
                    'Poz No': item.pos,
                    'İşin Tanımı': item.desc,
                    'Birim': item.unit,
                    'Birim Fiyat': item.price,
                    'Sözleşme Miktarı': contractQty,
                    'Sözleşme Tutarı': contractAmt,
                    'Gerçekleşen Miktar': realizedQty,
                    'Gerçekleşen Tutar': realizedAmt,
                    'Fark (TL)': diffAmt,
                    'Artış (%)': percent.toFixed(2)
                });
            });
        });

        // @ts-ignore
        const ws = window.XLSX.utils.json_to_sheet(exportData);
        // @ts-ignore
        const wb = window.XLSX.utils.book_new();
        // @ts-ignore
        window.XLSX.utils.book_append_sheet(wb, ws, "Mukayeseli Keşif");
        // @ts-ignore
        window.XLSX.writeFile(wb, `Mukayeseli_Kesif_${new Date().toLocaleDateString()}.xlsx`);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] min-h-[700px] gap-6">

            {/* OVERALL SUMMARY CARDS */}
            <div className={`p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] bg-white border border-slate-200/60 shadow-xl shadow-slate-200/40 relative overflow-hidden transition-all duration-500 ${stats.isOverLimit ? 'ring-4 ring-red-500/20' : ''}`}>
                {stats.isOverLimit && (
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-500 via-rose-500 to-red-500 animate-pulse" />
                )}

                <div className="flex flex-col lg:flex-row gap-8 items-center justify-between relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-indigo-50 rounded-xl">
                                <Calculator className="w-6 h-6 text-indigo-600" />
                            </div>
                            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">Mukayeseli Keşif Özeti</h2>
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-slate-500 pl-1">Sözleşme ve gerçekleşen imalat karşılaştırması.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-stretch sm:items-center justify-end w-full lg:w-auto">
                        {/* Contract Amount */}
                        <div className="px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 min-w-[180px]">
                            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Toplam Sözleşme Bedeli</div>
                            <div className="text-xl font-black text-slate-900">{formatCurrency(stats.totalContractAmount)}</div>
                        </div>

                        {/* Realized Amount */}
                        <div className="px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 min-w-[180px]">
                            <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Gerçekleşen İmalat</div>
                            <div className="text-xl font-black text-slate-700">{formatCurrency(stats.totalRealizedAmount)}</div>
                        </div>

                        {/* Difference/Increase */}
                        <div className={`px-6 py-4 rounded-2xl border min-w-[220px] shadow-lg flex items-center justify-between gap-4 ${stats.difference > 0
                            ? (stats.isOverLimit ? 'bg-red-50 border-red-100 text-red-700 shadow-red-100' : 'bg-amber-50 border-amber-100 text-amber-700 shadow-amber-100')
                            : 'bg-emerald-50 border-emerald-100 text-emerald-700 shadow-emerald-100'
                            }`}>
                            <div>
                                <div className={`text-[10px] font-extrabold uppercase tracking-wider mb-1 flex items-center gap-1.5 ${stats.difference > 0 ? (stats.isOverLimit ? 'text-red-400' : 'text-amber-400') : 'text-emerald-400'
                                    }`}>
                                    {stats.difference > 0 ? (
                                        <>Artış Tutarı <TrendingUp className="w-3 h-3" /></>
                                    ) : (
                                        <>Tasarruf <TrendingDown className="w-3 h-3" /></>
                                    )}
                                </div>
                                <div className="text-2xl font-black">{formatCurrency(Math.abs(stats.difference))}</div>
                            </div>
                            <div className={`text-right ${stats.isOverLimit ? 'animate-bounce' : ''}`}>
                                <div className="text-xs font-bold opacity-60">Artış Oranı</div>
                                <div className="text-2xl font-black">{stats.increasePercentage.toFixed(2)}%</div>
                            </div>
                        </div>
                    </div>
                </div>

                {stats.isOverLimit && (
                    <div className="mt-6 p-4 bg-red-500 text-white rounded-2xl flex items-start gap-4 shadow-xl shadow-red-500/20 animate-in slide-in-from-top-2 duration-500">
                        <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5 animate-pulse" />
                        <div>
                            <h4 className="font-extrabold text-lg">YASAL SINIR AŞILDI! (%20)</h4>
                            <p className="text-red-100 text-sm font-medium mt-1 leading-relaxed opacity-90">
                                Toplam proje maliyet artışı yasal sınır olan %20'yi aşmıştır. Bu durum idari işlem ve ek onay gerektirebilir. Lütfen kalemleri kontrol ediniz.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 bg-white/60 backdrop-blur-2xl rounded-[2.5rem] border border-white/50 shadow-2xl shadow-indigo-100/50 overflow-hidden flex flex-col relative min-h-[500px]">

                {/* TABS */}
                <div className="px-4 sm:px-8 border-b border-slate-100 bg-white flex flex-col md:flex-row justify-between items-start md:items-center sticky top-0 z-20 gap-3 md:gap-0">
                    <div className="flex gap-2 py-4 overflow-x-auto no-scrollbar w-full md:w-auto">
                        {[
                            { id: 'static', label: 'Statik', icon: LayoutDashboard },
                            { id: 'architectural', label: 'Mimari', icon: HardHat },
                            { id: 'mechanical', label: 'Mekanik', icon: Wrench },
                            { id: 'electrical', label: 'Elektrik', icon: Zap },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`px-2 py-2 sm:px-5 sm:py-3 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all flex items-center gap-1 sm:gap-2 border-2 ${activeTab === tab.id
                                    ? 'bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20 scale-105'
                                    : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300 hover:bg-slate-50'
                                    }`}
                            >
                                <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-white' : 'text-slate-400'}`} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Summary */}
                    <div className="flex gap-4 items-center">
                        <button
                            onClick={handleExportExcel}
                            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold text-xs transition-all shadow-lg shadow-slate-200 active:scale-95"
                        >
                            <Download className="w-4 h-4" />
                            Excel'e Aktar
                        </button>

                        <div className="text-right">
                            <div className="text-[10px] font-bold text-slate-400 uppercase">Kategori Sözleşme Toplamı</div>
                            <div className="text-sm font-black text-slate-800">{formatCurrency(tabStats.contract)}</div>
                        </div>
                    </div>
                </div>

                {/* TABLE */}
                <div className="flex-1 overflow-auto p-0 custom-scrollbar relative">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/90 border-b border-slate-200 sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                            <tr>
                                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider w-16">No</th>
                                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider w-24">Poz No</th>
                                <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider min-w-[200px]">İşin Tanımı</th>
                                <th className="px-4 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center w-16">Birim</th>
                                <th className="px-4 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-right w-24">B.Fiyat</th>

                                <th className="px-4 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider text-right bg-blue-50/50 w-32 border-l border-blue-100">Sözleşme M.</th>
                                <th className="px-4 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider text-right bg-blue-50/50 w-32 border-r border-blue-100">Sözleşme T.</th>

                                <th className="px-4 py-4 text-[10px] font-extrabold text-slate-600 uppercase tracking-wider text-right bg-indigo-50/50 w-32">Gerçekleşen M.</th>
                                <th className="px-4 py-4 text-[10px] font-extrabold text-slate-600 uppercase tracking-wider text-right bg-indigo-50/50 w-32 border-r border-indigo-100">Gerçekleşen T.</th>

                                <th className="px-4 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider text-right w-32">Fark</th>
                                <th className="px-4 py-4 text-[10px] font-extrabold text-slate-500 uppercase tracking-wider text-center w-20">Artış %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="py-20 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-300">
                                            <FileText className="w-16 h-16 mb-4 opacity-20" />
                                            <span className="text-lg font-bold">Bu kategoride kalem bulunamadı.</span>
                                            <span className="text-sm font-medium opacity-60 mt-1">İlgili sekmeye giderek yeni imalat ekleyebilirsiniz.</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map((item, index) => {
                                    const contractQty = item.quantity || 0; // Existing quantity (user input from main tabs)
                                    const realizedQty = item.realizedQuantity || 0; // New input on this page
                                    const contractAmt = contractQty * item.price;
                                    const realizedAmt = realizedQty * item.price;

                                    const diffAmt = realizedAmt - contractAmt;
                                    const percent = contractAmt > 0 ? (diffAmt / contractAmt) * 100 : 0;

                                    const isIncrease = diffAmt > 0;
                                    const isDecrease = diffAmt < 0;

                                    return (
                                        <tr
                                            key={item.id}
                                            className={`group transition-colors hover:bg-slate-50 ${isIncrease && Math.abs(percent) > 0 ? 'bg-red-50/30 hover:bg-red-50/60' :
                                                isDecrease && Math.abs(percent) > 0 ? 'bg-emerald-50/30 hover:bg-emerald-50/60' : ''
                                                }`}
                                        >
                                            <td className="px-6 py-3 text-xs font-bold text-slate-400">{index + 1}</td>
                                            <td className="px-6 py-3 text-xs font-black text-slate-700 font-mono">{item.pos}</td>
                                            <td className="px-6 py-3 text-xs font-bold text-slate-600 leading-snug">{item.desc}</td>
                                            <td className="px-4 py-3 text-xs font-bold text-slate-500 text-center bg-slate-50/50 rounded-lg mx-1">{item.unit}</td>
                                            <td className="px-4 py-3 text-xs font-bold text-slate-700 text-right font-mono">{formatCurrency(item.price)}</td>

                                            {/* Contract Qty (Read Only) */}
                                            <td className="px-4 py-3 text-xs font-black text-slate-800 text-right bg-blue-50/20 border-l border-blue-50 font-mono">{contractQty}</td>
                                            <td className="px-4 py-3 text-xs font-bold text-blue-900/60 text-right bg-blue-50/20 border-r border-blue-50 font-mono">{formatCurrency(contractAmt)}</td>

                                            {/* Realized Input */}
                                            <td className="px-2 py-2 text-right bg-indigo-50/20">
                                                <input
                                                    type="number"
                                                    value={item.realizedQuantity || ''}
                                                    onChange={(e) => onUpdateRealizedQuantity(item.id, activeTab, parseFloat(e.target.value))}
                                                    placeholder="0"
                                                    className="w-full text-right px-3 py-2 bg-white border border-indigo-200 rounded-lg text-xs font-black text-indigo-700 focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none transition-all shadow-sm group-hover:bg-white"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-xs font-bold text-indigo-900/60 text-right bg-indigo-50/20 border-r border-indigo-50 font-mono">{formatCurrency(realizedAmt)}</td>

                                            {/* Results */}
                                            <td className={`px-4 py-3 text-right font-mono text-xs font-black ${isIncrease ? 'text-red-500' : isDecrease ? 'text-emerald-500' : 'text-slate-300'
                                                }`}>
                                                {diffAmt !== 0 ? (isIncrease ? '+' : '') + formatCurrency(diffAmt) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {diffAmt !== 0 && (
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-black ${isIncrease ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'
                                                        }`}>
                                                        {percent > 0 ? '+' : ''}{percent.toFixed(0)}%
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
