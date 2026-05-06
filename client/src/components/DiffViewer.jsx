import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { ChevronDown, ChevronRight, FileCode, Plus, Minus } from 'lucide-react';

function DiffLine({ line }) {
  const type = line.startsWith('+') ? 'add' : line.startsWith('-') ? 'del' : 'ctx';
  const lineClass =
    type === 'add'
      ? 'bg-emerald-500/10 text-emerald-300'
      : type === 'del'
      ? 'bg-red-500/10 text-red-300 line-through decoration-red-500/50'
      : 'text-white/50';
  const prefix =
    type === 'add' ? (
      <Plus size={10} className="text-emerald-400 shrink-0 mt-0.5" />
    ) : type === 'del' ? (
      <Minus size={10} className="text-red-400 shrink-0 mt-0.5" />
    ) : (
      <span className="w-2.5 shrink-0" />
    );

  return (
    <div className={`flex items-start gap-2 px-3 py-0.5 font-mono text-xs leading-5 ${lineClass}`}>
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
    <div className="rounded-xl border border-white/10 overflow-hidden animate-slide-up">
      {/* File header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-surface-700 hover:bg-surface-600 transition-colors text-left"
      >
        {open ? <ChevronDown size={14} className="text-white/40" /> : <ChevronRight size={14} className="text-white/40" />}
        <FileCode size={14} className="text-brand-400 shrink-0" />
        <span className="font-mono text-sm text-white/80 flex-1 truncate">{fileName}</span>
        <div className="flex items-center gap-2 text-xs shrink-0">
          {addCount > 0 && <span className="text-emerald-400 font-semibold">+{addCount}</span>}
          {delCount > 0 && <span className="text-red-400 font-semibold">-{delCount}</span>}
        </div>
      </button>

      {/* Diff content */}
      {open && (
        <div className="bg-[#1e1e2e] overflow-x-auto">
          {lines.map((line, i) => {
            if (line.startsWith('@@')) {
              return (
                <div key={i} className="px-3 py-1 font-mono text-xs text-white/30 bg-brand-900/20 border-y border-brand-500/10">
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
      <div className="text-center py-12 text-white/30 text-sm">
        No diff to display.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-white/30 mb-3">{files.length} file{files.length !== 1 ? 's' : ''} changed</p>
      {files.map((file, i) => (
        <FileSection key={i} file={file} />
      ))}
    </div>
  );
}
