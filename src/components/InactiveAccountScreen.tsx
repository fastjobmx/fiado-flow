import { AlertTriangle, Phone, MessageCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const ADMIN_WHATSAPP = '+573001234567'; // Replace with actual admin number

export const InactiveAccountScreen = () => {
  const { signOut } = useAuth();

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      `Hola, mi cuenta de Fiado Friendly está inactiva. Quisiera información para reactivarla.`
    );
    window.open(`https://wa.me/${ADMIN_WHATSAPP.replace(/\+/g, '')}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl">Cuenta Inactiva</CardTitle>
          <CardDescription className="text-base">
            Tu cuenta ha sido suspendida por falta de pago del mantenimiento mensual.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-foreground">¿Cómo reactivar tu cuenta?</h3>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Realiza el pago del mantenimiento pendiente</li>
              <li>Envía el comprobante por WhatsApp</li>
              <li>Tu cuenta será reactivada en menos de 24 horas</li>
            </ol>
          </div>

          <div className="space-y-2">
            <Button 
              className="w-full gap-2" 
              size="lg"
              onClick={handleWhatsAppContact}
            >
              <MessageCircle className="w-5 h-5" />
              Contactar por WhatsApp
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={signOut}
            >
              <LogOut className="w-5 h-5" />
              Cerrar Sesión
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Si crees que esto es un error, contáctanos para verificar tu estado de pago.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
