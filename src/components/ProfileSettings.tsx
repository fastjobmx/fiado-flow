import { useState, useRef } from 'react';
import { X, Store, Upload, Palette, Image } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type BrandingColors } from '@/hooks/useProfile';

interface ProfileSettingsProps {
  currentStoreName: string;
  currentLogoUrl: string | null;
  currentColors: BrandingColors;
  onSaveName: (storeName: string) => void;
  onUploadLogo: (file: File) => Promise<string | null>;
  onSaveColors: (colors: BrandingColors) => void;
  onClose: () => void;
}

export const ProfileSettings = ({
  currentStoreName,
  currentLogoUrl,
  currentColors,
  onSaveName,
  onUploadLogo,
  onSaveColors,
  onClose,
}: ProfileSettingsProps) => {
  const [storeName, setStoreName] = useState(currentStoreName);
  const [colors, setColors] = useState<BrandingColors>(currentColors);
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

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setIsUploading(true);
    await onUploadLogo(file);
    setIsUploading(false);
  };

  const handleColorChange = (key: keyof BrandingColors, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveColors = () => {
    onSaveColors(colors);
  };

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
              Colores
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primary">Color primario</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primary"
                      type="color"
                      value={colors.primary_color}
                      onChange={(e) => handleColorChange('primary_color', e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={colors.primary_color}
                      onChange={(e) => handleColorChange('primary_color', e.target.value)}
                      className="flex-1 h-10 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary">Color secundario</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondary"
                      type="color"
                      value={colors.secondary_color}
                      onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={colors.secondary_color}
                      onChange={(e) => handleColorChange('secondary_color', e.target.value)}
                      className="flex-1 h-10 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="background">Color de fondo</Label>
                  <div className="flex gap-2">
                    <Input
                      id="background"
                      type="color"
                      value={colors.background_color}
                      onChange={(e) => handleColorChange('background_color', e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={colors.background_color}
                      onChange={(e) => handleColorChange('background_color', e.target.value)}
                      className="flex-1 h-10 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="text">Color de texto</Label>
                  <div className="flex gap-2">
                    <Input
                      id="text"
                      type="color"
                      value={colors.text_color}
                      onChange={(e) => handleColorChange('text_color', e.target.value)}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={colors.text_color}
                      onChange={(e) => handleColorChange('text_color', e.target.value)}
                      className="flex-1 h-10 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border" style={{ 
                backgroundColor: colors.background_color,
                borderColor: colors.primary_color 
              }}>
                <p className="text-sm mb-2" style={{ color: colors.text_color }}>
                  Vista previa de colores
                </p>
                <div className="flex gap-2">
                  <div 
                    className="px-3 py-1.5 rounded-lg text-white text-sm"
                    style={{ backgroundColor: colors.primary_color }}
                  >
                    Botón primario
                  </div>
                  <div 
                    className="px-3 py-1.5 rounded-lg text-white text-sm"
                    style={{ backgroundColor: colors.secondary_color }}
                  >
                    Secundario
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveColors} className="w-full">
                Guardar colores
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
