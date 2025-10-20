import ExcelJS from 'exceljs';
import { createObjectCsvWriter } from 'csv-writer';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import { prisma } from '../lib/prisma';

export interface ReportOptions {
  format: 'excel' | 'csv' | 'pdf';
  tenantId: string;
}

export interface EventStatsReportOptions extends ReportOptions {
  eventId: string;
}

export interface PaymentHistoryReportOptions extends ReportOptions {
  eventId?: string;
  startDate?: string;
  endDate?: string;
}

export interface UserPaymentReportOptions extends ReportOptions {
  userId: string;
}

/**
 * Generate Event Statistics Report
 */
export async function generateEventStatsReport(options: EventStatsReportOptions): Promise<Buffer> {
  const { eventId, tenantId, format } = options;

  // Fetch event data
  const event = await prisma.event.findFirst({
    where: { id: eventId, tenantId },
    include: {
      payments: {
        select: {
          id: true,
          amount: true,
          paymentMethod: true,
          status: true,
          createdAt: true,
          user: {
            select: {
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!event) {
    throw new Error('Event not found');
  }

  // Calculate statistics
  const completedPayments = event.payments.filter((p) => p.status === 'COMPLETED');
  const totalRevenue = completedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalTransactions = completedPayments.length;
  const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Group revenue by hour
  const revenueByHour: Record<number, number> = {};
  completedPayments.forEach((payment) => {
    const hour = new Date(payment.createdAt).getHours();
    revenueByHour[hour] = (revenueByHour[hour] || 0) + Number(payment.amount);
  });

  // Group by payment method
  const paymentMethodStats: Record<string, number> = {};
  completedPayments.forEach((payment) => {
    const method = payment.paymentMethod || 'UNKNOWN';
    paymentMethodStats[method] = (paymentMethodStats[method] || 0) + 1;
  });

  const reportData = {
    event,
    stats: {
      totalRevenue,
      totalTransactions,
      avgTransaction,
      revenueByHour,
      paymentMethodStats,
    },
    payments: completedPayments,
  };

  switch (format) {
    case 'excel':
      return generateEventStatsExcel(reportData);
    case 'csv':
      return generateEventStatsCSV(reportData);
    case 'pdf':
      return generateEventStatsPDF(reportData);
    default:
      throw new Error('Invalid format');
  }
}

/**
 * Generate All Events Summary Report
 */
export async function generateAllEventsSummaryReport(options: ReportOptions): Promise<Buffer> {
  const { tenantId, format } = options;

  const events = await prisma.event.findMany({
    where: { tenantId },
    include: {
      _count: {
        select: { payments: true },
      },
      payments: {
        where: { status: 'COMPLETED' },
        select: { amount: true },
      },
    },
    orderBy: { startDate: 'desc' },
  });

  const eventsData = events.map((event) => {
    const totalRevenue = event.payments.reduce((sum, p) => sum + Number(p.amount), 0);
    return {
      id: event.id,
      name: event.name,
      location: event.location,
      status: event.status,
      startDate: event.startDate,
      endDate: event.endDate,
      capacity: event.capacity,
      totalPayments: event._count.payments,
      totalRevenue,
    };
  });

  switch (format) {
    case 'excel':
      return generateAllEventsExcel(eventsData);
    case 'csv':
      return generateAllEventsCSV(eventsData);
    case 'pdf':
      return generateAllEventsPDF(eventsData);
    default:
      throw new Error('Invalid format');
  }
}

/**
 * Generate Payment History Report
 */
export async function generatePaymentHistoryReport(options: PaymentHistoryReportOptions): Promise<Buffer> {
  const { tenantId, eventId, startDate, endDate, format } = options;

  const where: any = {
    event: { tenantId },
  };

  if (eventId) {
    where.eventId = eventId;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const payments = await prisma.payment.findMany({
    where,
    include: {
      user: {
        select: {
          email: true,
          firstName: true,
          lastName: true,
        },
      },
      event: {
        select: {
          name: true,
          location: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  switch (format) {
    case 'excel':
      return generatePaymentHistoryExcel(payments);
    case 'csv':
      return generatePaymentHistoryCSV(payments);
    case 'pdf':
      return generatePaymentHistoryPDF(payments);
    default:
      throw new Error('Invalid format');
  }
}

/**
 * Generate User Payment Report
 */
export async function generateUserPaymentReport(options: UserPaymentReportOptions): Promise<Buffer> {
  const { userId, tenantId, format } = options;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      payments: {
        where: {
          event: { tenantId },
        },
        include: {
          event: {
            select: {
              name: true,
              location: true,
              startDate: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const completedPayments = user.payments.filter((p) => p.status === 'COMPLETED');
  const totalSpent = completedPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const totalTransactions = completedPayments.length;
  const avgTransaction = totalTransactions > 0 ? totalSpent / totalTransactions : 0;

  const reportData = {
    user,
    stats: {
      totalSpent,
      totalTransactions,
      avgTransaction,
    },
    payments: user.payments,
  };

  switch (format) {
    case 'excel':
      return generateUserPaymentExcel(reportData);
    case 'csv':
      return generateUserPaymentCSV(reportData);
    case 'pdf':
      return generateUserPaymentPDF(reportData);
    default:
      throw new Error('Invalid format');
  }
}

// ==================== EXCEL GENERATORS ====================

async function generateEventStatsExcel(data: any): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Event Statistics');

  // Header
  sheet.mergeCells('A1:D1');
  sheet.getCell('A1').value = `Event Statistics: ${data.event.name}`;
  sheet.getCell('A1').font = { size: 16, bold: true };
  sheet.getCell('A1').alignment = { horizontal: 'center' };

  // Event info
  sheet.addRow([]);
  sheet.addRow(['Event Name:', data.event.name]);
  sheet.addRow(['Location:', data.event.location]);
  sheet.addRow(['Start Date:', new Date(data.event.startDate).toLocaleString()]);
  sheet.addRow(['End Date:', new Date(data.event.endDate).toLocaleString()]);
  sheet.addRow(['Status:', data.event.status]);
  sheet.addRow(['Capacity:', data.event.capacity || 'Unlimited']);

  // Summary stats
  sheet.addRow([]);
  sheet.addRow(['Summary Statistics']);
  sheet.addRow(['Total Revenue:', `€${data.stats.totalRevenue.toFixed(2)}`]);
  sheet.addRow(['Total Transactions:', data.stats.totalTransactions]);
  sheet.addRow(['Average Transaction:', `€${data.stats.avgTransaction.toFixed(2)}`]);

  // Payment methods
  sheet.addRow([]);
  sheet.addRow(['Payment Methods Distribution']);
  sheet.addRow(['Method', 'Count']);
  Object.entries(data.stats.paymentMethodStats).forEach(([method, count]) => {
    sheet.addRow([method, count]);
  });

  // Revenue by hour
  sheet.addRow([]);
  sheet.addRow(['Hourly Revenue']);
  sheet.addRow(['Hour', 'Revenue (€)']);
  for (let hour = 0; hour < 24; hour++) {
    const revenue = data.stats.revenueByHour[hour] || 0;
    if (revenue > 0) {
      sheet.addRow([`${hour}:00`, revenue.toFixed(2)]);
    }
  }

  // Transactions detail
  const transactionsSheet = workbook.addWorksheet('Transactions');
  transactionsSheet.addRow(['Date', 'User', 'Email', 'Amount (€)', 'Method', 'Status']);
  data.payments.forEach((payment: any) => {
    transactionsSheet.addRow([
      new Date(payment.createdAt).toLocaleString(),
      `${payment.user.firstName || ''} ${payment.user.lastName || ''}`.trim() || 'N/A',
      payment.user.email,
      payment.amount.toFixed(2),
      payment.paymentMethod,
      payment.status,
    ]);
  });

  // Auto-fit columns
  sheet.columns.forEach((column) => {
    if (column) {
      column.width = 20;
    }
  });
  transactionsSheet.columns.forEach((column) => {
    if (column) {
      column.width = 20;
    }
  });

  return await workbook.xlsx.writeBuffer() as Buffer;
}

async function generateAllEventsExcel(events: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Events Summary');

  // Header
  sheet.addRow(['Event Name', 'Location', 'Status', 'Start Date', 'End Date', 'Capacity', 'Total Payments', 'Total Revenue (€)']);

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD3D3D3' },
  };

  // Data
  events.forEach((event) => {
    sheet.addRow([
      event.name,
      event.location,
      event.status,
      new Date(event.startDate).toLocaleDateString(),
      new Date(event.endDate).toLocaleDateString(),
      event.capacity || 'Unlimited',
      event.totalPayments,
      event.totalRevenue.toFixed(2),
    ]);
  });

  // Auto-fit columns
  sheet.columns.forEach((column) => {
    if (column) {
      column.width = 20;
    }
  });

  return await workbook.xlsx.writeBuffer() as Buffer;
}

async function generatePaymentHistoryExcel(payments: any[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Payment History');

  // Header
  sheet.addRow(['Date', 'Event', 'Location', 'User', 'Email', 'Amount (€)', 'Method', 'Status']);

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFD3D3D3' },
  };

  // Data
  payments.forEach((payment) => {
    sheet.addRow([
      new Date(payment.createdAt).toLocaleString(),
      payment.event.name,
      payment.event.location,
      `${payment.user.firstName || ''} ${payment.user.lastName || ''}`.trim() || 'N/A',
      payment.user.email,
      payment.amount.toFixed(2),
      payment.paymentMethod,
      payment.status,
    ]);
  });

  // Auto-fit columns
  sheet.columns.forEach((column) => {
    if (column) {
      column.width = 20;
    }
  });

  return await workbook.xlsx.writeBuffer() as Buffer;
}

async function generateUserPaymentExcel(data: any): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('User Payment Report');

  // Header
  sheet.mergeCells('A1:D1');
  sheet.getCell('A1').value = 'User Payment Report';
  sheet.getCell('A1').font = { size: 16, bold: true };
  sheet.getCell('A1').alignment = { horizontal: 'center' };

  // User info
  sheet.addRow([]);
  sheet.addRow(['Email:', data.user.email]);
  sheet.addRow(['Name:', `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() || 'N/A']);

  // Summary stats
  sheet.addRow([]);
  sheet.addRow(['Summary Statistics']);
  sheet.addRow(['Total Spent:', `€${data.stats.totalSpent.toFixed(2)}`]);
  sheet.addRow(['Total Transactions:', data.stats.totalTransactions]);
  sheet.addRow(['Average Transaction:', `€${data.stats.avgTransaction.toFixed(2)}`]);

  // Transactions
  sheet.addRow([]);
  sheet.addRow(['Date', 'Event', 'Amount (€)', 'Method', 'Status']);
  data.payments.forEach((payment: any) => {
    sheet.addRow([
      new Date(payment.createdAt).toLocaleString(),
      payment.event.name,
      payment.amount.toFixed(2),
      payment.paymentMethod,
      payment.status,
    ]);
  });

  // Auto-fit columns
  sheet.columns.forEach((column) => {
    if (column) {
      column.width = 20;
    }
  });

  return await workbook.xlsx.writeBuffer() as Buffer;
}

// ==================== CSV GENERATORS ====================

async function generateEventStatsCSV(data: any): Promise<Buffer> {
  const rows: any[] = [];

  // Summary stats
  rows.push({ type: 'Event Info', key: 'Name', value: data.event.name });
  rows.push({ type: 'Event Info', key: 'Location', value: data.event.location });
  rows.push({ type: 'Event Info', key: 'Status', value: data.event.status });
  rows.push({ type: 'Event Info', key: 'Start Date', value: new Date(data.event.startDate).toLocaleString() });
  rows.push({ type: 'Event Info', key: 'End Date', value: new Date(data.event.endDate).toLocaleString() });
  rows.push({ type: 'Stats', key: 'Total Revenue', value: `€${data.stats.totalRevenue.toFixed(2)}` });
  rows.push({ type: 'Stats', key: 'Total Transactions', value: data.stats.totalTransactions });
  rows.push({ type: 'Stats', key: 'Avg Transaction', value: `€${data.stats.avgTransaction.toFixed(2)}` });

  const csvContent = [
    'Type,Key,Value',
    ...rows.map(row => `${row.type},${row.key},${row.value}`),
    '',
    'Transactions',
    'Date,User,Email,Amount (€),Method,Status',
    ...data.payments.map((p: any) =>
      `${new Date(p.createdAt).toLocaleString()},"${p.user.firstName || ''} ${p.user.lastName || ''}".trim() || 'N/A',${p.user.email},${p.amount.toFixed(2)},${p.paymentMethod},${p.status}`
    ),
  ].join('\n');

  return Buffer.from(csvContent, 'utf-8');
}

async function generateAllEventsCSV(events: any[]): Promise<Buffer> {
  const csvContent = [
    'Event Name,Location,Status,Start Date,End Date,Capacity,Total Payments,Total Revenue (€)',
    ...events.map(event =>
      `"${event.name}",${event.location},${event.status},${new Date(event.startDate).toLocaleDateString()},${new Date(event.endDate).toLocaleDateString()},${event.capacity || 'Unlimited'},${event.totalPayments},${event.totalRevenue.toFixed(2)}`
    ),
  ].join('\n');

  return Buffer.from(csvContent, 'utf-8');
}

async function generatePaymentHistoryCSV(payments: any[]): Promise<Buffer> {
  const csvContent = [
    'Date,Event,Location,User,Email,Amount (€),Method,Status',
    ...payments.map(p =>
      `${new Date(p.createdAt).toLocaleString()},"${p.event.name}",${p.event.location},"${p.user.firstName || ''} ${p.user.lastName || ''}".trim() || 'N/A',${p.user.email},${p.amount.toFixed(2)},${p.paymentMethod},${p.status}`
    ),
  ].join('\n');

  return Buffer.from(csvContent, 'utf-8');
}

async function generateUserPaymentCSV(data: any): Promise<Buffer> {
  const rows: any[] = [];

  rows.push({ type: 'User Info', key: 'Email', value: data.user.email });
  rows.push({ type: 'User Info', key: 'Name', value: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() || 'N/A' });
  rows.push({ type: 'Stats', key: 'Total Spent', value: `€${data.stats.totalSpent.toFixed(2)}` });
  rows.push({ type: 'Stats', key: 'Total Transactions', value: data.stats.totalTransactions });
  rows.push({ type: 'Stats', key: 'Avg Transaction', value: `€${data.stats.avgTransaction.toFixed(2)}` });

  const csvContent = [
    'Type,Key,Value',
    ...rows.map(row => `${row.type},${row.key},${row.value}`),
    '',
    'Transactions',
    'Date,Event,Amount (€),Method,Status',
    ...data.payments.map((p: any) =>
      `${new Date(p.createdAt).toLocaleString()},"${p.event.name}",${p.amount.toFixed(2)},${p.paymentMethod},${p.status}`
    ),
  ].join('\n');

  return Buffer.from(csvContent, 'utf-8');
}

// ==================== PDF GENERATORS ====================

async function generateEventStatsPDF(data: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).text('Event Statistics Report', { align: 'center' });
    doc.moveDown();

    // Event Info
    doc.fontSize(16).text('Event Information', { underline: true });
    doc.fontSize(12);
    doc.text(`Name: ${data.event.name}`);
    doc.text(`Location: ${data.event.location}`);
    doc.text(`Status: ${data.event.status}`);
    doc.text(`Start: ${new Date(data.event.startDate).toLocaleString()}`);
    doc.text(`End: ${new Date(data.event.endDate).toLocaleString()}`);
    doc.text(`Capacity: ${data.event.capacity || 'Unlimited'}`);
    doc.moveDown();

    // Summary Stats
    doc.fontSize(16).text('Summary Statistics', { underline: true });
    doc.fontSize(12);
    doc.text(`Total Revenue: €${data.stats.totalRevenue.toFixed(2)}`);
    doc.text(`Total Transactions: ${data.stats.totalTransactions}`);
    doc.text(`Average Transaction: €${data.stats.avgTransaction.toFixed(2)}`);
    doc.moveDown();

    // Payment Methods
    doc.fontSize(16).text('Payment Methods', { underline: true });
    doc.fontSize(12);
    Object.entries(data.stats.paymentMethodStats).forEach(([method, count]) => {
      doc.text(`${method}: ${count}`);
    });
    doc.moveDown();

    // Footer
    doc.fontSize(10).text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });

    doc.end();
  });
}

async function generateAllEventsPDF(events: any[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).text('All Events Summary Report', { align: 'center' });
    doc.moveDown();

    // Events
    doc.fontSize(12);
    events.forEach((event, index) => {
      if (index > 0) doc.moveDown();
      doc.fontSize(14).text(`${event.name}`, { underline: true });
      doc.fontSize(10);
      doc.text(`Location: ${event.location}`);
      doc.text(`Status: ${event.status}`);
      doc.text(`Start: ${new Date(event.startDate).toLocaleDateString()}`);
      doc.text(`Total Payments: ${event.totalPayments}`);
      doc.text(`Total Revenue: €${event.totalRevenue.toFixed(2)}`);
    });

    doc.moveDown();
    doc.fontSize(10).text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });

    doc.end();
  });
}

async function generatePaymentHistoryPDF(payments: any[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).text('Payment History Report', { align: 'center' });
    doc.moveDown();

    // Payments
    doc.fontSize(10);
    payments.forEach((payment, index) => {
      if (index > 0 && index % 20 === 0) {
        doc.addPage();
      }

      doc.fontSize(12).text(`Payment #${index + 1}`, { underline: true });
      doc.fontSize(10);
      doc.text(`Date: ${new Date(payment.createdAt).toLocaleString()}`);
      doc.text(`Event: ${payment.event.name} (${payment.event.location})`);
      doc.text(`User: ${payment.user.email}`);
      doc.text(`Amount: €${payment.amount.toFixed(2)}`);
      doc.text(`Method: ${payment.paymentMethod} | Status: ${payment.status}`);
      doc.moveDown(0.5);
    });

    doc.moveDown();
    doc.fontSize(10).text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });

    doc.end();
  });
}

async function generateUserPaymentPDF(data: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).text('User Payment Report', { align: 'center' });
    doc.moveDown();

    // User Info
    doc.fontSize(16).text('User Information', { underline: true });
    doc.fontSize(12);
    doc.text(`Email: ${data.user.email}`);
    doc.text(`Name: ${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() || 'N/A');
    doc.moveDown();

    // Summary Stats
    doc.fontSize(16).text('Summary Statistics', { underline: true });
    doc.fontSize(12);
    doc.text(`Total Spent: €${data.stats.totalSpent.toFixed(2)}`);
    doc.text(`Total Transactions: ${data.stats.totalTransactions}`);
    doc.text(`Average Transaction: €${data.stats.avgTransaction.toFixed(2)}`);
    doc.moveDown();

    // Transactions
    doc.fontSize(16).text('Transaction History', { underline: true });
    doc.fontSize(10);
    data.payments.forEach((payment: any, index: number) => {
      if (index > 0 && index % 15 === 0) {
        doc.addPage();
      }

      doc.text(`${new Date(payment.createdAt).toLocaleDateString()} - ${payment.event.name} - €${payment.amount.toFixed(2)} (${payment.status})`);
    });

    doc.moveDown();
    doc.fontSize(10).text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });

    doc.end();
  });
}