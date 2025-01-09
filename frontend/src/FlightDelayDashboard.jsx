import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Moon, Sun } from 'lucide-react';

const FlightDelayDashboard = () => {
  const [data, setData] = useState({
    loading: true,
    error: null,
    airports: {},
    airportList: [],
    selectedAirport: 'ORD',
    showAirportDropdown: false,
    showMonthDropdown: false
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [theme, setTheme] = useState('light');

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setData(prev => ({
          ...prev,
          showAirportDropdown: false,
          showMonthDropdown: false
        }));
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/analysis_results.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const results = await response.json();
        setData({
          loading: false,
          error: null,
          airports: results.airports,
          airportList: results.airportList,
          selectedAirport: 'ORD',
          showAirportDropdown: false,
          showMonthDropdown: false
        });
      } catch (error) {
        setData(prev => ({
          ...prev,
          loading: false,
          error: `Failed to load data: ${error.message}`
        }));
      }
    };
    loadData();
  }, []);

  if (data.loading) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] p-8">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-2xl font-semibold text-gray-800">Loading flight delay data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (data.error || !data.airports[data.selectedAirport]?.airlinePerformance) {
    return (
      <div className="min-h-screen bg-[#1a1a2e] p-8">
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-2xl font-semibold text-red-600">
              {data.error || 'No data available'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentAirport = data.airports[data.selectedAirport];

  return (
    <div className="min-h-screen bg-[#1a1a2e] p-8">
      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* Theme Toggle */}
        <div className="fixed top-4 right-4">
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-full bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
          >
            {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
          </button>
        </div>

        {/* Header with Dropdowns */}
        <div className="bg-white rounded-xl shadow-2xl">
          <div className="flex items-center justify-center min-h-[200px] p-8">
            <h1 className="text-4xl font-ultrabold text-gray-800 max-w-4xl">
              How Late is your flight at{' '}
              <span className="relative dropdown-container inline-block">
                <button
                  className="font-ultrabold text-gray-800 border-b-2 border-gray-300 hover:border-gray-800 pb-1 mx-2 transition-all duration-200"
                  onClick={() => setData(prev => ({
                    ...prev,
                    showAirportDropdown: !prev.showAirportDropdown,
                    showMonthDropdown: false
                  }))}
                >
                  {currentAirport.name}
                </button>
                {data.showAirportDropdown && (
                  <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 bg-white border border-gray-200 rounded shadow-lg z-50 w-96 max-h-96 overflow-y-auto">
                    {data.airportList.map(airport => (
                      <button
                        key={airport.code}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 text-2xl font-ultrabold text-gray-800"
                        onClick={() => {
                          setData(prev => ({
                            ...prev,
                            selectedAirport: airport.code,
                            showAirportDropdown: false
                          }));
                        }}
                      >
                        {airport.name}
                      </button>
                    ))}
                  </div>
                )}
              </span>
              {' '}during{' '}
              <span className="relative dropdown-container inline-block">
                <button
                  className="font-ultrabold text-gray-800 border-b-2 border-gray-300 hover:border-gray-800 pb-1 mx-2 transition-all duration-200"
                  onClick={() => setData(prev => ({
                    ...prev,
                    showMonthDropdown: !prev.showMonthDropdown,
                    showAirportDropdown: false
                  }))}
                >
                  {monthNames[selectedMonth - 1]}
                </button>
                {data.showMonthDropdown && (
                  <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 bg-white border border-gray-200 rounded shadow-lg z-50 w-64">
                    {monthNames.map((month, index) => (
                      <button
                        key={index}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 text-2xl font-ultrabold text-gray-800"
                        onClick={() => {
                          setSelectedMonth(index + 1);
                          setData(prev => ({ ...prev, showMonthDropdown: false }));
                        }}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                )}
              </span>
              ?
            </h1>
          </div>
        </div>

        {/* Monthly Best Airline */}
        <div className="bg-white rounded-xl shadow-2xl p-8">
          {currentAirport.monthlyPerformance
            .filter(perf => parseInt(perf.MONTH) === selectedMonth)
            .sort((a, b) => a.AVG_DEP_DELAY - b.AVG_DEP_DELAY)
            .slice(0, 1)
            .map(bestAirline => (
              <div key={bestAirline.AIRLINE} className="bg-gradient-to-br from-indigo-50 to-cyan-50 rounded-xl p-6 shadow-lg border border-indigo-100">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full text-sm font-semibold">
                      Best Choice for {monthNames[selectedMonth - 1]}
                    </span>
                    <h3 className="text-2xl font-bold text-gray-800">
                      {bestAirline.AIRLINE}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-500">Average Delay</p>
                      <p className="text-xl font-bold text-indigo-600">
                        {bestAirline.AVG_DEP_DELAY.toFixed(2)} <span className="text-sm font-normal">min</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Flights</p>
                      <p className="text-xl font-bold text-gray-800">
                        {bestAirline.TOTAL_FLIGHTS.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">On-Time Performance</p>
                      <p className="text-xl font-bold text-cyan-600">
                        {(100 - (bestAirline.AVG_DEP_DELAY > 15 ? 100 : (bestAirline.AVG_DEP_DELAY/15)*100)).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Best Airlines Section */}
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-8">Top Performing Airlines</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {[...currentAirport.airlinePerformance]
              .sort((a, b) => a.AVG_DEP_DELAY - b.AVG_DEP_DELAY)
              .slice(0, 5)
              .map((airline, index) => (
                <div
                  key={airline.AIRLINE}
                  className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 shadow-lg border border-gray-100"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-indigo-600" />
                  <div className="pl-3">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 font-bold text-sm">
                        {index + 1}
                      </span>
                      <h3 className="text-lg font-bold text-gray-800">
                        {airline.AIRLINE}
                      </h3>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Average Delay</p>
                        <p className="text-xl font-bold text-indigo-600">
                          {airline.AVG_DEP_DELAY.toFixed(2)} <span className="text-sm font-normal">min</span>
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Total Flights</p>
                        <p className="text-xl font-bold text-gray-800">
                          {airline.TOTAL_FLIGHTS.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">Airline Performance Overview</h2>
          <div className="h-[500px] w-full">
            <ResponsiveContainer>
              <BarChart
                data={currentAirport.airlinePerformance}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="AIRLINE"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fill: '#4a5568', fontSize: 14 }}
                />
                <YAxis
                  tick={{ fill: '#4a5568' }}
                  label={{
                    value: 'Average Delay (minutes)',
                    angle: -90,
                    position: 'insideLeft',
                    style: { fill: '#4a5568', fontSize: 14 }
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => [value.toFixed(2) + ' min', 'Average Delay']}
                />
                <Bar
                  dataKey="AVG_DEP_DELAY"
                  name="Average Delay"
                  fill="#4f46e5"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightDelayDashboard;