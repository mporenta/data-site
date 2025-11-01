import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from '@/lib/recharts'

interface DataPoint {
  name: string
  [key: string]: string | number
}

interface BarChartComponentProps {
  data: DataPoint[]
  dataKeys: string[]
  colors?: string[]
  height?: number
}

export default function BarChartComponent({
  data,
  dataKeys,
  colors = ['#3C50E0', '#80CAEE', '#10B981'],
  height = 350
}: BarChartComponentProps) {
  return (
    <div className="w-full" style={{ height: `${height}px` }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
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
            <Bar
              key={key}
              dataKey={key}
              fill={colors[index % colors.length]}
              radius={[8, 8, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
