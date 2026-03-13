'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  HomeIcon, 
  CalculatorIcon, 
  BuildingLibraryIcon,
  ChartBarIcon,
  DocumentChartBarIcon,
  UserIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Loan Calculator', href: '/dashboard/loan-calculator', icon: CalculatorIcon },
  { name: 'Companies', href: '/dashboard/companies', icon: BuildingLibraryIcon },
  { name: 'Reports', href: '/dashboard/reports', icon: DocumentChartBarIcon },
  { name: 'Research', href: '/dashboard/research', icon: ChartBarIcon },
  { name: 'Profile', href: '/dashboard/profile', icon: UserIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-gray-900 w-64">
      <div className="flex items-center h-16 px-4 bg-gray-800">
        <span className="text-xl font-bold text-white">FinSathi AI</span>
      </div>
      
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <Link
          href="/settings"
          className="flex items-center px-4 py-2 text-sm text-gray-300 hover:text-white"
        >
          <Cog6ToothIcon className="w-5 h-5 mr-3" />
          Settings
        </Link>
        <button
          className="flex items-center w-full px-4 py-2 mt-2 text-sm text-gray-300 hover:text-white"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
