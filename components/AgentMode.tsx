import React, { useState, useRef, useEffect } from 'react';
import { EditorProps, ProjectState } from '../types';
import { agentChat, AgentResponse } from '../services/geminiService';
import { Bot, Send, Loader2, Sparkles, Terminal } from 'lucide-react';

export const AgentMode: React.FC<EditorProps> = ({ project, setProject }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [project.chatHistory, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    
    // Optimistic update
    const newHistory = [...project.chatHistory, { role: 'user', content: userMsg }];
    setProject(p => ({ ...p, chatHistory: newHistory }));
    
    setLoading(true);

    try {
      const response = await agentChat(userMsg, newHistory, project);

      if (response) {
        // Apply updates
        setProject(prev => {
            const next = { ...prev };
            
            // Apply Updates
            if (response.updates) {
               if (response.updates?.code) {
                   next.code = response.updates.code;
               }

               if (response.updates?.docs) {
                   next.docs = response.updates.docs;
               }

               if (response.updates?.sprites) {
                   const newSprites = [...next.sprites];
                   response.updates.sprites.forEach(update => {
                       if (update.id !== undefined) {
                           const idx = newSprites.findIndex(s => s.id === update.id);
                           if (idx !== -1) {
                               newSprites[idx] = { ...newSprites[idx], ...update } as any;
                           }
                       }
                   });
                   next.sprites = newSprites;
               }

               if (response.updates?.map) {
                   next.map = { ...next.map, ...response.updates.map };
               }

               if (response.updates?.sounds) {
                   const newSounds = [...next.sounds];
                   response.updates.sounds.forEach(update => {
                       if (update.id !== undefined) {
                           const idx = newSounds.findIndex(s => s.id === update.id);
                           if (idx !== -1) {
                               newSounds[idx] = { ...newSounds[idx], ...update } as any;
                           }
                       }
                   });
                   next.sounds = newSounds;
               }
            }

            // Append Agent Message to history
            next.chatHistory = [...newHistory, { role: 'model', content: response.message }];
            
            return next;
        });

      } else {
        setProject(prev => ({
            ...prev,
            chatHistory: [...newHistory, { role: 'model', content: "Sorry, I encountered an error processing your request." }]
        }));
      }
    } catch (e) {
      console.error(e);
      setProject(prev => ({
          ...prev,
          chatHistory: [...newHistory, { role: 'model', content: "System Error." }]
      }));
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#1a1c2c] text-white font-mono">
      {/* Header */}
      <div className="p-4 border-b border-gray-700 bg-[#14151e] flex items-center gap-2">
         <Bot className="text-purple-400" />
         <h2 className="text-sm font-bold font-retro text-purple-100">AGENT MODE</h2>
         <span className="text-[10px] bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded ml-auto">GEMINI 3 PRO POWERED</span>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
        {project.chatHistory.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`max-w-[80%] rounded-lg p-3 text-sm shadow-md ${
                msg.role === 'user' 
                  ? 'bg-blue-900/80 text-blue-50 border border-blue-700' 
                  : 'bg-gray-800 text-gray-200 border border-gray-700'
              }`}
            >
              {msg.role === 'model' && <div className="flex items-center gap-2 mb-1 text-purple-400 font-bold text-xs"><Sparkles size={12}/> AGENT</div>}
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
             <div className="bg-gray-800 rounded-lg p-4 flex items-center gap-3 border border-gray-700">
                 <Loader2 className="animate-spin text-purple-400" size={16} />
                 <span className="text-xs text-gray-400 animate-pulse">Generating game assets...</span>
             </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#14151e] border-t border-gray-700">
         <div className="relative">
             <div className="absolute left-3 top-3 text-gray-500">
                 <Terminal size={16} />
             </div>
             <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Describe a game to create (e.g., 'Make a dungeon crawler with a goblin sprite')..."
                className="w-full bg-[#0d0e15] border border-gray-700 rounded-lg py-3 pl-10 pr-12 focus:outline-none focus:border-purple-500 text-sm text-white placeholder-gray-600 shadow-inner"
             />
             <button 
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="absolute right-2 top-2 bg-purple-600 hover:bg-purple-500 text-white p-1.5 rounded disabled:opacity-50 transition-colors"
             >
                 <Send size={16} />
             </button>
         </div>
         <div className="text-[10px] text-gray-500 mt-2 text-center font-retro">
             AI can modify Code, Sprites, Map, Sound and Docs instantly.
         </div>
      </div>
    </div>
  );
};
