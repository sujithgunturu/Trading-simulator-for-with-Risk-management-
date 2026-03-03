/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { GrowthChart } from './components/GrowthChart';
import { runSimulation, SimulationResult } from './lib/simulation';
import { RefreshCw, TrendingUp, DollarSign, Percent, Activity, Clock, Settings2, AlertCircle, Target, Wallet, Scissors, Layers } from 'lucide-react';
import { cn } from './lib/utils';

export default function App() {
  // State for inputs
  const [initialBalance, setInitialBalance] = useState(10000);
  const [riskPercent, setRiskPercent] = useState(1);
  const [winRate, setWinRate] = useState(50);
  const [riskRewardRatio, setRiskRewardRatio] = useState(2);
  const [numTrades, setNumTrades] = useState(100);
  const [stopLossPercent, setStopLossPercent] = useState(2);

  // Trimming State
  const [enableTrimming, setEnableTrimming] = useState(false);
  const [trim1Target, setTrim1Target] = useState(5); // % Price Move
  const [trim1Size, setTrim1Size] = useState(30); // % of Position
  const [trim2Target, setTrim2Target] = useState(10); // % Price Move
  const [trim2Size, setTrim2Size] = useState(30); // % of Position
  const [runnerTarget, setRunnerTarget] = useState(20); // % Price Move for remaining

  // State for simulation results
  const [data, setData] = useState<SimulationResult[]>([]);
  const [simulationKey, setSimulationKey] = useState(0);

  // Calculate Effective R:R
  const calculateEffectiveRR = useCallback(() => {
    if (!enableTrimming) return riskRewardRatio;

    const runnerSize = Math.max(0, 100 - trim1Size - trim2Size);
    
    // Weighted Average Return %
    // (Size% * Target%) + ...
    const weightedReturnPercent = 
      ((trim1Size / 100) * trim1Target) +
      ((trim2Size / 100) * trim2Target) +
      ((runnerSize / 100) * runnerTarget);

    // Effective R:R = WeightedReturn% / StopLoss%
    // Avoid division by zero
    return stopLossPercent > 0 ? weightedReturnPercent / stopLossPercent : 0;
  }, [enableTrimming, riskRewardRatio, trim1Size, trim1Target, trim2Size, trim2Target, runnerTarget, stopLossPercent]);

  // Derived effective R:R for display and simulation
  const effectiveRR = calculateEffectiveRR();

  // Run simulation
  const handleSimulate = useCallback(() => {
    const results = runSimulation({
      initialBalance,
      riskPercent,
      winRate,
      riskRewardRatio: effectiveRR, // Use the effective ratio
      numTrades,
    });
    setData(results);
  }, [initialBalance, riskPercent, winRate, effectiveRR, numTrades]);

  // Run on mount and when inputs change
  useEffect(() => {
    handleSimulate();
  }, [handleSimulate, simulationKey]);

  // Helper for input change
  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<number>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) setter(val);
  };

  const finalBalance = data.length > 0 ? data[data.length - 1].balance : 0;
  const totalReturn = ((finalBalance - initialBalance) / initialBalance) * 100;
  const isProfitable = totalReturn >= 0;

  // Single Trade Analysis Calculations
  const riskAmount = initialBalance * (riskPercent / 100);
  const profitAmount = riskAmount * effectiveRR;
  const positionSize = stopLossPercent > 0 ? riskAmount / (stopLossPercent / 100) : 0;
  const runnerSize = Math.max(0, 100 - trim1Size - trim2Size);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      
      {/* Left Sidebar - Parameters */}
      <aside className="w-full md:w-[400px] bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto z-10 shadow-xl md:shadow-none shrink-0">
        <div className="p-6 space-y-8">
          
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-7 h-7 text-emerald-600" />
              Growth Sim
            </h1>
            <p className="text-gray-500 text-sm mt-1">Configure your trading strategy parameters below.</p>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2 text-gray-900 font-semibold border-b border-gray-100 pb-2">
              <Settings2 className="w-5 h-5 text-gray-500" />
              Parameters
            </div>

            {/* Initial Balance */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-gray-400" />
                Initial Account Value
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  value={initialBalance}
                  onChange={handleInputChange(setInitialBalance)}
                  className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            {/* Risk Per Trade */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Activity className="w-4 h-4 text-gray-400" />
                Risk per Trade (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={riskPercent}
                  onChange={handleInputChange(setRiskPercent)}
                  step="0.1"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-gray-50 focus:bg-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={riskPercent}
                onChange={handleInputChange(setRiskPercent)}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Stop Loss Distance */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Target className="w-4 h-4 text-gray-400" />
                Stop Loss Distance (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={stopLossPercent}
                  onChange={handleInputChange(setStopLossPercent)}
                  step="0.1"
                  min="0.1"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-gray-50 focus:bg-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
              </div>
            </div>

            {/* Win Rate */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Percent className="w-4 h-4 text-gray-400" />
                Success Rate (Win %)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={winRate}
                  onChange={handleInputChange(setWinRate)}
                  min="1"
                  max="99"
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-gray-50 focus:bg-white"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={winRate}
                onChange={handleInputChange(setWinRate)}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Risk to Reward (Conditional) */}
            {!enableTrimming && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  Risk to Reward Ratio (1:X)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">1:</span>
                  <input
                    type="number"
                    value={riskRewardRatio}
                    onChange={handleInputChange(setRiskRewardRatio)}
                    step="0.1"
                    className="w-full pl-8 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>
            )}

            {/* Trimming Section */}
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={enableTrimming} 
                    onChange={(e) => setEnableTrimming(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                  />
                  <Scissors className="w-4 h-4 text-gray-500" />
                  Enable Trimming / Scaling
                </label>
              </div>
              
              {enableTrimming && (
                <div className="p-4 space-y-4 bg-white">
                  {/* Trim 1 */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase">First Trim</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Target (% Move)</label>
                        <input
                          type="number"
                          value={trim1Target}
                          onChange={handleInputChange(setTrim1Target)}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Size (% Pos)</label>
                        <input
                          type="number"
                          value={trim1Size}
                          onChange={handleInputChange(setTrim1Size)}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Trim 2 */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Second Trim</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Target (% Move)</label>
                        <input
                          type="number"
                          value={trim2Target}
                          onChange={handleInputChange(setTrim2Target)}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Size (% Pos)</label>
                        <input
                          type="number"
                          value={trim2Size}
                          onChange={handleInputChange(setTrim2Size)}
                          className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Runners */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase flex justify-between">
                      <span>Runners</span>
                      <span className="text-emerald-600">{runnerSize}% Remaining</span>
                    </p>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Exit Target (% Move)</label>
                      <input
                        type="number"
                        value={runnerTarget}
                        onChange={handleInputChange(setRunnerTarget)}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm"
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Effective R:R</span>
                      <span className="font-bold text-emerald-600">1:{effectiveRR.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Number of Trades */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                Number of Trades (Time)
              </label>
              <input
                type="number"
                value={numTrades}
                onChange={handleInputChange(setNumTrades)}
                min="10"
                max="1000"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all bg-gray-50 focus:bg-white"
              />
            </div>

            {/* Trade Analysis Card */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-gray-500" />
                Single Trade Analysis
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Potential Profit (Avg)</span>
                  <span className="font-semibold text-emerald-600">
                    +${profitAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Max Loss (Risk)</span>
                  <span className="font-semibold text-red-600">
                    -${riskAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                  <span className="text-gray-600">Position Size</span>
                  <span className="font-bold text-gray-900">
                    ${positionSize.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </span>
                </div>
                {enableTrimming && (
                  <div className="pt-2 border-t border-gray-200 text-xs text-gray-500">
                    <p>Based on hitting all trim targets.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2">
               <button
                onClick={() => setSimulationKey(prev => prev + 1)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-lg shadow-md hover:bg-gray-800 transition-colors font-medium"
              >
                <RefreshCw className="w-4 h-4" />
                Rerun Simulation
              </button>
              <p className="text-xs text-gray-400 text-center mt-2">
                Rerunning generates a new random outcome.
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Right Main - Graph */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200/60 min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">Final Balance</p>
              <p 
                className={cn("text-xl md:text-2xl font-bold mt-2 whitespace-nowrap truncate", isProfitable ? "text-emerald-600" : "text-red-600")}
                title={`$${finalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              >
                ${finalBalance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200/60 min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">Total Return</p>
              <p 
                className={cn("text-xl md:text-2xl font-bold mt-2 whitespace-nowrap truncate", isProfitable ? "text-emerald-600" : "text-red-600")}
                title={`${totalReturn > 0 ? '+' : ''}${totalReturn.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`}
              >
                {totalReturn > 0 ? '+' : ''}{totalReturn.toLocaleString(undefined, { maximumFractionDigits: 2 })}%
              </p>
            </div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200/60 min-w-0">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">Trades Simulated</p>
              <p 
                className="text-xl md:text-2xl font-bold text-gray-900 mt-2 whitespace-nowrap truncate"
                title={numTrades.toString()}
              >
                {numTrades}
              </p>
            </div>
          </div>

          {/* Main Chart Container */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200/60 flex flex-col h-[500px] md:h-[600px]">
             <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Growth Projection</h3>
             <div className="flex-1 min-h-0">
               <GrowthChart data={data} />
             </div>
          </div>

          {/* Explanation */}
          <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 text-sm text-blue-800">
            <p className="font-semibold mb-2 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Simulation Details
            </p>
            <ul className="grid md:grid-cols-2 gap-x-8 gap-y-2 list-disc list-inside opacity-90">
              <li><span className="text-emerald-600 font-bold">Green Line</span>: One possible randomized outcome.</li>
              <li><span className="text-blue-600 font-bold border-b border-dashed border-blue-600">Blue Dashed Line</span>: Mathematical expected value.</li>
              <li>Compounding: Risk is % of <em>current</em> balance.</li>
              <li>Inputs update the graph automatically.</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
