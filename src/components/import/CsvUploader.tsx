import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import Papa from 'papaparse';
import { detectMapping } from '@/services/columnMappingService';
import MappingModal from '@/components/import/MappingModal';
import type { MappingResponse, MappingObject } from '@/types/import';

interface CsvUploaderProps {
  // onUpload now accepts an optional mapping object so parent can decide whether
  // to immediately process the file with a mapping (MappingModal flow) or just
  // register an uploaded file.
  onUpload: (file: File, mapping?: MappingObject) => void;
}

/**
 * CsvUploader component with a developer-friendly "Run Detection" flow.
 *
 * - Primary upload behaviour remains unchanged: calls onUpload(file)
 * - Dev helper: after selecting a file, you can run "Run Detection (dev)"
 *   which parses the first few rows and displays the mapping response
 *   returned by the client-side detection service.
 */
const CsvUploader: React.FC<CsvUploaderProps> = ({ onUpload }) => {
  const [lastDetection, setLastDetection] = useState<MappingResponse | null>(null);
  const [running, setRunning] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const [lastFile, setLastFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // We only support uploading one file at a time.
    // Save the picked file and open the modal immediately with a loader,
    // then run detection to populate the modal when ready.
    if (acceptedFiles.length > 0) {
      const f = acceptedFiles[0];
      setLastFile(f);
      // Open modal immediately to show loader while detection runs
      setModalOpen(true);
      // Run detection (will set mapping and keep modal open)
      runDetection(f).catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Auto-detection failed on drop:', err);
      });
    }
  }, []); // keep stable

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    }
  });

  // Developer helper: parse small preview and run client-side detection
  const runDetection = async (file: File) => {
    setRunning(true);
    try {
      const result = await new Promise<Papa.ParseResult<any>>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          preview: 6,
          skipEmptyLines: true,
          complete: resolve,
          error: reject,
        });
      });

      const headers = (result.meta && (result.meta as any).fields) || [];
      const sampleRows: string[][] = (result.data || []).slice(0, 5).map((row: any) =>
        headers.map((h: string) => (row[h] == null ? '' : String(row[h])))
      );

      const mappingResp = await detectMapping({ headers, sampleRows, fileName: file.name });
      setLastDetection(mappingResp);
      setModalOpen(true);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Detection failed', err);
      setLastDetection({
        mapping: { mapping: {}, fingerprintColumns: [], visibleColumns: [], metadata: {} },
        errors: [(err as Error).message || 'unknown error'],
      } as MappingResponse);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div>
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the files here ...</p>
        ) : (
          <div>
            <p>Drag 'n' drop a CSV file here, or click to select a file</p>
            <Button variant="outline" className="mt-4">Select File</Button>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          variant="ghost"
          onClick={() => {
            // If a file was already selected, run detection on it; otherwise open picker.
            if (lastFile) {
              runDetection(lastFile).catch((err) => {
                // eslint-disable-next-line no-console
                console.error('Detection failed', err);
              });
              return;
            }
            // fallback: open picker
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.csv,text/csv';
            input.onchange = async (e) => {
              const f = (e.target as HTMLInputElement).files?.[0];
              if (f) {
                setLastFile(f);
                await runDetection(f);
              }
            };
            input.click();
          }}
        >
          (Dev) Run Detection
        </Button>
        <div className="ml-auto">
          <Button
            onClick={async () => {
              // Ask user to pick a file via a temporary input if parent didn't provide one.
              // Create a hidden input dynamically.
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.csv,text/csv';
              input.onchange = async (e) => {
                const f = (e.target as HTMLInputElement).files?.[0];
                if (f) await runDetection(f);
              };
              input.click();
            }}
            disabled={running}
          >
            {running ? 'Running…' : 'Run Detection (dev)'}
          </Button>
        </div>
      </div>

      {/* Mapping modal (opens after detection) */}
      <MappingModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mappingResponse={lastDetection as MappingResponse}
        onApply={(mapping) => {
          // If a file was uploaded previously, call parent handler with mapping so
          // Import page can process the file with the mapping and open staged view.
          if (lastFile) {
            onUpload(lastFile, mapping);
          } else {
            // eslint-disable-next-line no-console
            console.warn('No file available to apply mapping to');
          }
          setModalOpen(false);
        }}
      />

      {lastDetection && (
        <div className="mt-4 p-4 bg-gray-50 rounded border">
          <h4 className="font-semibold mb-2">Detection Result (dev)</h4>
          <pre className="text-xs max-h-64 overflow-auto">
            {JSON.stringify(lastDetection, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default CsvUploader;
