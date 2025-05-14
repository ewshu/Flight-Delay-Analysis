import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, LineChart, Line,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, ComposedChart, Area, Scatter, ScatterChart, ZAxis
} from 'recharts';
import {
  MapPin, Plane, Calendar, Search, ArrowUpDown, ArrowDown,
  Clock, Award, AlertTriangle, Moon, Sun, Layers, Filter, Info, X
} from 'lucide-react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';

const US_AIRPORT_COORDINATES = {
  'ATL': { lat: 33.6407, lng: -84.4277, region: 'Southeast' },
  'LAX': { lat: 33.9416, lng: -118.4085, region: 'West' },
  'ORD': { lat: 41.9742, lng: -87.9073, region: 'Midwest' },
  'DFW': { lat: 32.8998, lng: -97.0403, region: 'South' },
  'DEN': { lat: 39.8561, lng: -104.6737, region: 'West' },
  'JFK': { lat: 40.6413, lng: -73.7781, region: 'Northeast' },
  'SFO': { lat: 37.7749, lng: -122.4194, region: 'West' },
  'SEA': { lat: 47.4502, lng: -122.3088, region: 'Northwest' },
  'LAS': { lat: 36.0840, lng: -115.1537, region: 'West' },
  'MCO': { lat: 28.4312, lng: -81.3081, region: 'Southeast' },
  'MIA': { lat: 25.7933, lng: -80.2906, region: 'Southeast' },
  'CLT': { lat: 35.2144, lng: -80.9473, region: 'Southeast' },
  'EWR': { lat: 40.6895, lng: -74.1745, region: 'Northeast' },
  'PHX': { lat: 33.4352, lng: -112.0101, region: 'Southwest' },
  'IAH': { lat: 29.9902, lng: -95.3368, region: 'South' }
};

