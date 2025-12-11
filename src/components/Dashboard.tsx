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
  Activity
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
  ResponsiveContainer 
} from 'recharts';
import { formatCurrency } from '../utils/helpers';

interface MetrajItem {
  price: number;
  quantity: number;
  [key: string]: any;
}

interface DashboardProps {
  staticItems: MetrajItem[];
  architecturalItems: MetrajItem[];
}

const COLORS = ['#F97316', '#3B82F6', '#EAB308', '#6366F1'];

const Dashboard: React.FC<DashboardProps> = ({ staticItems, architecturalItems }) => {
  
  // --- HESAPLAMALAR ---
  const { 
    staticTotal, 
    archTotal, 
    electricTotal, 
    mechanicalTotal, 
    estimatedGrandTotal, 
    chartData 
  } = useMemo(() => {
    const sTotal = staticItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const aTotal = architecturalItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    // İş Mantığı: Statik + Mimari = %80
    const subTotal = sTotal + aTotal;
    const grandTotal = subTotal > 0 ? subTotal / 0.8 : 0;
    
    // Kalan %20'yi dağıt (Elektrik %10, Mekanik %10)
    const eTotal = grandTotal * 0.1;
    const mTotal = grandTotal * 0.1;

    const data = [
      { name: 'Kaba İnşaat', value: sTotal, percent: grandTotal > 0 ? (sTotal / grandTotal) * 100 : 0 },
      { name: 'Mimari İmalat', value: aTotal, percent: grandTotal > 0 ? (aTotal / grandTotal) * 100 : 0 },
      { name: 'Elektrik', value: eTotal, percent: 10 },
      { name: 'Mekanik', value: mTotal, percent: 10 },
    ];

    return { 
      staticTotal: sTotal, 
      archTotal: aTotal, 
      electricTotal: eTotal, 
      mechanicalTotal: mTotal, 
      estimatedGrandTotal: grandTotal, 
      chartData: data 
    };
  }, [staticItems, architecturalItems]);

  const handlePrint = () => {
    window.print();
  };

  return (
    // Ana kapsayıcıya w-full ve min-w-0 ekleyerek taşmaları önlüyoruz
    <div className="w-full min-w-0 animate-in fade-in duration-500 dashboard-container">
        
        {/* Yazdırma Stilleri */}
        <style>
          {`
            @media print {
              body * { visibility: hidden; }
              .dashboard-container, .dashboard-container * { visibility: visible; }
              .dashboard-container { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; }
              .print-hidden { display: none !important; }
              .recharts-responsive-container { min-width: 600px !important; }
            }
          `}
        </style>

        {/* --- ÜST BİLGİ ALANI --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 print-hidden border-b border-slate-100 pb-6">
            <div>
                <h2 className="text-2xl font-black text-slate-800 flex items-center tracking-tight">
                    <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                         <LayoutDashboard className="w-6 h-6 text-indigo-600"/> 
                    </div>
                    Proje Özeti
                </h2>
                <p className="text-slate-500 mt-1 text-sm font-medium ml-1">
                   Otomatik hesaplanan tahmini proje bütçesi ve maliyet dağılımı
                </p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
                 <button 
                    onClick={handlePrint}
                    className="flex-1 md:flex-none items-center justify-center px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all shadow-lg shadow-slate-200 active:scale-95 font-bold text-sm"
                >
                    <Printer className="w-4 h-4 mr-2"/> Rapor Al
                </button>
            </div>
        </div>

        {/* --- KPI KARTLARI (GRID) --- */}
        {/* min-w-0 class'ı grid item'larının taşmasını engeller */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 w-full">
            {/* Statik */}
            <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                    <Building className="w-12 h-12 text-orange-500" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Kaba İnşaat</span>
                    </div>
                    <div className="text-2xl xl:text-3xl font-black text-slate-800 tracking-tight">
                        {formatCurrency(staticTotal)}
                    </div>
                    <div className="mt-2 inline-flex items-center px-2 py-1 rounded-md bg-orange-50 text-orange-700 text-xs font-bold">
                        <Activity className="w-3 h-3 mr-1" /> Pay: %{chartData[0].percent.toFixed(1)}
                    </div>
                </div>
            </div>

            {/* Mimari */}
            <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                    <Ruler className="w-12 h-12 text-blue-500" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Mimari İmalat</span>
                    </div>
                    <div className="text-2xl xl:text-3xl font-black text-slate-800 tracking-tight">
                        {formatCurrency(archTotal)}
                    </div>
                    <div className="mt-2 inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold">
                        <Activity className="w-3 h-3 mr-1" /> Pay: %{chartData[1].percent.toFixed(1)}
                    </div>
                </div>
            </div>

            {/* Elektrik */}
            <div className="bg-white p-5 rounded-2xl border border-yellow-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                    <Zap className="w-12 h-12 text-yellow-500" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                        <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider">Elektrik (Tahmini)</span>
                    </div>
                    <div className="text-2xl xl:text-3xl font-black text-slate-800 tracking-tight">
                        {formatCurrency(electricTotal)}
                    </div>
                    <div className="mt-2 inline-flex items-center px-2 py-1 rounded-md bg-yellow-50 text-yellow-700 text-xs font-bold">
                        Sabit: %10
                    </div>
                </div>
            </div>

             {/* Mekanik */}
             <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:scale-110 transition-transform">
                    <Settings className="w-12 h-12 text-indigo-500" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Mekanik (Tahmini)</span>
                    </div>
                    <div className="text-2xl xl:text-3xl font-black text-slate-800 tracking-tight">
                        {formatCurrency(mechanicalTotal)}
                    </div>
                    <div className="mt-2 inline-flex items-center px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold">
                         Sabit: %10
                    </div>
                </div>
            </div>
        </div>

        {/* --- GRAFİKLER (Tam Genişlik - Grid) --- */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 w-full mb-8">
            
            {/* 1. Pasta Grafik */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-w-0">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                    <h3 className="font-bold text-slate-700 flex items-center">
                        <PieChartIcon className="w-5 h-5 mr-2 text-slate-400"/> Maliyet Dağılımı
                    </h3>
                </div>
                <div className="w-full h-[350px]">
                    <ResponsiveContainer width="99%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Tooltip 
                                formatter={(value: number) => formatCurrency(value)}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 2. Sütun Grafik */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-w-0">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                    <h3 className="font-bold text-slate-700 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2 text-slate-400"/> Bütçe Analizi
                    </h3>
                </div>
                <div className="w-full h-[350px]">
                    <ResponsiveContainer width="99%" height="100%">
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0"/>
                            <XAxis type="number" tickFormatter={(val) => `₺${(val/1000000).toFixed(1)}M`} stroke="#94a3b8" fontSize={11} />
                            <YAxis type="category" dataKey="name" width={100} stroke="#64748b" fontSize={11} fontWeight={600} />
                            <Tooltip 
                                formatter={(value: number) => formatCurrency(value)}
                                cursor={{fill: '#f8fafc'}}
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>

        {/* --- GENEL TOPLAM FOOTER --- */}
        <div className="bg-slate-900 rounded-2xl p-6 md:p-8 text-white flex flex-col md:flex-row justify-between items-center shadow-xl shadow-slate-900/10">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
                <div className="p-3 bg-white/10 rounded-full">
                    <Wallet className="w-8 h-8 text-green-400" />
                </div>
                <div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tahmini Toplam Proje Bütçesi</div>
                    <div className="text-sm text-slate-300 opacity-80">Statik + Mimari + Elektrik + Mekanik dahildir</div>
                </div>
            </div>
            <div className="text-3xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-emerald-400 to-teal-300">
                {formatCurrency(estimatedGrandTotal)}
            </div>
        </div>
    </div>
  );
};

export default Dashboard;