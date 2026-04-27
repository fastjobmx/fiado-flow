import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  onClear?: () => void;
}

export const QuickSearch = ({
  value,
  onChange,
  placeholder = 'Buscar cliente...',
  className,
  autoFocus = false,
  onClear,
}: QuickSearchProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleClear = useCallback(() => {
    onChange('');
    onClear?.();
    inputRef.current?.focus();
  }, [onChange, onClear]);

  // Atajo de teclado: / para buscar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if (e.key === 'Escape' && isFocused) {
        inputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused]);

  return (
    <div
      className={cn(
        "relative flex items-center transition-all duration-200",
        isFocused && "scale-[1.02]",
        className
      )}
    >
      <div
        className={cn(
          "absolute inset-y-0 left-3 flex items-center pointer-events-none transition-colors",
          isFocused ? "text-primary" : "text-zinc-400"
        )}
      >
        <Search className="w-5 h-5" />
      </div>

      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={cn(
          "w-full pl-10 pr-10 py-3 rounded-2xl border-2 transition-all duration-200",
          "bg-white text-zinc-900 placeholder:text-zinc-400",
          "focus:outline-none focus:ring-0",
          isFocused 
            ? "border-primary shadow-lg shadow-primary/10" 
            : "border-zinc-200 hover:border-zinc-300"
        )}
      />

      {/* Indicador de atajo */}
      {!value && !isFocused && (
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:block">
          <span className="bg-zinc-100 text-zinc-500 text-xs px-2 py-1 rounded-md border border-zinc-200">
            /
          </span>
        </kbd>
      )}

      {/* Botón limpiar */}
      {value && (
        <button
          onClick={handleClear}
          className={cn(
            "absolute right-3 top-1/2 -translate-y-1/2",
            "w-6 h-6 flex items-center justify-center rounded-full",
            "bg-zinc-100 hover:bg-zinc-200 text-zinc-500 transition-colors"
          )}
        >
          <X className="w-4 h-4" />
        </button>
      )}

      {/* Indicador de búsqueda por voz (placeholder) */}
      {isFocused && !value && (
        <div className="absolute -bottom-8 left-0 right-0 flex justify-center">
          <span className="text-xs text-zinc-400 bg-zinc-50 px-3 py-1 rounded-full">
            Escribe para buscar o presiona ESC para cerrar
          </span>
        </div>
      )}
    </div>
  );
};
