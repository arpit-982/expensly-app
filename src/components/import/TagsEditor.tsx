import React, { useState, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import type { ICellRendererParams } from 'ag-grid-community';

interface TagsRendererParams extends ICellRendererParams {
  onCommit?: (params: any, newValue: string[]) => void;
}

/**
 * TagsEditor
 *
 * Lightweight React cell renderer for AG Grid used as an inline tags editor.
 * Displays tags as chips and allows adding/removing tags with a simple input.
 *
 * Features:
 * - Display tags as removable chips
 * - Click to enter edit mode with input field
 * - Enter to add new tag, Esc to cancel
 * - Blur to commit changes
 */
export default function TagsEditor(props: TagsRendererParams) {
  const initialTags = Array.isArray(props.value) ? props.value : [];
  const [editing, setEditing] = useState(false);
  const [tags, setTags] = useState<string[]>(initialTags);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Common tag suggestions
  const TAG_SUGGESTIONS = [
    'business',
    'personal',
    'recurring',
    'one-time',
    'essential',
    'discretionary',
    'tax-deductible',
    'reimbursable',
    'subscription',
    'investment',
  ];

  useEffect(() => {
    setTags(Array.isArray(props.value) ? props.value : []);
  }, [props.value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  const startEdit = () => {
    setEditing(true);
  };

  const commit = () => {
    setEditing(false);
    setInputValue('');
    
    try {
      const commitFn = (props as any).onCommit;
      if (typeof commitFn === 'function') {
        commitFn(props, tags);
      } else if (props.node && props.node.setDataValue && props.colDef?.field) {
        props.node.setDataValue(props.colDef.field, tags);
      }
    } catch (e) {
      console.error('TagsEditor commit error', e);
    }
  };

  const cancel = () => {
    setEditing(false);
    setInputValue('');
    setTags(initialTags);
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setInputValue('');
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancel();
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      // Remove last tag if input is empty and backspace is pressed
      setTags(tags.slice(0, -1));
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addTag(inputValue);
    }
    setTimeout(() => {
      if (editing) {
        commit();
      }
    }, 150);
  };

  if (!editing) {
    return (
      <div
        className="flex items-center gap-1 px-2 py-1 cursor-pointer h-full flex-wrap"
        onClick={startEdit}
        title="Click to edit tags"
      >
        {tags.length === 0 ? (
          <span className="text-muted-foreground italic text-sm">— add tags —</span>
        ) : (
          tags.map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="text-xs px-2 py-0.5"
            >
              {tag}
            </Badge>
          ))
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 px-2 py-1 h-full flex-wrap">
      {tags.map((tag, index) => (
        <Badge
          key={index}
          variant="secondary"
          className="text-xs px-2 py-0.5 flex items-center gap-1"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(tag)}
            className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </Badge>
      ))}
      <div className="flex items-center gap-1 min-w-0 flex-1">
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder="Add tag..."
          className="border-0 shadow-none p-0 h-6 text-xs focus-visible:ring-0 min-w-20"
          list="tag-suggestions"
        />
        <datalist id="tag-suggestions">
          {TAG_SUGGESTIONS.map((suggestion) => (
            <option key={suggestion} value={suggestion} />
          ))}
        </datalist>
        {inputValue.trim() && (
          <button
            type="button"
            onClick={() => addTag(inputValue)}
            className="text-muted-foreground hover:text-foreground p-0.5"
          >
            <Plus className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
