# TailAdmin + Recharts Dashboard Implementation Guide

Complete reference documentation for building production-ready Next.js dashboards using TailAdmin components and Recharts data visualization.

## Overview

**TailAdmin** is a free, open-source Next.js 15 admin dashboard template built with React 19, TypeScript, and Tailwind CSS v4. It provides a complete component architecture with layouts, cards, tables, and UI elements optimized for the App Router pattern.

**Recharts** is a composable charting library built on React components and D3. It provides declarative chart creation with full TypeScript support, responsive design, and extensive customization options.

This guide demonstrates how to integrate Recharts charts into TailAdmin-style dashboard layouts to create professional, production-ready analytics dashboards that consume data from FastAPI JSON endpoints.

---

## Quick Start

### Installation

```bash
npm install recharts
npm install next-themes  # For dark mode support
npm install react-error-boundary  # For error handling
```

### Critical: Client Component Directive

**Recharts requires client-side rendering.** Always add `"use client"` to any component that imports Recharts:

```typescript
'use client'

import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

export default function MyChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="value" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### Centralized Recharts Wrapper (Recommended)

Avoid repeating `"use client"` in every chart by creating a centralized wrapper:

```typescript
// lib/recharts.tsx
'use client';

// Export all Recharts components from a single client-side module
export * from 'recharts';
```

Then import from your wrapper:

```typescript
// components/charts/AreaChart.tsx
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer } from '@/lib/recharts';

// No need for 'use client' here
export default function AreaChartComponent({ data }) {
  return <AreaChart data={data}>...</AreaChart>;
}
```

---

## TailAdmin Component Architecture

### Layout Structure

TailAdmin uses a **DefaultLayout** wrapper that provides consistent page structure:

```typescript
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import Breadcrumb from "@/components/Breadcrumbs/Breadcrumb";

const DashboardPage = () => {
  return (
    <DefaultLayout>
      <Breadcrumb pageName="Dashboard" />
      {/* Page content here */}
    </DefaultLayout>
  );
};
```

**Layout Components:**
- **Sidebar** - Collapsible navigation (uses SidebarContext)
- **Header** - Fixed header with user dropdown, notifications, dark/light mode toggle
- **Main Content Area** - Scrollable content wrapper

### Card Component Pattern

TailAdmin uses a consistent card pattern for content containers:

```typescript
// Base card pattern with dark mode support
<div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark md:p-6 xl:p-9">
  {/* Card content */}
</div>
```

**Card with Header:**

```typescript
<div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
  <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
    <h3 className="font-medium text-black dark:text-white">
      Section Title
    </h3>
  </div>
  <div className="p-6.5">
    {/* Section content */}
  </div>
</div>
```

### Responsive Grid Layouts

**Stats Cards Grid (1-2-4 columns):**

```typescript
<div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
  {/* Stats cards */}
</div>
```

**Two-Column Chart Layout:**

```typescript
<div className="grid grid-cols-12 gap-4 md:gap-6 2xl:gap-7.5">
  <div className="col-span-12 xl:col-span-8">
    {/* Main content */}
  </div>
  <div className="col-span-12 xl:col-span-4">
    {/* Sidebar content */}
  </div>
</div>
```

**Three-Column Layout:**

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
  <ChartCard />
  <ChartCard />
  <ChartCard />
</div>
```

---

## Recharts Chart Types: Complete Reference

### Data Format

All Recharts charts expect an array of objects with consistent keys:

```typescript
const data = [
  { name: 'Jan', revenue: 4000, cost: 2400 },
  { name: 'Feb', revenue: 3000, cost: 1398 },
  { name: 'Mar', revenue: 2000, cost: 9800 },
];
```

### LineChart

**Use for:** Time series data, trends over time, comparing multiple metrics.

