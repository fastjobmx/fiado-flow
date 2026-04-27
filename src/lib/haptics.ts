// Utilidades de feedback táctil (haptics) para mejorar la experiencia móvil

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const HAPTIC_PATTERNS: Record<HapticType, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [50, 100, 50],
  warning: [30, 50, 30],
  error: [100, 50, 100],
};

/**
 * Verifica si el dispositivo soporta vibración
 */
export const isHapticSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
};

/**
 * Activa el feedback táctil si está disponible
 */
export const haptic = (type: HapticType = 'light'): void => {
  if (!isHapticSupported()) return;
  
  const pattern = HAPTIC_PATTERNS[type];
  
  try {
    navigator.vibrate(pattern);
  } catch (e) {
    // Silenciar errores si la vibración falla
    console.debug('Haptic feedback failed:', e);
  }
};

/**
 * Feedback para interacciones táctiles comunes
 */
export const haptics = {
  tap: () => haptic('light'),
  press: () => haptic('medium'),
  confirm: () => haptic('success'),
  cancel: () => haptic('error'),
  warning: () => haptic('warning'),
};

/**
 * Hook para activar haptic feedback en eventos touch
 * Uso: <button onTouchStart={touchFeedback()}>Click me</button>
 */
export const touchFeedback = (type: HapticType = 'light') => {
  return () => haptic(type);
};