const COLORS = [
  '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316',
  '#6366f1', '#f43f5e', '#14b8a6', '#eab308', '#3b82f6'
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// Function to format airline names
const formatAirlineName = (name) => {
  // Remove "d/b/a aha!" from ExpressJet Airlines
  if (name.includes("ExpressJet Airlines LLC d/b/a aha!")) {
    return "ExpressJet Airlines LLC";
  }
  return name;
};

const ModernFlightDelayDashboard = () => {
  // State management
  const [data, setData] = useState({
    loading: true,
    error: null,
    airports: {},
    airportList: [],
    selectedAirport: 'ORD',
    selectedMonth: new Date().getMonth() + 1,
    showAirportDropdown: false,
    showMonthDropdown: false,
    showMobileMenu: false
  });

  // Effects
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch data from the JSON file using the same format as the original dashboard
        const response = await fetch('/analysis_results.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const results = await response.json();

        setData({
          ...data,
          loading: false,
          airports: results.airports,
          airportList: results.airportList,
          error: null
        });
      } catch (error) {
        setData({
          ...data,
          loading: false,
          error: `Failed to load data: ${error.message}`
        });
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('button')) {
        setData({...data, showAirportDropdown: false, showMonthDropdown: false});
      }
    };

    if (data.showAirportDropdown || data.showMonthDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [data.showAirportDropdown, data.showMonthDropdown]);

  // Methods
  const selectAirport = (code) => {
    setData(prev => ({
      ...prev,
      selectedAirport: code,
      showAirportDropdown: false
    }));
  };

  const selectMonth = (month) => {
    setData(prev => ({
      ...prev,
      selectedMonth: month,
      showMonthDropdown: false
    }));
  };

  const toggleAirportDropdown = () => {
    setData(prev => ({
      ...prev,
      showAirportDropdown: !prev.showAirportDropdown,
      showMonthDropdown: false
    }));
  };

  const toggleMonthDropdown = () => {
    setData(prev => ({
      ...prev,
      showMonthDropdown: !prev.showMonthDropdown,
      showAirportDropdown: false
    }));
  };

  const toggleMobileMenu = () => {
    setData({...data, showMobileMenu: !data.showMobileMenu});
  };

  // Data processing functions
  const getFilteredAirports = () => {
    return data.airportList;
  };

  const getTopPerformingAirlines = (airportCode, limit = 5) => {
    const airport = data.airports[airportCode];
    if (!airport || !airport.airlinePerformance) return [];

    return [...airport.airlinePerformance]
      .sort((a, b) => a.AVG_DEP_DELAY - b.AVG_DEP_DELAY)
      .slice(0, limit);
  };

  const getWorstPerformingAirlines = (airportCode, limit = 5) => {
    const airport = data.airports[airportCode];
    if (!airport || !airport.airlinePerformance) return [];

    return [...airport.airlinePerformance]
      .sort((a, b) => b.AVG_DEP_DELAY - a.AVG_DEP_DELAY)
      .slice(0, limit);
  };

  const getMonthlyPerformance = (airportCode, monthNum) => {
    const airport = data.airports[airportCode];
    if (!airport || !airport.monthlyPerformance) return [];

    return airport.monthlyPerformance.filter(perf => parseInt(perf.MONTH) === monthNum)
      .sort((a, b) => a.AVG_DEP_DELAY - b.AVG_DEP_DELAY);
  };

  const getMonthlyTrends = (airportCode) => {
    const airport = data.airports[airportCode];
    if (!airport || !airport.monthlyPerformance) return [];

    const airlines = new Set();
    airport.monthlyPerformance.forEach(perf => {
      airlines.add(perf.AIRLINE);
    });

    // Get top 3 airlines by total flights
    const topAirlines = Array.from(airlines)
      .map(airline => {
        const flights = airport.monthlyPerformance
          .filter(perf => perf.AIRLINE === airline)
          .reduce((sum, perf) => sum + perf.TOTAL_FLIGHTS, 0);
        return { airline, flights };
      })
      .sort((a, b) => b.flights - a.flights)
      .slice(0, 3)
      .map(item => item.airline);

    // Generate quarterly data for the top airlines
    const quarterlyData = [
      { quarter: 'Q1', months: [1, 2, 3] },
      { quarter: 'Q2', months: [4, 5, 6] },
      { quarter: 'Q3', months: [7, 8, 9] },
      { quarter: 'Q4', months: [10, 11, 12] }
    ].map(quarter => {
      const obj = { quarter: quarter.quarter };

      topAirlines.forEach(airline => {
        const quarterPerformances = airport.monthlyPerformance.filter(
          perf => quarter.months.includes(parseInt(perf.MONTH)) && perf.AIRLINE === airline
        );

        if (quarterPerformances.length > 0) {
          const avgDelay = quarterPerformances.reduce((sum, perf) => sum + perf.AVG_DEP_DELAY, 0) / quarterPerformances.length;
          obj[airline] = avgDelay;
        } else {
          obj[airline] = 0;
        }
      });

      return obj;
    });

    return { trends: quarterlyData, airlines: topAirlines };
  };

  const getAirportDelayMap = () => {
    if (!data.airports || Object.keys(data.airports).length === 0) return [];

    return Object.keys(data.airports).map(code => {
      const airport = data.airports[code];
      const coords = US_AIRPORT_COORDINATES[code] || { lat: 0, lng: 0, region: 'Unknown' };

      const totalFlights = airport.airlinePerformance.reduce((sum, airline) => sum + airline.TOTAL_FLIGHTS, 0);
      const weightedDelay = airport.airlinePerformance.reduce((sum, airline) =>
        sum + (airline.AVG_DEP_DELAY * airline.TOTAL_FLIGHTS), 0);
      const avgDelay = weightedDelay / totalFlights;

      return {
        code,
        name: airport.name,
        lat: coords.lat,
        lng: coords.lng,
        region: coords.region,
        avgDelay,
        totalFlights,
        selected: code === data.selectedAirport
      };
    });
  };

  // Render loading state
  if (data.loading) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-50 text-gray-800">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mb-4"></div>
          <h2 className="text-2xl font-semibold">Loading flight delay data...</h2>
          <p className="text-gray-500 mt-2">Retrieving airport and airline performance information</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (data.error || !data.airports[data.selectedAirport]?.airlinePerformance) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-gray-50">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <AlertTriangle className="mx-auto h-16 w-16 text-red-500 mb-4" />
              <h2 className="text-2xl font-semibold text-red-600">
                {data.error || 'No data available for the selected airport'}
              </h2>
              <p className="text-gray-500 mt-4">
                Please try again later or select a different airport
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Extract data for the current selection
  const currentAirport = data.airports[data.selectedAirport];
  const topAirlines = getTopPerformingAirlines(data.selectedAirport);
  const worstAirlines = getWorstPerformingAirlines(data.selectedAirport);
  const monthlyBest = getMonthlyPerformance(data.selectedAirport, data.selectedMonth);
  const bestAirline = monthlyBest.length > 0 ? monthlyBest[0] : null;
  const { trends: monthlyTrends, airlines: topTrendAirlines } = getMonthlyTrends(data.selectedAirport);
  const airportMap = getAirportDelayMap();
  const filteredAirports = getFilteredAirports();

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Mobile menu */}
      <div className={`lg:hidden fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-50 transition-opacity ${data.showMobileMenu ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className={`absolute top-0 right-0 w-4/5 h-full bg-white transform transition-transform ${data.showMobileMenu ? 'translate-x-0' : 'translate-x-full'} overflow-y-auto`}>
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Select Airport</h2>
            <button
              onClick={toggleMobileMenu}
              className="p-3 rounded-full hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-4">
            {filteredAirports.map(airport => (
              <button
                key={airport.code}
                onClick={() => {
                  selectAirport(airport.code);
                  toggleMobileMenu();
                }}
                className={`w-full text-left mb-3 p-4 rounded-lg flex items-center ${data.selectedAirport === airport.code ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-gray-100'}`}
              >
                <MapPin className="mr-3 w-5 h-5" />
                <div>
                  <div className="font-medium">{airport.name}</div>
                  <div className="text-sm text-gray-500">{airport.code}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="py-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          {/* Author credit */}
          <div className="text-center mb-8">
            <span className="text-sm text-gray-500">By </span>
            <a 
              href="https://eshwarp.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-orange-500 transition-colors underline"
            >
              Eshwar
            </a>
          </div>

          {/* Main header content */}
          <div className="flex flex-col items-center">
            {/* Title with selections */}
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-2 max-w-2xl">
                How late is your flight from{' '}
                <button
                  onClick={toggleAirportDropdown}
                  className="border-b-2 border-orange-500 hover:border-orange-600 transition-colors"
                >
                  {currentAirport.name}
                  <span className="ml-1 text-orange-500">▼</span>
                </button>
                {' '}during{' '}
                <button
                  onClick={toggleMonthDropdown}
                  className="border-b-2 border-orange-500 hover:border-orange-600 transition-colors"
                >
                  {MONTHS[data.selectedMonth - 1]}
                  <span className="ml-1 text-orange-500">▼</span>
                </button>
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Dropdowns */}
      {data.showAirportDropdown && (
        <div className="fixed left-1/2 transform -translate-x-1/2 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-2 max-h-96 overflow-y-auto">
            {filteredAirports.map(airport => (
              <button
                key={airport.code}
                onClick={() => selectAirport(airport.code)}
                className="w-full text-left px-4 py-2 hover:bg-orange-50 rounded-md text-sm"
              >
                {airport.code} - {airport.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {data.showMonthDropdown && (
        <div className="fixed left-1/2 transform -translate-x-1/2 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-2">
            {MONTHS.map((month, index) => (
              <button
                key={index}
                onClick={() => selectMonth(index + 1)}
                className="w-full text-left px-4 py-2 hover:bg-orange-50 rounded-md text-sm"
              >
                {month}
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {/* Best airline for the month */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-8">
          <div className="p-6">
            <h3 className="text-xl font-bold mb-4">Best Airline for {MONTHS[data.selectedMonth - 1]}</h3>
            {bestAirline ? (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <h3 className="text-2xl font-bold text-orange-600">
                      {formatAirlineName(bestAirline.AIRLINE)}
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Average Delay</p>
                      <p className="text-xl font-bold text-orange-600">
                        {bestAirline.AVG_DEP_DELAY.toFixed(2)} <span className="text-sm font-normal">min</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Flights</p>
                      <p className="text-xl font-bold">
                        {bestAirline.TOTAL_FLIGHTS.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">On-Time Performance</p>
                      <p className="text-xl font-bold text-green-600">
                        {(100 - (bestAirline.AVG_DEP_DELAY > 15 ? 100 : (bestAirline.AVG_DEP_DELAY/15)*100)).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium mb-3">Other Top Airlines This Month:</h4>
                  <div className="space-y-2">
                    {monthlyBest.slice(1, 4).map((airline, index) => (
                      <div key={airline.AIRLINE} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-medium">
                            {index + 2}
                          </span>
                          <span className="ml-3 font-medium">{formatAirlineName(airline.AIRLINE)}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-medium text-orange-600">{airline.AVG_DEP_DELAY.toFixed(1)} min</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                No data available for this month
              </div>
            )}
          </div>
        </div>

        {/* Airport map */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-8">
          <div className="p-6">
            <h3 className="text-xl font-bold mb-4">U.S. Airport Delay Map</h3>
            <div className="h-80 relative">
              <ComposableMap
                projection="geoAlbersUsa"
                width={800}
                height={450}
                style={{ width: '100%', height: '100%' }}
              >
                <Geographies geography="https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json">
                  {({ geographies }) =>
                    geographies.map(geo => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill="#f8fafc"
                        stroke="#e2e8f0"
                        style={{
                          default: { opacity: 0.7 },
                          hover: { opacity: 0.9 },
                          pressed: { opacity: 1 }
                        }}
                      />
                    ))
                  }
                </Geographies>
                {airportMap.map((airport) => {
                  const minR = 7, maxR = 18;
                  const minFlights = Math.min(...airportMap.map(a => a.totalFlights));
                  const maxFlights = Math.max(...airportMap.map(a => a.totalFlights));
                  const r = maxFlights === minFlights
                    ? minR
                    : minR + (airport.totalFlights - minFlights) * (maxR - minR) / (maxFlights - minFlights);
                  return (
                    <Marker key={airport.code} coordinates={[airport.lng, airport.lat]}>
                      <circle
                        r={r}
                        fill="#f97316"
                        stroke="#fff"
                        strokeWidth={airport.selected ? 3 : 1}
                        opacity={airport.selected ? 1 : 0.85}
                        onClick={() => selectAirport(airport.code)}
                        style={{ cursor: 'pointer', filter: airport.selected ? 'drop-shadow(0 0 6px #f97316)' : 'none' }}
                      />
                      <text
                        textAnchor="middle"
                        y={-r - 4}
                        style={{ fontFamily: 'inherit', fontSize: 12, fontWeight: 'bold', fill: '#1e293b', pointerEvents: 'none' }}
                      >
                        {airport.code}
                      </text>
                    </Marker>
                  );
                })}
              </ComposableMap>
            </div>
          </div>
        </div>

        {/* Top performing airlines */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-8">
          <div className="p-6">
            <h3 className="text-xl font-bold mb-4">Lowest Average Delays</h3>
            <div className="space-y-3">
              {topAirlines.map((airline, index) => (
                <div
                  key={airline.AIRLINE}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 font-bold text-sm mr-3">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{formatAirlineName(airline.AIRLINE)}</div>
                      <div className="text-sm text-gray-500">{airline.TOTAL_FLIGHTS.toLocaleString()} flights</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">{airline.AVG_DEP_DELAY.toFixed(1)} min</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Worst performing airlines */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-8">
          <div className="p-6">
            <h3 className="text-xl font-bold mb-4">Highest Average Delays</h3>
            <div className="space-y-3">
              {worstAirlines.map((airline, index) => (
                <div
                  key={airline.AIRLINE}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-600 font-bold text-sm mr-3">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium">{formatAirlineName(airline.AIRLINE)}</div>
                      <div className="text-sm text-gray-500">{airline.TOTAL_FLIGHTS.toLocaleString()} flights</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-600">{airline.AVG_DEP_DELAY.toFixed(1)} min</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fun Facts Section - Add after Highest Average Delays */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-8">
          <div className="p-6">
            <h3 className="text-xl font-bold mb-4">Did You Know?</h3>
            <div className="space-y-4">
              {(() => {
                const airport = data.airports[data.selectedAirport];
                const monthData = airport.monthlyPerformance.filter(p => parseInt(p.MONTH) === data.selectedMonth);
                const totalFlights = monthData.reduce((sum, p) => sum + p.TOTAL_FLIGHTS, 0);
                const avgDelay = monthData.reduce((sum, p) => sum + p.AVG_DEP_DELAY * p.TOTAL_FLIGHTS, 0) / totalFlights;
                const bestAirline = monthData.sort((a, b) => a.AVG_DEP_DELAY - b.AVG_DEP_DELAY)[0];
                const worstAirline = monthData.sort((a, b) => b.AVG_DEP_DELAY - a.AVG_DEP_DELAY)[0];
                const delayDiff = worstAirline.AVG_DEP_DELAY - bestAirline.AVG_DEP_DELAY;

                return (
                  <>
                    <p className="text-gray-700">
                      {formatAirlineName(bestAirline.AIRLINE)} operates {bestAirline.TOTAL_FLIGHTS.toLocaleString()} flights with an average delay of just {bestAirline.AVG_DEP_DELAY.toFixed(1)} minutes, making it the most reliable carrier at {currentAirport.name}.
                    </p>
                    <p className="text-gray-700">
                      The difference between the best and worst performing airlines is {delayDiff.toFixed(1)} minutes, showing how much your choice of airline matters.
                    </p>
                    <p className="text-gray-700">
                      In {MONTHS[data.selectedMonth - 1]}, {currentAirport.name} handled {totalFlights.toLocaleString()} flights with an average delay of {avgDelay.toFixed(1)} minutes.
                    </p>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Quarterly performance chart */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 mb-8">
          <div className="p-6">
            <h3 className="text-xl font-bold mb-4">Quarterly Delay Trends</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrends} margin={{ top: 20, right: 30, left: 10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="quarter"
                    stroke="#64748b"
                    tick={{ fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    stroke="#64748b"
                    label={{ 
                      value: 'Avg Delay (min)', 
                      angle: -90, 
                      position: 'insideLeft', 
                      style: { textAnchor: 'middle', fontSize: 12 }, 
                      fill: '#64748b',
                      dy: -10
                    }}
                  />
                  <Tooltip
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      borderColor: '#e2e8f0',
                      padding: '12px',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}
                    itemStyle={{ color: '#1a202c' }}
                    labelStyle={{ fontWeight: 'bold', marginBottom: '8px' }}
                    formatter={(value) => [`${value?.toFixed(1) || 'N/A'} min`, 'Avg Delay']}
                    labelFormatter={(label) => `Quarter ${label}`}
                  />
                  {topTrendAirlines.map((airline, index) => (
                    <Line
                      key={airline}
                      type="monotone"
                      dataKey={airline}
                      name={formatAirlineName(airline)}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                      dot={{ r: 4, strokeWidth: 2 }}
                      activeDot={{ r: 6, stroke: COLORS[index % COLORS.length], strokeWidth: 2 }}
                      animationDuration={1500}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            {/* Custom Legend */}
            <div className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {topTrendAirlines.map((airline, index) => (
                  <div key={airline} className="flex items-center space-x-2 p-2 rounded-lg bg-gray-50">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium truncate">{formatAirlineName(airline)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-6 border-t border-gray-100">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <p className="text-center text-sm text-gray-500">
            Flight Delay Dashboard | Data showing airline departure performance across major US airports
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ModernFlightDelayDashboard;