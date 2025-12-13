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
  const { staticTotal, archTotal, electricTotal, mechanicalTotal, estimatedGrandTotal, chartData } =
    useMemo(() => {
      const sTotal = staticItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const aTotal = architecturalItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

      const subTotal = sTotal + aTotal;
      const grandTotal = subTotal > 0 ? subTotal / 0.8 : 0;

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
        chartData: data,
      };
    }, [staticItems, architecturalItems]);

  const handlePrint = () => window.print();

  return (
    <div className="w-full max-w-none min-w-0">
      {/* PRINT: SADECE #print-area yazdırılır */}
      <style>
        {`
          .print-card { break-inside: avoid; page-break-inside: avoid; }

          @media print {
            @page { margin: 12mm; }

            body * { visibility: hidden !important; }
            #print-area, #print-area * { visibility: visible !important; }

            #print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }

            .print-hidden { display: none !important; }
            .no-print-shadow { box-shadow: none !important; }
            .recharts-wrapper, .recharts-responsive-container { width: 100% !important; }
          }
        `}
      </style>

      {/* App.tsx zaten padding/panel veriyor -> burada ekstra px/py yok */}
      <div className="w-full min-w-0">
        {/* --- ÜST BİLGİ (Ekranda var, yazdırmada yok) --- */}
        <div className="print-hidden flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-100 pb-5 mb-6 min-w-0">
          <div className="min-w-0">
            <h2 className="text-2xl font-black text-slate-800 flex items-center tracking-tight min-w-0">
              <span className="p-2 bg-indigo-100 rounded-lg mr-3 shrink-0">
                <LayoutDashboard className="w-6 h-6 text-indigo-600" />
              </span>
              Proje Özeti
            </h2>
            <p className="text-slate-500 mt-1 text-sm font-medium">
              Otomatik hesaplanan tahmini proje bütçesi ve maliyet dağılımı
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-all shadow-lg shadow-slate-200 active:scale-95 font-bold text-sm w-full sm:w-auto"
          >
            <Printer className="w-4 h-4 mr-2" /> Rapor Al
          </button>
        </div>

        {/* ===== PRINT AREA ===== */}
        <div id="print-area" className="w-full min-w-0 max-w-none">
          {/* --- KPI KARTLARI --- */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5 mb-6 w-full min-w-0">
            <div className="print-card no-print-shadow bg-white p-5 rounded-2xl border border-orange-100 shadow-sm min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Kaba İnşaat</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight break-words">
                    {formatCurrency(staticTotal)}
                  </div>
                  <div className="mt-2 inline-flex items-center px-2 py-1 rounded-md bg-orange-50 text-orange-700 text-xs font-bold">
                    <Activity className="w-3 h-3 mr-1" /> Pay: %{chartData[0].percent.toFixed(1)}
                  </div>
                </div>
                <Building className="w-10 h-10 text-orange-200 shrink-0" />
              </div>
            </div>

            <div className="print-card no-print-shadow bg-white p-5 rounded-2xl border border-blue-100 shadow-sm min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Mimari İmalat</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight break-words">
                    {formatCurrency(archTotal)}
                  </div>
                  <div className="mt-2 inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold">
                    <Activity className="w-3 h-3 mr-1" /> Pay: %{chartData[1].percent.toFixed(1)}
                  </div>
                </div>
                <Ruler className="w-10 h-10 text-blue-200 shrink-0" />
              </div>
            </div>

            <div className="print-card no-print-shadow bg-white p-5 rounded-2xl border border-yellow-100 shadow-sm min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    <span className="text-xs font-bold text-yellow-600 uppercase tracking-wider">Elektrik (Tahmini)</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight break-words">
                    {formatCurrency(electricTotal)}
                  </div>
                  <div className="mt-2 inline-flex items-center px-2 py-1 rounded-md bg-yellow-50 text-yellow-700 text-xs font-bold">
                    Sabit: %10
                  </div>
                </div>
                <Zap className="w-10 h-10 text-yellow-200 shrink-0" />
              </div>
            </div>

            <div className="print-card no-print-shadow bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Mekanik (Tahmini)</span>
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight break-words">
                    {formatCurrency(mechanicalTotal)}
                  </div>
                  <div className="mt-2 inline-flex items-center px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold">
                    Sabit: %10
                  </div>
                </div>
                <Settings className="w-10 h-10 text-indigo-200 shrink-0" />
              </div>
            </div>
          </div>

          {/* --- GRAFİKLER --- */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6 mb-6 w-full min-w-0">
            <div className="print-card no-print-shadow bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm overflow-hidden min-w-0">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-bold text-slate-700 flex items-center">
                  <PieChartIcon className="w-5 h-5 mr-2 text-slate-400" /> Maliyet Dağılımı
                </h3>
              </div>

              <div className="w-full h-[300px] sm:h-[350px] min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="print-card no-print-shadow bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm overflow-hidden min-w-0">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-bold text-slate-700 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-slate-400" /> Bütçe Analizi
                </h3>
              </div>

              <div className="w-full h-[300px] sm:h-[350px] min-w-0">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 30, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      type="number"
                      tickFormatter={(val) => `₺${(val / 1_000_000).toFixed(1)}M`}
                      stroke="#94a3b8"
                      fontSize={11}
                    />
                    <YAxis type="category" dataKey="name" width={110} stroke="#64748b" fontSize={11} fontWeight={600} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} cursor={{ fill: '#f8fafc' }} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* --- GENEL TOPLAM --- */}
          <div className="print-card no-print-shadow bg-slate-900 rounded-2xl p-6 sm:p-8 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl shadow-slate-900/10 min-w-0">
            <div className="flex items-center gap-4 min-w-0">
              <div className="p-3 bg-white/10 rounded-full shrink-0">
                <Wallet className="w-8 h-8 text-green-400" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tahmini Toplam Proje Bütçesi</div>
                <div className="text-sm text-slate-300 opacity-80">Statik + Mimari + Elektrik + Mekanik dahildir</div>
              </div>
            </div>

            <div className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-emerald-400 to-teal-300 break-words">
              {formatCurrency(estimatedGrandTotal)}
            </div>
          </div>
        </div>
        {/* ===== PRINT AREA SONU ===== */}
      </div>
    </div>
  );
};

export default Dashboard;
