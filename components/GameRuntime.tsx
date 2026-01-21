import React, { useRef, useEffect, useState } from 'react';
import { ProjectState } from '../types';
import { PALETTE, MAP_WIDTH, MAP_HEIGHT } from '../constants';
import { audioEngine } from '../services/audioEngine';

interface RuntimeProps {
  project: ProjectState;
  onStop: () => void;
}

export const GameRuntime: React.FC<RuntimeProps> = ({ project, onStop }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameIdRef = useRef<number>(0);
  const keyStateRef = useRef<Record<number, boolean>>({});
  const keyPressStateRef = useRef<Record<number, boolean>>({}); // For one-shot presses
  
  // Game state encapsulation
  const gameStateRef = useRef<any>({}); 

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    
    // Disable smoothing for pixel art (affects drawing images onto canvas)
    ctx.imageSmoothingEnabled = false;

    // Helper: Draw Sprite
    const spr = (id: number, x: number, y: number) => {
        const sprite = project.sprites.find(s => s.id === id);
        if (!sprite) return;
        
        for (let i = 0; i < 64; i++) {
            const colorIdx = sprite.data[i];
            // Skip transparency if index 0 (black in palette)
            if (colorIdx === -1 || colorIdx === 0) continue; 
            
            const px = i % 8;
            const py = Math.floor(i / 8);
            
            ctx.fillStyle = PALETTE[colorIdx];
            ctx.fillRect(Math.floor(x + px), Math.floor(y + py), 1, 1);
        }
    };

    // Helper: Map
    const map = (mx: number, my: number, dx: number, dy: number, w: number, h: number) => {
        for (let iy = 0; iy < h; iy++) {
            for (let ix = 0; ix < w; ix++) {
                const tileIdx = (my + iy) * MAP_WIDTH + (mx + ix);
                const spriteId = project.map.tiles[tileIdx];
                if (spriteId !== -1 && spriteId !== undefined) {
                    spr(spriteId, dx + ix * 8, dy + iy * 8);
                }
            }
        }
    };

    // Helper: Map Get (mget)
    const mget = (tx: number, ty: number) => {
        tx = Math.floor(tx);
        ty = Math.floor(ty);
        if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) return 0;
        const idx = ty * MAP_WIDTH + tx;
        return project.map.tiles[idx] !== -1 ? project.map.tiles[idx] : 0;
    };

    // Helper: Map Set (mset)
    const mset = (tx: number, ty: number, id: number) => {
        tx = Math.floor(tx);
        ty = Math.floor(ty);
        if (tx < 0 || tx >= MAP_WIDTH || ty < 0 || ty >= MAP_HEIGHT) return;
        project.map.tiles[ty * MAP_WIDTH + tx] = id;
    };

    // Helper: Input
    // PICO-8 mapping: 0:Left, 1:Right, 2:Up, 3:Down, 4:Z, 5:X
    const btn = (i: number) => {
        const k = keyStateRef.current;
        switch(i) {
            case 0: return !!k[37]; // Left Arrow
            case 1: return !!k[39]; // Right Arrow
            case 2: return !!k[38]; // Up Arrow
            case 3: return !!k[40]; // Down Arrow
            case 4: return !!k[90]; // Z
            case 5: return !!k[88]; // X
            default: return false;
        }
    };

    const btnp = (i: number) => {
        // Simplified btnp
        return btn(i); 
    };
    
    // Helper: SFX
    const sfx = (id: number) => {
        const sound = project.sounds.find(s => s.id === id);
        if (sound) audioEngine.playSound(sound);
    };

    // Helper: Print
    const print = (text: string, x: number, y: number, color: number = 7) => {
        ctx.fillStyle = PALETTE[color] || '#FFF';
        ctx.font = '10px "Press Start 2P"'; 
        ctx.fillText(String(text), x, y);
    };

    const cls = (color: number = 0) => {
        ctx.fillStyle = PALETTE[color];
        ctx.fillRect(0, 0, 512, 512); // Clear ample space
    };
    
    const log = (msg: any) => console.log(msg);

    // Math Aliases for AI generated code compatibility
    const flr = Math.floor;
    const ceil = Math.ceil;
    const abs = Math.abs;
    const rnd = (x: number = 1) => Math.random() * x;
    const max = Math.max;
    const min = Math.min;
    const sin = Math.sin;
    const cos = Math.cos;

    // Create the Sandbox
    let _init: Function = () => {};
    let _update: Function = () => {};
    let _draw: Function = () => {};

    try {
        // Construct the API context
        const apiNames = [
            'spr', 'map', 'mget', 'mset', 
            'btn', 'btnp', 
            'sfx', 
            'print', 'cls', 'log',
            'flr', 'ceil', 'abs', 'rnd', 'max', 'min', 'sin', 'cos'
        ];
        const apiValues = [
            spr, map, mget, mset, 
            btn, btnp, 
            sfx, 
            print, cls, log,
            flr, ceil, abs, rnd, max, min, sin, cos
        ];
        
        // User code is wrapped in a function that receives API
        const userFunction = new Function(...apiNames, project.code + '\n return { _init: (typeof _init !== "undefined" ? _init : null), _update: (typeof _update !== "undefined" ? _update : null), _draw: (typeof _draw !== "undefined" ? _draw : null) };');
        
        const hooks = userFunction(...apiValues);
        if (hooks._init) _init = hooks._init;
        if (hooks._update) _update = hooks._update;
        if (hooks._draw) _draw = hooks._draw;

        _init(); // Run init immediately

    } catch (err) {
        console.error("Runtime Error in User Code:", err);
        alert("Error in your code! Check console.");
        onStop();
        return;
    }

    // Loop
    const loop = () => {
        try {
            _update();
            _draw();
        } catch (e) {
            console.error(e);
            onStop();
            return;
        }
        
        // Reset "just pressed" if we had that logic
        keyPressStateRef.current = {}; 
        
        frameIdRef.current = requestAnimationFrame(loop);
    };
    frameIdRef.current = requestAnimationFrame(loop);

    // Input listeners
    const handleKeyDown = (e: KeyboardEvent) => {
        keyStateRef.current[e.keyCode] = true;
        keyPressStateRef.current[e.keyCode] = true;
    };
    const handleKeyUp = (e: KeyboardEvent) => {
        keyStateRef.current[e.keyCode] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
        cancelAnimationFrame(frameIdRef.current);
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, [project]); // Re-run if project changes (though usually we don't swap project mid-run, this is okay)

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center p-8">
        <div className="relative max-w-full max-h-full flex flex-col items-center">
            <canvas 
                ref={canvasRef} 
                width={128} 
                height={127} 
                className="bg-black shadow-2xl border-4 border-gray-800"
                style={{ 
                    width: '512', 
                    maxWidth: '100%',
                    aspectRatio: '1/1',
                    imageRendering: 'pixelated'
                }} 
            />
            <button 
                onClick={onStop}
                className="absolute -top-12 right-0 text-red-500 font-retro hover:text-red-400"
            >
                [ ESC to STOP ]
            </button>
        </div>
        <div className="mt-8 text-gray-500 font-retro text-xs text-center">
            <p>ARROWS to Move • Z/X for Actions</p>
        </div>
    </div>
  );
};
