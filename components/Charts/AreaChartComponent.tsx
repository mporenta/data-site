import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from '@/lib/recharts'

interface DataPoint {
  name: string
  [key: string]: string | number
}

interface AreaChartComponentProps {
  data: DataPoint[]
  dataKeys: string[]
  colors?: string[]
  height?: number
}

export default function AreaChartComponent({
  data,
  dataKeys,
  colors = ['#3C50E0', '#80CAEE'],
  height = 350
}: AreaChartComponentProps) {
  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            {dataKeys.map((key, index) => (
              <linearGradient key={key} id={`color${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[index % colors.length]} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={colors[index % colors.length]} stopOpacity={0.1}/>
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-stroke dark:stroke-strokedark" />
          <XAxis
            dataKey="name"
            className="text-sm"
            tick={{ fill: '#64748B' }}
            tickLine={{ stroke: '#64748B' }}
          />
          <YAxis
            className="text-sm"
            tick={{ fill: '#64748B' }}
            tickLine={{ stroke: '#64748B' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e2e8f0',
              borderRadius: '0.375rem',
            }}
            itemStyle={{ color: '#1e293b' }}
          />
          <Legend />
          {dataKeys.map((key, index) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[index % colors.length]}
              fillOpacity={1}
              fill={`url(#color${key})`}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
