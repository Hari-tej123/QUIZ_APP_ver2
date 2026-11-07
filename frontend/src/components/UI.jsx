import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Search, X, Sparkles, BookMarked, BookOpen, Layers } from 'lucide-react';

/* ==========================================================================
   BUTTON COMPONENT
   ========================================================================== */
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow-indigo focus:ring-primary-500 border border-transparent',
    amber: 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm hover:shadow-amber focus:ring-amber-500 border border-transparent',
    secondary: 'bg-white hover:bg-neutral-50 text-neutral-800 border border-neutral-200/90 shadow-xs hover:border-neutral-300 focus:ring-neutral-400',
    outlineIndigo: 'bg-primary-50/50 hover:bg-primary-100/70 text-primary-700 border border-primary-200 focus:ring-primary-500',
    outlineAmber: 'bg-amber-50/50 hover:bg-amber-100/70 text-amber-800 border border-amber-200 focus:ring-amber-500',
    ghost: 'hover:bg-neutral-100/80 text-neutral-600 hover:text-neutral-900 focus:ring-neutral-400',
    destructive: 'bg-danger-500 hover:bg-danger-600 text-white shadow-sm focus:ring-danger-500 border border-transparent'
  };

  const sizes = {
    xs: 'px-2.5 py-1 text-xs rounded-lg gap-1.5',
    sm: 'px-3.5 py-1.5 text-xs rounded-lg gap-1.5',
    md: 'px-4.5 py-2.2 text-sm rounded-xl gap-2',
    lg: 'px-6 py-3 text-base rounded-xl gap-2.5'
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {children}
    </button>
  );
};

/* ==========================================================================
   BADGE COMPONENT
   ========================================================================== */
export const Badge = ({ children, variant = 'neutral', className = '' }) => {
  const variants = {
    neutral: 'bg-neutral-100 text-neutral-700 border border-neutral-200/80',
    primary: 'bg-primary-50 text-primary-700 border border-primary-200/80',
    amber: 'bg-amber-50 text-amber-800 border border-amber-200/80',
    trackCompetitive: 'bg-primary-50 text-primary-700 border border-primary-200/90 font-bold',
    trackCollege: 'bg-amber-50 text-amber-800 border border-amber-200/90 font-bold',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200/80',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200/80',
    info: 'bg-blue-50 text-blue-700 border border-blue-200/80',
    roleAdmin: 'bg-neutral-900 text-white font-bold',
    roleFaculty: 'bg-primary-100 text-primary-800 border border-primary-200 font-bold',
    roleStudent: 'bg-blue-100 text-blue-800 border border-blue-200 font-bold'
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant] || variants.neutral} ${className}`}>
      {children}
    </span>
  );
};

/* ==========================================================================
   TRACK SELECTOR / SEGMENTED TOGGLE
   ========================================================================== */
export const TrackSelector = ({ activeTrack, onChange, showAll = true, className = '' }) => {
  const tracks = [
    ...(showAll ? [{ id: 'all', label: 'All Tracks', icon: <Layers className="w-3.5 h-3.5" /> }] : []),
    { id: 'competitive', label: 'Competitive Exams', icon: <BookMarked className="w-3.5 h-3.5" />, color: 'primary' },
    { id: 'college', label: 'College Courses', icon: <BookOpen className="w-3.5 h-3.5" />, color: 'amber' }
  ];

  return (
    <div className={`inline-flex p-1 bg-neutral-100/90 border border-neutral-200/80 rounded-xl ${className}`}>
      {tracks.map((t) => {
        const isActive = activeTrack === t.id;
        let activeStyles = 'bg-white text-neutral-900 shadow-sm border border-neutral-200/60 font-bold';
        if (isActive && t.id === 'competitive') {
          activeStyles = 'bg-white text-primary-700 shadow-sm border border-primary-200 font-bold';
        } else if (isActive && t.id === 'college') {
          activeStyles = 'bg-white text-amber-800 shadow-sm border border-amber-200 font-bold';
        }

        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
              isActive ? activeStyles : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200/40'
            }`}
          >
            <span className={isActive ? (t.id === 'competitive' ? 'text-primary-600' : t.id === 'college' ? 'text-amber-600' : 'text-neutral-800') : 'text-neutral-400'}>
              {t.icon}
            </span>
            {t.label}
          </button>
        );
      })}
    </div>
  );
};

/* ==========================================================================
   STAT CARD COMPONENT
   ========================================================================== */
