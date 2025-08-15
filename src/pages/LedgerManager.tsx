import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Save, Trash2, AlertTriangle, FileText } from 'lucide-react';
import { AddFileModal } from '@/components/ledger/AddFileModal';
import { LedgerEditor } from '@/components/ledger/LedgerEditor';
import type { LedgerFile } from '@/lib/types';

export default function LedgerManager() {
  const [files, setFiles] = useState<LedgerFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<LedgerFile | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load all files on component mount
  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('ledger_files')
        .select('*')
        .order('last_updated_at', { ascending: false });

      if (error) throw error;

      const files = data || [];
      setFiles(files as LedgerFile[]);
      
      // Auto-select primary file or first file
      const primaryFile = files.find((f: any) => f.is_primary) || files[0];
      if (primaryFile) {
        setSelectedFile(primaryFile as LedgerFile);
        setEditorContent(primaryFile.content);
      }
    } catch (error) {
      toast({
        title: "Error loading files",
        description: error instanceof Error ? error.message : "Failed to load ledger files",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveFile = async () => {
    if (!selectedFile) return;

    setIsSaving(true);
    try {
      const { error } = await (supabase as any)
        .from('ledger_files')
        .update({
          content: editorContent,
          last_updated_at: new Date().toISOString()
        })
        .eq('id', selectedFile.id);

      if (error) throw error;

      toast({
        title: "File saved",
        description: `${selectedFile.name} has been saved successfully`
      });

      // Refresh files to update last_updated_at
      await loadFiles();
    } catch (error) {
      toast({
        title: "Error saving file",
        description: error instanceof Error ? error.message : "Failed to save file",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteFile = async (file: LedgerFile) => {
    if (!confirm(`Are you sure you want to delete "${file.name}"?`)) return;

    try {
      const { error } = await (supabase as any)
        .from('ledger_files')
        .delete()
        .eq('id', file.id);

      if (error) throw error;

      toast({
        title: "File deleted",
        description: `${file.name} has been deleted`
      });

      // If deleted file was selected, clear selection
      if (selectedFile?.id === file.id) {
        setSelectedFile(null);
        setEditorContent('');
      }

      await loadFiles();
    } catch (error) {
      toast({
        title: "Error deleting file",
        description: error instanceof Error ? error.message : "Failed to delete file",
        variant: "destructive"
      });
    }
  };

  const setPrimaryFile = async (file: LedgerFile) => {
    try {
      // First, unset all primary flags
      const { error: unsetError } = await (supabase as any)
        .from('ledger_files')
        .update({ is_primary: false })
        .neq('id', 0); // Update all rows

      if (unsetError) throw unsetError;

      // Then set the selected file as primary
      const { error: setError } = await (supabase as any)
        .from('ledger_files')
        .update({ is_primary: true })
        .eq('id', file.id);

      if (setError) throw setError;

      toast({
        title: "Primary file updated",
        description: `${file.name} is now the primary file`
      });

      await loadFiles();
    } catch (error) {
      toast({
        title: "Error setting primary file",
        description: error instanceof Error ? error.message : "Failed to set primary file",
        variant: "destructive"
      });
    }
  };

  const selectFile = (file: LedgerFile) => {
    setSelectedFile(file);
    setEditorContent(file.content);
  };

  const primaryFiles = files.filter(f => f.is_primary);
  const hasMultiplePrimary = primaryFiles.length > 1;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading ledger files...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Card className="w-80 rounded-none border-l-0 border-t-0 border-b-0">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5" />
            Ledger Files
          </CardTitle>
          <Button onClick={() => setIsAddModalOpen(true)} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add New File
          </Button>
        </CardHeader>
        
        <CardContent className="p-0">
          {hasMultiplePrimary && (
            <Alert className="mx-4 mb-4" variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Multiple files are marked as primary. Only one should be primary.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-1">
            {files.map((file) => (
              <div
                key={file.id}
                className={`p-3 cursor-pointer border-b hover:bg-muted/50 transition-colors ${
                  selectedFile?.id === file.id ? 'bg-muted' : ''
                }`}
                onClick={() => selectFile(file)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm truncate">{file.name}</span>
                  <div className="flex gap-1">
                    {file.is_primary && (
                      <Badge variant="default" className="text-xs">Primary</Badge>
                    )}
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground mb-2">
                  Updated: {new Date(file.last_updated_at).toLocaleDateString()}
                </div>

                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPrimaryFile(file);
                    }}
                    disabled={file.is_primary}
                  >
                    Set Primary
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="text-xs h-6"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFile(file);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Editor Header */}
        <div className="border-b bg-card p-4 flex items-center justify-between">
          <div>
            {selectedFile ? (
              <div>
                <h2 className="text-lg font-semibold">{selectedFile.name}</h2>
                <p className="text-sm text-muted-foreground">
                  Last updated: {new Date(selectedFile.last_updated_at).toLocaleString()}
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-semibold">No file selected</h2>
                <p className="text-sm text-muted-foreground">Select a file from the sidebar to start editing</p>
              </div>
            )}
          </div>

          {selectedFile && (
            <Button onClick={saveFile} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </div>

        {/* Editor */}
        <div className="flex-1">
          {selectedFile ? (
            <LedgerEditor
              value={editorContent}
              onChange={setEditorContent}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Select a file to start editing
            </div>
          )}
        </div>
      </div>

      <AddFileModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onFileAdded={loadFiles}
      />
    </div>
  );
}