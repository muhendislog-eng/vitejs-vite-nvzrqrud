import React, { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';

interface LegalPageProps {
    title: string;
    onBack: () => void;
    children?: React.ReactNode;
}

const LegalPageLayout: React.FC<LegalPageProps> = ({ title, onBack, children }) => {
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] min-h-[700px] gap-6 animate-in fade-in duration-500">
            {/* HERDER CARD */}
            <div className="p-8 rounded-[2.5rem] bg-gradient-to-br from-white via-white to-slate-50/30 border border-slate-200/60 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-slate-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none transition-all duration-700 group-hover:bg-slate-500/10"></div>
                <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-3 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:bg-slate-50 transition-all group/back"
                        >
                            <ArrowLeft className="w-6 h-6 text-slate-400 group-hover/back:text-slate-700 transition-colors" />
                        </button>
                        <div>
                            <h2 className="text-3xl font-black text-slate-800 tracking-tight">{title}</h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENT AREA */}
            <div className="flex-1 bg-white border border-slate-200/60 rounded-[2rem] shadow-xl shadow-slate-200/40 p-8 sm:p-12 overflow-auto custom-scrollbar">
                {children || (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-50">
                        <p className="text-lg font-medium">İçerik bekleniyor...</p>
                        <p className="text-sm">Buraya tıklanıldığında metin alanı gelecek.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export const TermsOfUse = ({ onBack }: { onBack: () => void }) => (
    <LegalPageLayout title="Kullanım Koşulları" onBack={onBack}>
        <div className="prose prose-slate max-w-none">
            <p className="text-slate-500">Kullanım Koşulları metni buraya eklenecek.</p>
        </div>
    </LegalPageLayout>
);

export const PrivacyPolicy = ({ onBack }: { onBack: () => void }) => (
    <LegalPageLayout title="Gizlilik Politikası" onBack={onBack}>
        <div className="prose prose-slate max-w-none">
            <p className="text-slate-500">Gizlilik Politikası metni buraya eklenecek.</p>
        </div>
    </LegalPageLayout>
);

export const LicenseInfo = ({ onBack }: { onBack: () => void }) => (
    <LegalPageLayout title="Lisans Bilgisi" onBack={onBack}>
        <div className="prose prose-slate max-w-none">
            <p className="text-slate-500">Lisans Bilgisi metni buraya eklenecek.</p>
        </div>
    </LegalPageLayout>
);
