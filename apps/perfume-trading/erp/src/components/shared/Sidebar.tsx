'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Package, ArrowLeftRight, Users,
  FileText, Settings, Wrench, Mail, Menu, ChevronLeft, Calculator
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/stores/ui-store';

const navItems = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Catálogo', href: '/catalog', icon: Package },
  { name: 'Trading B2B', href: '/trading', icon: ArrowLeftRight },
  { name: 'Socios B2B', href: '/partners', icon: Users },
  { name: 'Facturación', href: '/invoices', icon: FileText },
  { name: 'Contabilidad', href: '/accounting', icon: Calculator },
  { name: 'Correo', href: '/email', icon: Mail },
  { name: 'Configuración', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'h-screen bg-white dark:bg-[#1a1a1a] border-r border-[#EDEBE9] dark:border-[#333] transition-all duration-300 flex flex-col shrink-0',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="h-12 flex items-center px-4 justify-between border-b border-[#EDEBE9] dark:border-[#333] bg-[#F3F2F1] dark:bg-[#222]">
        {!sidebarCollapsed && (
          <span className="font-bold text-[#f43f5e] dark:text-[#fb7185] text-sm tracking-wide">Perfume Trading</span>
        )}
        <button onClick={toggleSidebar} className="p-1 hover:bg-white dark:hover:bg-[#333] rounded transition-colors">
          {sidebarCollapsed ? <Menu size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center mx-2 px-3 py-2 rounded transition-colors group',
                isActive
                  ? 'bg-[#f43f5e]/10 dark:bg-[#fb7185]/20 text-[#f43f5e] dark:text-[#fb7185] font-semibold'
                  : 'text-[#323130] dark:text-[#ccc] hover:bg-[#F3F2F1] dark:hover:bg-[#2a2a2a]'
              )}
            >
              <item.icon size={20} className="min-w-[20px]" />
              {!sidebarCollapsed && <span className="ml-3 text-sm">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-4 border-t border-[#EDEBE9] dark:border-[#333]">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-[#f43f5e] dark:bg-[#fb7185] flex items-center justify-center text-white text-xs font-bold shrink-0">
            AD
          </div>
          {!sidebarCollapsed && (
            <div className="ml-3 overflow-hidden">
              <p className="text-xs font-semibold truncate text-[#323130] dark:text-[#e0e0e0]">Admin User</p>
              <p className="text-[10px] text-[#605E5C] dark:text-[#888] truncate">admin@perfume-trading.app</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
