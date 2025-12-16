import React, { useState } from 'react';
import {
    Briefcase,
    Plus,
    Search,
    Building2,
    FileText,
    Filter,
    MoreVertical,
    Clock,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Users,
    Calendar,
    TrendingDown,
    FileSignature,
    ArrowRight,
    ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet } from 'lucide-react';

// --- TİP TANIMLARI ---
export interface Contract {
    contractor: string;
    amount: number;
    signDate: string;
    endDate: string;
    status: 'ongoing' | 'completed' | 'terminated';
}

export interface ProgressPayment {
    id: string;
    date: string;
    amount: number;
    description: string;
}

export interface Tender {
    id: string;
    ikn: string;
    name: string;
    estimatedCost: number;
    tenderDate: string;
    method: string;
    status: 'preparation' | 'announced' | 'receiving_bids' | 'evaluation' | 'completed' | 'cancelled';
    bidCount?: number;
    lowestBid?: number;
    highestBid?: number;
    contract?: Contract;
    payments?: ProgressPayment[];
}

interface PublicTendersModuleProps {
    tenders: Tender[];
    onUpdateTenders: (tenders: Tender[]) => void;
}

// --- SABİTLER ---
const STATUS_CONFIG = {
    preparation: { label: 'Hazırlık', color: 'slate', icon: Clock },
    announced: { label: 'İlanda', color: 'blue', icon: Calendar },
    receiving_bids: { label: 'Teklif Alınıyor', color: 'indigo', icon: Users },
    evaluation: { label: 'Değerlendirme', color: 'orange', icon: AlertCircle },
    completed: { label: 'Tamamlandı', color: 'emerald', icon: CheckCircle2 },
    cancelled: { label: 'İptal', color: 'rose', icon: XCircle },
};

const CONTRACT_STATUS_CONFIG = {
    ongoing: { label: 'Devam Ediyor', color: 'blue' },
    completed: { label: 'Tamamlandı', color: 'emerald' },
    terminated: { label: 'Feshedildi', color: 'rose' },
};

const METHOD_OPTIONS = ['Açık İhale', 'Belli İstekliler Arası', 'Pazarlık Usulü', 'Doğrudan Temin'];

