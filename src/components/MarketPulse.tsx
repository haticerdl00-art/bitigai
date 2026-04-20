import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  DollarSign,
  Euro,
  Coins,
  BarChart3
} from 'lucide-react';
import { motion } from 'motion/react';

interface MarketData {
  label: string;
  value: string;
  change: number;
  unit?: string;
}

interface StockData {
  name: string;
  change: number;
}

export const MarketPulse = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [bistData, setBistData] = useState<MarketData | null>(null);
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchMarketData = async () => {
    setIsRefreshing(true);
    setError(null);
    
    // Don't clear old data if we already have some to avoid flickering
    if (marketData.length === 0) {
      setMarketData([]);
      setBistData(null);
      setStocks([]);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      console.log(`[MARKET PULSE] Attempting fetch from /api/market-data...`);
      const response = await fetch('/api/market-data', { 
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      console.log(`[MARKET PULSE] Response status: ${response.status}`);
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        const bodyPreview = text.substring(0, 100).replace(/[\n\r]/g, ' ');
        console.error(`Invalid response format. Status: ${response.status}, Content-Type: ${contentType}, Body: ${bodyPreview}`);
        
        // If it looks like HTML, it's probably the SPA fallback
        if (text.toLowerCase().includes('<!doctype html>') || text.toLowerCase().includes('<html')) {
          throw new Error(`Sunucu hatası: API rotası bulunamadı (404/SPA Fallback).`);
        }
        
        throw new Error(`Sunucudan geçersiz yanıt alındı (Durum: ${response.status}).`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Hata: ${response.status}`);
      }
      
      const currencies = (data.currencies || []).map((c: any) => ({ ...c, type: 'currency' }));
      const gold = (data.gold || []).map((g: any) => ({ ...g, type: 'gold' }));
      
      // Ensure we have some data to show
      if (currencies.length === 0 && gold.length === 0) {
        throw new Error('Piyasa verileri şu an ulaşılamaz durumda.');
      }

      setMarketData([...currencies, ...gold]);
      setBistData({
        label: 'BIST 100',
        value: data.bist?.value || '9150.00',
        change: data.bist?.change || 0
      });
      setStocks(data.stocks || []);
      setLastUpdated(new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err: any) {
      console.error('Market data error:', err);
      if (err.name === 'AbortError') {
        setError('Bağlantı zaman aşımına uğradı');
      } else {
        setError(err.message || 'Veri şu an güncellenemedi');
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMarketData();
    const interval = setInterval(fetchMarketData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchMarketData();
  };

  const isPositive = bistData ? bistData.change > 0 : true;

  const getIcon = (label: string) => {
    switch (label) {
      case 'Dolar': return <DollarSign className="w-3 h-3 text-kilim-blue" />;
      case 'Euro': return <Euro className="w-3 h-3 text-kilim-blue" />;
      case 'Gram Altın':
      case 'Çeyrek Altın': return <Coins className="w-3 h-3 text-kilim-red" />;
      default: return <Activity className="w-3 h-3 text-slate-400" />;
    }
  };

  if (isRefreshing && marketData.length === 0) {
    return (
      <div className="bg-[#FDF5E6] border border-kilim-blue-dark/10 rounded-[2rem] p-12 flex flex-col items-center justify-center shadow-sm gap-4">
        <RefreshCw className="w-8 h-8 text-kilim-blue animate-spin" />
        <div className="text-center">
          <p className="text-xs font-bold text-kilim-blue-dark uppercase tracking-widest animate-pulse">Piyasa Verileri Alınıyor...</p>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">Veriler şu an güncelleniyor, lütfen bekleyiniz...</p>
        </div>
      </div>
    );
  }

  if (error && marketData.length === 0) {
    return (
      <div className="bg-[#FDF5E6] border border-kilim-blue-dark/10 rounded-[2rem] p-12 flex flex-col items-center justify-center shadow-sm gap-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center">
          <Activity className="w-6 h-6 text-kilim-red" />
        </div>
        <div className="text-center">
          <p className="text-sm font-black text-kilim-blue-dark uppercase tracking-tighter mb-1">Piyasa Nabzı</p>
          {error && (
            <div className="mt-1">
              <p className="text-[10px] font-bold text-kilim-red uppercase tracking-widest leading-tight">{error}</p>
              <p className="text-[8px] text-gray-400 mt-0.5">Endpoint: /api/market-data</p>
            </div>
          )}
        </div>
        <button 
          onClick={handleRefresh}
          className="mt-2 px-6 py-2 bg-white rounded-xl text-[10px] font-black text-kilim-blue-dark uppercase tracking-widest border border-kilim-blue-dark/10 shadow-sm hover:bg-kilim-blue-dark hover:text-white transition-all"
        >
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#FDF5E6] border border-kilim-blue-dark/10 rounded-[2rem] p-6 shadow-sm space-y-6 overflow-hidden relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-white/80 shadow-sm border border-kilim-blue-dark/5 flex items-center justify-center">
            <Activity className="w-4 h-4 text-kilim-blue" />
          </div>
          <div>
            <h3 className="font-black text-kilim-blue-dark text-sm uppercase tracking-tighter">Piyasa Nabzı</h3>
            <div className="flex items-center gap-2">
              <p className="text-[8px] text-slate-400 font-bold uppercase">Kaynak: TCMB & Canlı Veri</p>
              {lastUpdated && <p className="text-[8px] text-emerald-600 font-bold uppercase">• Son Güncelleme: {lastUpdated}</p>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {error && <span className="text-[10px] text-kilim-red font-bold">{error}</span>}
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`p-2 bg-white/80 hover:bg-white rounded-xl transition-all shadow-sm border border-kilim-blue-dark/5 ${isRefreshing ? 'animate-spin' : ''}`}
            title="Verileri Güncelle"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Main Market Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-4">
        {marketData.map((item) => (
          <div key={item.label} className="bg-white/80 p-4 rounded-2xl border border-kilim-blue-dark/5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
              {getIcon(item.label)}
            </div>
            <div className="flex items-center justify-between">
              <p className="font-black text-kilim-blue-dark text-sm sm:text-base">
                {item.value === '0.00' || !item.value ? (
                  <span className="text-[9px] text-slate-400 animate-pulse">Güncelleniyor...</span>
                ) : (
                  <>{item.value} <span className="text-[10px] font-medium">{item.unit}</span></>
                )}
              </p>
              <div className={`flex items-center text-[10px] font-bold ${item.change >= 0 ? 'text-emerald-600' : 'text-kilim-red'}`}>
                {item.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                %{Math.abs(item.change)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* BIST 100 Simple Indicator */}
      {bistData && (
        <div className="bg-white/90 p-5 rounded-2xl border border-kilim-blue-dark/5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shadow-sm ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-kilim-red'}`}>
              {isPositive ? <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" /> : <TrendingDown className="w-5 h-5 sm:w-6 sm:h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">BIST 100 Endeksi</p>
                <BarChart3 className="w-3 h-3 text-kilim-blue" />
              </div>
              <p className="text-lg sm:text-xl font-black text-kilim-blue-dark">
                {bistData.value === '0.00' || !bistData.value ? (
                  <span className="text-xs text-slate-400 animate-pulse">Güncelleniyor...</span>
                ) : (
                  bistData.value
                )}
              </p>
            </div>
          </div>
          
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs sm:text-sm shadow-sm border border-white ${isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-kilim-red'}`}>
            <div className={`w-2 h-2 rounded-full animate-pulse ${isPositive ? 'bg-emerald-500' : 'bg-kilim-red'}`} />
            {isPositive ? '📈 Piyasa Alıcılı/Pozitif' : '📉 Piyasa Satıcılı/Negatif'}
          </div>
        </div>
      )}

      {/* Ticker Tape (Borsa Bandı) */}
      <div className="relative bg-kilim-blue-dark/5 py-3 -mx-6 overflow-hidden border-y border-kilim-blue-dark/5">
        <motion.div 
          animate={{ x: [0, -1000] }}
          transition={{ 
            duration: 30, 
            repeat: Infinity, 
            ease: "linear" 
          }}
          className="flex items-center gap-8 whitespace-nowrap px-6"
        >
          {/* Repeat stocks twice for seamless loop */}
          {[...stocks, ...stocks, ...stocks].map((stock, idx) => (
            <div key={`${stock.name}-${idx}`} className="flex items-center gap-2">
              <span className="text-[10px] font-black text-kilim-blue-dark uppercase">{stock.name}</span>
              <span className={`text-[10px] font-bold ${stock.change >= 0 ? 'text-emerald-600' : 'text-kilim-red'}`}>
                {stock.change >= 0 ? '+' : ''}{stock.change}%
              </span>
              {stock.change >= 0 ? 
                <ArrowUpRight className="w-3 h-3 text-emerald-600" /> : 
                <ArrowDownRight className="w-3 h-3 text-kilim-red" />
              }
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
