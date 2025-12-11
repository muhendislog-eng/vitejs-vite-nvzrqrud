import React from 'react';
// EKSİK İKONLAR (Building, Ruler, PieChartIcon) BURAYA EKLENDİ
import { LayoutDashboard, Printer, TrendingUp, Wallet, Zap, Settings, Building, Ruler, PieChart as PieChartIcon } from 'lucide-react';
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
  
  // 1. Mevcut Verilerin Toplamını Al
  const staticTotal = staticItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const archTotal = architecturalItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  // 2. İş Mantığı: (Statik + Mimari) = Toplam Bütçenin %80'i
  const knownTotal = staticTotal + archTotal;
  
  // Eğer hiç veri yoksa 0'a bölme hatasını önle
  const estimatedGrandTotal = knownTotal > 0 ? knownTotal / 0.8 : 0;
  
  // 3. Geriye kalan %20'yi Elektrik (%10) ve Mekanik (%10) olarak dağıt
  const electricTotal = estimatedGrandTotal * 0.1;
  const mechanicalTotal = estimatedGrandTotal * 0.1;

  // Grafik Verisi Hazırla
  const chartData = [
    { name: 'Kaba İnşaat', value: staticTotal, percent: (staticTotal / estimatedGrandTotal) * 100 },
    { name: 'Mimari İmalat', value: archTotal, percent: (archTotal / estimatedGrandTotal) * 100 },
    { name: 'Elektrik (Tahmini)', value: electricTotal, percent: 10 },
    { name: 'Mekanik (Tahmini)', value: mechanicalTotal, percent: 10 },
  ];

  const handlePrintDashboard = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-6 dashboard-container animate-in fade-in duration-500">
        <style>
          {`
            @media print {
              body * { visibility: hidden; }
              .dashboard-container, .dashboard-container * { visibility: visible; }
              .dashboard-container { position: absolute; left: 0; top: 0; width: 100%; }
              .print-hidden { display: none !important; }
            }
          `}
        </style>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 w-full">
            {/* Header */}
            <div className="flex justify-between items-center mb-8 print-hidden">
                 <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                    <LayoutDashboard className="w-7 h-7 mr-3 text-indigo-600"/> 
                    Proje Maliyet Özeti
                </h2>
                <button 
                    onClick={handlePrintDashboard} 
                    className="flex items-center px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors shadow-lg shadow-slate-900/20 active:scale-95 font-medium"
                >
                    <Printer className="w-4 h-4 mr-2"/> Rapor Yazdır
                </button>
            </div>

            {/* Özet Kartları */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 w-full">
                {/* Statik */}
                <div className="p-6 rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-white shadow-sm relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Building className="w-16 h-16 text-orange-600" />
                    </div>
                    <span className="flex items-center text-xs font-bold text-orange-600 uppercase tracking-wider mb-2">
                        <div className="w-2 h-2 rounded-full bg-orange-500 mr-2"></div>
                        Kaba İnşaat
                    </span>
                    <div className="text-2xl font-black text-slate-800 tracking-tight">{formatCurrency(staticTotal)}</div>
                    <div className="text-xs text-slate-400 mt-1 font-medium">Bütçedeki Payı: %{chartData[0].percent.toFixed(1)}</div>
                </div>

                {/* Mimari */}
                <div className="p-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white shadow-sm relative overflow-hidden group">
                     <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Ruler className="w-16 h-16 text-blue-600" />
                    </div>
                    <span className="flex items-center text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
                        Mimari İmalat
                    </span>
                    <div className="text-2xl font-black text-slate-800 tracking-tight">{formatCurrency(archTotal)}</div>
                    <div className="text-xs text-slate-400 mt-1 font-medium">Bütçedeki Payı: %{chartData[1].percent.toFixed(1)}</div>
                </div>

                {/* Elektrik */}
                <div className="p-6 rounded-2xl border border-yellow-100 bg-gradient-to-br from-yellow-50 to-white shadow-sm relative overflow-hidden group">
                     <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap className="w-16 h-16 text-yellow-600" />
                    </div>
                    <span className="flex items-center text-xs font-bold text-yellow-600 uppercase tracking-wider mb-2">
                        <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                        Elektrik (Tahmini)
                    </span>
                    <div className="text-2xl font-black text-slate-800 tracking-tight">{formatCurrency(electricTotal)}</div>
                    <div className="text-xs text-slate-400 mt-1 font-medium">Öngörülen Pay: %10</div>
                </div>

                {/* Mekanik */}
                <div className="p-6 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white shadow-sm relative overflow-hidden group">
                     <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Settings className="w-16 h-16 text-indigo-600" />
                    </div>
                    <span className="flex items-center text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></div>
                        Mekanik (Tahmini)
                    </span>
                    <div className="text-2xl font-black text-slate-800 tracking-tight">{formatCurrency(mechanicalTotal)}</div>
                    <div className="text-xs text-slate-400 mt-1 font-medium">Öngörülen Pay: %10</div>
                </div>
            </div>

            {/* Grafikler */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full mb-8">
                {/* Pasta Grafik */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center shadow-sm">
                    <div className="flex items-center justify-between w-full border-b border-slate-100 pb-4 mb-4">
                        <h3 className="text-lg font-bold text-slate-700 flex items-center">
                            <PieChartIcon className="w-5 h-5 mr-2 text-slate-400"/> Maliyet Dağılımı
                        </h3>
                    </div>
                    <div className="w-full h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={110}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    formatter={(value: number) => formatCurrency(value)} 
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sütun Grafik */}
                 <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col items-center shadow-sm">
                    <div className="flex items-center justify-between w-full border-b border-slate-100 pb-4 mb-4">
                        <h3 className="text-lg font-bold text-slate-700 flex items-center">
                            <TrendingUp className="w-5 h-5 mr-2 text-slate-400"/> Bütçe Analizi
                        </h3>
                    </div>
                     <div className="w-full h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                layout="vertical"
                                margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0"/>
                                <XAxis type="number" tickFormatter={(val) => `${(val/1000000).toFixed(1)}M`} stroke="#94a3b8" fontSize={12} />
                                <YAxis type="category" dataKey="name" width={110} stroke="#64748b" fontSize={12} fontWeight={600} />
                                <Tooltip 
                                    formatter={(value: number) => formatCurrency(value)} 
                                    cursor={{fill: '#f8fafc'}}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={32}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                 </div>
            </div>

            {/* Alt Toplam Çubuğu */}
            <div className="mt-8 p-8 bg-slate-900 rounded-2xl text-white flex flex-col md:flex-row justify-between items-center shadow-xl shadow-slate-900/10">
                 <div className="mb-4 md:mb-0 flex items-center">
                    <div className="p-3 bg-white/10 rounded-full mr-4">
                        <Wallet className="w-8 h-8 text-green-400" />
                    </div>
                    <div>
                        <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Tahmini Toplam Proje Bütçesi</h4>
                        <p className="text-sm text-slate-300">Hesaplanan tüm kalemler ve öngörülen giderler dahildir.</p>
                    </div>
                 </div>
                 <div className="text-center md:text-right">
                    <div className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-emerald-400 to-teal-300">
                        {formatCurrency(estimatedGrandTotal)}
                    </div>
                 </div>
            </div>
        </div>
    </div>
  );
};

export default Dashboard;