```typescript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function LineChartComponent({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
        <Line type="monotone" dataKey="cost" stroke="#82ca9d" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

**Key Props:**
- `type`: "monotone", "linear", "step", "natural", "basis"
- `strokeWidth`: Line thickness
- `dot`: Show/hide data points (boolean or custom component)
- `activeDot`: Active dot styling on hover

### BarChart

**Use for:** Comparing categories, showing discrete values, period-over-period comparisons.

```typescript
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function BarChartComponent({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="sales" fill="#8884d8" />
        <Bar dataKey="profit" fill="#82ca9d" />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

**Key Props:**
- `fill`: Bar color
- `barSize`: Width of bars
- `radius`: Corner radius `[topLeft, topRight, bottomRight, bottomLeft]`
- `stackId`: Stack bars with same ID

**Individual Bar Colors with Cell:**

```typescript
import { Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

<Bar dataKey="value">
  {data.map((entry, index) => (
    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
  ))}
</Bar>
```

### AreaChart

**Use for:** Showing volume/magnitude over time, stacked area charts for part-to-whole relationships.

```typescript
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AreaChartComponent({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="name" />
        <YAxis />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip />
        <Area type="monotone" dataKey="sales" stroke="#8884d8" fillOpacity={1} fill="url(#colorSales)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
```

**Stacked AreaChart:**

```typescript
<AreaChart data={data}>
  <Area type="monotone" dataKey="value1" stackId="1" stroke="#8884d8" fill="#8884d8" />
  <Area type="monotone" dataKey="value2" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
  <Area type="monotone" dataKey="value3" stackId="1" stroke="#ffc658" fill="#ffc658" />
</AreaChart>
```

### PieChart

**Use for:** Showing composition, market share, category distribution.

```typescript
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Group A', value: 400 },
  { name: 'Group B', value: 300 },
  { name: 'Group C', value: 300 },
  { name: 'Group D', value: 200 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function PieChartComponent() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

**Donut Chart:**

```typescript
<Pie
  data={data}
  cx="50%"
  cy="50%"
  innerRadius={60}
  outerRadius={80}
  fill="#8884d8"
  paddingAngle={5}
  dataKey="value"
>
  {data.map((entry, index) => (
    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
  ))}
</Pie>
```

### ComposedChart

**Use for:** Combining multiple chart types (bar + line, area + line), showing different scales.

```typescript
import { ComposedChart, Line, Bar, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ComposedChartComponent({ data }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid stroke="#f5f5f5" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Area type="monotone" dataKey="revenue" fill="#8884d8" stroke="#8884d8" />
        <Bar dataKey="sales" barSize={20} fill="#413ea0" />
        <Line type="monotone" dataKey="profit" stroke="#ff7300" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
```

**Multiple Y-Axes:**

```typescript
<ComposedChart data={data}>
  <XAxis dataKey="time" />
  <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
  <Tooltip />
  <Legend />
  <Bar yAxisId="left" dataKey="value1" fill="#8884d8" />
  <Line yAxisId="right" type="monotone" dataKey="value2" stroke="#82ca9d" />
</ComposedChart>
```

### ScatterChart

**Use for:** Correlation analysis, distribution patterns, outlier detection.

```typescript
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { x: 100, y: 200, z: 200 },
  { x: 120, y: 100, z: 260 },
  { x: 170, y: 300, z: 400 },
  { x: 140, y: 250, z: 280 },
];

export default function ScatterChartComponent() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
        <CartesianGrid />
        <XAxis type="number" dataKey="x" name="stature" unit="cm" />
        <YAxis type="number" dataKey="y" name="weight" unit="kg" />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
        <Scatter name="A school" data={data} fill="#8884d8" />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
```

---

## Integrating Recharts with TailAdmin Cards

### Reusable ChartCard Component

Create a standardized card wrapper for all charts:

```typescript
// components/dashboard/ChartCard.tsx
import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  height?: string;
  actions?: ReactNode;
}

export default function ChartCard({ 
  title, 
  subtitle, 
  children, 
  height = 'h-[400px]',
  actions 
}: ChartCardProps) {
  return (
    <div className={`bg-white dark:bg-boxdark rounded-sm border border-stroke dark:border-strokedark shadow-default ${height}`}>
      {/* Card Header */}
      <div className="flex items-center justify-between p-6 border-b border-stroke dark:border-strokedark">
        <div>
          <h3 className="text-lg font-semibold text-black dark:text-white">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div>{actions}</div>}
      </div>
      
      {/* Card Body - Chart Container */}
      <div className="p-6 h-[calc(100%-80px)]">
        {children}
      </div>
    </div>
  );
}
```

**Usage:**

```typescript
<ChartCard 
  title="Monthly Revenue" 
  subtitle="Last 12 months"
  actions={
    <button className="text-sm text-blue-600">View Details</button>
  }
>
  <RevenueChart data={revenueData} />
</ChartCard>
```

### Stats Card Component

```typescript
// components/dashboard/StatsCard.tsx
import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down';
  icon?: ReactNode;
}

