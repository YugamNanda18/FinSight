import React from 'react'
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, AreaChart } from 'recharts'
import { formatCurrency } from '../../utils/formatters'
import { CHART_COLORS } from '../../utils/constants'

interface SpendingChartProps {
  data: any[]
  type: 'line' | 'bar' | 'area' | 'pie'
  title?: string
  height?: number
  dataKey?: string
  xAxisKey?: string
}

const SpendingChart: React.FC<SpendingChartProps> = ({
  data,
  type,
  title,
  height = 300,
  dataKey = 'amount',
  xAxisKey = 'name',
}) => {
  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey={xAxisKey} stroke="#9CA3AF" />
            <YAxis tickFormatter={(value) => formatCurrency(value)} stroke="#9CA3AF" />
            <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
            <Legend />
            <Line type="monotone" dataKey={dataKey} stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
          </LineChart>
        )
      
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey={xAxisKey} stroke="#9CA3AF" />
            <YAxis tickFormatter={(value) => formatCurrency(value)} stroke="#9CA3AF" />
            <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
            <Bar dataKey={dataKey} fill="#3B82F6" radius={[8, 8, 0, 0]} />
          </BarChart>
        )
      
      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey={xAxisKey} stroke="#9CA3AF" />
            <YAxis tickFormatter={(value) => formatCurrency(value)} stroke="#9CA3AF" />
            <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
            <Area type="monotone" dataKey={dataKey} stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} />
          </AreaChart>
        )
      
      case 'pie':
        return (
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px' }} />
          </PieChart>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
      {title && <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  )
}

export default SpendingChart