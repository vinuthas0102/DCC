import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';

interface DocUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
  label?: string;
  optional?: boolean;
  accept?: string;
  className?: string;
}

export const DocUpload: React.FC<DocUploadProps> = ({
  value,
  onChange,
  label,
  optional = false,
  accept = 'application/pdf,image/*',
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onChange(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    onChange(file);
    e.target.value = '';
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-xs font-medium text-gray-600 mb-1">
          {label}
          {optional && <span className="text-gray-400 font-normal ml-1">(optional)</span>}
        </label>
      )}

      {value ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
          <FileText size={14} className="text-blue-500 shrink-0" />
          <span className="flex-1 min-w-0 text-xs font-medium text-blue-800 truncate">{value.name}</span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="p-0.5 rounded text-blue-400 hover:text-red-500 transition-colors shrink-0"
          >
            <X size={13} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`w-full flex flex-col items-center justify-center gap-1.5 px-3 py-3 border-2 border-dashed rounded-lg transition-all text-center cursor-pointer ${
            dragging
              ? 'border-blue-400 bg-blue-50 text-blue-600'
              : 'border-gray-200 bg-gray-50 text-gray-400 hover:border-blue-300 hover:bg-blue-50/50 hover:text-blue-500'
          }`}
        >
          <UploadCloud size={18} />
          <span className="text-xs font-medium">Drag & drop or <span className="underline">browse</span></span>
          <span className="text-[10px] text-gray-400">PDF or image</span>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
};
