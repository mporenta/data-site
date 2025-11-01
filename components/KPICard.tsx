'use client'

import { ArrowUp, ArrowDown, Minus } from 'lucide-react'

interface KPICardProps {
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
  subtitle?: string
  format?: 'currency' | 'percent' | 'number'
}

export default function KPICard({
  title,
  value,
  change,
  trend = 'neutral',
  subtitle,
  format = 'number',
}: KPICardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'string') return val

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(val)
      case 'percent':
        return `${val.toFixed(1)}%`
      default:
        return new Intl.NumberFormat('en-US').format(val)
    }
  }

  const getTrendColor = () => {
    if (trend === 'up') return 'text-meta-3'
    if (trend === 'down') return 'text-meta-1'
    return 'text-body'
  }

  const getTrendIcon = () => {
    if (trend === 'up') return ArrowUp
    if (trend === 'down') return ArrowDown
    return Minus
  }

  const TrendIcon = getTrendIcon()

  return (
    <div className="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-black dark:text-white">{title}</p>
          <p className="mt-4 text-title-md font-bold text-black dark:text-white">{formatValue(value)}</p>
          {subtitle && (
            <p className="mt-2 text-sm text-body">{subtitle}</p>
          )}
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${getTrendColor()}`}>
            <TrendIcon className="w-4 h-4" />
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  )
}
