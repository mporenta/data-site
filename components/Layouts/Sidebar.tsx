'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, TrendingUp, Users, BarChart3, ChevronLeft } from 'lucide-react'
import { useEffect, useRef } from 'react'

interface SidebarProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

const navigation = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Revenue', href: '/dashboards/revenue', icon: TrendingUp },
  { name: 'Operations', href: '/dashboards/operations', icon: BarChart3 },
  { name: 'Customers', href: '/dashboards/customers', icon: Users },
]

export default function Sidebar({ sidebarOpen, setSidebarOpen }: SidebarProps) {
  const pathname = usePathname()
  const sidebar = useRef<HTMLDivElement>(null)

  // Close sidebar on click outside
  useEffect(() => {
    const clickHandler = ({ target }: MouseEvent) => {
      if (!sidebar.current) return
      if (
        !sidebarOpen ||
        sidebar.current.contains(target as Node)
      )
        return
      setSidebarOpen(false)
    }
    document.addEventListener('click', clickHandler)
    return () => document.removeEventListener('click', clickHandler)
  })

  // Close sidebar on ESC key
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!sidebarOpen || keyCode !== 27) return
      setSidebarOpen(false)
    }
    document.addEventListener('keydown', keyHandler)
    return () => document.removeEventListener('keydown', keyHandler)
  })

  return (
    <aside
      ref={sidebar}
      className={`absolute left-0 top-0 z-9999 flex h-screen w-72.5 flex-col overflow-y-hidden bg-black duration-300 ease-linear dark:bg-boxdark lg:static lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between gap-2 px-6 py-5.5 lg:py-6.5">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
            <LayoutDashboard className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">BI Dashboard</span>
        </Link>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-controls="sidebar"
          className="block lg:hidden"
        >
          <ChevronLeft className="h-6 w-6 text-white" />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <div className="no-scrollbar flex flex-col overflow-y-auto duration-300 ease-linear">
        <nav className="mt-5 py-4 px-4 lg:mt-9 lg:px-6">
          <div>
            <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">
              MENU
            </h3>

            <ul className="mb-6 flex flex-col gap-1.5">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4 ${
                        isActive && 'bg-graydark dark:bg-meta-4'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Additional Menu Section */}
          <div>
            <h3 className="mb-4 ml-4 text-sm font-semibold text-bodydark2">
              OTHERS
            </h3>

            <ul className="mb-6 flex flex-col gap-1.5">
              <li>
                <Link
                  href="/settings"
                  className="group relative flex items-center gap-2.5 rounded-sm px-4 py-2 font-medium text-bodydark1 duration-300 ease-in-out hover:bg-graydark dark:hover:bg-meta-4"
                >
                  <svg
                    className="fill-current"
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M17.8099 8.4364C17.7149 8.14516 17.5499 7.88266 17.3299 7.66766L14.7824 5.12016C14.5149 4.85266 14.1449 4.71891 13.7749 4.76641L11.3399 5.05016C11.2299 4.96391 11.1199 4.88516 11.0099 4.80641L10.4699 2.42516C10.3899 2.07891 10.1924 1.76891 9.91738 1.55391C9.64238 1.33141 9.29488 1.21016 8.94738 1.21016C8.59988 1.21016 8.25238 1.33141 7.97738 1.55391C7.70238 1.77641 7.50488 2.07891 7.42488 2.42516L6.88488 4.80641C6.77488 4.88516 6.66488 4.96391 6.55488 5.05016L4.11988 4.76641C3.74988 4.71891 3.37988 4.85266 3.11238 5.12016L0.564883 7.66766C0.344883 7.88266 0.179883 8.14516 0.0848828 8.4364C-0.0101172 8.72766 -0.0251172 9.04516 0.0423828 9.34391L0.764883 12.1839C0.854883 12.5727 1.07988 12.9202 1.39738 13.1652L3.47238 14.7127C3.53988 14.8402 3.61488 14.9752 3.68988 15.1102L3.65988 17.6102C3.65988 17.9714 3.78738 18.3177 4.02738 18.5877C4.26738 18.8577 4.59738 19.0327 4.95738 19.0927L7.82988 19.4777C8.12988 19.5252 8.43738 19.4927 8.71488 19.3727C8.99238 19.2527 9.23988 19.0552 9.41988 18.7952L10.7399 16.8552C10.8499 16.8627 10.9599 16.8702 11.0699 16.8702C11.1799 16.8702 11.2899 16.8627 11.3999 16.8552L12.7199 18.7952C12.8999 19.0552 13.1474 19.2452 13.4249 19.3727C13.7024 19.4927 14.0099 19.5252 14.3099 19.4777L17.1824 19.0927C17.5424 19.0327 17.8724 18.8577 18.1124 18.5877C18.3524 18.3177 18.4799 17.9714 18.4799 17.6102L18.4499 15.1102C18.5249 14.9752 18.5999 14.8402 18.6674 14.7127L20.7424 13.1652C21.0599 12.9202 21.2849 12.5727 21.3749 12.1839L22.0974 9.34391C22.1649 9.04516 22.1499 8.72766 22.0549 8.4364H17.8099Z"
                      fill=""
                    />
                  </svg>
                  Settings
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </aside>
  )
}
