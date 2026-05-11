import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ChevronDown, ChevronRight, FileCode, Plus, Minus } from 'lucide-react';

function DiffLine({ line }) {
  const type = line.startsWith('+') ? 'add' : line.startsWith('-') ? 'del' : 'ctx';
  const lineClass =
    type === 'add'
      ? 'bg-emerald-50/80 text-emerald-700'
      : type === 'del'
      ? 'bg-red-50/80 text-red-700 line-through decoration-red-300'
      : 'text-text-muted';
  const prefix =
    type === 'add' ? (
      <Plus size={12} className="text-emerald-500 shrink-0 mt-0.5" />
    ) : type === 'del' ? (
      <Minus size={12} className="text-red-500 shrink-0 mt-0.5" />
    ) : (
      <span className="w-3 shrink-0" />
    );

  return (
    <div className={`flex items-start gap-3 px-4 py-1 font-mono text-xs leading-5 ${lineClass}`}>
      {prefix}
      <span className="whitespace-pre-wrap break-all">{line.slice(1)}</span>
    </div>
  );
}

function FileSection({ file }) {
  const [open, setOpen] = useState(true);
  const fileName = file.to || file.from || 'unknown';
  const addCount = file.chunks?.flatMap((c) => c.changes).filter((c) => c.type === 'add').length || 0;
  const delCount = file.chunks?.flatMap((c) => c.changes).filter((c) => c.type === 'del').length || 0;

  // Flatten all lines for display
  const lines = file.chunks?.flatMap((chunk) => [
    `@@ ${chunk.content} @@`,
    ...chunk.changes.map((c) =>
      c.type === 'add' ? `+${c.content}` : c.type === 'del' ? `-${c.content}` : ` ${c.content}`
    ),
  ]) || [];

  return (
    <div className="rounded-2xl border border-surface-700 overflow-hidden shadow-sm animate-slide-up mb-3">
      {/* File header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-surface-800 hover:bg-surface-700 transition-colors text-left border-b border-surface-700/50"
      >
        {open ? <ChevronDown size={16} className="text-text-light" /> : <ChevronRight size={16} className="text-text-light" />}
        <FileCode size={16} className="text-brand-500 shrink-0" />
        <span className="font-mono font-semibold text-sm text-text-main flex-1 truncate">{fileName}</span>
        <div className="flex items-center gap-3 text-xs shrink-0 font-bold bg-white px-2 py-1 rounded-lg shadow-sm border border-surface-700">
          {addCount > 0 && <span className="text-emerald-600">+{addCount}</span>}
          {delCount > 0 && <span className="text-red-500">-{delCount}</span>}
        </div>
      </button>

      {/* Diff content */}
      {open && (
        <div className="bg-white overflow-x-auto pb-1 custom-scrollbar">
          {lines.map((line, i) => {
            if (line.startsWith('@@')) {
              return (
                <div key={i} className="px-4 py-1.5 font-mono font-medium text-xs text-brand-600 bg-brand-50/50 border-y border-brand-100/50">
                  {line}
                </div>
              );
            }
            return <DiffLine key={i} line={line} />;
          })}
        </div>
      )}
    </div>
  );
}

export default function DiffViewer({ files = [] }) {
  if (!files || files.length === 0) {
    return (
      <div className="text-center py-12 text-text-muted text-sm border-2 border-dashed border-surface-700 rounded-2xl">
        <p className="font-medium">No diff to display.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
         <p className="text-sm font-semibold text-text-muted">{files.length} file{files.length !== 1 ? 's' : ''} changed</p>
      </div>
      {files.map((file, i) => (
        <FileSection key={i} file={file} />
      ))}
    </div>
  );
}

