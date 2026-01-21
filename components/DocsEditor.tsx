import React, { useState } from 'react';
import { EditorProps } from '../types';
import { generateDocs } from '../services/geminiService';
import { Wand2, Loader2, FileText } from 'lucide-react';

export const DocsEditor: React.FC<EditorProps> = ({ project, setProject }) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAiEdit = async () => {
    if (!aiPrompt) return;
    setLoading(true);
    const newDocs = await generateDocs(aiPrompt, project.docs);
    if (newDocs) {
        setProject(prev => ({ 
            ...prev, 
            docs: newDocs,
            chatHistory: [
                ...prev.chatHistory,
                { role: 'user', content: `Update docs: ${aiPrompt}` },
                { role: 'model', content: `Updated documentation based on "${aiPrompt}"` }
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
             <FileText size={16} className="text-yellow-500" />
             <span className="font-retro text-xs text-yellow-500">README.MD</span>
         </div>
         
         <div className="flex items-center gap-2">
            <input 
                type="text" 
                placeholder="Ask AI to write docs..."
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

      {/* Editor Area */}
      <div className="flex-1 relative font-mono text-sm">
        <textarea
            className="w-full h-full bg-[#1e1e1e] p-8 outline-none resize-none leading-relaxed text-gray-300 font-sans"
            value={project.docs}
            onChange={(e) => setProject(p => ({ ...p, docs: e.target.value }))}
            placeholder="# Write your game documentation here..."
        />
      </div>
      
      <div className="h-6 bg-[#007acc] text-white text-[10px] px-2 flex items-center justify-between">
          <span>Markdown Supported</span>
          <span>Chars: {project.docs.length}</span>
      </div>
    </div>
  );
};
