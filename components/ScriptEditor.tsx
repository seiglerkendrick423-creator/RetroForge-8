import React, { useState } from 'react';
import { EditorProps } from '../types';
import { generateCode } from '../services/geminiService';
import { Wand2, Loader2, Play } from 'lucide-react';

export const ScriptEditor: React.FC<EditorProps> = ({ project, setProject }) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAiEdit = async () => {
    if (!aiPrompt) return;
    setLoading(true);
    const newCode = await generateCode(aiPrompt, project.code);
    if (newCode) {
        setProject(prev => ({ 
            ...prev, 
            code: newCode,
            chatHistory: [
                ...prev.chatHistory,
                { role: 'user', content: `Edit code: ${aiPrompt}` },
                { role: 'model', content: `Updated code based on "${aiPrompt}"` }
            ]
        }));
        setAiPrompt('');
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-[#d4d4d4]">
      {/* Toolbar */}
      <div className="h-12 bg-[#2d2d2d] border-b border-[#3e3e3e] flex items-center px-4 justify-between">
         <div className="flex items-center gap-2">
             <span className="font-retro text-xs text-yellow-500">SCRIPT.JS</span>
         </div>
         
         <div className="flex items-center gap-2">
            <input 
                type="text" 
                placeholder="Ask AI to modify code..."
                className="bg-[#3e3e3e] text-xs px-3 py-1.5 rounded border border-[#555] w-64 focus:border-purple-500 outline-none text-white"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
            />
            <button 
                onClick={handleAiEdit}
                disabled={loading}
                className="bg-purple-700 hover:bg-purple-600 text-white p-1.5 rounded flex items-center gap-2 text-xs font-bold disabled:opacity-50"
            >
                {loading ? <Loader2 size={14} className="animate-spin"/> : <Wand2 size={14} />}
                AI EDIT
            </button>
         </div>
      </div>

      {/* Editor Area - Simplified textarea but styled */}
      <div className="flex-1 relative font-mono text-sm">
        <textarea
            className="w-full h-full bg-[#1e1e1e] p-4 outline-none resize-none leading-relaxed"
            value={project.code}
            onChange={(e) => setProject(p => ({ ...p, code: e.target.value }))}
            spellCheck={false}
        />
      </div>
      
      <div className="h-6 bg-[#007acc] text-white text-[10px] px-2 flex items-center justify-between">
          <span>JavaScript Mode (PICO-8 API Compatible)</span>
          <span>Ln {project.code.split('\n').length}</span>
      </div>
    </div>
  );
};