export const StatCard = ({ title, value, subtitle, icon, accent = 'primary', trend }) => {
  const accentStyles = {
    primary: {
      iconBg: 'bg-primary-50 border-primary-100 text-primary-600',
      valueColor: 'text-neutral-900'
    },
    amber: {
      iconBg: 'bg-amber-50 border-amber-100 text-amber-600',
      valueColor: 'text-neutral-900'
    },
    emerald: {
      iconBg: 'bg-emerald-50 border-emerald-100 text-emerald-600',
      valueColor: 'text-neutral-900'
    },
    blue: {
      iconBg: 'bg-blue-50 border-blue-100 text-blue-600',
      valueColor: 'text-neutral-900'
    }
  };

  const style = accentStyles[accent] || accentStyles.primary;

  return (
    <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all duration-200 flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">{title}</span>
        <h3 className={`text-2xl sm:text-3xl font-extrabold mt-1.5 font-display tracking-tight ${style.valueColor}`}>{value}</h3>
        {subtitle && (
          <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1.5 font-medium">
            {subtitle}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-xl border shrink-0 ${style.iconBg}`}>
        {icon}
      </div>
    </div>
  );
};

/* ==========================================================================
   CARD COMPONENT
   ========================================================================== */
export const Card = ({ children, title, subtitle, action, footer, className = '', hoverEffect = false }) => {
  return (
    <div className={`bg-white border border-neutral-200/80 rounded-2xl shadow-card ${hoverEffect ? 'hover:shadow-card-hover hover:border-neutral-300 transition-all duration-200' : ''} ${className}`}>
      {(title || subtitle || action) && (
        <div className="px-6 py-4.5 border-b border-neutral-100 flex items-center justify-between gap-4">
          <div>
            {title && <h3 className="text-base font-bold text-neutral-900 tracking-tight">{title}</h3>}
            {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && <div className="px-6 py-4 bg-neutral-50/60 border-t border-neutral-100 rounded-b-2xl">{footer}</div>}
    </div>
  );
};

/* ==========================================================================
   EMPTY STATE COMPONENT
   ========================================================================== */
export const EmptyState = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionVariant = 'primary',
  className = ''
}) => {
  return (
    <div className={`text-center py-12 px-6 flex flex-col items-center justify-center max-w-md mx-auto ${className}`}>
      <div className="w-16 h-16 rounded-2xl bg-neutral-100 border border-neutral-200/80 flex items-center justify-center text-neutral-400 mb-4 shadow-xs">
        {icon}
      </div>
      <h3 className="text-base font-bold text-neutral-800 tracking-tight">{title}</h3>
      <p className="text-xs text-neutral-500 leading-relaxed mt-1.5 mb-5 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button variant={actionVariant} size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

/* ==========================================================================
   FORM INPUTS
   ========================================================================== */
export const Input = ({
  label,
  error,
  helperText,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
          {label} {required && <span className="text-danger-500">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-neutral-800 transition-all placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
          error
            ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20'
            : 'border-neutral-200/90 focus:border-primary-500 focus:ring-primary-500/20 shadow-xs'
        }`}
        {...props}
      />
      {error ? (
        <span className="text-xs text-danger-500 font-medium">{error}</span>
      ) : helperText ? (
        <span className="text-[11px] text-neutral-400 font-medium">{helperText}</span>
      ) : null}
    </div>
  );
};

export const Select = ({
  label,
  error,
  value,
  onChange,
  options = [],
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
          {label} {required && <span className="text-danger-500">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-neutral-800 transition-all focus:outline-none focus:ring-2 focus:ring-offset-0 ${
          error
            ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20'
            : 'border-neutral-200/90 focus:border-primary-500 focus:ring-primary-500/20 shadow-xs'
        }`}
        {...props}
      >
        <option value="" disabled hidden>Select an option</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-danger-500 font-medium">{error}</span>}
    </div>
  );
};

export const Textarea = ({
  label,
  error,
  helperText,
  value,
  onChange,
  placeholder,
  rows = 3,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
          {label} {required && <span className="text-danger-500">*</span>}
        </label>
      )}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className={`w-full px-3.5 py-2.5 text-sm rounded-xl border bg-white text-neutral-800 transition-all placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-offset-0 ${
          error
            ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/20'
            : 'border-neutral-200/90 focus:border-primary-500 focus:ring-primary-500/20 shadow-xs'
        }`}
        {...props}
      />
      {error ? (
        <span className="text-xs text-danger-500 font-medium">{error}</span>
      ) : helperText ? (
        <span className="text-[11px] text-neutral-400 font-medium">{helperText}</span>
      ) : null}
    </div>
  );
};

/* ==========================================================================
   MODAL COMPONENT
   ========================================================================== */
export const Modal = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-neutral-900/50 backdrop-blur-xs transition-opacity animate-fade-in" onClick={onClose} />

      {/* Dialog container */}
      <div className={`relative bg-white rounded-2xl shadow-card-hover w-full ${sizes[size]} z-10 overflow-hidden animate-slide-up border border-neutral-200/80`}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-neutral-100">
          <h3 className="text-lg font-bold text-neutral-900 tracking-tight font-display">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 max-h-[72vh] overflow-y-auto">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 bg-neutral-50/80 border-t border-neutral-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

/* ==========================================================================
   DATA TABLE COMPONENT
   ========================================================================== */
export const DataTable = ({
  columns = [],
  data = [],
  searchable = false,
  searchPlaceholder = 'Search...',
  searchKey = '',
  isLoading = false,
  emptyStateMessage = 'No records found.'
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedData = React.useMemo(() => {
    let sortableItems = [...data];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue === undefined || bValue === undefined) return 0;
        if (typeof aValue === 'string') {
          return sortConfig.direction === 'ascending'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        } else {
          return sortConfig.direction === 'ascending' ? aValue - bValue : bValue - aValue;
        }
      });
    }
    return sortableItems;
  }, [data, sortConfig]);

  const filteredData = React.useMemo(() => {
    if (!searchable || !searchTerm || !searchKey) return sortedData;
    return sortedData.filter((item) => {
      const val = item[searchKey];
      return String(val || '').toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [sortedData, searchTerm, searchable, searchKey]);

  const paginatedData = React.useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const displayStart = filteredData.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const displayEnd = Math.min(currentPage * itemsPerPage, filteredData.length);

  return (
    <div className="flex flex-col gap-3.5 w-full">
      {searchable && (
        <div className="relative max-w-sm w-full">
          <Search className="absolute left-3.5 top-2.8 h-4.5 w-4.5 text-neutral-400" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-sm border border-neutral-200/90 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 shadow-xs"
          />
        </div>
      )}

      <div className="overflow-x-auto border border-neutral-200/80 rounded-2xl shadow-card bg-white">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-neutral-50/80">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  className={`px-6 py-3.5 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider ${
                    col.sortable ? 'cursor-pointer select-none hover:text-neutral-700' : ''
                  } ${col.className || ''}`}
                >
                  <div className="flex items-center gap-1.5">
                    {col.label}
                    {col.sortable && sortConfig?.key === col.key && (
                      sortConfig.direction === 'ascending' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 bg-white">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, rIdx) => (
                <tr key={rIdx}>
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="px-6 py-4.5">
                      <div className="h-4 bg-neutral-200/70 rounded-md animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <p className="text-sm font-semibold text-neutral-500">{emptyStateMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rIdx) => (
                <tr key={row.id || rIdx} className="hover:bg-neutral-50/60 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className={`px-6 py-4 text-sm text-neutral-700 whitespace-nowrap ${col.className || ''}`}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between px-1 py-1.5">
          <span className="text-xs text-neutral-500 font-medium">
            Showing <span className="font-semibold text-neutral-700">{displayStart}</span> to{' '}
            <span className="font-semibold text-neutral-700">{displayEnd}</span> of{' '}
            <span className="font-semibold text-neutral-700">{filteredData.length}</span> entries
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((c) => c - 1)}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }).map((_, pageIdx) => {
                const pageNum = pageIdx + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7.5 h-7.5 text-xs font-semibold rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-primary-600 text-white shadow-xs'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <Button
              variant="secondary"
              size="sm"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((c) => c + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ==========================================================================
   PROGRESS BAR
   ========================================================================== */
export const ProgressBar = ({ percentage, color = 'primary', className = '' }) => {
  const colorMap = {
    primary: 'bg-primary-600',
    amber: 'bg-amber-500',
    success: 'bg-emerald-600',
    danger: 'bg-rose-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-600'
  };

  const clampedPercent = Math.min(Math.max(percentage, 0), 100);

  return (
    <div className={`w-full bg-neutral-200/80 rounded-full h-2 overflow-hidden ${className}`}>
      <div
        className={`h-full transition-all duration-300 ease-out rounded-full ${colorMap[color] || colorMap.primary}`}
        style={{ width: `${clampedPercent}%` }}
      />
    </div>
  );
};

/* ==========================================================================
   SKELETONS
   ========================================================================== */
export const SkeletonCard = () => (
  <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-card flex flex-col gap-4">
    <div className="h-5 bg-neutral-200/80 rounded-md animate-pulse w-1/3" />
    <div className="flex flex-col gap-2">
      <div className="h-4 bg-neutral-200/80 rounded-md animate-pulse w-full" />
      <div className="h-4 bg-neutral-200/80 rounded-md animate-pulse w-5/6" />
    </div>
    <div className="h-9 bg-neutral-200/80 rounded-xl animate-pulse w-1/4 mt-2" />
  </div>
);
