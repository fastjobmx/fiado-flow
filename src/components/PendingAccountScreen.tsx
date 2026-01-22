import { Clock, MessageCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const ADMIN_WHATSAPP = '+573001234567'; // Replace with actual admin number

export const PendingAccountScreen = () => {
  const { signOut } = useAuth();

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      `Hola, acabo de registrarme en Fiado Friendly. ¿Podrían activar mi cuenta?`
    );
    window.open(`https://wa.me/${ADMIN_WHATSAPP.replace(/\+/g, '')}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Cuenta Pendiente</CardTitle>
          <CardDescription className="text-base">
            ¡Gracias por registrarte! Tu cuenta está en proceso de activación.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h3 className="font-semibold text-foreground">¿Qué sigue?</h3>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Un administrador revisará tu solicitud</li>
              <li>Recibirás confirmación por email cuando se active</li>
              <li>Una vez activa, podrás comenzar a usar la app</li>
            </ol>
          </div>

          <div className="space-y-2">
            <Button 
              className="w-full gap-2" 
              size="lg"
              onClick={handleWhatsAppContact}
            >
              <MessageCircle className="w-5 h-5" />
              Contactar para Acelerar
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
            La activación suele tomar menos de 24 horas hábiles.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
