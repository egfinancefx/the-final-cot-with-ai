import React, { useState } from 'react';
import { Upload, FileText } from 'lucide-react';
import { RAW_SUMMARY_CSV, RAW_HISTORY_CSV } from '../constants';

interface FileUploadProps {
  onDataLoaded: (summaryCsv: string, historyCsv: string) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded }) => {
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      // Heuristic to detect if it's the summary file or history file
      // Summary usually has "Net Positions" in header
      // History has dates
      if (text.includes("Net Positions")) {
        onDataLoaded(text, ''); // Only loaded summary
      } else {
        onDataLoaded('', text); // Only loaded history (or assumed history)
      }
      setLoading(false);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleLoadSample = () => {
    setLoading(true);
    setTimeout(() => {
        onDataLoaded(RAW_SUMMARY_CSV, RAW_HISTORY_CSV);
        setLoading(false);
    }, 500);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div 
        className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-xl transition-colors duration-300 ${
          dragActive 
            ? "border-emerald-500 bg-emerald-500/10" 
            : "border-slate-600 bg-slate-800 hover:border-slate-500"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Upload className={`w-12 h-12 mb-3 ${dragActive ? "text-emerald-400" : "text-slate-400"}`} />
          <p className="mb-2 text-sm text-slate-300">
            <span className="font-semibold">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-slate-500">CSV files supported</p>
        </div>
        <input 
          id="dropzone-file" 
          type="file" 
          accept=".csv"
          className="absolute w-full h-full opacity-0 cursor-pointer" 
          onChange={handleChange}
        />
      </div>

      <div className="flex items-center justify-center mt-6">
        <span className="text-slate-500 text-sm mx-4">OR</span>
      </div>

      <button
        onClick={handleLoadSample}
        disabled={loading}
        className="w-full mt-4 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20"
      >
        {loading ? (
            <span className="animate-pulse">Loading Data...</span>
        ) : (
            <>
                <FileText className="w-5 h-5" />
                <span>Load Provided Dataset</span>
            </>
        )}
      </button>
      <p className="text-center text-xs text-slate-500 mt-2">
        Loads the specific snapshot and historical CSV data provided.
      </p>
    </div>
  );
};

export default FileUpload;