import React, { useState, useEffect, useRef } from 'react';
import { 
  ProjectState, 
  ToolMode, 
  Sprite, 
} from './types';
import { 
  INITIAL_SPRITES, 
  INITIAL_MAP, 
  INITIAL_SOUNDS, 
  INITIAL_MUSIC, 
  DEFAULT_CODE, 
  DEFAULT_DOCS,
  PALETTE,
  INITIAL_HISTORY
} from './constants';
import { SpriteEditor } from './components/SpriteEditor';
import { MapEditor } from './components/MapEditor';
import { ScriptEditor } from './components/ScriptEditor';
import { SoundEditor } from './components/SoundEditor';
import { AgentMode } from './components/AgentMode';
import { DocsEditor } from './components/DocsEditor';
import { GameRuntime } from './components/GameRuntime';
import { 
  Code, 
  Grid3X3, 
  Image as ImageIcon, 
  Music, 
  Play, 
  Save, 
  Upload,
  Volume2,
  Bot,
  FileText
} from 'lucide-react';

const App = () => {
  const [project, setProject] = useState<ProjectState>({
    sprites: INITIAL_SPRITES,
    map: INITIAL_MAP,
    code: DEFAULT_CODE,
    docs: DEFAULT_DOCS,
    sounds: INITIAL_SOUNDS,
    music: INITIAL_MUSIC,
    palette: PALETTE,
    chatHistory: INITIAL_HISTORY
  });

  const [mode, setMode] = useState<ToolMode>(ToolMode.SPRITE);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Prevent spacebar scrolling when in app
    window.addEventListener('keydown', (e) => {
      if(e.code === 'Space' && e.target === document.body) e.preventDefault();
    });
  }, []);

  const handleSaveCart = () => {
      // JSON stringify automatically includes all fields in ProjectState, including 'docs'
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(project));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "game.json");
      document.body.appendChild(downloadAnchorNode); // required for firefox
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
  };

  const handleLoadCart = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const text = e.target?.result as string;
              const loadedProject = JSON.parse(text);
              // Basic validation to ensure it looks like a project
              if (loadedProject.sprites && loadedProject.code) {
                  // Ensure chat history exists if loading old file
                  if (!Array.isArray(loadedProject.chatHistory)) {
                      loadedProject.chatHistory = INITIAL_HISTORY;
                  }
                  
                  // Ensure docs exist (check for type string specifically to allow empty docs)
                  if (typeof loadedProject.docs !== 'string') {
                      loadedProject.docs = DEFAULT_DOCS;
                  }
                  
                  setProject(loadedProject);
                  alert("Cart loaded successfully!");
              } else {
                  alert("Invalid cart file.");
              }
          } catch (err) {
              console.error("Failed to load cart", err);
              alert("Error reading file.");
          }
      };
      reader.readAsText(file);
      // Reset input
      event.target.value = '';
  };

  const renderActiveTool = () => {
    switch (mode) {
      case ToolMode.SPRITE:
        return <SpriteEditor project={project} setProject={setProject} />;
      case ToolMode.MAP:
        return <MapEditor project={project} setProject={setProject} />;
      case ToolMode.CODE:
        return <ScriptEditor project={project} setProject={setProject} />;
      case ToolMode.DOCS:
        return <DocsEditor project={project} setProject={setProject} />;
      case ToolMode.SFX:
        return <SoundEditor project={project} setProject={setProject} />;
      case ToolMode.AGENT:
        return <AgentMode project={project} setProject={setProject} />;
      case ToolMode.MUSIC:
        return <div className="flex items-center justify-center h-full text-gray-500 font-retro">Music Tracker Coming Soon...</div>;
      default:
        return null;
    }
  };

  const NavButton = ({ m, icon: Icon, label }: { m: ToolMode, icon: any, label: string }) => (
      <button 
        onClick={() => setMode(m)}
        className={`flex flex-col items-center justify-center p-3 w-20 transition-all ${mode === m ? 'bg-[#ff004d] text-white shadow-lg scale-105' : 'text-gray-400 hover:text-white hover:bg-white/10'}`}
      >
          <Icon size={24} className="mb-1" />
          <span className="text-[10px] font-bold font-retro">{label}</span>
      </button>
  );

  return (
    <div className="h-screen w-screen flex flex-col bg-[#1a1c2c] overflow-hidden">
      
      {/* Header */}
      <div className="h-12 bg-[#101015] border-b border-gray-800 flex items-center justify-between px-4 z-10">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded flex items-center justify-center font-retro text-white font-bold text-xs shadow-lg">
                 8
             </div>
             <h1 className="text-white font-retro text-sm tracking-widest text-shadow">RETROFORGE</h1>
          </div>
          
          <div className="flex gap-2">
             <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleLoadCart} 
                className="hidden" 
                accept=".json"
             />
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1 rounded text-xs font-retro flex items-center gap-2 border border-gray-700"
             >
                 <Upload size={14}/> LOAD
             </button>
             <button 
                onClick={handleSaveCart}
                className="bg-blue-900 hover:bg-blue-800 text-blue-100 px-3 py-1 rounded text-xs font-retro flex items-center gap-2"
             >
                 <Save size={14}/> SAVE
             </button>
             <button 
                onClick={() => setMode(ToolMode.RUN)}
                className="bg-green-600 hover:bg-green-500 text-white px-4 py-1 rounded text-xs font-retro flex items-center gap-2 shadow-[0_4px_0_rgb(21,128,61)] active:shadow-none active:translate-y-[4px] transition-all"
             >
                 <Play size={14} fill="currentColor"/> RUN GAME
             </button>
          </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
         {/* Sidebar Navigation */}
         <div className="w-20 bg-[#14151e] border-r border-gray-800 flex flex-col items-center py-4 gap-2 z-10">
             <NavButton m={ToolMode.AGENT} icon={Bot} label="AGENT" />
             <div className="w-10 h-px bg-gray-800 my-2"></div>
             <NavButton m={ToolMode.SPRITE} icon={ImageIcon} label="SPR" />
             <NavButton m={ToolMode.MAP} icon={Grid3X3} label="MAP" />
             <NavButton m={ToolMode.SFX} icon={Volume2} label="SFX" />
             <NavButton m={ToolMode.MUSIC} icon={Music} label="MUS" />
             <NavButton m={ToolMode.CODE} icon={Code} label="LUA" />
             <NavButton m={ToolMode.DOCS} icon={FileText} label="DOCS" />
         </div>

         {/* Tool Area */}
         <div className="flex-1 bg-[#202028] relative">
            {renderActiveTool()}
         </div>
      </div>

      {/* Runtime Overlay */}
      {mode === ToolMode.RUN && (
        <GameRuntime project={project} onStop={() => setMode(ToolMode.CODE)} />
      )}
    </div>
  );
};

export default App;