import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Briefcase, TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react';

const Dashboard = () => {
    const [portfolio, setPortfolio] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [portfolioData, setPortfolioData] = useState([]);
    const [totalValue, setTotalValue] = useState(0);
    const [totalReturn, setTotalReturn] = useState(0);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch portfolio items
                const portRes = await axios.get('http://localhost:8000/portfolio/');
                const items = portRes.data;
                setPortfolio(items);

                // Fetch live quotes for portfolio items
                let currentValue = 0;
                let costBasis = 0;
                const enrichedItems = await Promise.all(items.map(async (item) => {
                    try {
                        const quoteRes = await axios.get(`http://localhost:8000/market/quote/${item.ticker}`);
                        const quote = quoteRes.data;
                        const value = quote.price * item.shares;
                        const cost = item.average_cost * item.shares;
                        currentValue += value;
                        costBasis += cost;
                        
                        return {
                            ...item,
                            current_price: quote.price,
                            change_percent: quote.change_percent,
                            total_value: value,
                            return_val: value - cost,
                            return_percent: ((value - cost) / cost) * 100
                        };
                    } catch (e) {
                        return { ...item, total_value: 0, return_val: 0, return_percent: 0 };
                    }
                }));
                
                setPortfolioData(enrichedItems);
                setTotalValue(currentValue);
                setTotalReturn(currentValue - costBasis);

                // Fetch recommendations
                const recRes = await axios.get('http://localhost:8000/recommendations/');
                setRecommendations(recRes.data.recommendations);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const removePortfolioItem = async (id) => {
        if (!window.confirm("Are you sure you want to remove this stock?")) return;
        try {
            await axios.delete(`http://localhost:8000/portfolio/${id}`);
            // Refresh page data
            window.location.reload();
        } catch (error) {
            console.error("Failed to remove item", error);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    return (
        <div className="space-y-8">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center text-gray-500 mb-2">
                        <DollarSign className="h-5 w-5 mr-2" />
                        <h3 className="text-sm font-medium">Total Portfolio Value</h3>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">${totalValue.toFixed(2)}</p>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center text-gray-500 mb-2">
                        <Activity className="h-5 w-5 mr-2" />
                        <h3 className="text-sm font-medium">Total Return</h3>
                    </div>
                    <p className={`text-3xl font-bold flex items-center ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {totalReturn >= 0 ? '+' : '-'}${Math.abs(totalReturn).toFixed(2)}
                        {totalReturn >= 0 ? <TrendingUp className="h-6 w-6 ml-2" /> : <TrendingDown className="h-6 w-6 ml-2" />}
                    </p>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center text-gray-500 mb-2">
                        <Briefcase className="h-5 w-5 mr-2" />
                        <h3 className="text-sm font-medium">Holdings</h3>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{portfolio.length}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Portfolio Table */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-800">Your Portfolio</h2>
                        <Link to="/search" className="text-sm font-medium text-blue-600 hover:text-blue-500 bg-blue-50 px-3 py-1.5 rounded-md transition-colors">
                            + Add Stock
                        </Link>
                    </div>
                    
                    {portfolioData.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">Your portfolio is empty.</p>
                            <p className="text-sm text-gray-400 mt-1">Search for stocks to add them here.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Symbol</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Shares</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg Cost</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Return</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {portfolioData.map((item) => (
                                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <Link to={`/stock/${item.ticker}`} className="font-bold text-blue-600 hover:underline">{item.ticker}</Link>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900">{item.shares}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm text-gray-900">${item.average_cost.toFixed(2)}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                ${item.current_price?.toFixed(2) || '---'}
                                            </td>
                                            <td className={`px-4 py-4 whitespace-nowrap text-right text-sm font-medium ${item.return_val >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {item.return_val >= 0 ? '+' : '-'}${Math.abs(item.return_val || 0).toFixed(2)}
                                                <span className="text-xs ml-1 opacity-80">({(item.return_percent || 0).toFixed(2)}%)</span>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                                                <button onClick={() => removePortfolioItem(item.id)} className="text-red-500 hover:text-red-700 font-medium">Remove</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Recommendations Sidebar */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Recommended for You</h2>
                    <p className="text-sm text-gray-500 mb-6">Based on your portfolio diversity</p>
                    
                    <div className="space-y-4 flex-1">
                        {recommendations.map((rec) => (
                            <div key={rec.ticker} className="p-4 rounded-lg border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors group">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <Link to={`/stock/${rec.ticker}`} className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{rec.ticker}</Link>
                                        <p className="text-xs text-gray-500 truncate w-32" title={rec.company_name}>{rec.company_name}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">${rec.price}</p>
                                        <p className={`text-xs font-medium flex items-center justify-end ${rec.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {rec.change >= 0 ? '+' : ''}{rec.change} ({rec.change_percent}%)
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-3 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    {rec.sector}
                                </div>
                                <p className="text-xs text-gray-500 mt-2 italic flex items-center">
                                    <Activity className="h-3 w-3 mr-1" />
                                    {rec.reason}
                                </p>
                            </div>
                        ))}
                        {recommendations.length === 0 && (
                            <p className="text-sm text-gray-500 text-center py-8">No recommendations currently available.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
