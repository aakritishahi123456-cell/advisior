'use client';

import { BellIcon, MagnifyingGlassIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

export function Header() {
  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
      <div className="flex items-center flex-1">
        <div className="relative w-96">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full py-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search companies, reports..."
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button className="relative p-2 text-gray-500 hover:text-gray-700">
          <ChatBubbleLeftRightIcon className="w-6 h-6" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        <button className="relative p-2 text-gray-500 hover:text-gray-700">
          <BellIcon className="w-6 h-6" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">JD</span>
          </div>
          <div className="text-sm">
            <p className="font-medium text-gray-900">John Doe</p>
            <p className="text-gray-500">Free Plan</p>
          </div>
        </div>
      </div>
    </header>
  );
}
