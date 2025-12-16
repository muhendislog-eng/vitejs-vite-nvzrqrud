import React, { useState, useMemo } from 'react';
import {
    Calendar as CalendarIcon,
    Sun,
    Cloud,
    CloudRain,
    Snowflake,
    Wind,
    Users,
    FileText,
    CheckCircle2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Save,
    RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
export interface DailyReport {
    date: string; // YYYY-MM-DD
    weather: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'windy';
    temperature: number;
    personnel: {
        engineers: number;
        masters: number;
        workers: number;
    };
    workSummary: string;
}

interface ConstructionManagementModuleProps {
    reports: DailyReport[];
    onUpdateReports: (reports: DailyReport[]) => void;
}

// --- Icons Map ---
const WEATHER_ICONS = {
    sunny: { icon: Sun, label: 'Güneşli', color: 'text-amber-500', bg: 'bg-amber-50' },
    cloudy: { icon: Cloud, label: 'Bulutlu', color: 'text-slate-500', bg: 'bg-slate-50' },
    rainy: { icon: CloudRain, label: 'Yağmurlu', color: 'text-blue-500', bg: 'bg-blue-50' },
    snowy: { icon: Snowflake, label: 'Karlı', color: 'text-cyan-500', bg: 'bg-cyan-50' },
    windy: { icon: Wind, label: 'Rüzgarlı', color: 'text-teal-500', bg: 'bg-teal-50' },
};

export const ConstructionManagementModule: React.FC<ConstructionManagementModuleProps> = ({ reports, onUpdateReports }) => {
    // --- State ---
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Form State (initialized with selected date's report or default)
    const [formData, setFormData] = useState<DailyReport>({
        date: selectedDate,
        weather: 'sunny',
        temperature: 20,
        personnel: { engineers: 0, masters: 0, workers: 0 },
        workSummary: ''
    });

    // Sync form when date changes
    useMemo(() => {
        const existingReport = reports.find(r => r.date === selectedDate);
        if (existingReport) {
            setFormData(existingReport);
        } else {
            setFormData({
                date: selectedDate,
                weather: 'sunny',
                temperature: 20,
                personnel: { engineers: 0, masters: 0, workers: 0 },
                workSummary: ''
            });
        }
    }, [selectedDate, reports]);

    // --- Helpers ---
    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay(); // 0 = Sunday
        // Shift so 0 = Monday (Turkish system)
        const shiftedFirstDay = firstDay === 0 ? 6 : firstDay - 1;
        return { days, firstDay: shiftedFirstDay };
    };

    const { days: totalDays, firstDay } = getDaysInMonth(currentMonth);

    const getDayStatus = (day: number) => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth() + 1;
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const todayStr = new Date().toISOString().slice(0, 10);

        const hasReport = reports.some(r => r.date === dateStr);
        const isFuture = dateStr > todayStr;
        const isToday = dateStr === todayStr;

        if (hasReport) return 'completed';
        if (isFuture) return 'future';
        return 'missing'; // Past and no report
    };

    const handleSave = () => {
        const existingIndex = reports.findIndex(r => r.date === formData.date);
        let newReports = [...reports];

        if (existingIndex >= 0) {
            newReports[existingIndex] = formData;
        } else {
            newReports.push(formData);
        }

        onUpdateReports(newReports);
        // Optional: Show success feedback
    };

    const changeMonth = (offset: number) => {
        const newDate = new Date(currentMonth);
        newDate.setMonth(newDate.getMonth() + offset);
        setCurrentMonth(newDate);
    };

    return (
        <div className="w-full max-w-[1400px] mx-auto p-4 md:p-8 space-y-8 pb-32">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-black text-slate-800 tracking-tight mb-2">İnşaat Yönetimi</h1>
                <p className="text-slate-500 font-medium text-lg max-w-xl">
                    Şantiye günlük raporlarınızı tutun, personel ve iş ilerlemesini takip edin.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Calendar (4 cols) */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-6">
                            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <h3 className="font-bold text-slate-800 text-lg capitalize">
                                {currentMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                            </h3>
                            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-500 transition-colors">
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Days Grid */}
                        <div className="grid grid-cols-7 gap-2 text-center mb-2">
                            {['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'].map(d => (
                                <span key={d} className="text-xs font-bold text-slate-400 uppercase">{d}</span>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                            {Array.from({ length: firstDay }).map((_, i) => (
                                <div key={`empty-${i}`} />
                            ))}
                            {Array.from({ length: totalDays }).map((_, i) => {
                                const day = i + 1;
                                const status = getDayStatus(day);
                                const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const isSelected = dateStr === selectedDate;

                                let statusClass = '';
                                if (status === 'completed') statusClass = 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200';
                                else if (status === 'missing') statusClass = 'bg-red-50 text-red-600 hover:bg-red-100 border-red-100';
                                else statusClass = 'bg-slate-50 text-slate-400 border-transparent'; // Future

                                if (isSelected) statusClass += ' ring-2 ring-slate-900 ring-offset-2 !bg-slate-900 !text-white';

                                return (
                                    <button
                                        key={day}
                                        onClick={() => setSelectedDate(dateStr)}
                                        className={`
                                            aspect-square rounded-xl flex items-center justify-center font-bold text-sm transition-all border
                                            ${statusClass}
                                        `}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="flex items-center justify-center gap-4 mt-6 text-xs font-medium text-slate-500">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                                <span>Girildi</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                                <span>Eksik</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-slate-300"></div>
                                <span>Gelecek</span>
                            </div>
                        </div>
                    </div>

                    {/* Today's Status Card */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-[2rem] shadow-xl text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-3xl"></div>
                        <div className="relative z-10">
                            <h4 className="opacity-80 font-medium mb-1">Bugünün Durumu</h4>
                            <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold">{new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</span>
                                {getDayStatus(new Date().getDate()) === 'completed' ? (
                                    <span className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full text-green-300 text-sm font-bold border border-green-500/20">
                                        <CheckCircle2 className="w-4 h-4" /> Rapor Tamam
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2 bg-red-500/20 px-3 py-1 rounded-full text-red-300 text-sm font-bold border border-red-500/20 animate-pulse">
                                        <AlertCircle className="w-4 h-4" /> Giriş Yapılmadı
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Form (8 cols) */}
                <div className="lg:col-span-8">
                    <div className="bg-white rounded-[2rem] shadow-xl border border-slate-100 p-8 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-slate-800 to-slate-900"></div>

                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Günlük Rapor Girişi</h3>
                                <p className="text-slate-500 font-medium">
                                    {new Date(selectedDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} tarihli rapor
                                </p>
                            </div>
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-slate-900/20 active:scale-95"
                            >
                                {reports.some(r => r.date === selectedDate) ? (
                                    <>
                                        <RefreshCw className="w-5 h-5" />
                                        Güncelle
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Kaydet
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Weather Section */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Hava Durumu</label>
                                <div className="grid grid-cols-5 gap-2">
                                    {Object.entries(WEATHER_ICONS).map(([key, { icon: Icon, label, color, bg }]) => {
                                        const isSelected = formData.weather === key;
                                        return (
                                            <button
                                                key={key}
                                                onClick={() => setFormData({ ...formData, weather: key as any })}
                                                className={`
                                                    p-3 rounded-2xl flex flex-col items-center gap-2 transition-all border-2
                                                    ${isSelected ? `border-${color.split('-')[1]}-500 ${bg} ring-2 ring-offset-1` : 'border-slate-100 hover:border-slate-200'}
                                                `}
                                                title={label}
                                            >
                                                <Icon className={`w-6 h-6 ${isSelected ? color : 'text-slate-400'}`} />
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Temperature */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Sıcaklık (°C)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={formData.temperature}
                                        onChange={e => setFormData({ ...formData, temperature: parseInt(e.target.value) })}
                                        className="w-full p-4 bg-slate-50 rounded-2xl font-black text-2xl text-slate-800 border-none focus:ring-2 focus:ring-slate-900/20 text-center"
                                    />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">°C</span>
                                </div>
                            </div>

                            {/* Personnel Section */}
                            <div className="md:col-span-2 space-y-4">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Personel Mevcudu</label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-3 mb-2 text-slate-500">
                                            <Users className="w-5 h-5" />
                                            <span className="font-bold text-sm">Mühendis/Teknik</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={formData.personnel.engineers}
                                            onChange={e => setFormData({ ...formData, personnel: { ...formData.personnel, engineers: parseInt(e.target.value) } })}
                                            className="w-full bg-white p-3 rounded-xl font-bold text-xl text-slate-800 text-center border-none shadow-sm focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-3 mb-2 text-slate-500">
                                            <Users className="w-5 h-5" />
                                            <span className="font-bold text-sm">Usta/Formen</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={formData.personnel.masters}
                                            onChange={e => setFormData({ ...formData, personnel: { ...formData.personnel, masters: parseInt(e.target.value) } })}
                                            className="w-full bg-white p-3 rounded-xl font-bold text-xl text-slate-800 text-center border-none shadow-sm focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-3 mb-2 text-slate-500">
                                            <Users className="w-5 h-5" />
                                            <span className="font-bold text-sm">Düz İşçi</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={formData.personnel.workers}
                                            onChange={e => setFormData({ ...formData, personnel: { ...formData.personnel, workers: parseInt(e.target.value) } })}
                                            className="w-full bg-white p-3 rounded-xl font-bold text-xl text-slate-800 text-center border-none shadow-sm focus:ring-2 focus:ring-blue-500/20"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Work Summary */}
                            <div className="md:col-span-2 space-y-4">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Yapılan İş Özeti</label>
                                <textarea
                                    value={formData.workSummary}
                                    onChange={e => setFormData({ ...formData, workSummary: e.target.value })}
                                    placeholder="Bugün sahada yapılan imalatları ve önemli olayları detaylıca yazınız..."
                                    className="w-full h-48 p-4 bg-slate-50 rounded-2xl border-none focus:ring-2 focus:ring-slate-900/20 font-medium text-slate-700 resize-none leading-relaxed shadow-inner"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
