import React, { useState } from 'react';
import { EditorProps } from '../types';
import { PALETTE, MAP_WIDTH, MAP_HEIGHT } from '../constants';
import { Eraser } from 'lucide-react';

export const MapEditor: React.FC<EditorProps> = ({ project, setProject }) => {
  const [selectedSpriteId, setSelectedSpriteId] = useState<number>(0);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleMapClick = (x: number, y: number) => {
    if (x < 0 || x >= MAP_WIDTH || y < 0 || y >= MAP_HEIGHT) return;
    
    const newMap = { ...project.map };
    const newTiles = [...newMap.tiles];
    newTiles[y * MAP_WIDTH + x] = selectedSpriteId;
    
    setProject(prev => ({ ...prev, map: { ...newMap, tiles: newTiles } }));
  };

  const getSpriteData = (id: number) => {
      return project.sprites.find(s => s.id === id)?.data || new Array(64).fill(0);
  };

  // Helper to render a mini sprite on canvas logic
  const renderTilePreview = (spriteId: number) => {
      if (spriteId === -1) return <div className="w-full h-full bg-black" />;
      const data = getSpriteData(spriteId);
      return (
          <div className="w-full h-full grid grid-cols-8">
              {data.map((c, i) => (
                  <div key={i} style={{ backgroundColor: PALETTE[c] }} />
              ))}
          </div>
      )
  }

  return (
    <div className="flex h-full text-white">
      {/* Sprite Selector */}
      <div className="w-48 bg-gray-900 border-r border-gray-700 flex flex-col">
        <div className="p-2 border-b border-gray-700">
            <h3 className="text-xs font-retro text-gray-500 mb-2">Tiles</h3>
            <button 
                onClick={() => setSelectedSpriteId(-1)}
                className={`flex items-center gap-2 p-2 w-full text-sm rounded ${selectedSpriteId === -1 ? 'bg-red-900' : 'bg-gray-800'}`}
            >
                <Eraser size={16} /> Eraser
            </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 grid grid-cols-4 gap-1 content-start">
           {project.sprites.map(sprite => (
             <div 
               key={sprite.id}
               onClick={() => setSelectedSpriteId(sprite.id)}
               className={`aspect-square border cursor-pointer overflow-hidden ${selectedSpriteId === sprite.id ? 'border-yellow-400' : 'border-gray-700'}`}
             >
                 {renderTilePreview(sprite.id)}
             </div>
           ))}
        </div>
      </div>

      {/* Map Grid */}
      <div className="flex-1 overflow-auto bg-[#1a1c2c] p-8 flex justify-center">
         <div 
            className="grid gap-[1px] bg-gray-800 border-4 border-gray-700 shadow-xl"
            style={{ 
                gridTemplateColumns: `repeat(${MAP_WIDTH}, 1fr)`,
                width: `${MAP_WIDTH * 24}px`, // 24px per tile
                height: `${MAP_HEIGHT * 24}px`
            }}
            onMouseLeave={() => setIsDrawing(false)}
         >
             {project.map.tiles.map((tileSpriteId, idx) => {
                 const x = idx % MAP_WIDTH;
                 const y = Math.floor(idx / MAP_WIDTH);
                 return (
                     <div 
                        key={idx}
                        className="w-6 h-6 bg-black/50 hover:border hover:border-white/30 cursor-crosshair"
                        onMouseDown={() => { setIsDrawing(true); handleMapClick(x, y); }}
                        onMouseEnter={() => { if(isDrawing) handleMapClick(x, y); }}
                        onMouseUp={() => setIsDrawing(false)}
                     >
                         {renderTilePreview(tileSpriteId)}
                     </div>
                 );
             })}
         </div>
      </div>
    </div>
  );
};
