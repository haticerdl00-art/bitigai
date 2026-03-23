import React from 'react';
import { LayoutDashboard } from 'lucide-react';

interface ModulePlaceholderProps {
  title: string;
  description: string;
}

export const ModulePlaceholder = ({ title, description }: ModulePlaceholderProps) => (
  <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center">
      <LayoutDashboard className="w-10 h-10 text-emerald-600" />
    </div>
    <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
    <p className="text-slate-500 max-w-md">{description}</p>
    <button className="px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors">
      Modülü Başlat
    </button>
  </div>
);
