import { api, getApiErrorMessage } from './api';
import toast from 'react-hot-toast';

/**
 * Download an export as a file. Uses the authenticated axios instance so the
 * Bearer token is attached, then streams the blob to a temporary anchor.
 */
export async function downloadExport(entity: 'customers' | 'leads' | 'deals', format: 'excel' | 'pdf') {
  try {
    const res = await api.get(`/export/${entity}/${format}`, { responseType: 'blob' });
    const ext = format === 'excel' ? 'xlsx' : 'pdf';
    const url = window.URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entity}-${new Date().toISOString().slice(0, 10)}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    toast.success(`Exported ${entity} as ${ext.toUpperCase()}`);
  } catch (e) {
    toast.error(getApiErrorMessage(e, 'Export failed'));
  }
}
