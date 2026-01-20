import { useState, useRef } from 'react';
import { X, Store, Upload, Palette, Image, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type BrandingColors, PREDEFINED_THEMES } from '@/hooks/useProfile';

interface ProfileSettingsProps {
  currentStoreName: string;
  currentLogoUrl: string | null;
  currentColors: BrandingColors;
  activeTheme: string;
  onSaveName: (storeName: string) => void;
  onUploadLogo: (file: File) => Promise<string | null>;
  onSaveTheme: (themeId: string, colors: BrandingColors) => void;
  onSaveColors: (colors: BrandingColors) => void;
  onClose: () => void;
}

export const ProfileSettings = ({
  currentStoreName,
  currentLogoUrl,
  currentColors,
  activeTheme,
  onSaveName,
  onUploadLogo,
  onSaveTheme,
  onSaveColors,
  onClose,
}: ProfileSettingsProps) => {
  const [storeName, setStoreName] = useState(currentStoreName);
  const [selectedTheme, setSelectedTheme] = useState(activeTheme);
  const [customColors, setCustomColors] = useState<BrandingColors>(currentColors);
  const [logoPreview, setLogoPreview] = useState<string | null>(currentLogoUrl);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (storeName.trim()) {
      onSaveName(storeName.trim());
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    setIsUploading(true);
    await onUploadLogo(file);
    setIsUploading(false);
  };

  const handleThemeSelect = (themeId: string) => {
    setSelectedTheme(themeId);
    const theme = PREDEFINED_THEMES.find(t => t.id === themeId);
    if (theme && themeId !== 'custom') {
      onSaveTheme(themeId, theme.colors);
    }
  };

  const handleColorChange = (key: keyof BrandingColors, value: string) => {
    setCustomColors(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveCustomColors = () => {
    setSelectedTheme('custom');
    onSaveColors(customColors);
  };

  const getPreviewColors = (): BrandingColors => {
    if (selectedTheme === 'custom') {
      return customColors;
    }
    const theme = PREDEFINED_THEMES.find(t => t.id === selectedTheme);
    return theme?.colors || currentColors;
  };

  const previewColors = getPreviewColors();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-card rounded-2xl p-6 w-full max-w-md shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Configuración</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="general" className="text-xs">
              <Store className="w-3 h-3 mr-1" />
              General
            </TabsTrigger>
            <TabsTrigger value="logo" className="text-xs">
              <Image className="w-3 h-3 mr-1" />
              Logo
            </TabsTrigger>
            <TabsTrigger value="colors" className="text-xs">
              <Palette className="w-3 h-3 mr-1" />
              Temas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <form onSubmit={handleNameSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Nombre de tu tienda</Label>
                <Input
                  id="storeName"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="Ej: Tienda Don José"
                  className="h-12"
                />
              </div>
              <Button type="submit" className="w-full" disabled={!storeName.trim()}>
                Guardar nombre
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="logo">
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted">
                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Este logo aparecerá en recibos y cuando compartas con clientes
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="w-4 h-4 mr-2" />
                {isUploading ? 'Subiendo...' : 'Subir logo'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="colors">
            <div className="space-y-4">
              {/* Predefined Themes */}
              <div className="space-y-2">
                <Label>Temas predefinidos</Label>
                <div className="grid grid-cols-3 gap-2">
                  {PREDEFINED_THEMES.filter(t => t.id !== 'custom').map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeSelect(theme.id)}
                      className={`relative p-3 rounded-xl border-2 transition-all ${
                        selectedTheme === theme.id
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50'
                      }`}
                      style={{ backgroundColor: theme.colors.background_color }}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex gap-1">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: theme.colors.primary_color }}
                          />
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: theme.colors.secondary_color }}
                          />
                        </div>
                        <span
                          className="text-xs font-medium"
                          style={{ color: theme.colors.text_color }}
                        >
                          {theme.name}
                        </span>
                      </div>
                      {selectedTheme === theme.id && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Colors Section */}
              <div className="pt-4 border-t border-border">
                <Label className="mb-3 block">Personalizar colores</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="primary" className="text-xs">Primario</Label>
                    <div className="flex gap-1">
                      <Input
                        id="primary"
                        type="color"
                        value={customColors.primary_color}
                        onChange={(e) => handleColorChange('primary_color', e.target.value)}
                        className="w-10 h-8 p-0.5 cursor-pointer"
                      />
                      <Input
                        value={customColors.primary_color}
                        onChange={(e) => handleColorChange('primary_color', e.target.value)}
                        className="flex-1 h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="secondary" className="text-xs">Secundario</Label>
                    <div className="flex gap-1">
                      <Input
                        id="secondary"
                        type="color"
                        value={customColors.secondary_color}
                        onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                        className="w-10 h-8 p-0.5 cursor-pointer"
                      />
                      <Input
                        value={customColors.secondary_color}
                        onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                        className="flex-1 h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="background" className="text-xs">Fondo</Label>
                    <div className="flex gap-1">
                      <Input
                        id="background"
                        type="color"
                        value={customColors.background_color}
                        onChange={(e) => handleColorChange('background_color', e.target.value)}
                        className="w-10 h-8 p-0.5 cursor-pointer"
                      />
                      <Input
                        value={customColors.background_color}
                        onChange={(e) => handleColorChange('background_color', e.target.value)}
                        className="flex-1 h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="text" className="text-xs">Texto</Label>
                    <div className="flex gap-1">
                      <Input
                        id="text"
                        type="color"
                        value={customColors.text_color}
                        onChange={(e) => handleColorChange('text_color', e.target.value)}
                        className="w-10 h-8 p-0.5 cursor-pointer"
                      />
                      <Input
                        value={customColors.text_color}
                        onChange={(e) => handleColorChange('text_color', e.target.value)}
                        className="flex-1 h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div
                  className="p-3 rounded-xl border mt-3"
                  style={{
                    backgroundColor: previewColors.background_color,
                    borderColor: previewColors.primary_color,
                  }}
                >
                  <p className="text-xs mb-2" style={{ color: previewColors.text_color }}>
                    Vista previa
                  </p>
                  <div className="flex gap-2">
                    <div
                      className="px-2 py-1 rounded-lg text-white text-xs"
                      style={{ backgroundColor: previewColors.primary_color }}
                    >
                      Primario
                    </div>
                    <div
                      className="px-2 py-1 rounded-lg text-white text-xs"
                      style={{ backgroundColor: previewColors.secondary_color }}
                    >
                      Secundario
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveCustomColors} className="w-full mt-3">
                  Guardar colores personalizados
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
