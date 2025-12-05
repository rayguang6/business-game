'use client';

interface SidebarItem {
  id: string;
  label: string;
  icon?: string;
  disabled?: boolean;
  metadata?: string; // e.g., "(locked)" for unavailable industries
}

interface VerticalSidebarProps {
  title: string;
  description: string;
  items: SidebarItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  loading?: boolean;
  error?: string | null;
  actionButton?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'success';
  };
  width?: string;
}

export function VerticalSidebar({
  title,
  description,
  items,
  selectedId,
  onSelect,
  loading = false,
  error = null,
  actionButton,
  width = 'w-80',
}: VerticalSidebarProps) {
  const getButtonClasses = (variant: 'primary' | 'secondary' | 'success' = 'secondary') => {
    const variants = {
      primary: 'border-sky-500 text-sky-200 hover:bg-sky-500/10',
      secondary: 'border-slate-700 text-slate-300 hover:bg-slate-700',
      success: 'border-emerald-500 text-emerald-200 hover:bg-emerald-500/10',
    };
    return variants[variant];
  };

  return (
    <div className={`${width} space-y-4`}>
      <div>
        <h3 className="text-lg font-semibold text-slate-200 mb-1">{title}</h3>
        <p className="text-xs text-slate-500">{description}</p>
      </div>

      {actionButton && (
        <button
          onClick={actionButton.onClick}
          className={`w-full px-3 py-2 text-sm font-medium rounded-lg border ${getButtonClasses(actionButton.variant)}`}
        >
          {actionButton.label}
        </button>
      )}

      {loading ? (
        <div className="text-sm text-slate-400">Loading...</div>
      ) : error ? (
        <div className="text-sm text-rose-400">{error}</div>
      ) : items.length === 0 ? (
        <div className="text-sm text-slate-400">No items yet</div>
      ) : (
        <div className="space-y-1">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              disabled={item.disabled}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                selectedId === item.id
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                  : item.disabled
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
              }`}
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              <div className="flex flex-col">
                <span>{item.label}</span>
                {item.metadata && (
                  <span className="text-xs opacity-60">{item.metadata}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}