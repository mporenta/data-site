'use client'

import { Menu, Search, Bell, Settings, User } from 'lucide-react'

interface HeaderProps {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export default function Header({ sidebarOpen, setSidebarOpen }: HeaderProps) {
  return (
    <header className="sticky top-0 z-999 flex w-full bg-white drop-shadow-1 dark:bg-boxdark dark:drop-shadow-none border-b border-stroke dark:border-strokedark">
      <div className="flex flex-grow items-center justify-between px-4 py-4 shadow-2 md:px-6 2xl:px-11">
        {/* Hamburger Menu Button */}
        <div className="flex items-center gap-2 sm:gap-4 lg:hidden">
          <button
            aria-controls="sidebar"
            onClick={(e) => {
              e.stopPropagation()
              setSidebarOpen(!sidebarOpen)
            }}
            className="z-99999 block rounded-sm border border-stroke bg-white p-1.5 shadow-sm dark:border-strokedark dark:bg-boxdark lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Hidden on mobile, shown on desktop */}
        <div className="hidden sm:block">
          <h1 className="text-xl font-semibold text-black dark:text-white">
            Business Intelligence Dashboard
          </h1>
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center gap-3 2xl:gap-7">
          {/* Search */}
          <button
            aria-label="Search"
            className="flex h-8.5 w-8.5 items-center justify-center rounded-full border border-stroke bg-gray hover:bg-gray-2 dark:border-strokedark dark:bg-meta-4 dark:hover:bg-meta-4"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Notifications */}
          <button
            aria-label="Notifications"
            className="relative flex h-8.5 w-8.5 items-center justify-center rounded-full border border-stroke bg-gray hover:bg-gray-2 dark:border-strokedark dark:bg-meta-4 dark:hover:bg-meta-4"
          >
            <span className="absolute -top-0.5 -right-0.5 z-1 h-2 w-2 rounded-full bg-meta-1">
              <span className="absolute -z-1 inline-flex h-full w-full animate-ping rounded-full bg-meta-1 opacity-75"></span>
            </span>
            <Bell className="w-4 h-4" />
          </button>

          {/* User Dropdown */}
          <div className="relative">
            <button className="flex items-center gap-4">
              <span className="hidden text-right lg:block">
                <span className="block text-sm font-medium text-black dark:text-white">
                  Admin User
                </span>
                <span className="block text-xs">C-Suite Executive</span>
              </span>

              <span className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
