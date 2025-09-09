import React, { useEffect, useRef, useState } from 'react';
import { EditorView } from '@codemirror/view';
import { EditorState, Compartment } from '@codemirror/state';
import { autocompletion, CompletionContext, CompletionResult } from '@codemirror/autocomplete';
import type { ICellRendererParams } from 'ag-grid-community';
import { inlineSetup } from '@/lib/codemirror-setup';

interface AccountRendererParams extends ICellRendererParams {
  // optional commit callback supplied via colDef.cellRendererParams.onCommit
  onCommit?: (params: any, newValue: string) => void;
}

/**
 * AccountAutocomplete
 *
 * CodeMirror-based React cell renderer for AG Grid used as an inline account editor.
 * Provides ledger-style account autocompletion similar to paisa-fyi editor.
 *
 * Features:
 * - CodeMirror editor with account autocompletion
 * - Enter commits via onCommit callback and exits edit mode
 * - Esc cancels edit and reverts to original value
 * - Click to enter edit mode, blur to commit
 */
export default function AccountAutocomplete(props: AccountRendererParams) {
  const initialValue = (props.value ?? '') as string;
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initialValue);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const readonlyCompartment = useRef(new Compartment());

  // Account suggestions for autocompletion
  const ACCOUNT_SUGGESTIONS = [
    'Assets:Bank:Checking',
    'Assets:Bank:Savings',
    'Assets:Cash',
    'Assets:Investments',
    'Expenses:Food:Groceries',
    'Expenses:Food:Restaurants',
    'Expenses:Transport:Fuel',
    'Expenses:Transport:Public',
    'Expenses:Utilities:Electricity',
    'Expenses:Utilities:Internet',
    'Expenses:Office:Supplies',
    'Expenses:Office:Software',
    'Expenses:Entertainment',
    'Expenses:Healthcare',
    'Expenses:Insurance',
    'Expenses:Subscriptions',
    'Income:Salary',
    'Income:Freelance',
    'Income:Interest',
    'Liabilities:CreditCard:Personal',
    'Liabilities:Loan:Home',
    'Liabilities:Loan:Car',
  ];

  // Account autocompletion function
  const accountCompletion = (context: CompletionContext): CompletionResult | null => {
    const word = context.matchBefore(/\w*/);
    if (!word || (word.from === word.to && !context.explicit)) {
      return null;
    }

    const input = context.state.doc.toString().toLowerCase();
    const options = ACCOUNT_SUGGESTIONS
      .filter(account => account.toLowerCase().includes(input))
      .map(account => ({
        label: account,
        type: 'variable',
        boost: account.toLowerCase().startsWith(input) ? 1 : 0,
      }));

    return {
      from: 0,
      to: context.state.doc.length,
      options,
    };
  };

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (editing && editorRef.current && !viewRef.current) {
      const extensions = [
        inlineSetup,
        autocompletion({
          override: [accountCompletion],
          activateOnTyping: true,
          maxRenderedOptions: 10,
        }),
        EditorView.theme({
          '&': {
            fontSize: '14px',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
          },
          '.cm-focused': {
            outline: '2px solid hsl(var(--ring))',
            outlineOffset: '2px',
          },
          '.cm-editor': {
            padding: '8px',
          },
          '.cm-content': {
            minHeight: '20px',
            padding: '0',
          },
          '.cm-line': {
            padding: '0',
          },
        }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setValue(update.state.doc.toString());
          }
        }),
        readonlyCompartment.current.of(EditorState.readOnly.of(false)),
      ];

      const state = EditorState.create({
        doc: value,
        extensions,
      });

      const view = new EditorView({
        state,
        parent: editorRef.current,
      });

      viewRef.current = view;

      // Focus and select all text
      view.focus();
      view.dispatch({
        selection: { anchor: 0, head: view.state.doc.length },
      });

      // Handle key events
      const keyHandler = (event: KeyboardEvent) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          commit();
        } else if (event.key === 'Escape') {
          event.preventDefault();
          cancel();
        }
      };

      editorRef.current.addEventListener('keydown', keyHandler);

      return () => {
        if (editorRef.current) {
          editorRef.current.removeEventListener('keydown', keyHandler);
        }
      };
    }
  }, [editing, value]);

  useEffect(() => {
    // Cleanup editor when component unmounts or editing stops
    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
        viewRef.current = null;
      }
    };
  }, [editing]);

  const startEdit = () => {
    setEditing(true);
  };

  const commit = (newVal?: string) => {
    const final = newVal === undefined ? value : newVal;
    setEditing(false);
    setValue(final);
    
    // Clean up editor
    if (viewRef.current) {
      viewRef.current.destroy();
      viewRef.current = null;
    }

    // Call commit callback
    try {
      const commitFn = (props as any).onCommit;
      if (typeof commitFn === 'function') {
        commitFn(props, final);
      } else if (props.node && props.node.setDataValue && props.colDef?.field) {
        props.node.setDataValue(props.colDef.field, final);
      }
    } catch (e) {
      console.error('AccountAutocomplete commit error', e);
    }
  };

  const cancel = () => {
    setEditing(false);
    setValue(initialValue);
    
    // Clean up editor
    if (viewRef.current) {
      viewRef.current.destroy();
      viewRef.current = null;
    }
  };

  const handleBlur = () => {
    // Small delay to allow completion selection
    setTimeout(() => {
      if (editing) {
        commit();
      }
    }, 150);
  };

  if (!editing) {
    return (
      <div
        className="px-2 py-1 text-sm text-foreground truncate cursor-text h-full flex items-center"
        title={value || 'Click to edit account'}
        onClick={startEdit}
      >
        {value || <span className="text-muted-foreground italic">— add account —</span>}
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <div
        ref={editorRef}
        className="h-full"
        onBlur={handleBlur}
      />
    </div>
  );
}
