import React, { useState } from 'react';
import { Trash2, Plus, FileText, Printer, Building2, Search, Edit2, Save } from 'lucide-react';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, TextRun, AlignmentType, BorderStyle } from 'docx';
import { saveAs } from 'file-saver';
import { formatCurrency } from '../utils/helpers';

interface MarketItem {
    id: string;
    pozNo: string;
    description: string;
    unit: string;
    quantity: number;
    offers: number[]; // Dynamic array
}

interface MarketPriceResearchProps {
    items: MarketItem[];
    onUpdateItems: (items: MarketItem[]) => void;
    firms: string[];
    onUpdateFirms: (firms: string[]) => void;
    administrationName: string;
    onUpdateAdministrationName: (name: string) => void;
}

export const MarketPriceResearch: React.FC<MarketPriceResearchProps> = ({
    items,
    onUpdateItems,
    firms,
    onUpdateFirms,
    administrationName,
    onUpdateAdministrationName
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newItem, setNewItem] = useState<Partial<MarketItem>>({
        pozNo: '',
        description: '',
        unit: 'Adet',
        quantity: 1,
        offers: []
    });
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const handlePrint = () => {
        window.print();
    };

    const handleAddItem = () => {
        if (!newItem.pozNo || !newItem.description) return;

        if (editingId) {
            // Update existing item
            const updatedItems = items.map(item =>
                item.id === editingId ? {
                    ...item,
                    pozNo: newItem.pozNo!,
                    description: newItem.description!,
                    unit: newItem.unit || 'Adet',
                    quantity: newItem.quantity || 1
                } : item
            );
            onUpdateItems(updatedItems);
            setEditingId(null);
        } else {
            // Create new item
            const item: MarketItem = {
                id: Date.now().toString(),
                pozNo: newItem.pozNo!,
                description: newItem.description!,
                unit: newItem.unit || 'Adet',
                quantity: newItem.quantity || 1,
                offers: Array(firms.length).fill(0)
            };
            onUpdateItems([...items, item]);
        }

        setNewItem({ pozNo: '', description: '', unit: 'Adet', quantity: 1, offers: [] });
        setIsModalOpen(false);
    };

    const handleEditItem = (item: MarketItem) => {
        setNewItem({ ...item });
        setEditingId(item.id);
        setIsModalOpen(true);
    };

    const handleDeleteItem = (id: string) => {
        if (window.confirm('Bu kalemi silmek istediğinizden emin misiniz?')) {
            onUpdateItems(items.filter(i => i.id !== id));
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setNewItem({ pozNo: '', description: '', unit: 'Adet', quantity: 1, offers: [] });
        setEditingId(null);
    };

    const handleUpdateOffer = (id: string, offerIndex: number, value: number) => {
        const updatedItems = items.map(item => {
            if (item.id === id) {
                const newOffers = [...item.offers];
                // Ensure array is long enough
                while (newOffers.length < firms.length) newOffers.push(0);
                newOffers[offerIndex] = value;
                return { ...item, offers: newOffers };
            }
            return item;
        });
        onUpdateItems(updatedItems);
    };

    const handleAddFirm = () => {
        if (firms.length >= 5) return;
        const newFirms = [...firms, `Firma ${String.fromCharCode(65 + firms.length)} `];
        onUpdateFirms(newFirms);

        // Add 0 offer for the new firm to all items
        const updatedItems = items.map(item => ({
            ...item,
            offers: [...item.offers, 0]
        }));
        onUpdateItems(updatedItems);
    };

    const handleRemoveFirm = () => {
        if (firms.length <= 3) return;
        const newFirms = firms.slice(0, -1);
        onUpdateFirms(newFirms);

        // Remove last offer from all items
        const updatedItems = items.map(item => ({
            ...item,
            offers: item.offers.slice(0, -1)
        }));
        onUpdateItems(updatedItems);
    };

    const handleFirmNameChange = (index: number, name: string) => {
        const newFirms = [...firms];
        newFirms[index] = name;
        onUpdateFirms(newFirms);
    };

    const calculateAverage = (offers: number[]) => {
        const validOffers = offers.filter(o => o > 0);
        if (validOffers.length === 0) return 0;
        return validOffers.reduce((a, b) => a + b, 0) / validOffers.length;
    };

    const handleDownloadWord = async () => {
        // Table Headers
        const tableHeaderRow = new TableRow({
            children: [
                new TableCell({ children: [new Paragraph({ text: "S.No", alignment: AlignmentType.CENTER, style: "strong" })], width: { size: 5, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ text: "Poz No", style: "strong" })], width: { size: 10, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ text: "İşin Tanımı", style: "strong" })], width: { size: 30, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ text: "Birim", alignment: AlignmentType.CENTER, style: "strong" })], width: { size: 5, type: WidthType.PERCENTAGE } }),
                new TableCell({ children: [new Paragraph({ text: "Miktar", alignment: AlignmentType.CENTER, style: "strong" })], width: { size: 5, type: WidthType.PERCENTAGE } }),
                ...firms.map(firm => new TableCell({ children: [new Paragraph({ text: firm, alignment: AlignmentType.RIGHT, style: "strong" })], width: { size: 10, type: WidthType.PERCENTAGE } })),
                new TableCell({ children: [new Paragraph({ text: "Ortalama", alignment: AlignmentType.RIGHT, style: "strong" })], width: { size: 10, type: WidthType.PERCENTAGE } }),
            ],
        });

        // Table Rows
        const tableRows = items.map((item, index) => {
            return new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: (index + 1).toString(), alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: item.pozNo || "" })] }),
                    new TableCell({ children: [new Paragraph({ text: item.description || "" })] }),
                    new TableCell({ children: [new Paragraph({ text: item.unit || "", alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: item.quantity.toString(), alignment: AlignmentType.CENTER })] }),
                    ...firms.map((_, i) => new TableCell({
                        children: [new Paragraph({
                            text: item.offers[i] > 0 ? formatCurrency(item.offers[i]).replace('₺', '') : "-",
                            alignment: AlignmentType.RIGHT
                        })]
                    })),
                    new TableCell({
                        children: [new Paragraph({
                            text: formatCurrency(calculateAverage(item.offers)).replace('₺', ''),
                            alignment: AlignmentType.RIGHT, style: "strong"
                        })]
                    }),
                ],
            });
        });

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        text: administrationName,
                        heading: "Heading2",
                        alignment: AlignmentType.CENTER,
                    }),
                    new Paragraph({
                        text: "PİYASA FİYAT ARAŞTIRMASI TUTANAĞI",
                        heading: "Heading1",
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 },
                    }),
                    new Paragraph({
                        text: `Tarih: ${new Date().toLocaleDateString('tr-TR')} `,
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 400 },
                    }),
                    new Paragraph({
                        text: "Aşağıda dökümü yapılan mal/hizmet alımları için piyasada faaliyet gösteren firmalardan alınan teklifler neticesinde; en uygun fiyatların tespit edilmesi ve yaklaşık maliyetin belirlenmesi amacıyla işbu tutanak tarafımızca düzenlenmiştir.",
                        alignment: AlignmentType.JUSTIFIED,
                        spacing: { after: 400 },
                    }),
                    new Table({
                        width: { size: 100, type: WidthType.PERCENTAGE },
                        rows: [tableHeaderRow, ...tableRows],
                    }),
                    new Paragraph({ text: "", spacing: { before: 800 } }),

                    // Signatures (Simplified as text for Word)
                    new Paragraph({
                        children: [
                            new TextRun({ text: "Düzenleyen                                                                      ONAY", bold: true }),
                        ],
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 800 }
                    }),
                    new Paragraph({
                        text: "(İmza)                                                                             (İmza)",
                        alignment: AlignmentType.CENTER,
                    }),
                ],
            }],
        });

        Packer.toBlob(doc).then((blob) => {
            saveAs(blob, "piyasa_arastirma_tutanagi.docx");
        });
    };

    return (
        <>
            <div className="flex flex-col h-[calc(100vh-140px)] min-h-[700px] gap-6 print:hidden">

                {/* HERDER CARD */}
                {/* HERDER CARD */}
                <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-white via-white to-indigo-50/30 border border-white/60 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none transition-all duration-700 group-hover:bg-indigo-500/10"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none transition-all duration-700 group-hover:bg-emerald-500/10"></div>

                    <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between relative z-10">
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 transform group-hover:scale-105 transition-transform duration-300">
                                    <Search className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black text-slate-800 tracking-tight">Piyasa Fiyat Araştırması</h2>
                                    <p className="text-sm font-medium text-slate-500 mt-1">Malzeme ve hizmet tekliflerini karşılaştırın.</p>
                                </div>
                            </div>

                            {/* ADMINISTRATION INPUT */}
                            <div className="max-w-xl">
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">İdare / Kurum Bilgisi (Tutanağa Başlık Olarak Basılır)</label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <Building2 className="w-5 h-5 text-slate-400 group-focus-within/input:text-indigo-500 transition-colors duration-300" />
                                    </div>
                                    <input
                                        type="text"
                                        value={administrationName}
                                        onChange={(e) => onUpdateAdministrationName(e.target.value)}
                                        placeholder="Örn: T.C. ÖRNEK BELEDİYESİ İMAR VE ŞEHİRCİLİK MÜDÜRLÜĞÜ"
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl font-bold text-slate-700 shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 focus:bg-white outline-none transition-all duration-300 placeholder-slate-300 hover:border-indigo-200 hover:bg-white"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent scale-x-0 group-focus-within/input:scale-x-100 transition-transform duration-500 opacity-50"></div>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-4 items-center">
                            <div className="flex bg-slate-100/80 p-1 rounded-2xl border border-slate-200 backdrop-blur-sm">
                                <button
                                    onClick={handleAddFirm}
                                    disabled={firms.length >= 5}
                                    className="h-10 px-4 hover:bg-white hover:shadow-sm text-slate-600 hover:text-emerald-600 rounded-xl font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                                    title="Firma Ekle"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                                <div className="w-px bg-slate-300 my-2 mx-1"></div>
                                <button
                                    onClick={handleRemoveFirm}
                                    disabled={firms.length <= 3}
                                    className="h-10 px-4 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-xl font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                                    title="Firma Sil"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="h-12 px-6 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold shadow-lg shadow-slate-200 transition-all flex items-center gap-2 active:scale-95 hover:-translate-y-0.5"
                            >
                                <Plus className="w-5 h-5" />
                                Yeni Kalem
                            </button>
                            <button
                                onClick={handleDownloadWord}
                                disabled={items.length === 0}
                                className="h-12 px-6 bg-white border-2 border-slate-200 hover:border-slate-800 hover:bg-slate-50 text-slate-700 rounded-2xl font-bold shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 hover:-translate-y-0.5"
                            >
                                <FileText className="w-5 h-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                                Word İndir
                            </button>
                            <button
                                onClick={() => setShowPrintPreview(true)}
                                disabled={items.length === 0}
                                className="h-12 w-12 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 hover:-translate-y-0.5"
                                title="Önizle"
                            >
                                <FileText className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* MAIN CONTENT AREA */}
                <div className="flex-1 bg-white border border-slate-200/60 rounded-[2rem] shadow-xl shadow-slate-200/40 overflow-hidden flex flex-col relative min-h-[500px]">

                    {/* TABLE HEADER */}
                    <div className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 grid grid-cols-[0.8fr_2.5fr_0.7fr_6fr_1fr_0.8fr] gap-4 px-8 py-4 items-center">
                        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Poz No</div>
                        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Açıklama</div>
                        <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center">Birim</div>

                        {/* DYNAMIC FIRM HEADERS */}
                        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${firms.length}, minmax(0, 1fr))` }}>
                            {firms.map((firm, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    value={firm}
                                    onChange={(e) => handleFirmNameChange(index, e.target.value)}
                                    className="w-full text-[10px] font-extrabold uppercase tracking-wider text-center py-2 px-2 rounded-lg border border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white outline-none transition-all text-slate-600 bg-slate-100/50 focus:text-indigo-600 focus:bg-indigo-50/10 placeholder:text-slate-400"
                                />
                            ))}
                        </div>

                        <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest text-right">
                            <span>Ortalama</span>
                        </div>

                        <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest text-center">
                            <span>İşlem</span>
                        </div>
                    </div>

                    {/* TABLE BODY */}
                    <div className="flex-1 overflow-auto p-0 custom-scrollbar relative">
                        {items.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                                    <Search className="w-8 h-8 text-slate-300" />
                                </div>
                                <span className="text-lg font-bold text-slate-700">Listeniz Boş</span>
                                <span className="text-sm font-medium text-slate-400 mt-1 max-w-xs text-center">Piyasa araştırmasına başlamak için "Yeni Kalem Ekle" butonunu kullanın.</span>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {items.map((item) => (
                                    <div key={item.id} className="grid grid-cols-[0.8fr_2.5fr_0.7fr_6fr_1fr_0.8fr] gap-4 px-8 py-4 items-center hover:bg-indigo-50/30 transition-colors group">
                                        <div className="text-xs font-bold text-slate-600 font-mono tracking-tight">{item.pozNo}</div>
                                        <div className="text-sm font-semibold text-slate-700 leading-snug flex items-center gap-3">
                                            {item.description}
                                        </div>
                                        <div className="text-xs font-bold text-slate-500 text-center">
                                            <span className="bg-slate-100/50 border border-slate-200 px-2 py-0.5 rounded text-[10px] uppercase">
                                                {item.unit}
                                            </span>
                                        </div>

                                        {/* DYNAMIC FIRM INPUTS */}
                                        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${firms.length}, minmax(0, 1fr))` }}>
                                            {firms.map((_, index) => (
                                                <input
                                                    key={index}
                                                    type="number"
                                                    value={item.offers[index] || ''}
                                                    onChange={(e) => handleUpdateOffer(item.id, index, parseFloat(e.target.value))}
                                                    className="w-full text-right px-3 py-2 bg-transparent border border-transparent hover:border-slate-200 focus:bg-white focus:border-indigo-400 rounded-lg text-sm font-semibold focus:ring-4 focus:ring-indigo-100 outline-none transition-all text-slate-700 placeholder:text-slate-300 focus:text-indigo-600"
                                                    placeholder="0.00"
                                                />
                                            ))}
                                        </div>

                                        <div className="flex justify-end">
                                            <div className="text-sm font-bold text-slate-700 text-right bg-slate-50 py-2 px-3 rounded-lg border border-slate-200/50 min-w-[100px]">
                                                {formatCurrency(calculateAverage(item.offers))}
                                            </div>
                                        </div>

                                        {/* ACTIONS */}
                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEditItem(item)}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                title="Düzenle"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteItem(item.id)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                title="Sil"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* ADD ITEM MODAL */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                        <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col overflow-hidden ring-1 ring-slate-900/5">

                            {/* MODAL HEADER */}
                            <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex items-center justify-between relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3 relative z-10">
                                    <div className={`p - 2.5 rounded - xl ${editingId ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-600 text-white'} shadow - lg shadow - indigo - 200`}>
                                        {editingId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                    </div>
                                    {editingId ? 'Kalemi Düzenle' : 'Yeni Kalem Ekle'}
                                </h3>
                                <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 p-2 rounded-lg transition-all z-10" title="Kapat">
                                    <div className="w-6 h-6 flex items-center justify-center font-bold text-lg">×</div>
                                </button>
                            </div>

                            {/* MODAL BODY */}
                            <div className="p-8 space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Poz No</label>
                                    <input
                                        type="text"
                                        value={newItem.pozNo}
                                        onChange={(e) => setNewItem({ ...newItem, pozNo: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-700 font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all placeholder:font-normal"
                                        placeholder="Örn: 15.200.1001"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Açıklama</label>
                                    <input
                                        type="text"
                                        value={newItem.description}
                                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-700 font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all placeholder:font-normal"
                                        placeholder="İşin tanımı..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Birim</label>
                                        <div className="relative">
                                            <select
                                                value={newItem.unit}
                                                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                                                className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-700 font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none appearance-none cursor-pointer hover:border-slate-300 transition-all"
                                            >
                                                <option>Adet</option>
                                                <option>m²</option>
                                                <option>m³</option>
                                                <option>mt</option>
                                                <option>kg</option>
                                                <option>ton</option>
                                                <option>Tk</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">Miktar</label>
                                        <input
                                            type="number"
                                            value={newItem.quantity}
                                            onChange={(e) => setNewItem({ ...newItem, quantity: parseFloat(e.target.value) })}
                                            className="w-full px-5 py-4 bg-slate-50/50 border border-slate-200 rounded-2xl text-slate-700 font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:bg-white outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-4">
                                    <button
                                        onClick={handleCloseModal}
                                        className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl font-bold transition-colors"
                                    >
                                        İptal
                                    </button>
                                    <button
                                        onClick={handleAddItem}
                                        className="flex-[2] px-6 py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-500/20 hover:shadow-indigo-500/40 transition-all flex items-center justify-center gap-2 transform active:scale-95"
                                    >
                                        {editingId ? <Save className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                        {editingId ? 'Değişiklikleri Kaydet' : 'Kalemi Listeye Ekle'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PRINT PREVIEW MODAL */}
                {showPrintPreview && (
                    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
                        <div className="relative bg-zinc-100 rounded-sm shadow-2xl overflow-hidden flex flex-col max-h-full my-auto">

                            {/* TOOLBAR */}
                            <div className="sticky top-0 z-50 bg-slate-800 text-white p-4 flex items-center justify-between shadow-lg print:hidden">
                                <h3 className="font-bold flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-indigo-400" />
                                    Baskı Önizleme
                                </h3>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setShowPrintPreview(false)}
                                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold text-sm transition-colors"
                                    >
                                        Kapat
                                    </button>
                                    <button
                                        onClick={handlePrint}
                                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
                                    >
                                        <Printer className="w-4 h-4" />
                                        Yazdır / PDF İndir
                                    </button>
                                </div>
                            </div>

                            {/* PRINT CONTENT SCROLL AREA */}
                            <div className="overflow-y-auto custom-scrollbar p-8 bg-zinc-200/50 flex justify-center">
                                <div className="bg-white w-[210mm] min-h-[297mm] shadow-xl p-[20mm] text-black print-content mx-auto shrink-0 relative">

                                    {/* HEADER */}
                                    <div className="text-center mb-12 border-b-2 border-black pb-4">
                                        {administrationName && (
                                            <h2 className="text-xl font-bold mb-2 uppercase tracking-wide">{administrationName}</h2>
                                        )}
                                        <h1 className="text-2xl font-black mb-2">PİYASA FİYAT ARAŞTIRMASI TUTANAĞI</h1>
                                        <p className="text-sm font-semibold">Tarih: {new Date().toLocaleDateString('tr-TR')}</p>
                                    </div>

                                    <p className="mb-8 text-sm leading-relaxed text-justify font-serif">
                                        Aşağıda dökümü yapılan mal/hizmet alımları için piyasada faaliyet gösteren firmalardan alınan teklifler neticesinde;
                                        en uygun fiyatların tespit edilmesi ve yaklaşık maliyetin belirlenmesi amacıyla işbu tutanak tarafımızca düzenlenmiştir.
                                    </p>

                                    {/* TABLE */}
                                    <table className="w-full border-collapse border border-black mb-12 text-[10px]">
                                        <thead>
                                            <tr className="bg-gray-100">
                                                <th className="border border-black p-2 w-10 text-center font-black">S.No</th>
                                                <th className="border border-black p-2 w-20 text-left font-black">Poz No</th>
                                                <th className="border border-black p-2 text-left font-black">İşin Tanımı</th>
                                                <th className="border border-black p-2 w-12 text-center font-black">Birim</th>
                                                <th className="border border-black p-2 w-12 text-center font-black">Miktar</th>
                                                {firms.map((firm, index) => (
                                                    <th key={index} className="border border-black p-2 w-24 text-right font-black">{firm}</th>
                                                ))}
                                                <th className="border border-black p-2 w-24 text-right font-black bg-gray-200">Ortalama</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item, index) => (
                                                <tr key={item.id}>
                                                    <td className="border border-black p-2 text-center font-medium">{index + 1}</td>
                                                    <td className="border border-black p-2 font-medium">{item.pozNo}</td>
                                                    <td className="border border-black p-2 font-medium">{item.description}</td>
                                                    <td className="border border-black p-2 text-center font-medium">{item.unit}</td>
                                                    <td className="border border-black p-2 text-center font-medium">{item.quantity}</td>
                                                    {firms.map((_, i) => (
                                                        <td key={i} className="border border-black p-2 text-right font-medium">
                                                            {item.offers[i] > 0 ? formatCurrency(item.offers[i]) : '-'}
                                                        </td>
                                                    ))}
                                                    <td className="border border-black p-2 text-right font-bold bg-gray-50">{formatCurrency(calculateAverage(item.offers))}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    {/* SIGNATURES */}
                                    <div className="mt-auto pt-12 grid grid-cols-3 gap-8 text-center text-sm page-break-inside-avoid">
                                        <div className="flex flex-col gap-16">
                                            <div>
                                                <div className="font-bold mb-1">Görevli Personel</div>
                                                <div className="text-[10px] uppercase text-gray-500">(İmza)</div>
                                            </div>
                                            <div className="border-b border-black w-3/4 mx-auto border-dotted"></div>
                                        </div>
                                        <div className="flex flex-col gap-16">
                                            <div>
                                                <div className="font-bold mb-1">Görevli Personel</div>
                                                <div className="text-[10px] uppercase text-gray-500">(İmza)</div>
                                            </div>
                                            <div className="border-b border-black w-3/4 mx-auto border-dotted"></div>
                                        </div>
                                        <div className="flex flex-col gap-16">
                                            <div>
                                                <div className="font-bold mb-1">ONAY</div>
                                                <div className="text-[10px] uppercase text-gray-500">(İmza)</div>
                                            </div>
                                            <div className="border-b border-black w-3/4 mx-auto border-dotted"></div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* Placeholder for handleDownloadWord function */}
            {/* This function would typically be defined earlier in the component, e.g., before the return statement */}
            {/* For example: */}
            {/* const handleDownloadWord = () => { */}
            {/*   // Logic to generate and download a Word document */}
            {/*   console.log("Downloading Word document..."); */}
            {/* }; */}
        </>
    );
};
