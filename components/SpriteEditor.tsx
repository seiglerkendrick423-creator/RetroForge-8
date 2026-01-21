import React, { useState, useRef, useEffect } from 'react';
import { EditorProps, Sprite } from '../types';
import { PALETTE, DEFAULT_SPRITE_SIZE } from '../constants';
import { generateSprite } from '../services/geminiService';
import { Wand2, Eraser, Loader2 } from 'lucide-react';

export const SpriteEditor: React.FC<EditorProps> = ({ project, setProject }) => {
  const [activeSpriteId, setActiveSpriteId] = useState(0);
  const [activeColor, setActiveColor] = useState(7);
  const [isDrawing, setIsDrawing] = useState(false);
  const [genPrompt, setGenPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const activeSprite = project.sprites.find(s => s.id === activeSpriteId) || project.sprites[0];

  const updatePixel = (x: number, y: number) => {
    if (x < 0 || x >= DEFAULT_SPRITE_SIZE || y < 0 || y >= DEFAULT_SPRITE_SIZE) return;
    
    const newSprites = [...project.sprites];
    const spriteIndex = newSprites.findIndex(s => s.id === activeSpriteId);
    if (spriteIndex === -1) return;

    const newData = [...newSprites[spriteIndex].data];
    newData[y * DEFAULT_SPRITE_SIZE + x] = activeColor;
    
    newSprites[spriteIndex] = { ...newSprites[spriteIndex], data: newData };
    setProject(prev => ({ ...prev, sprites: newSprites }));
  };

  const handleCanvasAction = (e: React.MouseEvent<HTMLDivElement>) => {
    // Simple coordinate mapping from DOM to 8x8 grid
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / (rect.width / DEFAULT_SPRITE_SIZE));
    const y = Math.floor((e.clientY - rect.top) / (rect.height / DEFAULT_SPRITE_SIZE));
    updatePixel(x, y);
  };

  const handleGenerate = async () => {
    if (!genPrompt) return;
    setIsGenerating(true);
    const data = await generateSprite(genPrompt);
    if (data && data.length === 64) {
        setProject(prev => {
            const newSprites = [...prev.sprites];
            const spriteIndex = newSprites.findIndex(s => s.id === activeSpriteId);
            if (spriteIndex !== -1) {
                newSprites[spriteIndex] = { ...newSprites[spriteIndex], data };
            }
            return { 
                ...prev, 
                sprites: newSprites,
                chatHistory: [
                    ...prev.chatHistory,
                    { role: 'user', content: `Generate sprite ${activeSpriteId}: ${genPrompt}` },
                    { role: 'model', content: `Generated sprite ${activeSpriteId} based on "${genPrompt}"` }
                ]
            };
        });
        setGenPrompt('');
    }
    setIsGenerating(false);
  };

  return (
    <div className="flex h-full text-white">
      {/* Sprite Selector List */}
      <div className="w-48 bg-gray-900 border-r border-gray-700 overflow-y-auto p-2">
        <h3 className="text-xs font-bold mb-2 uppercase text-gray-500 font-retro">Sprites</h3>
        <div className="grid grid-cols-4 gap-1">
          {project.sprites.map(sprite => (
            <div 
              key={sprite.id}
              onClick={() => setActiveSpriteId(sprite.id)}
              className={`aspect-square border cursor-pointer relative ${activeSpriteId === sprite.id ? 'border-yellow-400' : 'border-gray-700'}`}
            >
               {/* Mini Preview */}
               <div className="w-full h-full grid grid-cols-8">
                  {sprite.data.map((c, i) => (
                      <div key={i} style={{ backgroundColor: PALETTE[c] }} />
                  ))}
               </div>
               <div className="absolute bottom-0 right-0 bg-black/50 text-[8px] px-1">{sprite.id}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col p-4 bg-[#202028] items-center justify-center relative">
        <div className="mb-4 flex items-center gap-2">
           <input 
              type="text" 
              value={activeSprite.name} 
              onChange={(e) => {
                  const newSprites = [...project.sprites];
                  const idx = newSprites.findIndex(s => s.id === activeSpriteId);
                  newSprites[idx].name = e.target.value;
                  setProject(p => ({...p, sprites: newSprites}));
              }}
              className="bg-gray-800 border border-gray-600 px-2 py-1 text-sm rounded font-retro"
           />
           <div className="flex gap-1 ml-4">
              <input 
                 type="text"
                 placeholder="AI: e.g. 'pixel cat'"
                 className="bg-gray-800 text-xs border border-gray-600 px-2 rounded w-40"
                 value={genPrompt}
                 onChange={(e) => setGenPrompt(e.target.value)}
              />
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="bg-purple-600 hover:bg-purple-500 text-white p-1 rounded disabled:opacity-50"
              >
                {isGenerating ? <Loader2 size={16} className="animate-spin"/> : <Wand2 size={16}/>}
              </button>
           </div>
        </div>

        <div 
            className="w-[320px] h-[320px] bg-gray-800 border-4 border-gray-700 grid grid-cols-8 cursor-crosshair shadow-2xl"
            onMouseDown={(e) => { setIsDrawing(true); handleCanvasAction(e); }}
            onMouseMove={(e) => { if(isDrawing) handleCanvasAction(e); }}
            onMouseUp={() => setIsDrawing(false)}
            onMouseLeave={() => setIsDrawing(false)}
        >
            {activeSprite.data.map((colorIndex, idx) => (
                <div 
                    key={idx} 
                    style={{ backgroundColor: PALETTE[colorIndex] }}
                    className="border-[0.5px] border-white/5 hover:border-white/20"
                />
            ))}
        </div>
      </div>

      {/* Palette */}
      <div className="w-32 bg-gray-900 border-l border-gray-700 p-4">
        <h3 className="text-xs font-bold mb-4 uppercase text-gray-500 font-retro">Palette</h3>
        <div className="grid grid-cols-2 gap-2">
            {PALETTE.map((hex, idx) => (
                <button
                    key={idx}
                    onClick={() => setActiveColor(idx)}
                    style={{ backgroundColor: hex }}
                    className={`w-10 h-10 rounded border-2 ${activeColor === idx ? 'border-white scale-110' : 'border-transparent'}`}
                    title={`Color ${idx}`}
                />
            ))}
        </div>
      </div>
    </div>
  );
};