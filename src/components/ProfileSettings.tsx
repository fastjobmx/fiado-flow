// ============================================================================
// ARCHIVO 1: ProfileSettings.tsx - VERSIÓN MEJORADA
// ============================================================================
// Guarda este código en: src/components/ProfileSettings.tsx

import { useState, useRef, useEffect } from 'react';
import { X, Upload, Check, Palette, Store, Phone, MessageSquare, Copy, Eye, EyeOff, RefreshCw, Download, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';

type BrandingColors = {
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
};

const PREDEFINED_THEMES = [
  {
    id: 'light',
    name: 'Claro',
    colors: {
      primary_color: '#10B981',
      secondary_color: '#059669',
      background_color: '#F0FDF4',
      text_color: '#1F2937',
    },
  },
  {
    id: 'dark',
    name: 'Oscuro',
    colors: {
      primary_color: '#22C55E',
      secondary_color: '#16A34A',
      background_color: '#1A1A2E',
      text_color: '#E5E7EB',
    },
  },
  {
    id: 'nequi',
    name: 'Nequi',
    colors: {
      primary_color: '#DA0081',
      secondary_color: '#9B0060',
      background_color: '#FDF2F8',
      text_color: '#1F2937',
    },
  },
  {
    id: 'ocean',
    name: 'Océano',
    colors: {
      primary_color: '#0EA5E9',
      secondary_color: '#0284C7',
      background_color: '#F0F9FF',
      text_color: '#0F172A',
    },
  },
  {
    id: 'sunset',
    name: 'Atardecer',
    colors: {
      primary_color: '#F97316',
      secondary_color: '#EA580C',
      background_color: '#FFF7ED',
      text_color: '#1C1917',
    },
  },
  {
    id: 'purple',
    name: 'Púrpura',
    colors: {
      primary_color: '#A855F7',
      secondary_color: '#9333EA',
      background_color: '#FAF5FF',
      text_color: '#1F2937',
    },
  },
];

interface ProfileSettingsProps {
  currentStoreName: string;
  currentLogoUrl: string | null;
  currentColors: BrandingColors;
  activeTheme: string;
  onSaveName: (storeName: string) => Promise<void>;
  onUploadLogo: (file: File) => Promise<string | null>;
  onSaveTheme: (themeId: string, colors: BrandingColors) => Promise<void>;
  onSaveColors: (colors: BrandingColors) => Promise<void>;
  onClose: () => void;
  paymentContacts?: {
    whatsapp_number?: string;
    nequi_number?: string;
    daviplata_number?: string;
    payment_accounts?: any;
  };
  messageTemplates?: {
    message_template_reminder?: string;
    message_template_receipt?: string;
  };
  onSavePaymentContacts?: (contacts: any) => Promise<void>;
  onSaveMessageTemplates?: (templates: any) => Promise<void>;
}

const showToast = (message: string, type: 'success' | 'error' = 'success') => {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
    type === 'success' ? 'bg-green-500' : 'bg-red-500'
  } text-white font-medium transition-all duration-300 transform translate-x-0`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(0)';
  });
  
  setTimeout(() => {
    toast.style.transform = 'translateX(400px)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
};

export default function ProfileSettings({
  currentStoreName = "Mi Tienda",
  currentLogoUrl = null,
  currentColors = {
    primary_color: '#10B981',
    secondary_color: '#059669',
    background_color: '#F0FDF4',
    text_color: '#1F2937',
  },
  activeTheme = 'light',
  onSaveName,
  onUploadLogo,
  onSaveTheme,
  onSaveColors,
  onClose,
  paymentContacts,
  messageTemplates,
  onSavePaymentContacts,
  onSaveMessageTemplates,
}: Partial<ProfileSettingsProps> = {}) {
  const [storeName, setStoreName] = useState(currentStoreName);
  const [selectedTheme, setSelectedTheme] = useState(activeTheme);
  const [customColors, setCustomColors] = useState<BrandingColors>(currentColors);
  const [logoPreview, setLogoPreview] = useState<string | null>(currentLogoUrl);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [contacts, setContacts] = useState({
    whatsapp_number: paymentContacts?.whatsapp_number || '',
    nequi_number: paymentContacts?.nequi_number || '',
    daviplata_number: paymentContacts?.daviplata_number || '',
    payment_accounts: paymentContacts?.payment_accounts || [],
  });
  
  const [templates, setTemplates] = useState({
    message_template_reminder: messageTemplates?.message_template_reminder || 
      '¡Hola {customer_first_name}! Tienes un saldo pendiente de {amount}. Puedes pagar por Nequi {nequi}, Daviplata {daviplata}.',
    message_template_receipt: messageTemplates?.message_template_receipt || 
      'Recibo #{transaction_id} - {store_name}\nCliente: {customer_name}\nPago: {amount}\nFecha: {date}\nSaldo restante: {remaining}',
  });

  const [paymentAccountsInput, setPaymentAccountsInput] = useState(
    JSON.stringify(contacts.payment_accounts, null, 2)
  );

  const [showMessagePreview, setShowMessagePreview] = useState(false);

  // Detectar cambios no guardados
  useEffect(() => {
    const hasChanges = 
      storeName !== currentStoreName ||
      JSON.stringify(customColors) !== JSON.stringify(currentColors) ||
      selectedTheme !== activeTheme;
    setHasUnsavedChanges(hasChanges);
  }, [storeName, customColors, selectedTheme, currentStoreName, currentColors, activeTheme]);

  // Actualizar estados cuando cambien las props
  useEffect(() => {
    setStoreName(currentStoreName);
  }, [currentStoreName]);

  useEffect(() => {
    setLogoPreview(currentLogoUrl);
  }, [currentLogoUrl]);

  useEffect(() => {
    setSelectedTheme(activeTheme);
  }, [activeTheme]);

  useEffect(() => {
    setCustomColors(currentColors);
  }, [currentColors]);

  // Copiar al portapapeles
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast(`✓ ${label} copiado al portapapeles`);
    });
  };

  // Exportar configuración
  const exportConfig = () => {
    const config = {
      storeName,
      theme: selectedTheme,
      colors: customColors,
      contacts,
      templates,
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `config-${storeName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('✓ Configuración exportada');
  };

  // Resetear tema
  const resetTheme = () => {
    if (confirm('¿Estás seguro de resetear el tema al predeterminado?')) {
      const defaultTheme = PREDEFINED_THEMES[0];
      setSelectedTheme(defaultTheme.id);
      setCustomColors(defaultTheme.colors);
      showToast('✓ Tema reseteado');
    }
  };

  // Handlers
  const handleNameSubmit = async () => {
    if (!storeName.trim()) {
      showToast('El nombre de la tienda no puede estar vacío', 'error');
      return;
    }
    
    setIsSaving(true);
    try {
      if (onSaveName) {
        await onSaveName(storeName.trim());
        showToast('✓ Nombre guardado exitosamente');
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      showToast('Error al guardar el nombre', 'error');
      console.error('Error saving name:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('El archivo es muy grande. Máximo 5MB', 'error');
      return;
    }

    if (!file.type.startsWith('image/')) {
      showToast('Solo se permiten archivos de imagen', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);

    setIsUploading(true);
    try {
      if (onUploadLogo) {
        await onUploadLogo(file);
        showToast('✓ Logo subido exitosamente');
      }
    } catch (error) {
      showToast('Error al subir el logo', 'error');
      console.error('Error uploading logo:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    if (confirm('¿Estás seguro de eliminar el logo?')) {
      setLogoPreview(null);
      showToast('✓ Logo eliminado');
    }
  };

  const handleThemeSelect = async (themeId: string) => {
    setSelectedTheme(themeId);
    const theme = PREDEFINED_THEMES.find(t => t.id === themeId);
    if (theme && onSaveTheme) {
      setIsSaving(true);
      try {
        await onSaveTheme(themeId, theme.colors);
        setCustomColors(theme.colors);
        showToast('✓ Tema aplicado exitosamente');
        setHasUnsavedChanges(false);
      } catch (error) {
        showToast('Error al aplicar el tema', 'error');
        console.error('Error saving theme:', error);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleColorChange = (key: keyof BrandingColors, value: string) => {
    setCustomColors(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSaveCustomColors = async () => {
    setIsSaving(true);
    try {
      setSelectedTheme('custom');
      if (onSaveColors) {
        await onSaveColors(customColors);
        showToast('✓ Colores personalizados guardados');
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      showToast('Error al guardar colores', 'error');
      console.error('Error saving colors:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.slice(0, 10);
  };

  const handlePhoneChange = (field: 'whatsapp_number' | 'nequi_number' | 'daviplata_number', value: string) => {
    const formatted = formatPhone(value);
    setContacts(prev => ({ ...prev, [field]: formatted }));
  };

  const handlePaymentAccountsChange = (value: string) => {
    setPaymentAccountsInput(value);
    try {
      const parsed = JSON.parse(value || '[]');
      if (Array.isArray(parsed)) {
        setContacts(prev => ({ ...prev, payment_accounts: parsed }));
      }
    } catch {
      // Ignorar errores de parseo en tiempo real
    }
  };

  const handleSavePaymentContacts = async () => {
    try {
      const parsed = JSON.parse(paymentAccountsInput || '[]');
      if (!Array.isArray(parsed)) {
        showToast('El formato JSON debe ser un array', 'error');
        return;
      }
      
      const updatedContacts = { ...contacts, payment_accounts: parsed };
      
      setIsSaving(true);
      if (onSavePaymentContacts) {
        await onSavePaymentContacts(updatedContacts);
        showToast('✓ Información de pagos guardada');
      }
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        showToast('Error: JSON inválido en cuentas adicionales', 'error');
      } else {
        showToast('Error al guardar información de pagos', 'error');
        console.error('Error saving payment contacts:', error);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveMessageTemplates = async () => {
    if (!templates.message_template_reminder.trim() && !templates.message_template_receipt.trim()) {
      showToast('Ingresa al menos una plantilla', 'error');
      return;
    }

    setIsSaving(true);
    try {
      if (onSaveMessageTemplates) {
        await onSaveMessageTemplates(templates);
        showToast('✓ Plantillas de mensajes guardadas');
      }
    } catch (error) {
      showToast('Error al guardar plantillas', 'error');
      console.error('Error saving templates:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const getPreviewColors = (): BrandingColors => {
    if (selectedTheme === 'custom') return customColors;
    const theme = PREDEFINED_THEMES.find(t => t.id === selectedTheme);
    return theme?.colors || currentColors;
  };

  const previewColors = getPreviewColors();

  // Vista previa de mensajes
  const getMessagePreview = (template: string) => {
    return template
      .replace('{customer_first_name}', 'Juan')
      .replace('{customer_name}', 'Juan Pérez')
      .replace('{amount}', '$50,000')
      .replace('{nequi}', contacts.nequi_number || '300-123-4567')
      .replace('{daviplata}', contacts.daviplata_number || '300-123-4567')
      .replace('{store_name}', storeName)
      .replace('{transaction_id}', '12345')
      .replace('{date}', new Date().toLocaleDateString('es-CO'))
      .replace('{remaining}', '$20,000')
      .replace('{whatsapp}', contacts.whatsapp_number || '300-123-4567');
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (confirm('Tienes cambios sin guardar. ¿Estás seguro de salir?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Configuración de Perfil</h2>
            {hasUnsavedChanges && (
              <p className="text-sm text-orange-600 mt-1">● Tienes cambios sin guardar</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={exportConfig}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Exportar
            </Button>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <Tabs defaultValue="store" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="store" className="flex items-center gap-2">
                <Store className="w-4 h-4" />
                Tienda
              </TabsTrigger>
              <TabsTrigger value="theme" className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Tema
              </TabsTrigger>
              <TabsTrigger value="contacts" className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Contactos
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Mensajes
              </TabsTrigger>
            </TabsList>

            {/* Tab: Tienda */}
            <TabsContent value="store" className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">💡 Consejo</h3>
                <p className="text-sm text-blue-700">
                  Un nombre claro y un logo profesional generan más confianza en tus clientes.
                </p>
              </div>

              <div>
                <Label htmlFor="storeName" className="text-base font-semibold">
                  Nombre de la Tienda
                </Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="storeName"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Mi Tienda"
                    className="flex-1"
                  />
                  <Button
                    onClick={handleNameSubmit}
                    disabled={isSaving || !storeName.trim()}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              </div>

              <div>
                <Label className="text-base font-semibold">Logo de la Tienda</Label>
                <div className="mt-2 space-y-4">
                  {logoPreview && (
                    <div className="relative flex items-center justify-center p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="max-h-32 object-contain"
                      />
                      <button
                        onClick={handleRemoveLogo}
                        className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    variant="outline"
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? 'Subiendo...' : logoPreview ? 'Cambiar Logo' : 'Subir Logo'}
                  </Button>
                  <p className="text-sm text-gray-500">
                    Formatos aceptados: PNG, JPG, GIF (máx. 5MB)
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Tab: Tema */}
            <TabsContent value="theme" className="space-y-6">
              <div className="flex items-center justify-between bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div>
                  <h3 className="font-semibold text-purple-900">Vista Previa</h3>
                  <p className="text-sm text-purple-700">Muestra cómo se verá tu tienda</p>
                </div>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 text-purple-700 hover:text-purple-900"
                >
                  {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showPreview ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>

              <div className="flex justify-between items-center">
                <Label className="text-base font-semibold">
                  Temas Predefinidos
                </Label>
                <Button
                  onClick={resetTheme}
                  variant="ghost"
                  size="sm"
                  className="text-gray-600"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resetear
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {PREDEFINED_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeSelect(theme.id)}
                    className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                      selectedTheme === theme.id
                        ? 'border-blue-500 bg-blue-50 shadow-lg'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{theme.name}</span>
                      {selectedTheme === theme.id && (
                        <Check className="w-5 h-5 text-blue-500" />
                      )}
                    </div>
                    <div className="flex gap-1">
                      <div
                        className="w-6 h-6 rounded shadow-sm"
                        style={{ backgroundColor: theme.colors.primary_color }}
                      />
                      <div
                        className="w-6 h-6 rounded shadow-sm"
                        style={{ backgroundColor: theme.colors.secondary_color }}
                      />
                      <div
                        className="w-6 h-6 rounded border border-gray-300 shadow-sm"
                        style={{ backgroundColor: theme.colors.background_color }}
                      />
                    </div>
                  </button>
                ))}
              </div>

              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Colores Personalizados
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryColor" className="text-sm">Color Primario</Label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="color"
                        id="primaryColor"
                        value={customColors.primary_color}
                        onChange={(e) => handleColorChange('primary_color', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <Input
                        value={customColors.primary_color}
                        onChange={(e) => handleColorChange('primary_color', e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => copyToClipboard(customColors.primary_color, 'Color primario')}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondaryColor" className="text-sm">Color Secundario</Label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="color"
                        id="secondaryColor"
                        value={customColors.secondary_color}
                        onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <Input
                        value={customColors.secondary_color}
                        onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => copyToClipboard(customColors.secondary_color, 'Color secundario')}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="backgroundColor" className="text-sm">Color de Fondo</Label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="color"
                        id="backgroundColor"
                        value={customColors.background_color}
                        onChange={(e) => handleColorChange('background_color', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <Input
                        value={customColors.background_color}
                        onChange={(e) => handleColorChange('background_color', e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => copyToClipboard(customColors.background_color, 'Color de fondo')}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="textColor" className="text-sm">Color de Texto</Label>
                    <div className="flex gap-2 mt-1">
                      <input
                        type="color"
                        id="textColor"
                        value={customColors.text_color}
                        onChange={(e) => handleColorChange('text_color', e.target.value)}
                        className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                      />
                      <Input
                        value={customColors.text_color}
                        onChange={(e) => handleColorChange('text_color', e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => copyToClipboard(customColors.text_color, 'Color de texto')}
                        variant="outline"
                        size="sm"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={handleSaveCustomColors}
                  disabled={isSaving}
                  className="w-full mt-4"
                >
                  {isSaving ? 'Guardando...' : 'Aplicar Colores Personalizados'}
                </Button>
              </div>

              {/* Vista previa */}
              {showPreview && (
                <div>
                  <Label className="text-base font-semibold mb-3 block">Vista Previa</Label>
                  <div
                    className="p-6 rounded-lg border-2 shadow-lg transition-all"
                    style={{
                      backgroundColor: previewColors.background_color,
                      color: previewColors.text_color,
                    }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold">{storeName}</h3>
                      {logoPreview && (
                        <img src={logoPreview} alt="Logo" className="h-8 object-contain" />
                      )}
                    </div>
                    <p className="mb-4 opacity-80">Esta es una vista previa de cómo se verá tu tienda con los colores seleccionados.</p>
                    <div className="flex gap-2">
                      <button
                        className="px-4 py-2 rounded font-medium shadow-md hover:shadow-lg transition-all"
                        style={{ backgroundColor: previewColors.primary_color, color: 'white' }}
                      >
                        Botón Primario
                      </button>
                      <button
                        className="px-4 py-2 rounded font-medium shadow-md hover:shadow-lg transition-all"
                        style={{ backgroundColor: previewColors.secondary_color, color: 'white' }}
                      >
                        Botón Secundario
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Tab: Contactos */}
            <TabsContent value="contacts" className="space-y-6">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-900 mb-2">📱 Información de Contacto</h3>
                <p className="text-sm text-green-700">
                  Esta información se usará para generar mensajes automáticos de recordatorio y recibos.
                </p>
              </div>

              <div>
                <Label htmlFor="whatsapp" className="text-base font-semibold flex items-center gap-2">
                  WhatsApp
                  {contacts.whatsapp_number && (
                    <Button
                      onClick={() => copyToClipboard(contacts.whatsapp_number, 'WhatsApp')}
                      variant="ghost"
                      size="sm"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  )}
                </Label>
                <Input
                  id="whatsapp"
                  type="tel"
                  value={contacts.whatsapp_number}
                  onChange={(e) => handlePhoneChange('whatsapp_number', e.target.value)}
                  placeholder="3001234567"
                  maxLength={10}
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">Solo números, máx. 10 dígitos</p>
              </div>

              <div>
                <Label htmlFor="nequi" className="text-base font-semibold flex items-center gap-2">
                  Nequi
                  {contacts.nequi_number && (
                    <Button
                      onClick={() => copyToClipboard(contacts.nequi_number, 'Nequi')}
                      variant="ghost"
                      size="sm"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  )}
                </Label>
                <Input
                  id="nequi"
                  type="tel"
                  value={contacts.nequi_number}
                  onChange={(e) => handlePhoneChange('nequi_number', e.target.value)}
                  placeholder="3001234567"
                  maxLength={10}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="daviplata" className="text-base font-semibold flex items-center gap-2">
                  Daviplata
                  {contacts.daviplata_number && (
                    <Button
                      onClick={() => copyToClipboard(contacts.daviplata_number, 'Daviplata')}
                      variant="ghost"
                      size="sm"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  )}
                </Label>
                <Input
                  id="daviplata"
                  type="tel"
                  value={contacts.daviplata_number}
                  onChange={(e) => handlePhoneChange('daviplata_number', e.target.value)}
                  placeholder="3001234567"
                  maxLength={10}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="paymentAccounts" className="text-base font-semibold">
                  Cuentas Adicionales (JSON)
                </Label>
                <Textarea
                  id="paymentAccounts"
                  value={paymentAccountsInput}
                  onChange={(e) => handlePaymentAccountsChange(e.target.value)}
                  placeholder='[{"type": "banco", "name": "Bancolombia", "number": "123456789"}]'
                  className="mt-2 font-mono text-sm"
                  rows={6}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Formato: Array de objetos JSON con type, name, number
                </p>
              </div>

              <Button
                onClick={handleSavePaymentContacts}
                disabled={isSaving}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Guardando...' : 'Guardar Información de Pagos'}
              </Button>
            </TabsContent>

            {/* Tab: Mensajes */}
            <TabsContent value="messages" className="space-y-6">
              <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div>
                  <h3 className="font-semibold text-yellow-900">Vista Previa de Mensajes</h3>
                  <p className="text-sm text-yellow-700">Ve cómo se verán tus mensajes</p>
                </div>
                <button
                  onClick={() => setShowMessagePreview(!showMessagePreview)}
                  className="flex items-center gap-2 text-yellow-700 hover:text-yellow-900"
                >
                  {showMessagePreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showMessagePreview ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>

              <div>
                <Label htmlFor="reminderTemplate" className="text-base font-semibold">
                  Plantilla de Recordatorio
                </Label>
                <Textarea
                  id="reminderTemplate"
                  value={templates.message_template_reminder}
                  onChange={(e) => setTemplates(prev => ({
                    ...prev,
                    message_template_reminder: e.target.value
                  }))}
                  placeholder="¡Hola {customer_first_name}! Tienes un saldo pendiente de {amount}..."
                  className="mt-2"
                  rows={4}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Variables: {'{customer_first_name}'}, {'{amount}'}, {'{nequi}'}, {'{daviplata}'}, {'{store_name}'}
                </p>
                {showMessagePreview && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-semibold">Vista Previa:</Label>
                      <Button
                        onClick={() => copyToClipboard(getMessagePreview(templates.message_template_reminder), 'Mensaje')}
                        variant="ghost"
                        size="sm"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-sm whitespace-pre-wrap text-gray-700">
                      {getMessagePreview(templates.message_template_reminder)}
                    </p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="receiptTemplate" className="text-base font-semibold">
                  Plantilla de Recibo
                </Label>
                <Textarea
                  id="receiptTemplate"
                  value={templates.message_template_receipt}
                  onChange={(e) => setTemplates(prev => ({
                    ...prev,
                    message_template_receipt: e.target.value
                  }))}
                  placeholder="Recibo #{transaction_id}..."
                  className="mt-2"
                  rows={6}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Variables: {'{transaction_id}'}, {'{store_name}'}, {'{customer_name}'}, {'{amount}'}, {'{date}'}, {'{remaining}'}, {'{whatsapp}'}
                </p>
                {showMessagePreview && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <Label className="text-sm font-semibold">Vista Previa:</Label>
                      <Button
                        onClick={() => copyToClipboard(getMessagePreview(templates.message_template_receipt), 'Recibo')}
                        variant="ghost"
                        size="sm"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-sm whitespace-pre-wrap text-gray-700 font-mono">
                      {getMessagePreview(templates.message_template_receipt)}
                    </p>
                  </div>
                )}
              </div>

              <Button
                onClick={handleSaveMessageTemplates}
                disabled={isSaving}
                className="w-full"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Guardando...' : 'Guardar Plantillas'}
              </Button>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer con acciones rápidas */}
        <div className="border-t p-4 bg-gray-50 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {hasUnsavedChanges ? '⚠️ Cambios sin guardar' : '✓ Todo guardado'}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Exportación nombrada adicional
export { ProfileSettings };