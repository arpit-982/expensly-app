import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';

interface CsvUploaderProps {
  onUpload: (file: File) => void;
}

/**
 * CsvUploader component
 * 
 * This component provides a drag-and-drop interface for uploading CSV files.
 * It uses the react-dropzone library to handle the file upload logic.
 * 
 * @param onUpload - A callback function that is called when a file is uploaded.
 */
const CsvUploader: React.FC<CsvUploaderProps> = ({ onUpload }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    // We only support uploading one file at a time
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    }
  });

  return (
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
  );
};

export default CsvUploader;
