import React from 'react';
import Editor from '@monaco-editor/react';

interface LedgerEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function LedgerEditor({ value, onChange }: LedgerEditorProps) {
  const handleEditorChange = (val: string | undefined) => {
    onChange(val || '');
  };

  const handleEditorDidMount = (editor: any, monaco: any) => {
    // Define ledger syntax highlighting
    monaco.languages.register({ id: 'ledger' });

    monaco.languages.setMonarchTokensProvider('ledger', {
      tokenizer: {
        root: [
          // Dates
          [/^\d{4}[-\/]\d{2}[-\/]\d{2}/, 'date'],
          
          // Comments (lines starting with ;)
          [/^;.*$/, 'comment'],
          [/\s+;.*$/, 'comment'],
          
          // Account names (indented lines)
          [/^\s+[A-Z][A-Za-z0-9:_\s-]+/, 'account'],
          
          // Numbers (amounts)
          [/-?\d+\.?\d*/, 'number'],
          
          // Transaction descriptions
          [/^\d{4}[-\/]\d{2}[-\/]\d{2}\s+.*/, 'transaction'],
          
          // Include statements
          [/^include\s+/, 'keyword'],
        ]
      }
    });

    // Define theme colors for dark mode
    monaco.editor.defineTheme('ledger-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'date', foreground: '#569cd6' },
        { token: 'comment', foreground: '#6a9955', fontStyle: 'italic' },
        { token: 'account', foreground: '#dcdcaa' },
        { token: 'number', foreground: '#b5cea8' },
        { token: 'transaction', foreground: '#c586c0' },
        { token: 'keyword', foreground: '#569cd6', fontStyle: 'bold' },
      ],
      colors: {
        'editor.background': '#0f0f23',
        'editor.foreground': '#d4d4d4',
        'editorLineNumber.foreground': '#858585',
        'editor.selectionBackground': '#264f78',
        'editor.lineHighlightBackground': '#2a2d3a',
      }
    });

    // Set the theme
    monaco.editor.setTheme('ledger-dark');

    // Configure editor options
    editor.updateOptions({
      fontSize: 14,
      lineNumbers: 'on',
      minimap: { enabled: true },
      wordWrap: 'off',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 4,
      insertSpaces: true,
      find: {
        addExtraSpaceOnTop: false,
        autoFindInSelection: 'never'
      }
    });
  };

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language="ledger"
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        theme="ledger-dark"
        options={{
          fontSize: 14,
          lineNumbers: 'on',
          minimap: { enabled: true },
          wordWrap: 'off',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
          insertSpaces: true,
        }}
      />
    </div>
  );
}