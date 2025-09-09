import React from 'react';
import type { ICellRendererParams } from 'ag-grid-community';

/**
 * DescriptionRenderer
 *
 * Simple React renderer for AG Grid description cells.
 * - Renders multi-line text safely (no raw HTML strings).
 * - Allows the grid to compute row height when used with `autoHeight: true`.
 * - Provides title attribute for full text on hover.
 */
export default function DescriptionRenderer(props: ICellRendererParams) {
  const text = props.value ?? props.data?.parsed_description ?? props.data?.original_description ?? '';
  const safeText = String(text);

  return (
    <div
      className="text-sm leading-tight whitespace-pre-line break-words px-2 py-1"
      title={safeText}
      style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
    >
      {safeText}
    </div>
  );
}
