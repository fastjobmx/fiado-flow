import * as XLSX from 'xlsx';
import { Customer, Transaction } from '@/types/fiado';

export interface ExcelCustomer {
  ID: string;
  Nombre: string;
  Telefono: string;
  Total_Deuda: number;
  Fecha_Ultimo_Pago: string;
  Fecha_Creacion: string;
}

export interface ExcelTransaction {
  ID: string;
  Cliente_ID: string;
  Cliente_Nombre: string;
  Tipo: 'FIADO' | 'ABONO';
  Monto: number;
  Descripcion: string;
  Fecha: string;
}

export const exportCustomersToExcel = (
  customers: Customer[],
  transactions: Transaction[]
): void => {
  // Hoja 1: Clientes
  const customersData: ExcelCustomer[] = customers.map(c => ({
    ID: c.id,
    Nombre: c.name,
    Telefono: c.phone,
    Total_Deuda: c.totalDebt,
    Fecha_Ultimo_Pago: c.lastPaymentDate ? c.lastPaymentDate.toISOString() : 'Sin pagos',
    Fecha_Creacion: c.createdAt.toISOString(),
  }));

  const wsCustomers = XLSX.utils.json_to_sheet(customersData);
  
  // Ajustar anchos de columna
  wsCustomers['!cols'] = [
    { wch: 40 }, // ID
    { wch: 30 }, // Nombre
    { wch: 15 }, // Telefono
    { wch: 15 }, // Total_Deuda
    { wch: 25 }, // Fecha_Ultimo_Pago
    { wch: 25 }, // Fecha_Creacion
  ];

  // Hoja 2: Historial de Transacciones
  const transactionsData: ExcelTransaction[] = transactions.map(t => {
    const customer = customers.find(c => c.id === t.customerId);
    return {
      ID: t.id,
      Cliente_ID: t.customerId,
      Cliente_Nombre: customer?.name || 'Desconocido',
      Tipo: t.type === 'debt' ? 'FIADO' : 'ABONO',
      Monto: t.amount,
      Descripcion: t.description,
      Fecha: t.date.toISOString(),
    };
  });

  const wsTransactions = XLSX.utils.json_to_sheet(transactionsData);
  
  // Ajustar anchos de columna
  wsTransactions['!cols'] = [
    { wch: 40 }, // ID
    { wch: 40 }, // Cliente_ID
    { wch: 30 }, // Cliente_Nombre
    { wch: 10 }, // Tipo
    { wch: 15 }, // Monto
    { wch: 40 }, // Descripcion
    { wch: 25 }, // Fecha
  ];

  // Crear libro
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsCustomers, 'Clientes');
  XLSX.utils.book_append_sheet(wb, wsTransactions, 'Historial');

  // Generar nombre de archivo con fecha
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const fileName = `Fiado_Export_${dateStr}.xlsx`;

  // Descargar
  XLSX.writeFile(wb, fileName);
};

export const exportSingleCustomerToExcel = (
  customer: Customer,
  transactions: Transaction[]
): void => {
  // Hoja 1: Datos del Cliente
  const customerData = [{
    ID: customer.id,
    Nombre: customer.name,
    Telefono: customer.phone,
    Total_Deuda: customer.totalDebt,
    Fecha_Ultimo_Pago: customer.lastPaymentDate ? customer.lastPaymentDate.toISOString() : 'Sin pagos',
    Fecha_Creacion: customer.createdAt.toISOString(),
  }];

  const wsCustomer = XLSX.utils.json_to_sheet(customerData);
  wsCustomer['!cols'] = [
    { wch: 40 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 25 }
  ];

  // Hoja 2: Historial del Cliente
  const customerTransactions = transactions
    .filter(t => t.customerId === customer.id)
    .map(t => ({
      ID: t.id,
      Tipo: t.type === 'debt' ? 'FIADO' : 'ABONO',
      Monto: t.amount,
      Descripcion: t.description,
      Fecha: t.date.toISOString(),
    }));

  const wsHistory = XLSX.utils.json_to_sheet(customerTransactions);
  wsHistory['!cols'] = [
    { wch: 40 }, { wch: 10 }, { wch: 15 }, { wch: 40 }, { wch: 25 }
  ];

  // Crear libro
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsCustomer, 'Cliente');
  XLSX.utils.book_append_sheet(wb, wsHistory, 'Historial');

  // Generar nombre de archivo
  const fileName = `Cliente_${customer.name.replace(/\s+/g, '_')}.xlsx`;

  XLSX.writeFile(wb, fileName);
};

export interface ImportCustomer {
  name: string;
  phone: string;
  total_debt?: number;
}

export const parseCustomersFromExcel = (file: File): Promise<ImportCustomer[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          reject(new Error('No se pudo leer el archivo'));
          return;
        }

        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as any[];
        
        // Mapear columnas flexibles
        const customers: ImportCustomer[] = jsonData.map((row: any) => ({
          name: row.Nombre || row.nombre || row.NAME || row.Name || '',
          phone: row.Telefono || row.telefono || row.Phone || row.Teléfono || '',
          total_debt: row.Total_Deuda || row.Deuda || row.Deuda_Total || 0,
        })).filter(c => c.name.trim() !== '');

        resolve(customers);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Error al leer el archivo'));
    };

    reader.readAsBinaryString(file);
  });
};

export const generateTemplateExcel = (): void => {
  // Template vacío para importar clientes
  const templateData = [
    {
      Nombre: 'Juan Pérez',
      Telefono: '3001234567',
      Total_Deuda: 50000,
    },
    {
      Nombre: 'María García',
      Telefono: '3109876543',
      Total_Deuda: 0,
    },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  ws['!cols'] = [{ wch: 30 }, { wch: 15 }, { wch: 15 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');

  XLSX.writeFile(wb, 'Plantilla_Importar_Clientes.xlsx');
};
