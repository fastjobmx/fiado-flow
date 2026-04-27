import { useState, useRef } from 'react';
import { 
  Download, 
  Upload, 
  FileSpreadsheet, 
  X, 
  Users, 
  History,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Customer, Transaction } from '@/types/fiado';
import { 
  exportCustomersToExcel, 
  exportSingleCustomerToExcel,
  parseCustomersFromExcel,
  generateTemplateExcel,
  ImportCustomer
} from '@/lib/excel';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ExcelManagerProps {
  customers: Customer[];
  transactions: Transaction[];
  selectedCustomer?: Customer | null;
  onImportCustomers?: (customers: ImportCustomer[]) => Promise<void>;
  className?: string;
}

export const ExcelManager = ({
  customers,
  transactions,
  selectedCustomer,
  onImportCustomers,
  className,
}: ExcelManagerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{ success: number; errors: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleExportAll = () => {
    try {
      exportCustomersToExcel(customers, transactions);
      toast({
        title: 'Exportación exitosa',
        description: `Se exportaron ${customers.length} clientes y ${transactions.length} transacciones`,
      });
    } catch (error) {
      toast({
        title: 'Error al exportar',
        description: 'No se pudo generar el archivo Excel',
        variant: 'destructive',
      });
    }
  };

  const handleExportSingle = () => {
    if (!selectedCustomer) {
      toast({
        title: 'Selecciona un cliente',
        description: 'Debes seleccionar un cliente para exportar su historial',
        variant: 'destructive',
      });
      return;
    }

    try {
      exportSingleCustomerToExcel(selectedCustomer, transactions);
      toast({
        title: 'Exportación exitosa',
        description: `Historial de ${selectedCustomer.name} exportado`,
      });
    } catch (error) {
      toast({
        title: 'Error al exportar',
        description: 'No se pudo generar el archivo Excel',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadTemplate = () => {
    generateTemplateExcel();
    toast({
      title: 'Plantilla descargada',
      description: 'Usa esta plantilla para importar clientes',
    });
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast({
        title: 'Archivo inválido',
        description: 'Solo se permiten archivos Excel (.xlsx, .xls)',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    setImportProgress(0);
    setImportResult(null);

    try {
      const parsedCustomers = await parseCustomersFromExcel(file);
      
      if (parsedCustomers.length === 0) {
        toast({
          title: 'Archivo vacío',
          description: 'No se encontraron clientes en el archivo',
          variant: 'destructive',
        });
        setIsImporting(false);
        return;
      }

      // Simular progreso
      for (let i = 0; i <= 50; i += 10) {
        setImportProgress(i);
        await new Promise(r => setTimeout(r, 100));
      }

      if (onImportCustomers) {
        await onImportCustomers(parsedCustomers);
      }

      for (let i = 60; i <= 100; i += 10) {
        setImportProgress(i);
        await new Promise(r => setTimeout(r, 100));
      }

      setImportResult({ success: parsedCustomers.length, errors: 0 });
      
      toast({
        title: 'Importación completada',
        description: `Se importaron ${parsedCustomers.length} clientes exitosamente`,
      });

      // Limpiar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('[ExcelManager] Error importando:', error);
      toast({
        title: 'Error al importar',
        description: 'No se pudo procesar el archivo. Verifica el formato.',
        variant: 'destructive',
      });
      setImportResult({ success: 0, errors: 1 });
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className={cn(
          "gap-2 border-zinc-200 hover:bg-zinc-50",
          className
        )}
      >
        <FileSpreadsheet className="w-4 h-4 text-green-600" />
        <span>Excel</span>
      </Button>
    );
  }

  return (
    <div className={cn(
      "fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-4 animate-in fade-in",
      className
    )}>
      <div 
        className="bg-white w-full max-w-md rounded-[32px] overflow-hidden shadow-2xl animate-in slide-in-from-bottom-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900">Excel</h2>
              <p className="text-sm text-zinc-500">Importa o exporta datos</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Exportar Sección */}
          <div className="space-y-3">
            <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exportar Datos
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                onClick={handleExportAll}
                variant="outline"
                className="h-auto py-4 px-4 flex flex-col items-start gap-2 border-zinc-200 hover:border-green-200 hover:bg-green-50/50 transition-all"
              >
                <div className="flex items-center gap-2 w-full">
                  <Users className="w-5 h-5 text-green-600" />
                  <span className="font-bold text-zinc-900">Todos los clientes</span>
                </div>
                <span className="text-xs text-zinc-500 font-medium">
                  {customers.length} clientes + historial
                </span>
              </Button>

              <Button
                onClick={handleExportSingle}
                variant="outline"
                disabled={!selectedCustomer}
                className="h-auto py-4 px-4 flex flex-col items-start gap-2 border-zinc-200 hover:border-blue-200 hover:bg-blue-50/50 transition-all disabled:opacity-50"
              >
                <div className="flex items-center gap-2 w-full">
                  <History className="w-5 h-5 text-blue-600" />
                  <span className="font-bold text-zinc-900">Cliente seleccionado</span>
                </div>
                <span className="text-xs text-zinc-500 font-medium">
                  {selectedCustomer ? selectedCustomer.name : 'Ningún cliente seleccionado'}
                </span>
              </Button>
            </div>
          </div>

          {/* Importar Sección */}
          {onImportCustomers && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Importar Clientes
              </h3>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="space-y-3">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  variant="outline"
                  className="w-full h-auto py-4 px-4 flex items-center gap-3 border-zinc-200 hover:border-amber-200 hover:bg-amber-50/50 transition-all border-dashed"
                >
                  {isImporting ? (
                    <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
                  ) : (
                    <Upload className="w-5 h-5 text-amber-600" />
                  )}
                  <div className="text-left">
                    <span className="font-bold text-zinc-900 block">
                      {isImporting ? 'Importando...' : 'Seleccionar archivo Excel'}
                    </span>
                    <span className="text-xs text-zinc-500">.xlsx o .xls</span>
                  </div>
                </Button>

                {/* Progreso */}
                {isImporting && (
                  <div className="space-y-2">
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-amber-500 transition-all duration-300"
                        style={{ width: `${importProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-zinc-500 text-center">{importProgress}%</p>
                  </div>
                )}

                {/* Resultado */}
                {importResult && (
                  <div className={cn(
                    "flex items-center gap-2 p-3 rounded-xl text-sm",
                    importResult.errors > 0 
                      ? "bg-red-50 text-red-700" 
                      : "bg-green-50 text-green-700"
                  )}>
                    {importResult.errors > 0 ? (
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <CheckCircle className="w-4 h-4 flex-shrink-0" />
                    )}
                    <span>
                      {importResult.success} clientes importados
                      {importResult.errors > 0 && `, ${importResult.errors} errores`}
                    </span>
                  </div>
                )}

                <Button
                  onClick={handleDownloadTemplate}
                  variant="ghost"
                  className="w-full text-xs text-zinc-500 hover:text-zinc-900"
                >
                  Descargar plantilla de ejemplo
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100">
          <p className="text-xs text-zinc-500 text-center">
            Los archivos Excel incluyen todas las columnas necesarias para reimportar más tarde.
          </p>
        </div>
      </div>
    </div>
  );
};