export const PublicTendersModule: React.FC<PublicTendersModuleProps> = ({ tenders, onUpdateTenders }) => {
    const [activeTab, setActiveTab] = useState<'tenders' | 'contracts' | 'payments'>('tenders');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string | null>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [editingTender, setEditingTender] = useState<Tender | null>(null);

    const [formData, setFormData] = useState<Partial<Tender>>({
        status: 'preparation',
        tenderDate: new Date().toISOString().split('T')[0],
        method: 'Açık İhale'
    });

    // --- İSTATİSTİKLER ---
    const stats = {
        total: tenders.length,
        ongoing: tenders.filter(t => ['announced', 'receiving_bids', 'evaluation'].includes(t.status)).length,
        contracted: tenders.filter(t => t.contract).length,
        totalContractValue: tenders.reduce((acc, t) => acc + (t.contract?.amount || 0), 0)
    };

    // --- CRUD ---
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.ikn || !formData.name) return;

        if (editingTender) {
            onUpdateTenders(tenders.map(t => t.id === editingTender.id ? { ...t, ...formData } as Tender : t));
        } else {
            const newTender: Tender = {
                id: Date.now().toString(),
                ikn: formData.ikn || '',
                name: formData.name || '',
                estimatedCost: formData.estimatedCost || 0,
                tenderDate: formData.tenderDate || new Date().toISOString().split('T')[0],
                method: formData.method || 'Açık İhale',
                status: formData.status as any || 'preparation',
                bidCount: formData.bidCount,
                lowestBid: formData.lowestBid,
                highestBid: formData.highestBid,
                contract: formData.contract
            };
            onUpdateTenders([...tenders, newTender]);
        }
        closeModal();
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTender(null);
        setFormData({ status: 'preparation', tenderDate: new Date().toISOString().split('T')[0], method: 'Açık İhale' });
    };

    const openEdit = (tender: Tender) => {
        setEditingTender(tender);
        setFormData(tender);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Bu ihaleyi silmek istediğinize emin misiniz?')) {
            onUpdateTenders(tenders.filter(t => t.id !== id));
            closeModal();
        }
    };

    // --- FİLTRELEME ---
    const filteredTenders = tenders.filter(t =>
        (t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.ikn.includes(searchTerm)) &&
        (!filterStatus || t.status === filterStatus)
    );

    const contractedTenders = tenders.filter(t => t.contract);

    const formatCurrency = (val: number) => `₺${val.toLocaleString('tr-TR')}`;

    return (
        <div className="w-full space-y-8">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/20 shadow-xl">
                <div className="flex items-center gap-6">
                    <div className="p-5 bg-slate-900 text-white rounded-3xl shadow-lg">
                        <Building2 className="w-8 h-8" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">İdare Paneli</h2>
                        <p className="text-slate-500 font-medium mt-1">İhale ve Sözleşme Yönetimi</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center gap-3 hover:bg-slate-800 transition-all shadow-lg"
                >
                    <Plus className="w-5 h-5" />
                    Yeni İhale
                </button>
            </div>

            {/* STAT CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Toplam İhale', val: stats.total, icon: Briefcase, color: 'blue' },
                    { label: 'Devam Eden', val: stats.ongoing, icon: Clock, color: 'orange' },
                    { label: 'Sözleşme İmzalanan', val: stats.contracted, icon: FileSignature, color: 'emerald' },
                    { label: 'Toplam Sözleşme Bedeli', val: formatCurrency(stats.totalContractValue), icon: TrendingDown, color: 'indigo' },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-lg flex flex-col items-center text-center group hover:shadow-xl transition-all"
                    >
                        <div className={`p-4 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl mb-4 group-hover:scale-110 transition-transform`}>
                            <stat.icon className="w-6 h-6" />
                        </div>
                        <div className="text-2xl font-black text-slate-800 tracking-tight mb-1">{stat.val}</div>
                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
                    </motion.div>
                ))}
            </div>

            {/* TABS */}
            <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('tenders')}
                    className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'tenders' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Briefcase className="w-4 h-4 inline mr-2" />
                    İhaleler
                </button>
                <button
                    onClick={() => setActiveTab('contracts')}
                    className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'contracts' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <FileSignature className="w-4 h-4 inline mr-2" />
                    Sözleşmeler
                </button>
                <button
                    onClick={() => setActiveTab('payments')}
                    className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${activeTab === 'payments' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Wallet className="w-4 h-4 inline mr-2" />
                    Hakedişler
                </button>
            </div>

            {/* CONTENT */}
            <AnimatePresence mode="wait">
                {activeTab === 'tenders' && (
                    <motion.div
                        key="tenders"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden"
                    >
                        {/* Toolbar */}
                        <div className="p-8 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
                            <div className="relative w-full sm:w-96">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="İKN veya iş adı ara..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-2xl font-bold text-slate-700 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none transition-colors"
                                />
                            </div>
                            <div className="relative">
                                <button
                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    className={`p-4 border-2 rounded-2xl transition-colors flex items-center gap-2 ${filterStatus ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                >
                                    <Filter className="w-5 h-5" />
                                    {filterStatus && <span className="text-sm font-bold">{STATUS_CONFIG[filterStatus as keyof typeof STATUS_CONFIG]?.label}</span>}
                                    <ChevronDown className="w-4 h-4" />
                                </button>
                                <AnimatePresence>
                                    {isFilterOpen && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setIsFilterOpen(false)} />
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                                className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-20"
                                            >
                                                <button onClick={() => { setFilterStatus(null); setIsFilterOpen(false); }} className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold ${!filterStatus ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}>Tümü</button>
                                                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                                    <button key={key} onClick={() => { setFilterStatus(key); setIsFilterOpen(false); }} className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 ${filterStatus === key ? `bg-${config.color}-50 text-${config.color}-700` : 'text-slate-500 hover:bg-slate-50'}`}>
                                                        <config.icon className="w-4 h-4" />{config.label}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-widest text-slate-500 font-extrabold">
                                    <tr>
                                        <th className="px-6 py-5">İKN</th>
                                        <th className="px-6 py-5">İşin Adı</th>
                                        <th className="px-6 py-5">Usul</th>
                                        <th className="px-6 py-5">Tarih</th>
                                        <th className="px-6 py-5 text-center">Durum</th>
                                        <th className="px-6 py-5 text-right">Yaklaşık Maliyet</th>
                                        <th className="px-6 py-5 text-center">Teklif</th>
                                        <th className="px-6 py-5 text-center">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredTenders.length === 0 ? (
                                        <tr><td colSpan={8} className="px-6 py-20 text-center text-slate-400"><Briefcase className="w-16 h-16 mx-auto opacity-20 mb-4" />Kayıtlı ihale bulunamadı</td></tr>
                                    ) : (
                                        filteredTenders.map((tender) => {
                                            const status = STATUS_CONFIG[tender.status];
                                            return (
                                                <tr key={tender.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="px-6 py-5 font-mono font-bold text-slate-600">{tender.ikn}</td>
                                                    <td className="px-6 py-5 font-bold text-slate-800">{tender.name}</td>
                                                    <td className="px-6 py-5 text-slate-600 font-medium text-sm">{tender.method}</td>
                                                    <td className="px-6 py-5 text-slate-500 font-medium tabular-nums">{new Date(tender.tenderDate).toLocaleDateString('tr-TR')}</td>
                                                    <td className="px-6 py-5 text-center">
                                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border bg-${status.color}-50 text-${status.color}-700 border-${status.color}-100`}>
                                                            <status.icon className="w-3.5 h-3.5" />{status.label}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-5 text-right font-mono font-bold text-slate-700">{formatCurrency(tender.estimatedCost)}</td>
                                                    <td className="px-6 py-5 text-center font-bold text-slate-600">{tender.bidCount ?? '-'}</td>
                                                    <td className="px-6 py-5 text-center">
                                                        <button onClick={() => openEdit(tender)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg"><MoreVertical className="w-5 h-5" /></button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'contracts' && (
                    <motion.div
                        key="contracts"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl overflow-hidden"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-widest text-slate-500 font-extrabold">
                                    <tr>
                                        <th className="px-6 py-5">İKN</th>
                                        <th className="px-6 py-5">İşin Adı</th>
                                        <th className="px-6 py-5">Yüklenici</th>
                                        <th className="px-6 py-5 text-right">Sözleşme Bedeli</th>
                                        <th className="px-6 py-5">İmza Tarihi</th>
                                        <th className="px-6 py-5">Bitiş Tarihi</th>
                                        <th className="px-6 py-5 text-center">Durum</th>
                                        <th className="px-6 py-5 text-center">İşlem</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {contractedTenders.length === 0 ? (
                                        <tr><td colSpan={8} className="px-6 py-20 text-center text-slate-400"><FileSignature className="w-16 h-16 mx-auto opacity-20 mb-4" />Sözleşme imzalanmış ihale bulunamadı</td></tr>
                                    ) : (
                                        contractedTenders.map((tender) => {
                                            const contract = tender.contract;
                                            if (!contract) return null;
                                            const cStatus = CONTRACT_STATUS_CONFIG[contract.status] || CONTRACT_STATUS_CONFIG.ongoing;
                                            return (
                                                <tr key={tender.id} className="hover:bg-slate-50/80 transition-colors">
                                                    <td className="px-6 py-5 font-mono font-bold text-slate-600">{tender.ikn}</td>
                                                    <td className="px-6 py-5 font-bold text-slate-800">{tender.name}</td>
                                                    <td className="px-6 py-5 text-slate-700 font-medium">{contract.contractor || '-'}</td>
                                                    <td className="px-6 py-5 text-right font-mono font-bold text-emerald-600">{formatCurrency(contract.amount || 0)}</td>
                                                    <td className="px-6 py-5 text-slate-500 tabular-nums">{contract.signDate ? new Date(contract.signDate).toLocaleDateString('tr-TR') : '-'}</td>
                                                    <td className="px-6 py-5 text-slate-500 tabular-nums">{contract.endDate ? new Date(contract.endDate).toLocaleDateString('tr-TR') : '-'}</td>
                                                    <td className="px-6 py-5 text-center">
                                                        <span className={`px-3 py-1.5 rounded-lg text-xs font-bold bg-${cStatus.color}-50 text-${cStatus.color}-700`}>{cStatus.label}</span>
                                                    </td>
                                                    <td className="px-6 py-5 text-center">
                                                        <button onClick={() => openEdit(tender)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg"><MoreVertical className="w-5 h-5" /></button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'payments' && (
                    <motion.div
                        key="payments"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white rounded-[2.5rem] border border-slate-200 shadow-xl p-6 space-y-6"
                    >
                        <div className="flex flex-col md:flex-row gap-6">
                            {/* Tender Selection */}
                            <div className="md:w-1/3 space-y-4">
                                <h4 className="text-sm font-black text-slate-400 uppercase">İhale Seç</h4>
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {contractedTenders.length === 0 ? (
                                        <p className="text-slate-400 text-sm">Sözleşme imzalanmış ihale bulunamadı</p>
                                    ) : (
                                        contractedTenders.map(t => {
                                            const totalPaid = (t.payments || []).reduce((acc, p) => acc + p.amount, 0);
                                            const remaining = (t.contract?.amount || 0) - totalPaid;
                                            return (
                                                <button
                                                    key={t.id}
                                                    onClick={() => setEditingTender(t)}
                                                    className={`w-full text-left p-4 rounded-xl border transition-all ${editingTender?.id === t.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}
                                                >
                                                    <div className="font-bold text-sm truncate">{t.name}</div>
                                                    <div className={`text-xs mt-1 ${editingTender?.id === t.id ? 'text-slate-300' : 'text-slate-500'}`}>
                                                        Kalan: {formatCurrency(remaining)}
                                                    </div>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            </div>

                            {/* Payment Details */}
                            <div className="md:w-2/3 space-y-4">
                                {editingTender ? (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-sm font-black text-slate-400 uppercase">{editingTender.name}</h4>
                                            <div className="text-right">
                                                <div className="text-xs text-slate-400">Sözleşme Bedeli</div>
                                                <div className="font-bold text-emerald-600">{formatCurrency(editingTender.contract?.amount || 0)}</div>
                                            </div>
                                        </div>

                                        {/* Summary Cards */}
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="bg-blue-50 p-4 rounded-xl text-center">
                                                <div className="text-lg font-black text-blue-700">
                                                    {formatCurrency((editingTender.payments || []).reduce((a, p) => a + p.amount, 0))}
                                                </div>
                                                <div className="text-xs font-bold text-blue-500 uppercase">Ödenen</div>
                                            </div>
                                            <div className="bg-orange-50 p-4 rounded-xl text-center">
                                                <div className="text-lg font-black text-orange-700">
                                                    {formatCurrency((editingTender.contract?.amount || 0) - (editingTender.payments || []).reduce((a, p) => a + p.amount, 0))}
                                                </div>
                                                <div className="text-xs font-bold text-orange-500 uppercase">Kalan</div>
                                            </div>
                                            <div className="bg-emerald-50 p-4 rounded-xl text-center">
                                                <div className="text-lg font-black text-emerald-700">{(editingTender.payments || []).length}</div>
                                                <div className="text-xs font-bold text-emerald-500 uppercase">Hakediş</div>
                                            </div>
                                        </div>

                                        {/* Add Payment Form */}
                                        <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                                            <h5 className="text-xs font-bold text-slate-500 uppercase">Yeni Hakediş Ekle</h5>
                                            <div className="grid grid-cols-3 gap-3">
                                                <input type="date" id="paymentDate" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" defaultValue={new Date().toISOString().split('T')[0]} />
                                                <input type="number" id="paymentAmount" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Tutar" />
                                                <input type="text" id="paymentDesc" className="px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="Açıklama" />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const dateEl = document.getElementById('paymentDate') as HTMLInputElement;
                                                    const amountEl = document.getElementById('paymentAmount') as HTMLInputElement;
                                                    const descEl = document.getElementById('paymentDesc') as HTMLInputElement;
                                                    if (!amountEl.value) return;
                                                    const newPayment = { id: Date.now().toString(), date: dateEl.value, amount: parseFloat(amountEl.value), description: descEl.value };
                                                    const updatedTender = { ...editingTender, payments: [...(editingTender.payments || []), newPayment] };
                                                    onUpdateTenders(tenders.map(t => t.id === editingTender.id ? updatedTender : t));
                                                    setEditingTender(updatedTender);
                                                    amountEl.value = ''; descEl.value = '';
                                                }}
                                                className="w-full py-2 bg-slate-900 text-white rounded-lg font-bold text-sm hover:bg-slate-800"
                                            >
                                                Hakediş Ekle
                                            </button>
                                        </div>

                                        {/* Payment History */}
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {(editingTender.payments || []).length === 0 ? (
                                                <p className="text-slate-400 text-sm text-center py-4">Henüz hakediş kaydı yok</p>
                                            ) : (
                                                (editingTender.payments || []).map((p, i) => (
                                                    <div key={p.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                                        <div>
                                                            <div className="font-bold text-sm text-slate-700">Hakediş #{i + 1}</div>
                                                            <div className="text-xs text-slate-400">{new Date(p.date).toLocaleDateString('tr-TR')} - {p.description || 'Açıklama yok'}</div>
                                                        </div>
                                                        <div className="font-bold text-emerald-600">{formatCurrency(p.amount)}</div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-64 text-slate-400">
                                        <div className="text-center">
                                            <Wallet className="w-16 h-16 mx-auto opacity-20 mb-4" />
                                            <p>Hakediş görmek için bir ihale seçin</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MODAL */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[2rem] w-full max-w-3xl shadow-2xl my-8"
                        >
                            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-[2rem]">
                                <h3 className="text-lg font-black text-slate-800">{editingTender ? 'İhale Düzenle' : 'Yeni İhale'}</h3>
                                <button type="button" onClick={closeModal} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"><XCircle className="w-5 h-5" /></button>
                            </div>

                            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
                                {/* Temel Bilgiler */}
                                <div className="space-y-3">
                                    <h4 className="text-xs font-black text-slate-400 uppercase flex items-center gap-2"><FileText className="w-3.5 h-3.5" />Temel Bilgiler</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <div className="col-span-2 md:col-span-4">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">İşin Adı</label>
                                            <input required type="text" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-sm text-slate-700 focus:border-blue-500 outline-none" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Örn: 24 Derslikli Okul İnşaatı" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">İKN No</label>
                                            <input required type="text" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-sm text-slate-700 focus:border-blue-500 outline-none" value={formData.ikn || ''} onChange={e => setFormData({ ...formData, ikn: e.target.value })} placeholder="2024/..." />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Yaklaşık Maliyet</label>
                                            <input type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-sm text-slate-700 focus:border-blue-500 outline-none" value={formData.estimatedCost || ''} onChange={e => setFormData({ ...formData, estimatedCost: parseFloat(e.target.value) })} placeholder="0" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">İhale Tarihi</label>
                                            <input type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-sm text-slate-700 focus:border-blue-500 outline-none" value={formData.tenderDate || ''} onChange={e => setFormData({ ...formData, tenderDate: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">İhale Usulü</label>
                                            <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-sm text-slate-700 focus:border-blue-500 outline-none" value={formData.method || 'Açık İhale'} onChange={e => setFormData({ ...formData, method: e.target.value })}>
                                                {METHOD_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Durum */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-black text-slate-400 uppercase flex items-center gap-2"><Clock className="w-3.5 h-3.5" />Durum</h4>
                                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                            <button key={key} type="button" onClick={() => setFormData({ ...formData, status: key as any })} className={`px-2 py-2 rounded-lg text-xs font-bold border transition-all flex items-center justify-center gap-1 ${formData.status === key ? `bg-${config.color}-50 border-${config.color}-500 text-${config.color}-700` : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
                                                <config.icon className="w-3 h-3" />{config.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Teklif Bilgileri */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-black text-slate-400 uppercase flex items-center gap-2"><Users className="w-3.5 h-3.5" />Teklif Bilgileri</h4>
                                    <div className="grid grid-cols-3 gap-3">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Teklif Sayısı</label>
                                            <input type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-sm text-slate-700 focus:border-blue-500 outline-none" value={formData.bidCount || ''} onChange={e => setFormData({ ...formData, bidCount: parseInt(e.target.value) })} placeholder="0" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">En Düşük Teklif</label>
                                            <input type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-sm text-slate-700 focus:border-blue-500 outline-none" value={formData.lowestBid || ''} onChange={e => setFormData({ ...formData, lowestBid: parseFloat(e.target.value) })} placeholder="0" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">En Yüksek Teklif</label>
                                            <input type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-sm text-slate-700 focus:border-blue-500 outline-none" value={formData.highestBid || ''} onChange={e => setFormData({ ...formData, highestBid: parseFloat(e.target.value) })} placeholder="0" />
                                        </div>
                                    </div>
                                </div>

                                {/* Sözleşme Bilgileri */}
                                <div className="space-y-2">
                                    <h4 className="text-xs font-black text-slate-400 uppercase flex items-center gap-2"><FileSignature className="w-3.5 h-3.5" />Sözleşme Bilgileri (Opsiyonel)</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                        <div className="col-span-2 md:col-span-5">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Yüklenici Firma</label>
                                            <input type="text" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-sm text-slate-700 focus:border-blue-500 outline-none" value={formData.contract?.contractor || ''} onChange={e => setFormData({ ...formData, contract: { ...formData.contract!, contractor: e.target.value } })} placeholder="Firma Adı" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Sözleşme Bedeli</label>
                                            <input type="number" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-sm text-slate-700 focus:border-blue-500 outline-none" value={formData.contract?.amount || ''} onChange={e => setFormData({ ...formData, contract: { ...formData.contract!, amount: parseFloat(e.target.value) } })} placeholder="0" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Durum</label>
                                            <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-sm text-slate-700 focus:border-blue-500 outline-none" value={formData.contract?.status || 'ongoing'} onChange={e => setFormData({ ...formData, contract: { ...formData.contract!, status: e.target.value as any } })}>
                                                <option value="ongoing">Devam Ediyor</option>
                                                <option value="completed">Tamamlandı</option>
                                                <option value="terminated">Feshedildi</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">İmza Tarihi</label>
                                            <input type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-sm text-slate-700 focus:border-blue-500 outline-none" value={formData.contract?.signDate || ''} onChange={e => setFormData({ ...formData, contract: { ...formData.contract!, signDate: e.target.value } })} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Bitiş Tarihi</label>
                                            <input type="date" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-semibold text-sm text-slate-700 focus:border-blue-500 outline-none" value={formData.contract?.endDate || ''} onChange={e => setFormData({ ...formData, contract: { ...formData.contract!, endDate: e.target.value } })} />
                                        </div>
                                    </div>
                                </div>
                            </form>

                            {/* Buttons outside form */}
                            <div className="p-5 pt-4 flex gap-2 border-t border-slate-100">
                                {editingTender && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (window.confirm('Bu ihaleyi silmek istediğinize emin misiniz?')) {
                                                onUpdateTenders(tenders.filter(t => t.id !== editingTender.id));
                                                closeModal();
                                            }
                                        }}
                                        className="px-4 py-2.5 rounded-lg bg-rose-50 text-rose-600 font-bold text-sm hover:bg-rose-100"
                                    >
                                        Sil
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={handleSubmit as any}
                                    className="flex-1 px-4 py-2.5 rounded-lg bg-slate-900 text-white font-bold text-sm hover:bg-slate-800 shadow-lg flex items-center justify-center gap-2"
                                >
                                    {editingTender ? 'Güncelle' : 'Oluştur'}
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
