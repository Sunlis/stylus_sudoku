const BUTTON_BASE = [
  'rounded-lg', 'border', 'px-4', 'py-2', 'text-sm', 'font-medium',
  'shadow-[0_2px_4px_rgba(15,23,42,0.85)]', 'hover:bg-opacity-90', 'mt-1'
];

export const PRIMARY_BUTTON = [
  ...BUTTON_BASE, 'mt-1', 'border-slate-900', 'bg-slate-900', 'text-white',
  'hover:bg-slate-800'
].join(' ');
export const SECONDARY_BUTTON = [
  ...BUTTON_BASE, 'border-slate-300', 'bg-slate-100', 'text-slate-800',
  'hover:bg-slate-200'
].join(' ');
export const DANGER_BUTTON = [
  ...BUTTON_BASE, 'border-red-500', 'bg-red-50', 'text-red-700',
  'hover:bg-red-100'
].join(' ');
