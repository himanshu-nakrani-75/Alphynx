import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, TrendingUp, TrendingDown, DollarSign, Activity, Percent, Info, Briefcase } from 'lucide-react';

const StockDetail = () => {
    const { ticker } = useParams();
    const navigate = useNavigate();
    const [info, setInfo] = useState(null);
    const [quote, setQuote] = useState(null);
    const [history, setHistory] = useState([]);
    const [period, setPeriod] = useState('1mo');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Add to Portfolio Modal State
    const [isAdding, setIsAdding] = useState(false);
    const [shares, setShares] = useState(1);
    const [averageCost, setAverageCost] = useState('');

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true);
            try {
                const [infoRes, quoteRes, histRes] = await Promise.all([
                    axios.get(`http://localhost:8000/market/info/${ticker}`),
                    axios.get(`http://localhost:8000/market/quote/${ticker}`),
                    axios.get(`http://localhost:8000/market/history/${ticker}?period=${period}`)
                ]);
                
                setInfo(infoRes.data);
                setQuote(quoteRes.data);
                setHistory(histRes.data.data);
                setAverageCost(quoteRes.data.price); // Default avg cost to current price
            } catch (err) {
                setError('Failed to fetch stock details.');
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [ticker, period]);

    const handleAddToPortfolio = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:8000/portfolio/', {
                ticker,
                shares: parseFloat(shares),
                average_cost: parseFloat(averageCost)
            });
            setIsAdding(false);
            alert(`${ticker} added to your portfolio!`);
            navigate('/dashboard');
        } catch (error) {
            alert(error.response?.data?.detail || 'Error adding stock');
        }
    };

    if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    if (error) return <div className="text-center text-red-600 py-12 text-xl">{error}</div>;

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white border border-gray-200 p-3 shadow-lg rounded-lg text-sm">
                    <p className="font-bold text-gray-800 mb-1">{label}</p>
                    <p className="text-blue-600 font-medium">Close: ${payload[0].value.toFixed(2)}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header / Nav */}
            <div className="flex items-center justify-between mb-8">
                <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-blue-600 flex items-center transition-colors">
                    <ArrowLeft className="h-5 w-5 mr-1" />
                    Back
                </button>
                <div className="text-sm font-medium text-gray-400">
                    Data provided by Yahoo Finance
                </div>
            </div>

            {/* Main Info Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-baseline">
                        {ticker}
                        <span className="text-xl font-medium text-gray-500 ml-4">{info?.company_name}</span>
                    </h1>
                    <div className="flex space-x-3 mt-3">
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded uppercase tracking-wider">{info?.sector || 'Unknown Sector'}</span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded uppercase tracking-wider">{info?.industry || 'Unknown Industry'}</span>
                    </div>
                </div>
                <div className="mt-6 md:mt-0 text-right">
                    <div className="text-5xl font-bold text-gray-900 mb-1">${quote?.price.toFixed(2)}</div>
                    <div className={`text-xl font-bold flex items-center justify-end ${quote?.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {quote?.change >= 0 ? <TrendingUp className="h-6 w-6 mr-1" /> : <TrendingDown className="h-6 w-6 mr-1" />}
                        {quote?.change >= 0 ? '+' : ''}{quote?.change} ({quote?.change_percent}%)
                    </div>
                    <div className="text-sm text-gray-400 font-medium mt-1">Live Quote</div>
                </div>
            </div>

            {/* Chart and Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Chart Section */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Price History</h2>
                        <select 
                            value={period} 
                            onChange={(e) => setPeriod(e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2"
                        >
                            <option value="1mo">1 Month</option>
                            <option value="3mo">3 Months</option>
                            <option value="6mo">6 Months</option>
                            <option value="1y">1 Year</option>
                            <option value="5y">5 Years</option>
                        </select>
                    </div>
                    <div className="flex-1 min-h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={history} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis 
                                    dataKey="date" 
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    dy={10}
                                    tickFormatter={(val) => {
                                        const d = new Date(val);
                                        return period.includes('y') ? d.getFullYear() : `${d.getMonth()+1}/${d.getDate()}`;
                                    }}
                                />
                                <YAxis 
                                    domain={['auto', 'auto']}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6B7280', fontSize: 12 }}
                                    dx={-10}
                                    tickFormatter={(val) => `$${val}`}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Line 
                                    type="monotone" 
                                    dataKey="close" 
                                    stroke={quote?.change >= 0 ? "#10B981" : "#EF4444"} 
                                    strokeWidth={3}
                                    dot={false}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right Column: Key Stats & Add Button */}
                <div className="space-y-6">
                    {/* Add to Portfolio */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        {isAdding ? (
                            <form onSubmit={handleAddToPortfolio} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Shares</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        min="0.01"
                                        required 
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        value={shares}
                                        onChange={(e) => setShares(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Average Cost ($)</label>
                                    <input 
                                        type="number" 
                                        step="0.01"
                                        min="0.01"
                                        required 
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                        value={averageCost}
                                        onChange={(e) => setAverageCost(e.target.value)}
                                    />
                                </div>
                                <div className="flex space-x-3 pt-2">
                                    <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                                        Save
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <button 
                                onClick={() => setIsAdding(true)}
                                className="w-full py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 flex justify-center items-center transition-colors"
                            >
                                <Briefcase className="mr-2 h-6 w-6" />
                                Add to Portfolio
                            </button>
                        )}
                    </div>

                    {/* Key Statistics */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-100 pb-2 flex items-center">
                            <Activity className="mr-2 h-5 w-5 text-gray-400" />
                            Key Statistics
                        </h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                <span className="text-sm text-gray-500 font-medium flex items-center">
                                    <Info className="h-4 w-4 mr-1.5" /> Market Cap
                                </span>
                                <span className="text-sm font-bold text-gray-900">
                                    {info?.market_cap ? `$${(info.market_cap / 1e9).toFixed(2)}B` : 'N/A'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-gray-50">
                                <span className="text-sm text-gray-500 font-medium flex items-center">
                                    <Info className="h-4 w-4 mr-1.5" /> P/E Ratio
                                </span>
                                <span className="text-sm font-bold text-gray-900">
                                    {info?.pe_ratio ? info.pe_ratio.toFixed(2) : 'N/A'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-gray-500 font-medium flex items-center">
                                    <Percent className="h-4 w-4 mr-1.5" /> Dividend Yield
                                </span>
                                <span className="text-sm font-bold text-gray-900">
                                    {info?.dividend_yield ? `${(info.dividend_yield * 100).toFixed(2)}%` : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    {/* About section */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-3">About {ticker}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-6">
                            {info?.summary || 'No description available.'}
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default StockDetail;
