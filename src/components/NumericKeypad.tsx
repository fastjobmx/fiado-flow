import { Delete, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

interface NumericKeypadProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  maxLength?: number;
  className?: string;
}

export const NumericKeypad = ({
  value,
  onChange,
  onSubmit,
  maxLength = 10,
  className,
}: NumericKeypadProps) => {
  const handlePress = (digit: string) => {
    haptic('light');
    
    if (digit === 'backspace') {
      onChange(value.slice(0, -1));
    } else if (digit === 'clear') {
      onChange('');
    } else if (digit === 'submit') {
      onSubmit?.();
    } else {
      if (value.length < maxLength) {
        onChange(value + digit);
      }
    }
  };

  const keys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['00', '0', 'backspace'],
  ];

  return (
    <div className={cn("select-none", className)}>
      {/* Display */}
      <div className="bg-zinc-100 rounded-2xl p-4 mb-4 text-center">
        <span className={cn(
          "text-3xl font-black tabular-nums",
          value ? "text-zinc-900" : "text-zinc-400"
        )}>
          {value ? `$ ${Number(value).toLocaleString('es-CO')}` : '$ 0'}
        </span>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-2">
        {keys.map((row, rowIndex) => (
          <div key={rowIndex} className="contents">
            {row.map((key) => (
              <button
                key={key}
                onClick={() => handlePress(key)}
                className={cn(
                  "h-16 rounded-2xl font-bold text-xl transition-all active:scale-95",
                  key === 'backspace'
                    ? "bg-zinc-200 text-zinc-700 flex items-center justify-center"
                    : "bg-white border-2 border-zinc-100 text-zinc-900 hover:bg-zinc-50"
                )}
                style={{
                  touchAction: 'manipulation',
                }}
              >
                {key === 'backspace' ? (
                  <Delete className="w-6 h-6" />
                ) : key === '00' ? (
                  <span className="text-lg">00</span>
                ) : (
                  key
                )}
              </button>
            ))}
          </div>
        ))}
        
        {/* Submit button (full width) */}
        {onSubmit && (
          <button
            onClick={() => handlePress('submit')}
            disabled={!value}
            className={cn(
              "col-span-3 h-14 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all",
              value
                ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
                : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
            )}
          >
            <Check className="w-5 h-5" />
            Confirmar
          </button>
        )}
      </div>
    </div>
  );
};
