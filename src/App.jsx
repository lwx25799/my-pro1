import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Activity, 
  Layers, 
  Database, 
  Search, 
  Zap, 
  AlertCircle, 
  RefreshCw, 
  Fuel, 
  Vote, 
  Ban, 
  FlaskConical,
  Sparkles, // 新增：AI 图标
  X,        // 新增：关闭图标
  Loader2   // 新增：加载图标
} from 'lucide-react';

// --- Gemini API 配置 ---
// --- 配置 ---
// 修改前: const API_KEY = "你的key";
// 修改后: 优先读取环境变量，如果没有则为空
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";

// --- Gemini 调用函数 ---
async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }]
  };

  // 简单的重试逻辑
  const delays = [1000, 2000, 4000];
  for (let i = 0; i < delays.length; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "暂无分析结果。";
    } catch (err) {
      if (i === delays.length - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, delays[i]));
    }
  }
}

// --- 默认模拟数据 (Demo Snapshot) ---
const DEMO_DATA = [
  {
    rank: 1, name: "Ethereum", symbol: "ETH", gas_symbol: "ETH", gov_symbol: "ETH", category: "L1",
    price: 3250.45, change_24h: 1.2, fdv: 390000000000, mcap: 390000000000, float_ratio: 1.0, 
    tvl: 58000000000, stablecoins: 82000000000, tx_24h: 1150000, fees_24h: 3500000
  },
  {
    rank: 2, name: "Solana", symbol: "SOL", gas_symbol: "SOL", gov_symbol: "SOL", category: "L1",
    price: 245.20, change_24h: 5.4, fdv: 140000000000, mcap: 110000000000, float_ratio: 0.78, 
    tvl: 6500000000, stablecoins: 4500000000, tx_24h: 35000000, fees_24h: 850000
  },
  {
    rank: 3, name: "Monad", symbol: "MON", gas_symbol: "MON", gov_symbol: "MON", category: "L1",
    price: 14.20, change_24h: 15.5, fdv: 14200000000, mcap: 2130000000, float_ratio: 0.15, 
    tvl: 850000000, stablecoins: 250000000, tx_24h: 45000000, fees_24h: 1200000 
  },
  {
    rank: 4, name: "Base", symbol: "ETH", gas_symbol: "ETH", gov_symbol: null, category: "L2",
    price: 0, change_24h: 0, fdv: 0, mcap: 0, float_ratio: 0, 
    tvl: 2500000000, stablecoins: 3800000000, tx_24h: 4200000, fees_24h: 150000
  },
  {
    rank: 5, name: "Sei", symbol: "SEI", gas_symbol: "SEI", gov_symbol: "SEI", category: "L1",
    price: 0.35, change_24h: -4.2, fdv: 3500000000, mcap: 900000000, float_ratio: 0.25, 
    tvl: 220000000, stablecoins: 45000000, tx_24h: 4500000, fees_24h: 15000
  },
  {
    rank: 6, name: "Berachain", symbol: "BERA", gas_symbol: "BERA", gov_symbol: "BGT", category: "L1", is_testnet: true,
    price: 0, change_24h: 0, fdv: 1500000000, mcap: 0, float_ratio: 0, 
    tvl: 450000000, stablecoins: 100000000, tx_24h: 800000, fees_24h: 0
  },
  {
    rank: 7, name: "Aptos", symbol: "APT", gas_symbol: "APT", gov_symbol: "APT", category: "L1",
    price: 8.50, change_24h: 1.5, fdv: 9000000000, mcap: 4000000000, float_ratio: 0.44, 
    tvl: 550000000, stablecoins: 300000000, tx_24h: 1500000, fees_24h: 25000
  },
  {
    rank: 8, name: "Arbitrum", symbol: "ARB", gas_symbol: "ETH", gov_symbol: "ARB", category: "L2",
    price: 0.75, change_24h: -2.1, fdv: 7500000000, mcap: 2800000000, float_ratio: 0.37, 
    tvl: 16000000000, stablecoins: 4200000000, tx_24h: 2100000, fees_24h: 80000
  },
  {
    rank: 9, name: "Sui", symbol: "SUI", gas_symbol: "SUI", gov_symbol: "SUI", category: "L1",
    price: 3.20, change_24h: 12.5, fdv: 32000000000, mcap: 8500000000, float_ratio: 0.26, 
    tvl: 1200000000, stablecoins: 600000000, tx_24h: 12000000, fees_24h: 65000
  },
   {
    rank: 10, name: "Hyperliquid", symbol: "HYPE", gas_symbol: "USDC", gov_symbol: "HYPE", category: "L1",
    price: 120.00, change_24h: 45.0, fdv: 12000000000, mcap: 4000000000, float_ratio: 0.33,
    tvl: 800000000, stablecoins: 900000000, tx_24h: 5000000, fees_24h: 200000
  }
];

