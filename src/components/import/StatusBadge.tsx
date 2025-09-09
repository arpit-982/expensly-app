import React from 'react';
import type { ICellRendererParams } from 'ag-grid-community';

/**
 * StatusBadge
 *
 * Small renderer that displays the staged transaction status as a colored badge.
 * Replaces raw HTML strings with a React component to avoid rendering/escaping issues.
 */
export default function StatusBadge(props: ICellRendererParams) {
  const status = String(props.value ?? props.data?.status ?? 'pending');

  const statusMap: Record<string, { bg: string; fg: string; label?: string }> = {
    pending: { bg: 'bg-gray-100', fg: 'text-gray-800', label: 'pending' },
    'auto-tagged': { bg: 'bg-blue-100', fg: 'text-blue-800', label: 'auto-tagged' },
    'manually-tagged': { bg: 'bg-yellow-100', fg: 'text-yellow-800', label: 'manually-tagged' },
    reviewed: { bg: 'bg-purple-100', fg: 'text-purple-800', label: 'reviewed' },
    approved: { bg: 'bg-green-100', fg: 'text-green-800', label: 'approved' },
  };

  const meta = statusMap[status] ?? statusMap.pending;

  return (
    <div
      className={`${meta.bg} ${meta.fg} inline-flex items-center px-2 py-1 rounded-full text-xs font-medium`}
      title={meta.label ?? status}
      style={{ whiteSpace: 'nowrap' }}
    >
      {meta.label ?? status}
    </div>
  );
}
