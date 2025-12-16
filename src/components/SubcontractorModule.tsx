import React, { useState } from 'react';
import {
    Users,
    Plus,
    UserPlus,
    CreditCard,
    Wallet,
    TrendingUp,
    FileText,
    AlertCircle,
    Building2,
    Phone,
    Briefcase,
    ChevronRight,
    Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../utils/helpers';

// --- TYPES ---
export interface Subcontractor {
    id: string;
    name: string;
    trade: string; // İş kolu (Kalıpçı, Demirci vb.)
    contact?: string;
}

export interface SubcontractorPayment {
    id: string;
    subcontractorId: string;
    date: string;
    amount: number;
    type: 'Nakit' | 'Çek' | 'Avans' | 'Banka';
    description?: string;
}

interface SubcontractorModuleProps {
    subcontractors: Subcontractor[];
    payments: SubcontractorPayment[];
    measurements: any[]; // All metraj items to calculate totals
    onUpdateSubcontractors: (list: Subcontractor[]) => void;
    onUpdatePayments: (list: SubcontractorPayment[]) => void;
    onAddMeasurement: (subId: string, category: string, item: any) => void;
}

export const SubcontractorModule: React.FC<SubcontractorModuleProps> = ({
    subcontractors,
    payments,
    measurements,
    onUpdateSubcontractors,
    onUpdatePayments,
    onAddMeasurement
}) => {
    const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAddWorkModalOpen, setIsAddWorkModalOpen] = useState(false);
    const [newSubName, setNewSubName] = useState('');
    const [newSubTrade, setNewSubTrade] = useState('');
    const [newSubContact, setNewSubContact] = useState('');
    const [activeTab, setActiveTab] = useState<'works' | 'payments'>('works');
    const [searchTerm, setSearchTerm] = useState('');

    // --- PAYMENT FORM STATE ---
    const [payDate, setPayDate] = useState(new Date().toISOString().split('T')[0]);
    const [payAmount, setPayAmount] = useState('');
    const [payType, setPayType] = useState('Nakit');
    const [payDesc, setPayDesc] = useState('');

    // --- WORK FORM STATE ---
    const [workCategory, setWorkCategory] = useState('static');
    const [workDesc, setWorkDesc] = useState('');
    const [workUnit, setWorkUnit] = useState('Adet');
    const [workQuantity, setWorkQuantity] = useState('');
    const [workPrice, setWorkPrice] = useState('');

    // --- HELPERS ---
    const getSubcontractorStats = (id: string) => {
        const subMeasurements = measurements.filter(m => m.subcontractorId === id);
        const totalWork = subMeasurements.reduce((acc, m) => acc + (m.price * m.quantity), 0);
        const subPayments = payments.filter(p => p.subcontractorId === id);
        const totalPaid = subPayments.reduce((acc, p) => acc + p.amount, 0);
        const balance = totalWork - totalPaid;
        return { totalWork, totalPaid, balance, subMeasurements, subPayments };
    };

    const handleAddSubcontractor = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubName || !newSubTrade) return;
        const newSub: Subcontractor = {
            id: Date.now().toString(),
            name: newSubName,
            trade: newSubTrade,
            contact: newSubContact
        };
        onUpdateSubcontractors([...subcontractors, newSub]);
        setNewSubName('');
        setNewSubTrade('');
        setNewSubContact('');
        setIsAddModalOpen(false);
    };

    const handleAddWork = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSubId || !workQuantity || !workPrice) return;
        const newItem = {
            pos: '',
            desc: workDesc,
            unit: workUnit,
            quantity: parseFloat(workQuantity),
            price: parseFloat(workPrice),
            isManual: true,
            subcontractorId: selectedSubId
        };
        onAddMeasurement(selectedSubId, workCategory, newItem);
        setWorkDesc('');
        setWorkQuantity('');
        setWorkPrice('');
        setIsAddWorkModalOpen(false);
    };

    const handleAddPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSubId || !payAmount) return;
        const newPayment: SubcontractorPayment = {
            id: Date.now().toString(),
            subcontractorId: selectedSubId,
            date: payDate,
            amount: parseFloat(payAmount),
            type: payType as any,
            description: payDesc
        };
        onUpdatePayments([...payments, newPayment]);
        setPayAmount('');
        setPayDesc('');
    };

    const selectedSub = subcontractors.find(s => s.id === selectedSubId);
    const stats = selectedSub ? getSubcontractorStats(selectedSub.id) : null;
    const filteredSubs = subcontractors.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] min-h-[700px]">
            {/* --- SIDEBAR --- */}
            <div className="w-full lg:w-96 flex flex-col gap-4 bg-white/60 backdrop-blur-2xl p-4 rounded-[2.5rem] border border-white/50 shadow-2xl shadow-indigo-100/50 overflow-hidden flex-shrink-0">
                <div className="p-2 space-y-4">
                    <div className="flex justify-between items-center px-2">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Taşeronlar</h2>
                            <p className="text-xs text-slate-400 font-medium">Yönetim ve Finans</p>
                        </div>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all hover:scale-105 shadow-xl shadow-slate-900/20 active:scale-95"
                        >
                            <UserPlus className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Taşeron ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white/80 border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-y-auto space-y-3 pr-2 custom-scrollbar flex-1 pl-1">
                    {filteredSubs.length === 0 ? (
                        <div className="text-center py-12 flex flex-col items-center opacity-40">
                            <Users className="w-16 h-16 mb-4 text-slate-300" />
                            <p className="text-sm font-bold text-slate-400">Taşeron bulunamadı.</p>
                        </div>
                    ) : (
                        filteredSubs.map(sub => {
                            const { balance } = getSubcontractorStats(sub.id);
                            const isSelected = selectedSubId === sub.id;

                            return (
                                <button
                                    key={sub.id}
                                    onClick={() => setSelectedSubId(sub.id)}
                                    className={`group w-full p-4 rounded-[1.5rem] text-left transition-all duration-300 relative overflow-hidden border ${isSelected
                                            ? 'bg-slate-900 border-slate-900 shadow-xl shadow-slate-900/30 translate-x-1'
                                            : 'bg-white border-white hover:border-slate-200 hover:shadow-lg hover:shadow-slate-200/50'
                                        }`}
                                >
                                    <div className="flex justify-between items-start relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                                                }`}>
                                                {sub.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className={`font-bold text-sm leading-tight mb-0.5 ${isSelected ? 'text-white' : 'text-slate-800'}`}>{sub.name}</div>
                                                <div className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>{sub.trade}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-4 flex justify-between items-end relative z-10">
                                        <div className={`text-[10px] font-semibold px-2 py-1 rounded-lg ${balance > 0
                                                ? (isSelected ? 'bg-rose-500/20 text-rose-200' : 'bg-rose-50 text-rose-600')
                                                : (isSelected ? 'bg-emerald-500/20 text-emerald-200' : 'bg-emerald-50 text-emerald-600')
                                            }`}>
                                            {balance > 0 ? 'BORÇ' : 'ALACAK'}
                                        </div>
                                        <div className={`font-mono font-bold text-base ${isSelected ? 'text-white' : (balance > 0 ? 'text-slate-800' : 'text-emerald-600')
                                            }`}>
                                            {formatCurrency(Math.abs(balance))}
                                        </div>
                                    </div>

                                    {isSelected && (
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                                    )}
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="flex-1 bg-white/60 backdrop-blur-2xl rounded-[2.5rem] border border-white/50 shadow-2xl shadow-indigo-100/50 overflow-hidden flex flex-col relative">
                {selectedSub && stats ? (
                    <>
                        {/* HEADER BANNER */}
                        <div className="p-8 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 relative overflow-hidden">
                            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="px-3 py-1 bg-slate-200/50 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                                            <Briefcase className="w-3 h-3" />
                                            {selectedSub.trade}
                                        </span>
                                        {selectedSub.contact && (
                                            <span className="px-3 py-1 bg-slate-100/50 border border-slate-200 text-slate-500 rounded-lg text-xs font-bold flex items-center gap-1.5">
                                                <Phone className="w-3 h-3" />
                                                {selectedSub.contact}
                                            </span>
                                        )}
                                    </div>
                                    <h1 className="text-4xl font-black text-slate-800 tracking-tight leading-none mb-2">{selectedSub.name}</h1>
                                    <p className="text-sm font-medium text-slate-400">Finansal Özet ve İmalat Detayları</p>
                                </div>

                                <div className="flex gap-3">
                                    <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-end min-w-[140px]">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Toplam Hakediş</span>
                                        <span className="text-xl font-black text-slate-800">{formatCurrency(stats.totalWork)}</span>
                                    </div>
                                    <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col items-end min-w-[140px]">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Toplam Ödenen</span>
                                        <span className="text-xl font-black text-slate-800">{formatCurrency(stats.totalPaid)}</span>
                                    </div>
                                    <div className={`p-4 rounded-2xl border flex flex-col items-end min-w-[140px] ${stats.balance > 0 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'
                                        }`}>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${stats.balance > 0 ? 'text-rose-400' : 'text-emerald-400'
                                            }`}>
                                            {stats.balance > 0 ? 'Bakiye (Borç)' : 'Alacak'}
                                        </span>
                                        <span className={`text-xl font-black ${stats.balance > 0 ? 'text-rose-600' : 'text-emerald-600'
                                            }`}>
                                            {formatCurrency(Math.abs(stats.balance))}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Decorative Background Elements */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100/50 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                        </div>

                        {/* TABS & ACTIONS */}
                        <div className="px-8 border-b border-slate-100 bg-white flex justify-between items-center sticky top-0 z-20">
                            <div className="flex gap-6">
                                <button
                                    onClick={() => setActiveTab('works')}
                                    className={`py-5 text-sm font-bold border-b-[3px] transition-all flex items-center gap-2 ${activeTab === 'works'
                                            ? 'border-slate-900 text-slate-900'
                                            : 'border-transparent text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    <FileText className={`w-4 h-4 ${activeTab === 'works' ? 'text-slate-900' : 'text-slate-400'}`} />
                                    İmalatlar
                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-extrabold">{stats.subMeasurements.length}</span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('payments')}
                                    className={`py-5 text-sm font-bold border-b-[3px] transition-all flex items-center gap-2 ${activeTab === 'payments'
                                            ? 'border-slate-900 text-slate-900'
                                            : 'border-transparent text-slate-400 hover:text-slate-600'
                                        }`}
                                >
                                    <CreditCard className={`w-4 h-4 ${activeTab === 'payments' ? 'text-slate-900' : 'text-slate-400'}`} />
                                    Ödemeler
                                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-[10px] font-extrabold">{stats.subPayments.length}</span>
                                </button>
                            </div>

                            {activeTab === 'works' && (
                                <button
                                    onClick={() => setIsAddWorkModalOpen(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all hover:scale-105 shadow-lg shadow-slate-900/20"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    Yeni İmalat Ekle
                                </button>
                            )}
                        </div>

                        {/* CONTENT AREA */}
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/50">
                            <AnimatePresence mode="wait">
                                {activeTab === 'works' ? (
                                    <motion.div
                                        key="works"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-2"
                                    >
                                        <div className="bg-white rounded-[1.5rem] border border-slate-200/60 shadow-sm overflow-hidden">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Açıklama</th>
                                                        <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-center">Birim</th>
                                                        <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-right">Miktar</th>
                                                        <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-right">Fiyat</th>
                                                        <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-right">Toplam</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {stats.subMeasurements.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={5} className="py-12 text-center">
                                                                <div className="flex flex-col items-center justify-center text-slate-300">
                                                                    <FileText className="w-12 h-12 mb-3 opacity-20" />
                                                                    <span className="text-sm font-medium">Henüz imalat eklenmemiş.</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        stats.subMeasurements.map((m, i) => (
                                                            <tr key={i} className="group hover:bg-blue-50/30 transition-colors">
                                                                <td className="px-6 py-4">
                                                                    <div className="font-bold text-slate-700 text-sm group-hover:text-blue-700 transition-colors">{m.desc}</div>
                                                                    {m.pos && <div className="text-[10px] font-mono text-slate-400 mt-0.5">{m.pos}</div>}
                                                                </td>
                                                                <td className="px-6 py-4 text-center">
                                                                    <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded-md text-xs font-bold">{m.unit}</span>
                                                                </td>
                                                                <td className="px-6 py-4 text-right font-bold text-slate-700">{m.quantity}</td>
                                                                <td className="px-6 py-4 text-right text-sm font-medium text-slate-500">{formatCurrency(m.price)}</td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <div className="font-bold text-slate-900 bg-slate-100/50 inline-block px-3 py-1 rounded-lg border border-slate-100">
                                                                        {formatCurrency(m.price * m.quantity)}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="payments"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="space-y-6"
                                    >
                                        {/* HISTORY TABLE */}
                                        <div className="bg-white rounded-[1.5rem] border border-slate-200/60 shadow-sm overflow-hidden">
                                            <table className="w-full text-left">
                                                <thead className="bg-slate-50 border-b border-slate-100">
                                                    <tr>
                                                        <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tarih</th>
                                                        <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Tür</th>
                                                        <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Açıklama</th>
                                                        <th className="px-6 py-4 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider text-right">Tutar</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-50">
                                                    {stats.subPayments.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={4} className="py-12 text-center">
                                                                <div className="flex flex-col items-center justify-center text-slate-300">
                                                                    <Wallet className="w-12 h-12 mb-3 opacity-20" />
                                                                    <span className="text-sm font-medium">Henüz ödeme yapılmamış.</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        stats.subPayments.map((p, i) => (
                                                            <tr key={i} className="group hover:bg-orange-50/30 transition-colors">
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 group-hover:bg-orange-400 transition-colors" />
                                                                        <span className="text-sm font-mono font-bold text-slate-600">{new Date(p.date).toLocaleDateString('tr-TR')}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-bold shadow-sm">{p.type}</span>
                                                                </td>
                                                                <td className="px-6 py-4 text-sm text-slate-500 italic font-medium">{p.description || '-'}</td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <div className="font-bold text-orange-600 bg-orange-50 inline-block px-3 py-1 rounded-lg border border-orange-100">
                                                                        {formatCurrency(p.amount)}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* ADD PAYMENT FORM CARD */}
                                        <div className="bg-slate-900 rounded-[2rem] p-8 shadow-2xl relative overflow-hidden text-white">
                                            <div className="absolute top-0 right-0 w-64 h-64 bg-slate-800 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none opacity-50" />
                                            <div className="relative z-10">
                                                <h3 className="text-lg font-black mb-6 flex items-center gap-2">
                                                    <div className="p-1.5 bg-orange-500 rounded-lg">
                                                        <Plus className="w-4 h-4 text-white" />
                                                    </div>
                                                    Yeni Ödeme Kaydet
                                                </h3>
                                                <form onSubmit={handleAddPayment} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Tarih</label>
                                                        <input type="date" required value={payDate} onChange={e => setPayDate(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border-none rounded-xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-slate-600" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Tutar (TL)</label>
                                                        <input type="number" required min="0" step="0.01" value={payAmount} onChange={e => setPayAmount(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border-none rounded-xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-slate-600" placeholder="0.00" />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Ödeme Türü</label>
                                                        <select value={payType} onChange={e => setPayType(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border-none rounded-xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-orange-500 transition-all appearance-none cursor-pointer">
                                                            <option value="Nakit">Nakit</option>
                                                            <option value="Çek">Çek</option>
                                                            <option value="Banka">Banka / EFT</option>
                                                            <option value="Avans">Avans</option>
                                                        </select>
                                                    </div>
                                                    <div className="md:col-span-1 flex items-center gap-2">
                                                        <div className="flex-1">
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase block mb-2">Açıklama</label>
                                                            <input type="text" value={payDesc} onChange={e => setPayDesc(e.target.value)} className="w-full px-4 py-3 bg-slate-800 border-none rounded-xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-orange-500 transition-all placeholder:text-slate-600" placeholder="..." />
                                                        </div>
                                                        <button type="submit" className="h-[46px] px-6 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 transition-all mt-auto flex items-center justify-center">
                                                            Ekle
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300 relative">
                        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] pointer-events-none" />
                        <div className="relative z-10 text-center">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inset">
                                <Search className="w-10 h-10 text-slate-300" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 mb-2">Taşeron Seçimi</h2>
                            <p className="text-slate-500 max-w-sm mx-auto">Detayları, imalatları ve ödemeleri görüntülemek için sol menüden bir taşeron seçin.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* --- ADD MODAL (Enhanced) --- */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl p-8 relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900" />
                            <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
                                <div className="p-3 bg-slate-100 rounded-2xl"><UserPlus className="w-6 h-6 text-slate-900" /></div>
                                Yeni Taşeron
                            </h3>
                            <form onSubmit={handleAddSubcontractor} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Firma / Kişi Adı</label>
                                    <input autoFocus type="text" required value={newSubName} onChange={e => setNewSubName(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:border-slate-900 focus:bg-white transition-all placeholder:text-slate-300" placeholder="Örn: Ahmet Yılmaz" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Uzmanlık Alanı</label>
                                    <input type="text" required value={newSubTrade} onChange={e => setNewSubTrade(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:border-slate-900 focus:bg-white transition-all placeholder:text-slate-300" placeholder="Örn: Seramik İşleri" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">İletişim (İsteğe Bağlı)</label>
                                    <input type="text" value={newSubContact} onChange={e => setNewSubContact(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:border-slate-900 focus:bg-white transition-all placeholder:text-slate-300" placeholder="05XX..." />
                                </div>
                                <div className="flex gap-4 pt-6">
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-colors">İptal</button>
                                    <button type="submit" className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 shadow-xl shadow-slate-900/20 transition-all hover:scale-[1.02]">Kaydet</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- ADD WORK MODAL (Enhanced) --- */}
            <AnimatePresence>
                {isAddWorkModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl p-8 relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500" />
                            <h3 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
                                <div className="p-3 bg-orange-50 rounded-2xl"><Plus className="w-6 h-6 text-orange-600" /></div>
                                Yeni İmalat Ekle
                            </h3>
                            <form onSubmit={handleAddWork} className="space-y-5">
                                <div>
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Kategori</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {['static', 'architectural', 'mechanical', 'electrical'].map((cat) => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setWorkCategory(cat)}
                                                className={`py-3 px-2 rounded-xl text-xs font-bold uppercase transition-all border-2 ${workCategory === cat
                                                        ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                                                        : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'
                                                    }`}
                                            >
                                                {cat === 'static' ? 'Statik' : cat === 'architectural' ? 'Mimari' : cat === 'mechanical' ? 'Mekanik' : 'Elektrik'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">İşin Tanımı / Açıklama</label>
                                    <input type="text" required value={workDesc} onChange={e => setWorkDesc(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:border-orange-500 focus:bg-white transition-all placeholder:text-slate-300" placeholder="Örn: 1. Kat Duvar Seramiği" />
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Birim</label>
                                        <select value={workUnit} onChange={e => setWorkUnit(e.target.value)} className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:border-orange-500 focus:bg-white transition-all appearance-none">
                                            <option value="Adet">Adet</option>
                                            <option value="m">m</option>
                                            <option value="m²">m²</option>
                                            <option value="m³">m³</option>
                                            <option value="kg">kg</option>
                                            <option value="Ton">Ton</option>
                                            <option value="sa">sa</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Miktar</label>
                                        <input type="number" step="0.01" required value={workQuantity} onChange={e => setWorkQuantity(e.target.value)} className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:border-orange-500 focus:bg-white transition-all placeholder:text-slate-300" placeholder="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Birim Fiyat</label>
                                        <input type="number" step="0.01" required value={workPrice} onChange={e => setWorkPrice(e.target.value)} className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 outline-none focus:border-orange-500 focus:bg-white transition-all placeholder:text-slate-300" placeholder="0.00" />
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button type="button" onClick={() => setIsAddWorkModalOpen(false)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-colors">İptal</button>
                                    <button type="submit" className="flex-1 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 shadow-xl shadow-slate-900/20 transition-all hover:scale-[1.02]">İmalatı Ekle</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
