import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Activity, Check, Scale } from 'lucide-react';
import { ThemeMode } from '../types';
import { ASSET_GROUPS } from '../constants';

interface CompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompare: (assets: string[]) => void;
  themeMode: ThemeMode;
}

const CompareModal: React.FC<CompareModalProps> = ({ isOpen, onClose, onCompare, themeMode }) => {
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const maxSelection = 3;

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = (asset: string) => {
    setSelectedAssets(prev => 
      prev.includes(asset)
        ? prev.filter(a => a !== asset)
        : prev.length < maxSelection ? [...prev, asset] : prev
    );
  };

  const handleCompare = () => {
    if (selectedAssets.length >= 2) {
      onCompare(selectedAssets);
      onClose();
    }
  };

  const themeStyles = {
    overlay: themeMode === 'light' ? 'bg-slate-900/40 backdrop-blur-md' : 'bg-black/75 backdrop-blur-md',
    modal: themeMode === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-white/10',
    textMain: themeMode === 'light' ? 'text-slate-900' : 'text-white',
    textSub: themeMode === 'light' ? 'text-slate-500' : 'text-slate-400',
    groupHeader: themeMode === 'light' ? 'bg-slate-50 text-slate-500' : 'bg-slate-800/50 text-slate-400',
    itemHover: themeMode === 'light' ? 'hover:bg-slate-50' : 'hover:bg-white/5',
    itemSelected: themeMode === 'light' ? 'bg-blue-50 border-blue-200' : 'bg-blue-500/20 border-blue-500/30',
    itemBorder: themeMode === 'light' ? 'border-slate-200' : 'border-white/5',
  };

  return createPortal(
    <div 
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-opacity duration-200 ${themeStyles.overlay}`}
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 ${themeStyles.modal}`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${themeMode === 'light' ? 'border-slate-200' : 'border-white/10'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${themeMode === 'light' ? 'bg-indigo-100 text-indigo-600' : 'bg-indigo-500/20 text-indigo-400'}`}>
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h2 className={`text-xl font-bold font-heading ${themeStyles.textMain}`}>Advanced Comparison</h2>
              <p className={`text-sm ${themeStyles.textSub}`}>Select 2 to 3 assets to compare</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${themeMode === 'light' ? 'hover:bg-slate-100 text-slate-500' : 'hover:bg-white/10 text-slate-400'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ASSET_GROUPS.map(group => (
              <div key={group.name} className="flex flex-col gap-2">
                <h3 className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded ${themeStyles.groupHeader}`}>
                  {group.name}
                </h3>
                <div className="flex flex-col gap-2">
                  {group.items.map(item => {
                    const isSelected = selectedAssets.includes(item);
                    const isDisabled = !isSelected && selectedAssets.length >= maxSelection;

                    return (
                      <button
                        key={item}
                        disabled={isDisabled}
                        onClick={() => handleToggle(item)}
                        className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                          isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                        } ${
                          isSelected ? themeStyles.itemSelected : `${themeStyles.itemBorder} ${themeStyles.itemHover}`
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Activity className={`w-4 h-4 ${isSelected ? 'text-blue-500' : themeStyles.textSub}`} />
                          <span className={`font-medium ${isSelected ? (themeMode === 'light' ? 'text-blue-700' : 'text-blue-300') : themeStyles.textMain}`}>
                            {item}
                          </span>
                        </div>
                        {isSelected && (
                          <div className={`p-1 rounded-full ${themeMode === 'light' ? 'bg-blue-100 text-blue-600' : 'bg-blue-500/20 text-blue-400'}`}>
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className={`p-6 border-t flex items-center justify-between ${themeMode === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/50 border-white/10'}`}>
          <div className={`text-sm font-medium ${themeStyles.textSub}`}>
            {selectedAssets.length} of {maxSelection} selected
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                themeMode === 'light' ? 'text-slate-600 hover:bg-slate-200' : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleCompare}
              disabled={selectedAssets.length < 2}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${
                selectedAssets.length >= 2
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/25'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500'
              }`}
            >
              <Scale className="w-4 h-4" />
              Compare Assets
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
};

export default CompareModal;