export default function StatsCard({ title, value, change, trend, icon }: StatsCardProps) {
  return (
    <div className="rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-black dark:text-white mt-2">
            {value}
          </p>
          {change && (
            <p className={`text-sm mt-2 ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="text-blue-500">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## Multi-Chart Dashboard Patterns

### Complete Dashboard Page Structure

```typescript
// app/dashboard/page.tsx (Server Component)
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import StatsCards from '@/components/dashboard/StatsCards';

// Dynamic imports for chart components
const AreaChartPlot = dynamic(() => import('@/components/charts/AreaChartPlot'), {
  loading: () => <ChartSkeleton />,
  ssr: false
});

const BarChartPlot = dynamic(() => import('@/components/charts/BarChartPlot'), {
  loading: () => <ChartSkeleton />,
  ssr: false
});

const PieChartPlot = dynamic(() => import('@/components/charts/PieChartPlot'), {
  loading: () => <ChartSkeleton />,
  ssr: false
});

async function getDashboardData() {
  const res = await fetch('http://localhost:3210/api/dashboard', {
    next: { revalidate: 60 } // Cache for 1 minute
  });
  return res.json();
}

export default async function DashboardPage() {
  const data = await getDashboardData();
  
  return (
    <DefaultLayout>
      <Breadcrumb pageName="Dashboard" />
      
      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        <StatsCard 
          title="Total Revenue" 
          value="$45,231" 
          change="+12.5%" 
          trend="up" 
        />
        <StatsCard 
          title="Total Sales" 
          value="$30,000" 
          change="+8.3%" 
          trend="up" 
        />
        <StatsCard 
          title="Customers" 
          value="1,234" 
          change="+5.2%" 
          trend="up" 
        />
        <StatsCard 
          title="Conversion Rate" 
          value="3.2%" 
          change="-2.1%" 
          trend="down" 
        />
      </div>
      
      {/* Main Charts Section - Two Column Layout */}
      <div className="mt-4 grid grid-cols-12 gap-4 md:mt-6 md:gap-6 2xl:mt-7.5 2xl:gap-7.5">
        <div className="col-span-12 xl:col-span-8">
          <ChartCard title="Sales Trends">
            <AreaChartPlot data={data.salesTrends} />
          </ChartCard>
        </div>
        
        <div className="col-span-12 xl:col-span-4">
          <ChartCard title="Revenue by Category">
            <BarChartPlot data={data.revenueByCategory} />
          </ChartCard>
        </div>
      </div>
      
      {/* Secondary Charts Section - Three Column Layout */}
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3 2xl:gap-7.5">
        <ChartCard title="Traffic Sources">
          <PieChartPlot data={data.trafficSources} />
        </ChartCard>
        
        <ChartCard title="User Growth">
          <LineChartPlot data={data.userGrowth} />
        </ChartCard>
        
        <ChartCard title="Top Products">
          <BarChartPlot data={data.topProducts} />
        </ChartCard>
      </div>
    </DefaultLayout>
  );
}
```

### Client Component Charts Container

```typescript
// components/dashboard/Charts.tsx
'use client'

import { AreaChart, BarChart, PieChart, LineChart } from '@/components/charts';
import ChartCard from './ChartCard';

export default function Charts({ data }) {
  return (
    <>
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Sales Overview">
          <AreaChart data={data.sales} />
        </ChartCard>
        
        <ChartCard title="Revenue by Category">
          <BarChart data={data.revenue} />
        </ChartCard>
      </div>
      
      {/* Three Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ChartCard title="Traffic Sources">
          <PieChart data={data.traffic} />
        </ChartCard>
        
        <ChartCard title="User Growth">
          <LineChart data={data.users} />
        </ChartCard>
        
        <ChartCard title="Conversion Rate">
          <LineChart data={data.conversions} />
        </ChartCard>
      </div>
    </>
  );
}
```

---

## Next.js Integration Patterns

### Server Components for Data Fetching

**Pattern 1: Server Actions (Recommended)**

```typescript
// lib/actions/dashboard.ts
'use server'

export async function getDashboardData() {
  const response = await fetch('http://localhost:3210/api/dashboard', {
    next: { revalidate: 60 } // Revalidate every minute
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch dashboard data');
  }
  
  return response.json();
}
```

**Usage in Page:**

```typescript
// app/dashboard/page.tsx
import { getDashboardData } from '@/lib/actions/dashboard';
import PieChart from '@/components/charts/PieChart';

export default async function DashboardPage() {
  const data = await getDashboardData();
  
  return (
    <div>
      <PieChart data={data.userCountries} />
    </div>
  );
}
```

**Pattern 2: Client-Side Fetching with useEffect**

```typescript
'use client'

import { useEffect, useState } from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function ClientSideChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetch('http://localhost:3210/api/dailyData')
      .then(res => res.json())
      .then(data => {
        setData(data);
        setLoading(false);
      });
  }, []);
  
  if (loading) return <ChartSkeleton />;
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="count" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

**Pattern 3: Using SWR for Client-Side Fetching**

```typescript
'use client'

import useSWR from 'swr';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function RealtimeChart() {
  const { data, error, isLoading } = useSWR('/api/metrics', fetcher, {
    refreshInterval: 5000 // Refresh every 5 seconds
  });
  
  if (error) return <div>Failed to load</div>;
  if (isLoading) return <ChartSkeleton />;
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="value" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### Consuming FastAPI JSON Endpoints

**FastAPI Response Format:**

```python
# FastAPI endpoint
@app.get("/api/dashboard")
async def get_dashboard_data():
    return {
        "salesTrends": [
            {"month": "Jan", "revenue": 4000, "cost": 2400},
            {"month": "Feb", "revenue": 3000, "cost": 1398}
        ],
        "trafficSources": [
            {"name": "Desktop", "value": 400},
            {"name": "Mobile", "value": 300}
        ]
    }
```

**Next.js Consumption:**

```typescript
// Server Component
async function getDashboardData() {
  const res = await fetch('http://localhost:3210/api/dashboard');
  const data = await res.json();
  return data;
}

// Transform if needed
const transformedData = data.salesTrends.map(item => ({
  ...item,
  formattedMonth: new Date(item.month).toLocaleDateString()
}));
```

---

## Styling and Theming

### CSS Variables Approach (Recommended)

```css
/* globals.css */
@layer base {
  :root {
    --chart-1: #3b82f6;     /* blue-500 */
    --chart-2: #10b981;     /* emerald-500 */
    --chart-3: #f59e0b;     /* amber-500 */
    --chart-4: #ef4444;     /* red-500 */
    --chart-5: #8b5cf6;     /* violet-500 */
  }
  
  .dark {
    --chart-1: #60a5fa;     /* blue-400 */
    --chart-2: #34d399;     /* emerald-400 */
    --chart-3: #fbbf24;     /* amber-400 */
    --chart-4: #f87171;     /* red-400 */
    --chart-5: #a78bfa;     /* violet-400 */
  }
}
```

**Usage:**

```typescript
<Line dataKey="revenue" stroke="var(--chart-1)" />
<Bar dataKey="sales" fill="var(--chart-2)" />
```

### Dark Mode Implementation

**Method 1: CSS Variables (Best)**

```typescript
const chartConfig = {
  revenue: {
    label: "Revenue",
    color: "hsl(var(--chart-1))", // Auto-switches with theme
  },
};
```

**Method 2: useTheme Hook**

```typescript
'use client';
import { useTheme } from 'next-themes';

export function DarkModeChart({ data }) {
  const { theme } = useTheme();
  
  const colors = {
    line: theme === 'dark' ? '#60a5fa' : '#2563eb',
    grid: theme === 'dark' ? '#374151' : '#e5e7eb',
    text: theme === 'dark' ? '#f3f4f6' : '#111827',
  };

  return (
    <LineChart data={data}>
      <Line stroke={colors.line} />
      <CartesianGrid stroke={colors.grid} />
      <XAxis tick={{ fill: colors.text }} />
    </LineChart>
  );
}
```

### Tailwind CSS Integration

```typescript
<ResponsiveContainer className="w-full h-[300px] md:h-[400px]">
  <BarChart>
    <CartesianGrid className="stroke-gray-200 dark:stroke-gray-800" />
    <Bar className="fill-blue-500 dark:fill-blue-400" />
  </BarChart>
</ResponsiveContainer>
```

---

## TypeScript Patterns

### Complete Type-Safe Example

```typescript
'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';

// Data interface
interface ChartDataPoint {
  month: string;
  desktop: number;
  mobile: number;
}

// Component props
interface LineChartComponentProps {
  data: ChartDataPoint[];
  height?: number;
  showLegend?: boolean;
}

// Custom tooltip with proper typing
const CustomTooltip: React.FC<TooltipProps<ValueType, NameType>> = ({
  active,
  payload,
  label,
}) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-lg border bg-white p-3 shadow-md dark:bg-gray-950">
      <p className="font-semibold">{label}</p>
      {payload.map((entry, index) => (
        <p key={index} style={{ color: entry.color }}>
          {entry.name}: {entry.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

// Type-safe component
export const LineChartComponent: React.FC<LineChartComponentProps> = ({
  data,
  height = 300,
  showLegend = true,
}) => {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        {showLegend && <Legend />}
        <Line 
          type="monotone" 
          dataKey="desktop" 
          stroke="var(--chart-1)"
          strokeWidth={2}
        />
        <Line 
          type="monotone" 
          dataKey="mobile" 
          stroke="var(--chart-2)"
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
```

### Type Definitions

```typescript
// types/dashboard.ts
export interface ChartData {
  date: string;
  value: number;
}

export interface DashboardData {
  sales: ChartData[];
  revenue: ChartData[];
  users: ChartData[];
}

export interface StatsCardData {
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down';
}
```

---

## Responsive Design Patterns

### Strategy 1: Aspect Ratio (Recommended)

```typescript
<ResponsiveContainer width="100%" aspect={16/9}>
  <LineChart data={data}>
    {/* Maintains consistent proportions */}
  </LineChart>
</ResponsiveContainer>
```

### Strategy 2: Breakpoint-Based Heights

```typescript
'use client';
import { useMediaQuery } from 'react-responsive';

export function ResponsiveChart({ data }) {
  const isMobile = useMediaQuery({ query: '(max-width: 768px)' });
  const isTablet = useMediaQuery({ query: '(max-width: 1024px)' });

  return (
    <ResponsiveContainer 
      width="100%" 
      height={isMobile ? 200 : isTablet ? 300 : 400}
    >
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: isMobile ? 10 : 30,
          left: isMobile ? 10 : 30,
          bottom: 5,
        }}
      >
        <XAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
        <YAxis tick={{ fontSize: isMobile ? 10 : 12 }} />
        {!isMobile && <Legend />}
        <Line dataKey="value" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
}
```

### Strategy 3: Tailwind Responsive Classes

```typescript
<div className="h-[200px] sm:h-[300px] md:h-[400px] lg:h-[500px]">
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data}>
      {/* Chart adapts to container height */}
    </BarChart>
  </ResponsiveContainer>
</div>
```

---

## Chart Customization

### Axes Configuration

```typescript
// Custom tick formatter
<XAxis 
  dataKey="date"
  tickFormatter={(value) => new Date(value).toLocaleDateString()}
/>

// Multiple Y-Axes
<YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
<YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />

// Domain customization
<YAxis domain={[0, 100]} />
<YAxis domain={['dataMin - 100', 'dataMax + 100']} />
```

### Custom Tooltips

```typescript
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
      <p className="font-semibold mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }} 
          />
          <span>{entry.name}: </span>
          <span className="font-medium">{entry.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

<Tooltip content={<CustomTooltip />} />
```

### Data Formatting

```typescript
// Number formatting
const formatNumber = (value: number) => value.toLocaleString();

// Currency formatting
const formatCurrency = (value: number) => 
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);

// Percentage formatting
const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;

// Compact notation (1K, 1M, 1B)
const formatCompact = (value: number) =>
  new Intl.NumberFormat('en', { notation: 'compact' }).format(value);

// Usage
<Tooltip formatter={formatCurrency} />
<YAxis tickFormatter={formatCompact} />
```

---

## Common Pitfalls and Solutions

### Problem 1: Hydration Errors

**Solution: Dynamic Import with ssr: false**

```typescript
import dynamic from 'next/dynamic';

const Chart = dynamic(() => import('@/components/Chart'), {
  ssr: false,
  loading: () => <div className="h-[300px] animate-pulse bg-gray-200" />,
});

export default function Page() {
  return <Chart data={data} />;
}
```

### Problem 2: Sizing Issues

**❌ WRONG - No parent height:**

```typescript
<ResponsiveContainer width="100%" height="100%">
  <BarChart data={data}>...</BarChart>
</ResponsiveContainer>
```

**✅ CORRECT - Explicit parent height:**

```typescript
<div className="h-[300px] w-full">
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={data}>...</BarChart>
  </ResponsiveContainer>
</div>
```

### Problem 3: Performance with Large Datasets

**Solution A: Data Sampling**

```typescript
const sampleData = (data: DataPoint[], sampleRate = 10) => {
  return data.filter((_, index) => index % sampleRate === 0);
};

<LineChart data={sampleData(largeDataset)}>...</LineChart>
```

**Solution B: Disable Animations**

```typescript
<Line 
  dataKey="value"
  isAnimationActive={false}
  dot={false}
/>
```

**Solution C: Memoization**

```typescript
import { useMemo } from 'react';

export const Chart = React.memo(({ data }) => {
  const chartData = useMemo(() => processData(data), [data]);
  
  return <LineChart data={chartData}>...</LineChart>;
});
```

### Problem 4: Missing "use client" Directive

**Error Message:**
```
TypeError: Super expression must either be null or a function
```

**Solution:** Add `"use client"` to the top of any component importing Recharts.

---

## Performance Optimization

### Dynamic Imports

```typescript
import dynamic from 'next/dynamic';

// Load chart components only when needed
const HeavyChart = dynamic(() => import('@/components/charts/HeavyChart'), {
  loading: () => <p>Loading chart...</p>,
  ssr: false
});

export default function Dashboard() {
  const [showChart, setShowChart] = useState(false);
  
  return (
    <div>
      <button onClick={() => setShowChart(true)}>Load Chart</button>
      {showChart && <HeavyChart />}
    </div>
  );
}
```

### Code Splitting by Route

```
app/
├── dashboard/
│   ├── page.tsx          # Only loads overview charts
│   ├── analytics/
│   │   └── page.tsx      # Heavy analytics charts loaded separately
│   └── reports/
│       └── page.tsx      # Report charts loaded separately
```

### React.memo for Chart Components

```typescript
'use client'

import React from 'react';
import { BarChart, Bar, ResponsiveContainer } from 'recharts';

const BarChartComponent = React.memo(({ data, dataKey }) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <Bar dataKey={dataKey} fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
});

BarChartComponent.displayName = 'BarChartComponent';

export default BarChartComponent;
```

---

## Accessibility

### Enable Built-in Accessibility

```typescript
<LineChart 
  accessibilityLayer  // Enables keyboard navigation
  data={data}
>
  <Line 
    dataKey="revenue"
    name="Monthly Revenue" // Screen reader announcement
  />
</LineChart>
```

### ARIA Labels

```typescript
<div role="region" aria-label="Revenue trends chart">
  <h3 id="chart-title" className="sr-only">
    Monthly Revenue Chart for 2024
  </h3>
  <ResponsiveContainer>
    <LineChart aria-labelledby="chart-title" data={data}>
      ...
    </LineChart>
  </ResponsiveContainer>
</div>
```

### Accessible Color Contrast

```typescript
// Minimum 3:1 contrast ratio for charts (WCAG AA)
const accessibleColors = {
  primary: '#2563eb',    // 4.5:1 on white
  secondary: '#059669',  // 4.5:1 on white
  tertiary: '#dc2626',   // 4.5:1 on white
  neutral: '#64748b',    // 4.5:1 on white
};
```

---

## Production Best Practices

### Error Handling

```typescript
'use client';
import { ErrorBoundary } from 'react-error-boundary';

function ChartError({ error, resetErrorBoundary }) {
  return (
    <div className="flex h-[300px] items-center justify-center border border-red-200 bg-red-50">
      <div className="text-center">
        <p className="text-red-600">Chart failed to load</p>
        <button onClick={resetErrorBoundary} className="mt-2 text-sm underline">
          Retry
        </button>
      </div>
    </div>
  );
}

export function ProductionChart({ data }) {
  return (
    <ErrorBoundary FallbackComponent={ChartError}>
      <LineChart data={data}>...</LineChart>
    </ErrorBoundary>
  );
}
```

### Loading States

```typescript
export function Chart({ data, isLoading }) {
  if (isLoading) {
    return (
      <div className="h-[300px] w-full animate-pulse">
        <div className="flex h-full items-end justify-around gap-2 px-4">
          {[...Array(7)].map((_, i) => (
            <div
              key={i}
              className="w-12 rounded-t bg-gray-200"
              style={{ height: `${Math.random() * 100}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return <BarChart data={data}>...</BarChart>;
}
```

### Data Validation

```typescript
import { z } from 'zod';

const ChartDataSchema = z.array(
  z.object({
    date: z.string(),
    value: z.number().positive(),
  })
);

export function ValidatedChart({ data }) {
  try {
    const validatedData = ChartDataSchema.parse(data);
    return <LineChart data={validatedData}>...</LineChart>;
  } catch (error) {
    return <div>Invalid chart data</div>;
  }
}
```

---

## File Organization

### Recommended Structure

```
src/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx              # Main dashboard (server component)
│   │   └── analytics/
│   │       └── page.tsx          # Analytics sub-page
│   └── api/
│       └── dashboard/
│           └── route.ts          # API routes
│
├── components/
│   ├── charts/                   # Chart components (client)
│   │   ├── AreaChart.tsx
│   │   ├── BarChart.tsx
│   │   ├── LineChart.tsx
│   │   ├── PieChart.tsx
│   │   └── index.ts              # Barrel export
│   │
│   ├── dashboard/                # Dashboard components
│   │   ├── ChartCard.tsx
│   │   ├── StatsCard.tsx
│   │   └── ChartSkeleton.tsx
│   │
│   └── ui/                       # Reusable UI components
│       ├── Button.tsx
│       └── Card.tsx
│
├── lib/
│   ├── recharts.tsx              # Recharts wrapper with 'use client'
│   ├── actions/
│   │   └── dashboard.ts          # Server actions
│   └── utils/
│       ├── chart-helpers.ts      # Chart utility functions
│       └── format.ts
│
└── types/
    └── dashboard.ts              # TypeScript types
```

---

## Complete Production Example

```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import DefaultLayout from '@/components/Layouts/DefaultLayout';
import Breadcrumb from '@/components/Breadcrumbs/Breadcrumb';
import { getDashboardData } from '@/lib/actions/dashboard';

const Charts = dynamic(() => import('@/components/dashboard/Charts'), {
  loading: () => <ChartsLoading />,
  ssr: false
});

export default async function DashboardPage() {
  const data = await getDashboardData();
  
  return (
    <DefaultLayout>
      <Breadcrumb pageName="Dashboard" />
      
      <div className="p-6">
        {/* Stats Section */}
        <Suspense fallback={<StatsLoading />}>
          <StatsCards data={data.stats} />
        </Suspense>
        
        {/* Charts Section */}
        <Suspense fallback={<ChartsLoading />}>
          <Charts data={data} />
        </Suspense>
      </div>
    </DefaultLayout>
  );
}

// components/dashboard/Charts.tsx
'use client'

import { AreaChart, BarChart, PieChart } from '@/components/charts';
import ChartCard from './ChartCard';

export default function Charts({ data }) {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <ChartCard title="Sales Overview">
          <AreaChart data={data.sales} />
        </ChartCard>
        
        <ChartCard title="Revenue by Category">
          <BarChart data={data.revenue} />
        </ChartCard>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ChartCard title="Traffic Sources">
          <PieChart data={data.traffic} />
        </ChartCard>
      </div>
    </>
  );
}
```

---

## Quick Reference Checklist

### ✅ DO:
1. Always use `"use client"` for components importing Recharts
2. Create a centralized Recharts wrapper to avoid repeating directives
3. Fetch data server-side when possible
4. Use dynamic imports for heavy chart components
5. Wrap charts in ResponsiveContainer
6. Memoize expensive calculations with useMemo
7. Use React.memo for chart components
8. Implement loading states with Suspense
9. Add proper TypeScript types
10. Test in both light and dark modes

### ❌ DON'T:
1. Don't render Recharts in Server Components without "use client"
2. Don't load all charts upfront - use lazy loading
3. Don't forget `ssr: false` for dynamic imports
4. Don't create deep nesting
5. Don't fetch data client-side when server-side is possible
6. Don't ignore responsive design
7. Don't skip error boundaries
8. Don't hardcode dimensions
9. Don't forget accessibility features
10. Don't use animations for large datasets

---

## Summary

This guide provides everything needed to build production-ready dashboards combining TailAdmin's component architecture with Recharts data visualization. Key patterns include:

- **Server Components for data fetching** + Client Components for chart rendering
- **TailAdmin's card/layout patterns** provide consistent styling
- **Recharts' declarative API** enables rapid chart development
- **TypeScript support** ensures type safety throughout
- **Dark mode** is built-in with CSS variables
- **Responsive design** adapts to all screen sizes
- **Performance optimization** through dynamic imports and memoization
- **Accessibility features** ensure charts are usable by everyone

Follow these patterns to create dashboards that are fast, maintainable, accessible, and production-ready.