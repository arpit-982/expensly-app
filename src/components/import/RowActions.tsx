import React from 'react';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Sparkles, RotateCcw, Eye, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { ICellRendererParams } from 'ag-grid-community';

interface RowActionsRendererParams extends ICellRendererParams {
  onApplySuggestion?: (params: any) => void;
  onRevert?: (params: any) => void;
  onViewOriginal?: (params: any) => void;
  onCreateRule?: (params: any) => void;
}

/**
 * RowActions
 *
 * Lightweight React cell renderer for AG Grid that provides row-level actions.
 * Uses a dropdown menu to avoid cluttering the interface.
 *
 * Features:
 * - Apply LLM suggestion
 * - Revert row to original state
 * - View original CSV data
 * - Create rule from row
 */
export default function RowActions(props: RowActionsRendererParams) {
  const hasSuggestion = props.data?.suggested_account;
  const hasChanges = props.data?.account !== props.data?.original_data?.account ||
                    (props.data?.tags || []).length > 0 ||
                    props.data?.narration;

  const handleApplySuggestion = () => {
    try {
      const applyFn = (props as any).onApplySuggestion;
      if (typeof applyFn === 'function') {
        applyFn(props);
      }
    } catch (e) {
      console.error('RowActions apply suggestion error', e);
    }
  };

  const handleRevert = () => {
    try {
      const revertFn = (props as any).onRevert;
      if (typeof revertFn === 'function') {
        revertFn(props);
      }
    } catch (e) {
      console.error('RowActions revert error', e);
    }
  };

  const handleViewOriginal = () => {
    try {
      const viewFn = (props as any).onViewOriginal;
      if (typeof viewFn === 'function') {
        viewFn(props);
      }
    } catch (e) {
      console.error('RowActions view original error', e);
    }
  };

  const handleCreateRule = () => {
    try {
      const createRuleFn = (props as any).onCreateRule;
      if (typeof createRuleFn === 'function') {
        createRuleFn(props);
      }
    } catch (e) {
      console.error('RowActions create rule error', e);
    }
  };

  return (
    <div className="flex items-center justify-center h-full">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {hasSuggestion && (
            <DropdownMenuItem onClick={handleApplySuggestion}>
              <Sparkles className="mr-2 h-3 w-3" />
              Apply Suggestion
            </DropdownMenuItem>
          )}
          {hasChanges && (
            <DropdownMenuItem onClick={handleRevert}>
              <RotateCcw className="mr-2 h-3 w-3" />
              Revert Changes
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleViewOriginal}>
            <Eye className="mr-2 h-3 w-3" />
            View Original
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCreateRule}>
            <Plus className="mr-2 h-3 w-3" />
            Create Rule
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
