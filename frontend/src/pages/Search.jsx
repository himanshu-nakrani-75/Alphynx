import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search as SearchIcon, ArrowRight, TrendingUp } from 'lucide-react';

const Search = () => {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);
    const navigate = useNavigate();

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const response = await axios.get(`http://localhost:8000/market/quote/${query.trim()}`);
            setResult(response.data);
        } catch (err) {
            setError(err.response?.data?.detail || 'Stock not found. Please try a valid ticker symbol (e.g., AAPL, TSLA).');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto py-12">
            <div className="text-center mb-10">
                <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Your Next Investment</h1>
                <p className="text-gray-500">Search for any stock ticker to view live quotes and add it to your portfolio.</p>
            </div>

            <form onSubmit={handleSearch} className="mb-8">
                <div className="relative flex items-center w-full h-14 rounded-full bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-blue-500 overflow-hidden">
                    <div className="grid place-items-center h-full w-14 text-gray-400">
                        <SearchIcon className="h-6 w-6" />
                    </div>
                    <input
                        className="peer h-full w-full outline-none text-gray-700 pr-4 bg-transparent font-medium text-lg placeholder-gray-400 uppercase"
                        type="text"
                        placeholder="Search ticker (e.g. AAPL, MSFT, TSLA)"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button type="submit" className="h-full px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors rounded-r-full" disabled={loading}>
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </div>
            </form>

            {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-center">
                    {error}
                </div>
            )}

            {result && (
                <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/stock/${result.ticker}`)}>
                    <div className="p-8 flex items-center justify-between">
                        <div>
                            <h2 className="text-4xl font-black text-gray-900 tracking-tight">{result.ticker}</h2>
                            <p className="text-gray-500 font-medium text-lg mt-1">{result.company_name}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-4xl font-bold text-gray-900">${result.price.toFixed(2)}</p>
                            <div className={`mt-2 font-semibold text-lg flex items-center justify-end ${result.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {result.change >= 0 ? '+' : ''}{result.change} ({result.change_percent}%)
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex items-center justify-between text-blue-600 font-medium group">
                        <span>View Details & Add to Portfolio</span>
                        <ArrowRight className="h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Search;
