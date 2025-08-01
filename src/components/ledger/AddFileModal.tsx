import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface AddFileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileAdded: () => void;
}

export function AddFileModal({ isOpen, onClose, onFileAdded }: AddFileModalProps) {
  const [fileName, setFileName] = useState('');
  const [content, setContent] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fileName.trim()) {
      toast({
        title: "Validation Error",
        description: "File name is required",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
    
    try {
      // If this file should be primary, first unset all other primary flags
      if (isPrimary) {
        const { error: unsetError } = await (supabase as any)
          .from('ledger_files')
          .update({ is_primary: false })
          .neq('id', 0); // Update all rows

        if (unsetError) throw unsetError;
      }

      // Create the new file
      const { error } = await (supabase as any)
        .from('ledger_files')
        .insert({
          name: fileName.trim(),
          content: content || '',
          is_primary: isPrimary,
          last_updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "File created",
        description: `${fileName} has been created successfully`
      });

      // Reset form and close modal
      setFileName('');
      setContent('');
      setIsPrimary(false);
      onClose();
      onFileAdded();
      
    } catch (error) {
      toast({
        title: "Error creating file",
        description: error instanceof Error ? error.message : "Failed to create file",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    if (!isCreating) {
      setFileName('');
      setContent('');
      setIsPrimary(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add New Ledger File</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="fileName">File Name</Label>
              <Input
                id="fileName"
                placeholder="e.g., main.ledger, accounts.ledger"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPrimary"
                checked={isPrimary}
                onCheckedChange={(checked) => setIsPrimary(checked as boolean)}
              />
              <Label htmlFor="isPrimary">Set as primary file</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Initial Content (Optional)</Label>
              <Textarea
                id="content"
                placeholder="Enter initial ledger content..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="font-mono"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create File'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}