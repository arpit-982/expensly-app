import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { MappingResponse, MappingObject } from '@/types/import';

interface MappingModalProps {
  open: boolean;
  onClose: () => void;
  mappingResponse?: MappingResponse | null;
  onApply: (mapping: MappingObject) => void;
}

/**
 * MappingModal
 *
 * Simple interactive modal used by the Column-Mapping MVP. It shows detected
 * mappings and lets the user override the header chosen for each canonical
 * field and select fingerprint / visible columns. This is intentionally
 * lightweight (native selects / checkboxes) so it can be used immediately in
 * the UI while we iterate on visuals.
 */
type LocalField = 'date' | 'narration' | 'balance' | 'debit' | 'credit';
const CANONICAL_FIELDS: LocalField[] = ['date', 'narration', 'balance', 'debit', 'credit'];

export default function MappingModal({ open, onClose, mappingResponse, onApply }: MappingModalProps) {
  const detected = mappingResponse?.mapping;
  const visibleOptions = detected?.visibleColumns ?? [];

  // selections: canonical field -> selected header (or empty string)
  const [selections, setSelections] = useState<Record<LocalField, string>>(() => {
    const init: Record<LocalField, string> = {
      date: '',
      narration: '',
      balance: '',
      debit: '',
      credit: '',
    };
    return init;
  });

  const [fingerprintCols, setFingerprintCols] = useState<string[]>(detected?.fingerprintColumns ?? []);

  useEffect(() => {
    // Initialize selections from detected mapping when response changes
    if (!detected) return;
    const newSel: Record<LocalField, string> = {
      date: '',
      narration: '',
      balance: '',
      debit: '',
      credit: '',
    };
    for (const f of CANONICAL_FIELDS) {
      const v = (detected.mapping as any)[f];
      newSel[f as LocalField] = v && v.header ? v.header : '';
    }
    setSelections(newSel);
    setFingerprintCols(detected.fingerprintColumns ?? []);
  }, [mappingResponse]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleFingerprint = (col: string) => {
    setFingerprintCols((prev) => {
      if (prev.includes(col)) return prev.filter((c) => c !== col);
      return [...prev, col];
    });
  };

  const apply = () => {
    // Build MappingObject from selections + fingerprintCols + visible options
    const mappingObj: MappingObject = {
      mapping: {},
      fingerprintColumns: fingerprintCols,
      visibleColumns: visibleOptions,
      metadata: detected?.metadata ?? {},
    };
    for (const f of CANONICAL_FIELDS) {
      const header = selections[f];
      // assign into mapping with proper typing: mapping keys accept canonical fields,
      // LocalField is a subset so we cast.
      (mappingObj.mapping as Record<string, any>)[f as string] = header
        ? { header, confidence: detected?.mapping?.[f as any]?.confidence ?? 0.5 }
        : null;
    }
    onApply(mappingObj);
  };

  const isLoading = !mappingResponse;

  return (
    <Dialog open={open}>
      <DialogContent className="w-[min(900px,92vw)]">
        <DialogHeader>
          <DialogTitle>Confirm Column Mapping</DialogTitle>
        </DialogHeader>

        {/* Loading state: show simple spinner + message while detection runs */}
        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-500" />
            <div className="text-sm text-muted-foreground">Detecting columns…</div>
            <div className="text-xs text-muted-foreground">This may take a few seconds for large files.</div>
          </div>
        ) : (
          <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Detected mappings</h4>
              <div className="space-y-3">
                {CANONICAL_FIELDS.map((field) => (
                  <div key={field} className="flex items-center gap-2">
                    <label className="w-28 text-sm text-muted-foreground">{field}</label>
                    <select
                      className="flex-1 border rounded px-2 py-1"
                      value={selections[field]}
                      onChange={(e) => setSelections({ ...selections, [field]: e.target.value })}
                    >
                      <option value="">-- none --</option>
                      {visibleOptions.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                    <div className="w-20 text-xs text-right">
                      {detected?.mapping?.[field] ? `conf ${String((detected.mapping as any)[field].confidence)}` : ''}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Preview / Column controls</h4>
              <p className="text-sm text-muted-foreground mb-2">Choose fingerprint columns (used for rule generation) and toggle visibility.</p>

              <div className="mb-2">
                <div className="text-sm font-semibold">Fingerprint columns</div>
                <div className="mt-1 space-y-1">
                  {visibleOptions.map((col) => (
                    <label key={`fp-${col}`} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={fingerprintCols.includes(col)}
                        onChange={() => toggleFingerprint(col)}
                      />
                      <span>{col}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-3">
                <div className="text-sm font-semibold">Visible columns (preview)</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {visibleOptions.length === 0 ? <div className="italic">No preview columns</div> : visibleOptions.join(', ')}
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter className="mt-4 flex gap-2">
          <div className="flex-1 text-sm text-muted-foreground">Tip: confirm mappings before applying to staged parse</div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
            <Button disabled={isLoading} onClick={() => { if (!isLoading) { apply(); onClose(); } }}>
              {isLoading ? 'Detecting…' : 'Apply mapping'}
            </Button>
          </div>
        </DialogFooter>

        <DialogClose />
      </DialogContent>
    </Dialog>
  );
}
