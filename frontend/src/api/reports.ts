// Reports API
// Functions for downloading reports in various formats

import { getAccessToken } from './index';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export type ReportFormat = 'excel' | 'csv' | 'pdf';

/**
 * Download a file from a blob
 */
function downloadFile(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Generic function to download a report
 */
async function downloadReport(endpoint: string, filename: string): Promise<void> {
  try {
    const token = getAccessToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to download report: ${response.statusText}`);
    }

    const blob = await response.blob();
    downloadFile(blob, filename);
  } catch (error) {
    console.error('Error downloading report:', error);
    throw error;
  }
}

/**
 * Export event statistics report
 * @param eventId - The ID of the event
 * @param format - The format of the report (excel, csv, pdf)
 */
export async function exportEventStats(eventId: string, format: ReportFormat = 'excel'): Promise<void> {
  const extensions = {
    excel: 'xlsx',
    csv: 'csv',
    pdf: 'pdf',
  };

  const filename = `event-stats-${eventId}.${extensions[format]}`;
  await downloadReport(`/reports/event-stats/${eventId}?format=${format}`, filename);
}

/**
 * Export all events summary report
 * @param format - The format of the report (excel, csv, pdf)
 */
export async function exportEventsSummary(format: ReportFormat = 'excel'): Promise<void> {
  const extensions = {
    excel: 'xlsx',
    csv: 'csv',
    pdf: 'pdf',
  };

  const filename = `events-summary.${extensions[format]}`;
  await downloadReport(`/reports/events-summary?format=${format}`, filename);
}

/**
 * Export payment history report
 * @param options - Filter options for the report
 * @param format - The format of the report (excel, csv, pdf)
 */
export async function exportPaymentHistory(
  options: {
    eventId?: string;
    startDate?: string;
    endDate?: string;
  } = {},
  format: ReportFormat = 'excel'
): Promise<void> {
  const extensions = {
    excel: 'xlsx',
    csv: 'csv',
    pdf: 'pdf',
  };

  const params = new URLSearchParams({ format });

  if (options.eventId) {
    params.append('eventId', options.eventId);
  }

  if (options.startDate) {
    params.append('startDate', options.startDate);
  }

  if (options.endDate) {
    params.append('endDate', options.endDate);
  }

  const filename = `payment-history.${extensions[format]}`;
  await downloadReport(`/reports/payments?${params.toString()}`, filename);
}

/**
 * Export user payment report
 * @param userId - The ID of the user
 * @param format - The format of the report (excel, csv, pdf)
 */
export async function exportUserPayments(userId: string, format: ReportFormat = 'excel'): Promise<void> {
  const extensions = {
    excel: 'xlsx',
    csv: 'csv',
    pdf: 'pdf',
  };

  const filename = `user-${userId}-payments.${extensions[format]}`;
  await downloadReport(`/reports/user/${userId}?format=${format}`, filename);
}