import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface DataPoint {
  trade: number;
  balance: number;
  expected: number;
}

interface GrowthChartProps {
  data: DataPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border border-gray-200 shadow-lg rounded-lg text-sm">
        <p className="font-semibold text-gray-900 mb-2">Trade #{label}</p>
        <p className="text-emerald-600 font-medium">
          Simulation: ${payload[0].value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </p>
        <p className="text-blue-600 font-medium">
          Expected: ${payload[1].value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

export function GrowthChart({ data }: GrowthChartProps) {
  return (
    <div className="h-[400px] w-full bg-white p-4 rounded-xl shadow-sm border border-gray-100">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 10,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis 
            dataKey="trade" 
            stroke="#6b7280" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            label={{ value: 'Number of Trades', position: 'insideBottomRight', offset: -5, fill: '#6b7280', fontSize: 12 }}
          />
          <YAxis 
            stroke="#6b7280" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `$${value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          <Line
            type="monotone"
            dataKey="balance"
            name="Simulated Path"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
            animationDuration={1000}
          />
          <Line
            type="monotone"
            dataKey="expected"
            name="Expected Growth"
            stroke="#3b82f6"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            activeDot={{ r: 6 }}
            animationDuration={1000}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