// 工具函数：格式化数字
const formatNumber = (num) => {
  if (!num && num !== 0) return '-';
  if (num === 0) return '-';
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
};

const formatCount = (num) => {
  if (!num) return '-';
  if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
  return num.toString();
};

export default function ChainDashboard() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('Initializing...');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('All'); 

  // AI 相关状态
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiReport, setAiReport] = useState("");

  // --- 核心逻辑：尝试加载真实数据，失败则加载演示数据 ---
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/chain_data.json');
        
        if (!response.ok) {
          throw new Error("Local data not found");
        }
        
        const jsonData = await response.json();
        const enhancedData = jsonData.map(item => ({
            ...item,
            gas_symbol: item.gas_symbol || (item.category === 'L2' ? 'ETH' : item.symbol),
            gov_symbol: item.gov_symbol || item.symbol
        }));
        
        setData(enhancedData);
        setDataSource('Live Data (Local JSON)');
      } catch (error) {
        console.warn("Using Demo Snapshot Data:", error.message);
        setData(DEMO_DATA);
        setDataSource('Demo Snapshot');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // --- AI 分析逻辑 ---
  const handleAiAnalysis = async () => {
    setShowAiModal(true);
    setIsAnalyzing(true);
    setAiReport("");

    // 1. 准备发给 AI 的数据摘要 (为了节省 Token，只发关键字段)
    const summary = data.map(c => 
      `- ${c.name} (${c.category}): TVL ${formatNumber(c.tvl)}, FDV ${formatNumber(c.fdv)}, Tx ${formatCount(c.tx_24h)}, Price Change ${c.change_24h}%`
    ).join('\n');

    const prompt = `
      你是一位资深的 Web3 投研分析师。请根据以下最新的公链数据快照，用中文生成一份简短的市场洞察报告。
      
      数据快照:
      ${summary}

      请包含以下 3 个部分 (使用 Markdown 格式):
      1. 🚀 **市场热点**: 哪个链最活跃或涨幅最大？
      2. ⚠️ **价值发现**: 寻找 "低估值高TVL" 或 "高估值低活跃" 的异常点。
      3. 💡 **一句话总结**: 对当前 L1/L2 格局的犀利点评。
      
      保持专业、客观、简洁。
    `;

    try {
      const result = await callGemini(prompt);
      setAiReport(result);
    } catch (error) {
      setAiReport("分析失败: 无法连接到 AI 服务。请稍后再试。");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const filteredData = useMemo(() => {
    return data.filter(chain => {
      const matchesSearch = chain.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            chain.symbol.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filter === 'All' || chain.category === filter;
      return matchesSearch && matchesFilter;
    });
  }, [data, searchTerm, filter]);

  const globalStats = useMemo(() => {
    return data.reduce((acc, curr) => ({
      totalFDV: acc.totalFDV + (curr.fdv || 0),
      totalTx: acc.totalTx + (curr.tx_24h || 0),
      totalTVL: acc.totalTVL + (curr.tvl || 0)
    }), { totalFDV: 0, totalTx: 0, totalTVL: 0 });
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 selection:bg-blue-500/30 relative">
      
      {/* --- AI 分析模态框 --- */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">AI Market Analyst</h3>
                  <p className="text-xs text-slate-400">Powered by Gemini 2.5 Flash</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAiModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
                  <p className="text-slate-400 text-sm animate-pulse">正在深度分析链上数据...</p>
                </div>
              ) : (
                <div className="prose prose-invert prose-sm max-w-none text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {aiReport}
                </div>
              )}
            </div>
            
            <div className="p-4 border-t border-slate-800 bg-slate-900/30 rounded-b-2xl flex justify-end">
              <button 
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-colors border border-slate-700"
              >
                关闭报告
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b border-slate-800/50 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20 ring-1 ring-white/10">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
              OnChain Insight
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${dataSource.includes('Live') ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
              <p className="text-xs text-slate-400 font-mono uppercase tracking-wide">
                Source: {dataSource}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto items-center">
          {/* AI 分析按钮 */}
          <button 
            onClick={handleAiAnalysis}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all hover:scale-105 active:scale-95 border border-indigo-400/20 group"
          >
            <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
            <span>AI Report</span>
          </button>

          <div className="relative group flex-1 md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500 group-focus-within:text-blue-400 transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Search chains..." 
              className="block w-full pl-10 pr-3 py-2 border border-slate-800 rounded-lg leading-5 bg-slate-900/50 text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-slate-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard 
          title="Total FDV (Market Depth)" 
          value={formatNumber(globalStats.totalFDV)} 
          icon={<Database className="w-5 h-5 text-indigo-400" />}
          subtext="Fully Diluted Valuation across chains"
        />
        <StatCard 
          title="24h Transactions" 
          value={formatCount(globalStats.totalTx)} 
          icon={<Zap className="w-5 h-5 text-amber-400" />}
          subtext="Network activity (raw count)"
        />
        <StatCard 
          title="Total Value Locked" 
          value={formatNumber(globalStats.totalTVL)} 
          icon={<Layers className="w-5 h-5 text-emerald-400" />}
          subtext="Smart contract liquidity"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 p-1 bg-slate-900/50 rounded-lg border border-slate-800/50">
          {['All', 'L1', 'L2'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                filter === f 
                  ? 'bg-slate-800 text-white shadow-sm ring-1 ring-white/10' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        
        <button 
          onClick={() => window.location.reload()}
          className="p-2 text-slate-500 hover:text-white transition-colors" 
          title="Refresh Data"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900/40 rounded-xl border border-slate-800/60 overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/60 text-slate-400 text-[11px] font-bold uppercase tracking-wider border-b border-slate-800">
                <th className="p-4 pl-6">Chain</th>
                
                {/* 新增的两个独立列 */}
                <th className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                        <Fuel className="w-3 h-3" /> Gas Token
                    </div>
                </th>
                <th className="p-4 text-center">
                     <div className="flex items-center justify-center gap-1">
                        <Vote className="w-3 h-3" /> Gov Token
                    </div>
                </th>

                <th className="p-4 text-right">Gov Price</th>
                <th className="p-4 text-right">FDV (Valuation)</th>
                <th className="p-4 text-center">Float Ratio</th>
                <th className="p-4 text-right">Liquidity</th>
                <th className="p-4 text-right">Activity</th>
                <th className="p-4 text-right pr-6">Valuation Index</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                 <tr><td colSpan="9" className="p-8 text-center text-slate-500 animate-pulse">Loading Chain Data...</td></tr>
              ) : filteredData.map((chain) => {
                const valIndex = chain.tx_24h > 0 ? chain.fdv / chain.tx_24h : 0;
                const floatColor = chain.float_ratio < 0.25 ? 'bg-rose-500' : chain.float_ratio > 0.75 ? 'bg-emerald-500' : 'bg-amber-500';
                const floatTextColor = chain.float_ratio < 0.25 ? 'text-rose-400' : chain.float_ratio > 0.75 ? 'text-emerald-400' : 'text-amber-400';

                return (
                  <tr key={chain.name} className="hover:bg-slate-800/40 transition-colors group">
                    {/* Chain Name */}
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-sm shadow-inner ring-1 ring-white/5 relative">
                          {chain.name[0]}
                          {chain.is_testnet && (
                             <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-slate-900"></div>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-100 flex items-center gap-2 text-sm">
                            {chain.name}
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border ${chain.is_testnet ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300' : 'border-slate-700 bg-slate-800/50 text-slate-400'} font-medium`}>
                              {chain.is_testnet ? 'Testnet' : chain.category}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    {/* Gas Token Column */}
                    <td className="p-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-medium">
                            {chain.gas_symbol}
                        </span>
                    </td>

                    {/* Gov Token Column - 处理未发币及Testnet状态 */}
                    <td className="p-4 text-center">
                        {chain.gov_symbol ? (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-medium ${chain.is_testnet ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-300' : 'bg-blue-500/10 border border-blue-500/20 text-blue-400'}`}>
                                {chain.is_testnet && <FlaskConical className="w-3 h-3" />}
                                {chain.gov_symbol}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-400 text-[10px] font-medium">
                                <Ban className="w-3 h-3" /> 未发币
                            </span>
                        )}
                    </td>
                    
                    {/* Price (Applies to Gov Token) */}
                    <td className="p-4 text-right">
                      {chain.price > 0 ? (
                          <>
                            <div className="font-mono text-slate-200 text-sm">${chain.price.toLocaleString()}</div>
                            <div className={`text-[10px] font-medium flex justify-end items-center gap-0.5 mt-0.5 ${chain.change_24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {chain.change_24h >= 0 ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
                                {Math.abs(chain.change_24h)}%
                            </div>
                          </>
                      ) : (
                          <div className="text-slate-600 text-xs italic">
                            {chain.is_testnet ? 'Pre-Market' : '-'}
                          </div>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      <div className="font-mono text-slate-200 text-sm">{formatNumber(chain.fdv)}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Mcap: {formatNumber(chain.mcap)}</div>
                    </td>

                    <td className="p-4">
                      {chain.price > 0 ? (
                          <div className="flex flex-col items-center gap-1.5">
                            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden shadow-inner">
                            <div 
                                className={`h-full rounded-full ${floatColor} transition-all duration-500`} 
                                style={{ width: `${Math.max(chain.float_ratio * 100, 5)}%` }}
                            />
                            </div>
                            <div className={`text-[10px] font-mono font-bold ${floatTextColor}`}>
                            {(chain.float_ratio * 100).toFixed(0)}% Unlocked
                            </div>
                          </div>
                      ) : (
                          <div className="text-center text-slate-600 text-xs">-</div>
                      )}
                    </td>

                    {/* TVL & Activity 必须准确显示，即使没有 Gov Token */}
                    <td className="p-4 text-right">
                       <div className="font-mono text-emerald-300 text-sm">{formatNumber(chain.stablecoins)}</div>
                       <div className="text-[10px] text-slate-500 mt-0.5">TVL: {formatNumber(chain.tvl)}</div>
                    </td>

                    <td className="p-4 text-right">
                      <div className="font-mono text-blue-300 text-sm">{formatCount(chain.tx_24h)}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Rev: {formatNumber(chain.fees_24h)}</div>
                    </td>

                    <td className="p-4 text-right pr-6">
                        {chain.price > 0 || chain.fdv > 0 ? (
                           <>
                             <div className="font-mono text-slate-300 text-sm">${(valIndex).toFixed(0)}</div>
                             <div className="text-[10px] text-slate-500 uppercase tracking-tight mt-0.5">FDV / Tx Ratio</div>
                           </>
                        ) : (
                           <div className="text-slate-600 text-xs italic">N/A</div>
                        )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {!loading && filteredData.length === 0 && (
            <div className="py-16 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 mb-4">
                <Search className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-slate-400 text-sm">No chains found matching "{searchTerm}"</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6 flex justify-between items-center text-[10px] text-slate-600 border-t border-slate-800/50 pt-4">
         <div>
            Data refresh cycle: 10m • Node Providers: Ankr, Alchemy
         </div>
         <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
           System Operational
         </div>
      </div>
    </div>
  );
}

// 子组件：统计卡片
function StatCard({ title, value, icon, subtext }) {
  return (
    <div className="bg-slate-900/40 p-5 rounded-xl border border-slate-800/60 backdrop-blur-sm hover:border-blue-500/30 transition-colors group">
      <div className="flex justify-between items-start mb-3">
        <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{title}</span>
        <div className="p-2 bg-slate-800/50 rounded-lg group-hover:bg-blue-500/10 transition-colors">{icon}</div>
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold text-white font-mono tracking-tight">{value}</span>
        <span className="text-[10px] text-slate-500 mt-1">{subtext}</span>
      </div>
    </div>
  );
}