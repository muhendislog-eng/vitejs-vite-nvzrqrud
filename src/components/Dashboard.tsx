import React from 'react';
import { 
  LayoutDashboard, 
  Printer 
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

// Veri tiplerini tanımlıyoruz
interface MetrajItem {
  id?: number | string;
  price: number;
  quantity: number;
  // Diğer alanlar dashboard hesaplamasında kullanılmadığı için opsiyonel bırakılabilir
  [key: string]: any; 
}

interface DashboardProps {
  staticItems: MetrajItem[];
  architecturalItems: MetrajItem[];
}

// Yardımcı para formatlama fonksiyonu
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 2
  }).format(value);
};

const COLORS = ['#F97316', '#3B82F6', '#EAB308', '#6366F1'];

const Dashboard: React.FC<DashboardProps> = ({ staticItems, architecturalItems }) => {
  
  // Toplamları Hesapla
  const staticTotal = staticItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const archTotal = architecturalItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  // Mantık: Statik + Mimari = Toplamın %80'i. 
  // Elektrik = %10, Mekanik = %10
  const knownTotal = staticTotal + archTotal;
  const estimatedGrandTotal = knownTotal > 0 ? knownTotal / 0.8 : 0;
  const electricTotal = estimatedGrandTotal * 0.1;
  const mechanicalTotal = estimatedGrandTotal * 0.1;

  // Grafik Verileri
  const chartData = [
    { name: 'Kaba İnşaat', value: staticTotal },
    { name: 'Mimari İmalat', value: archTotal },
    { name: 'Elektrik', value: electricTotal },
    { name: 'Mekanik', value: mechanicalTotal },
  ];

  const handlePrintDashboard = () => {
    window.print();
  };

  return (
    <div className="w-full space-y-6 dashboard-container animate-in fade-in duration-500">
        {/* Yazdırma Stilleri */}
        <style>
          {`
            @media print {
              body * {
                visibility: hidden;
              }
              .dashboard-container, .dashboard-container * {
                visibility: visible;
              }
              .dashboard-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
              }
              .print-hidden {
                display: none !important;
              }
            }
          `}
        </style>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 w-full">
            {/* Başlık ve Aksiyonlar */}
            <div className="flex justify-between items-center mb-8 print-hidden">
                 <h2 className="text-2xl font-bold text-slate-800 flex items-center">
                    <LayoutDashboard className="w-6 h-6 mr-2 text-indigo-600"/> Proje Özeti (Dashboard)
                </h2>
                <button 
                    onClick={handlePrintDashboard} 
                    className="flex items-center px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors shadow-md"
                >
                    <Printer className="w-4 h-4 mr-2"/> PDF / Yazdır
                </button>
            </div>

            {/* Özet Kartları (Summary Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 w-full">
                <div className="p-5 rounded-xl border border-orange-100 bg-orange-50/50">
                    <span className="text-xs font-bold text-orange-600 uppercase">Kaba İnşaat (%35)</span>
                    <div className="text-2xl font-black text-slate-800 mt-2">{formatCurrency(staticTotal)}</div>
                </div>
                <div className="p-5 rounded-xl border border-blue-100 bg-blue-50/50">
                    <span className="text-xs font-bold text-blue-600 uppercase">Mimari İmalat (%45)</span>
                    <div className="text-2xl font-black text-slate-800 mt-2">{formatCurrency(archTotal)}</div>
                </div>
                <div className="p-5 rounded-xl border border-yellow-100 bg-yellow-50/50">
                    <span className="text-xs font-bold text-yellow-600 uppercase">Elektrik (%10 - Tahmini)</span>
                    <div className="text-2xl font-black text-slate-800 mt-2">{formatCurrency(electricTotal)}</div>
                </div>
                <div className="p-5 rounded-xl border border-indigo-100 bg-indigo-50/50">
                    <span className="text-xs font-bold text-indigo-600 uppercase">Mekanik (%10 - Tahmini)</span>
                    <div className="text-2xl font-black text-slate-800 mt-2">{formatCurrency(mechanicalTotal)}</div>
                </div>
            </div>

            {/* Grafikler Alanı */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full">
                {/* Pasta Grafik (Pie Chart) */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center">
                    <h3 className="text-lg font-bold text-slate-700 mb-6 w-full border-b pb-2">Maliyet Dağılımı</h3>
                    <div className="w-full h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={120}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Sütun Grafik (Bar Chart) */}
                 <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center">
                    <h3 className="text-lg font-bold text-slate-700 mb-6 w-full border-b pb-2">Bütçe Analizi</h3>
                     <div className="w-full h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                layout="vertical"
                                margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false}/>
                                <XAxis type="number" tickFormatter={(val) => `₺${(val/1000000).toFixed(1)}M`} />
                                <YAxis type="category" dataKey="name" width={100} style={{fontSize: '12px', fontWeight:'bold'}} />
                                <Tooltip formatter={(value: number) => formatCurrency(value)} cursor={{fill: '#f3f4f6'}}/>
                                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                 </div>
            </div>

            {/* Genel Toplam Özeti */}
            <div className="mt-8 p-6 bg-slate-900 rounded-xl text-white flex justify-between items-center">
                 <div>
                    <h4 className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-1">Toplam Proje Bütçesi</h4>
                    <p className="text-xs text-slate-500">Statik + Mimari + Elektrik + Mekanik Dahil</p>
                 </div>
                 <div className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">
                    {formatCurrency(estimatedGrandTotal)}
                 </div>
            </div>
        </div>
    </div>
  );
};

export default Dashboard;