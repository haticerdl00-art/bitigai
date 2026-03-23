import React from 'react';
import { TrendingUp, ShieldAlert, Activity, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const data = [
  { name: 'Oca', value: 4000 },
  { name: 'Şub', value: 3000 },
  { name: 'Mar', value: 2000 },
  { name: 'Nis', value: 2780 },
  { name: 'May', value: 1890 },
  { name: 'Haz', value: 2390 },
];

export const CustomerRiskModule = () => {
  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-bold text-slate-800">Müşteri Risk ve Finansal Analiz</h2>
        <p className="text-slate-500">Müşterilerinizin finansal sağlığını ve inceleme risklerini takip edin.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
            <Activity className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Ortalama Sağlık Puanı</p>
            <p className="text-2xl font-bold text-slate-800">84/100</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center">
            <ShieldAlert className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Yüksek Riskli Müşteri</p>
            <p className="text-2xl font-bold text-slate-800">2 Firma</p>
          </div>
        </div>
        <div className="glass-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Vergi Yükü Trendi</p>
            <p className="text-2xl font-bold text-slate-800">+4.2%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-slate-800">Genel Karlılık Trendi</h3>
            <select className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 outline-none">
              <option>Son 6 Ay</option>
              <option>Son 1 Yıl</option>
            </select>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-bold text-slate-800 mb-6">Müşteri Risk Sıralaması</h3>
          <div className="space-y-4">
            {[
              { name: 'ABC Teknoloji A.Ş.', score: 92, risk: 'Düşük', trend: 'up' },
              { name: 'Özdemir İnşaat Ltd.', score: 45, risk: 'Yüksek', trend: 'down' },
              { name: 'Global Lojistik', score: 78, risk: 'Orta', trend: 'up' },
              { name: 'Yıldız Gıda', score: 62, risk: 'Orta', trend: 'down' },
            ].map((m, i) => (
              <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    m.risk === 'Yüksek' ? 'bg-rose-500' : m.risk === 'Orta' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  <div>
                    <p className="text-sm font-bold text-slate-800">{m.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{m.risk} Risk</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">{m.score}</p>
                  {m.trend === 'up' ? (
                    <ArrowUpRight className="w-3 h-3 text-emerald-500 ml-auto" />
                  ) : (
                    <ArrowDownRight className="w-3 h-3 text-rose-500 ml-auto" />
                  )}
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 text-emerald-600 text-xs font-bold hover:bg-emerald-50 rounded-xl transition-colors">
            Tüm Müşterileri Görüntüle
          </button>
        </div>
      </div>
    </div>
  );
};
