import { localDb } from '@/lib/db/local';
import type { LocalDream, LocalInterpretation, LocalConversation, LocalSymbol } from '@/lib/db/local';

export interface ExportData {
  version: string;
  exportDate: string;
  dreams: LocalDream[];
  interpretations: LocalInterpretation[];
  conversations: LocalConversation[];
  symbols: LocalSymbol[];
  stats: {
    totalDreams: number;
    totalInterpretations: number;
    totalConversations: number;
    totalSymbols: number;
  };
}

/**
 * Exports all dreams, interpretations, conversations, and symbols from IndexedDB
 * @returns ExportData object containing all user data
 */
export async function exportAllData(): Promise<ExportData> {
  const [dreams, interpretations, conversations, symbols] = await Promise.all([
    localDb.dreams.toArray(),
    localDb.interpretations.toArray(),
    localDb.conversations.toArray(),
    localDb.symbols.toArray(),
  ]);

  const exportData: ExportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    dreams,
    interpretations,
    conversations,
    symbols,
    stats: {
      totalDreams: dreams.length,
      totalInterpretations: interpretations.length,
      totalConversations: conversations.length,
      totalSymbols: symbols.length,
    },
  };

  return exportData;
}

/**
 * Downloads export data as a JSON file
 * @param data - The export data to download
 * @param filename - Optional custom filename (defaults to dreamlens-export-YYYY-MM-DD.json)
 */
export function downloadExportData(data: ExportData, filename?: string): void {
  const defaultFilename = `dreamlens-export-${new Date().toISOString().split('T')[0]}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || defaultFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convenience function that exports and downloads all data
 */
export async function exportAndDownload(): Promise<void> {
  const data = await exportAllData();
  downloadExportData(data);
}
