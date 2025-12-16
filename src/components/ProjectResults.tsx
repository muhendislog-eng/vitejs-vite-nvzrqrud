import React, { useMemo } from 'react';
import {
    LayoutDashboard,
    Printer,
    TrendingUp,
    Wallet,
    Zap,
    Settings,
    Building,
    Ruler,
    PieChart as PieChartIcon,
    Activity,
    CheckCircle2,
    Table as TableIcon,
    ArrowRight
} from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { formatCurrency } from '../utils/helpers';

interface MetrajItem {
    price: number;
    quantity: number;
    [key: string]: any;
}

interface ProjectResultsProps {
    staticItems: MetrajItem[];
    architecturalItems: MetrajItem[];
    mechanicalItems: MetrajItem[];
    electricalItems: MetrajItem[];
}

const COLORS = ['#F97316', '#3B82F6', '#EAB308', '#6366F1'];

// Animation Variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: { type: 'spring' as const, stiffness: 100, damping: 15 }
    }
};

const ProjectResults: React.FC<ProjectResultsProps> = ({ staticItems, architecturalItems, mechanicalItems, electricalItems }) => {
    const { staticTotal, archTotal, electricTotal, mechanicalTotal, estimatedGrandTotal, chartData } =
        useMemo(() => {
            const sTotal = staticItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
            const aTotal = architecturalItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
            const mTotal = mechanicalItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
            const eTotal = electricalItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

            const grandTotal = sTotal + aTotal + mTotal + eTotal;

            const data = [
                { name: 'Kaba İnşaat', value: sTotal, percent: grandTotal > 0 ? (sTotal / grandTotal) * 100 : 0, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100', icon: Building, barColor: '#F97316', shadow: 'shadow-orange-100' },
                { name: 'Mimari İmalat', value: aTotal, percent: grandTotal > 0 ? (aTotal / grandTotal) * 100 : 0, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', icon: Ruler, barColor: '#3B82F6', shadow: 'shadow-blue-100' },
                { name: 'Elektrik', value: eTotal, percent: grandTotal > 0 ? (eTotal / grandTotal) * 100 : 0, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-100', icon: Zap, barColor: '#EAB308', shadow: 'shadow-yellow-100' },
                { name: 'Mekanik', value: mTotal, percent: grandTotal > 0 ? (mTotal / grandTotal) * 100 : 0, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', icon: Settings, barColor: '#6366F1', shadow: 'shadow-indigo-100' },
            ];

            return {
                staticTotal: sTotal,
                archTotal: aTotal,
                electricTotal: eTotal,
                mechanicalTotal: mTotal,
                estimatedGrandTotal: grandTotal,
                chartData: data,
            };
        }, [staticItems, architecturalItems, mechanicalItems, electricalItems]);

    const handlePrint = () => window.print();

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-8 w-full"
        >
            {/* PRINT STYLES */}
            <style>
                {`
          .print-card {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          @media print {
            @page { 
              margin: 8mm;
              size: A4;
            }
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            
            /* Hide everything except print area */
            body * { 
              visibility: hidden !important; 
            }
            
            /* Explicitly hide header, footer, nav */
            header,
            footer,
            nav,
            [role="navigation"],
            .print-hidden {
              display: none !important;
              visibility: hidden !important;
            }
            
            /* Show only print area */
            #print-area,
            #print-area * { 
              visibility: visible !important;
            }
            
            #print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              transform: scale(0.85);
              transform-origin: top left;
            }
            
            .no-print-shadow { box-shadow: none !important; }
            
            /* Reduce spacing for print */
            .space-y-8 > * + * {
              margin-top: 1rem !important;
            }
            
            /* Compact hero section */
            #print-area > div > div:first-child {
              padding: 1.5rem !important;
              margin-bottom: 0.75rem !important;
            }
            
            /* Compact category cards */
            .grid {
              gap: 0.75rem !important;
            }
            
            /* Reduce chart heights */
            .h-\[420px\] {
              height: 280px !important;
            }
            
            /* Force chart rendering */
            .recharts-wrapper, 
            .recharts-responsive-container,
            .recharts-surface {
              width: 100% !important;
              height: 100% !important;
            }
            
            svg, svg * {
              visibility: visible !important;
            }
            
            /* Ensure backgrounds print */
            .bg-gradient-to-br,
            .bg-gradient-to-r,
            [class*="bg-"] {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            /* Compact table */
            table th,
            table td {
              padding: 0.5rem !important;
              font-size: 0.75rem !important;
            }
          }
        `}
            </style>

            {/* HEADER SECTION */}
            <motion.div
                variants={itemVariants}
                className="print-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 backdrop-blur-xl p-4 sm:p-6 rounded-3xl shadow-sm border border-slate-200/60 sticky top-24 z-10"
            >
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                        <div className="p-2 bg-slate-900 rounded-xl shadow-lg shadow-slate-900/20">
                            <LayoutDashboard className="w-6 h-6 text-white" />
                        </div>
                        Proje Sonuçları
                    </h1>
                    <p className="text-slate-500 font-medium mt-1 ml-1 pl-12">
                        Detaylı maliyet analizleri ve finansal genel bakış
                    </p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handlePrint}
                    className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 font-bold group"
                >
                    <Printer className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                    Rapor Al
                </motion.button>
            </motion.div>

            <div id="print-area" className="space-y-8 w-full">

                {/* --- HERO SECTION: TOTAL COST --- */}
                <motion.div
                    variants={itemVariants}
                    className="w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-12 shadow-2xl shadow-slate-900/30 text-white relative overflow-hidden print-card group"
                >
                    {/* Animated Background Mesh */}
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-indigo-500/30 transition-colors duration-700"></div>
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[80px] translate-y-1/3 -translate-x-1/3 group-hover:bg-emerald-500/20 transition-colors duration-700"></div>

                    <div className="absolute top-8 right-8 p-4 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                        <Wallet className="w-48 h-48" />
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="px-3 py-1 bg-white/10 rounded-full backdrop-blur-md border border-white/10 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                                    <span className="font-bold text-emerald-100 uppercase tracking-widest text-xs">
                                        Canlı Bütçe
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-slate-400 drop-shadow-sm">
                                    {formatCurrency(estimatedGrandTotal).replace('₺', '')}
                                </span>
                                <span className="text-2xl sm:text-4xl text-slate-400 font-light">₺</span>
                            </div>
                            <p className="mt-4 text-slate-400 text-sm max-w-lg font-medium leading-relaxed border-l-2 border-white/10 pl-4">
                                * Bu tutar Statik, Mimari, Mekanik ve Elektrik imalat kalemlerinin anlık hesaplanan toplam maliyetini ifade eder.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 sm:flex sm:flex-row gap-2 sm:gap-4 w-full sm:w-auto mt-6 md:mt-0">
                            {/* Stat Card 1 */}
                            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl sm:rounded-3xl p-3 sm:p-6 text-center min-w-[auto] sm:min-w-[140px] hover:bg-white/10 transition-colors cursor-default">
                                <div className="flex justify-center mb-1 sm:mb-2">
                                    <div className="p-1.5 sm:p-2 bg-indigo-500/20 rounded-lg sm:rounded-xl text-indigo-300">
                                        <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6" />
                                    </div>
                                </div>
                                <div className="text-xl sm:text-3xl font-bold text-white mb-0.5 sm:mb-1">{chartData.length}</div>
                                <div className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Kategori</div>
                            </div>

                            {/* Stat Card 2 */}
                            <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl sm:rounded-3xl p-3 sm:p-6 text-center min-w-[auto] sm:min-w-[140px] hover:bg-white/10 transition-colors cursor-default">
                                <div className="flex justify-center mb-1 sm:mb-2">
                                    <div className="p-1.5 sm:p-2 bg-emerald-500/20 rounded-lg sm:rounded-xl text-emerald-300">
                                        <CheckCircle2 className="w-4 h-4 sm:w-6 sm:h-6" />
                                    </div>
                                </div>
                                <div className="text-xl sm:text-3xl font-bold text-emerald-400 mb-0.5 sm:mb-1">%100</div>
                                <div className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Tamamlanan</div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* --- CATEGORY CARDS GRID --- */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
                    {chartData.map((item, index) => (
                        <motion.div
                            key={index}
                            variants={itemVariants}
                            whileHover={{ y: -5, transition: { duration: 0.2 } }}
                            className={`print-card no-print-shadow bg-white p-6 rounded-[2rem] border border-slate-100 shadow-xl ${item.shadow}/20 hover:shadow-2xl hover:${item.shadow}/40 transition-all group relative overflow-hidden`}
                        >
                            {/* Background Decoration */}
                            <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-5 group-hover:opacity-10 transition-all duration-500 blur-2xl ${item.bg.replace('50', '500')}`} />

                            <div className="flex items-start justify-between mb-6 relative">
                                <div className={`p-4 rounded-2xl ${item.bg} border ${item.border} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                                    <item.icon className={`w-8 h-8 ${item.color}`} />
                                </div>
                                <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${item.bg} ${item.color} border ${item.border}`}>
                                    <Activity className="w-3.5 h-3.5" />
                                    %{item.percent.toFixed(1)}
                                </div>
                            </div>

                            <div className="relative">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{item.name}</h3>
                                <div className="text-2xl font-black text-slate-800 tracking-tight truncate">
                                    {formatCurrency(item.value)}
                                </div>

                                {/* Progress Bar */}
                                <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.percent}%` }}
                                        transition={{ duration: 1, delay: 0.5 + (index * 0.1) }}
                                        className="h-full rounded-full"
                                        style={{ backgroundColor: item.barColor }}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* --- CHARTS SECTION --- */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 w-full">
                    {/* Pie Chart */}
                    <motion.div variants={itemVariants} className="print-card no-print-shadow bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 p-8 flex flex-col h-[420px]">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                                    <div className="p-2 bg-indigo-50 rounded-lg">
                                        <PieChartIcon className="w-6 h-6 text-indigo-600" />
                                    </div>
                                    Maliyet Dağılımı
                                </h3>
                                <p className="text-slate-400 text-sm font-medium ml-12 mt-1">Pasta grafik görünümü</p>
                            </div>
                        </div>
                        <div className="flex-1 w-full relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData.filter(d => d.value > 0)}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={4}
                                        dataKey="value"
                                        cornerRadius={8}
                                        startAngle={90}
                                        endAngle={-270}
                                        isAnimationActive={false}
                                    >
                                        {chartData.filter(d => d.value > 0).map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.barColor}
                                                stroke="white"
                                                strokeWidth={2}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => formatCurrency(value)}
                                        contentStyle={{
                                            borderRadius: '16px',
                                            border: 'none',
                                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                                            padding: '12px 16px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            backdropFilter: 'blur(8px)'
                                        }}
                                        itemStyle={{ color: '#1e293b', fontWeight: 600, fontSize: '14px' }}
                                    />
                                    <Legend
                                        verticalAlign="bottom"
                                        height={36}
                                        iconType="circle"
                                        formatter={(value) => <span className="text-slate-600 font-bold ml-1">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Bar Chart */}
                    <motion.div variants={itemVariants} className="print-card no-print-shadow bg-white rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/50 p-4 sm:p-8 flex flex-col h-[350px] sm:h-[420px]">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                                    <div className="p-2 bg-emerald-50 rounded-lg">
                                        <TrendingUp className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    Bütçe Analizi
                                </h3>
                                <p className="text-slate-400 text-sm font-medium ml-12 mt-1">Karşılaştırmalı çubuk grafik</p>
                            </div>
                        </div>
                        <div className="flex-1 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={chartData}
                                    layout="vertical"
                                    margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
                                    barSize={40}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={120}
                                        tick={{ fontSize: 13, fontWeight: 700, fill: '#64748b' }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        formatter={(value: number) => [formatCurrency(value), 'Tutar']}
                                        cursor={{ fill: '#f8fafc', radius: 8 }}
                                        contentStyle={{
                                            borderRadius: '16px',
                                            border: 'none',
                                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                                            padding: '12px 16px',
                                            backgroundColor: 'rgba(255, 255, 255, 0.95)',
                                            backdropFilter: 'blur(8px)'
                                        }}
                                        itemStyle={{ color: '#1e293b', fontWeight: 600 }}
                                    />
                                    <Bar name="Tutar" dataKey="value" radius={[0, 12, 12, 0]} isAnimationActive={false}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                </div>

                {/* --- DETAILED TABLE SECTION --- */}
                <motion.div
                    variants={itemVariants}
                    className="print-card no-print-shadow bg-white rounded-[2rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden w-full"
                >
                    <div className="bg-white/50 px-8 py-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-sm">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                                <div className="p-2 bg-slate-900 rounded-lg">
                                    <TableIcon className="w-5 h-5 text-white" />
                                </div>
                                Maliyet Analiz Tablosu
                            </h3>
                            <p className="text-slate-400 text-sm font-medium ml-12 mt-1">Tüm kalemlerin detaylı finansal dökümü</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-500">
                                <ArrowRight className="w-3 h-3 mr-1" /> Kaydırılabilir
                            </span>
                        </div>
                    </div>

                    <div className="overflow-x-auto w-full">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider font-bold backdrop-blur-sm">
                                    <th className="px-8 py-5 border-b border-slate-100 first:pl-10">İşlem Grubu</th>
                                    <th className="px-8 py-5 border-b border-slate-100">Durum</th>
                                    <th className="px-8 py-5 border-b border-slate-100 text-right">Toplam Tutar</th>
                                    <th className="px-8 py-5 border-b border-slate-100 w-1/3 last:pr-10">Proje Payı</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/80">
                                {chartData.map((item, index) => (
                                    <motion.tr
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 + (index * 0.1) }}
                                        key={index}
                                        className="hover:bg-slate-50/80 transition-colors group cursor-default"
                                    >
                                        <td className="px-8 py-6 first:pl-10">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-3 rounded-2xl ${item.bg} group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                                                    <item.icon className={`w-5 h-5 ${item.color}`} />
                                                </div>
                                                <span className="font-bold text-slate-700 text-sm group-hover:text-slate-900 transition-colors">{item.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm">
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                                Aktif
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="font-black text-slate-800 text-lg tabular-nums tracking-tight">
                                                {formatCurrency(item.value)}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 last:pr-10">
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${item.percent}%` }}
                                                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.8 }}
                                                        className="h-full rounded-full"
                                                        style={{
                                                            backgroundColor: item.barColor,
                                                            filter: 'brightness(1.1)'
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-sm font-bold text-slate-600 min-w-[50px] text-right">
                                                    %{item.percent.toFixed(1)}
                                                </span>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-slate-50/80 backdrop-blur-sm border-t border-slate-200">
                                    <td colSpan={2} className="px-8 py-6 font-bold text-slate-500 text-right uppercase text-xs tracking-wider">
                                        Genel Toplam
                                    </td>
                                    <td className="px-8 py-6 text-right font-black text-slate-900 text-2xl tracking-tighter tabular-nums text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700">
                                        {formatCurrency(estimatedGrandTotal)}
                                    </td>
                                    <td className="px-8 py-6"></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </motion.div>

            </div>
        </motion.div>
    );
};

export default ProjectResults;
