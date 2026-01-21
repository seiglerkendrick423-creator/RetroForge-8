import React, { useState } from 'react';
import { EditorProps, Sound } from '../types';
import { audioEngine } from '../services/audioEngine';
import { generateSound } from '../services/geminiService';
import { Play, Wand2, Loader2, Volume2 } from 'lucide-react';

export const SoundEditor: React.FC<EditorProps> = ({ project, setProject }) => {
  const [selectedSoundId, setSelectedSoundId] = useState(0);
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  const activeSound = project.sounds.find(s => s.id === selectedSoundId) || project.sounds[0];

  const updateSound = (updates: Partial<Sound>) => {
    setProject(prev => {
        const newSounds = [...prev.sounds];
        const idx = newSounds.findIndex(s => s.id === selectedSoundId);
        if (idx !== -1) {
            newSounds[idx] = { ...newSounds[idx], ...updates };
        }
        return { ...prev, sounds: newSounds };
    });
  };

  const handlePlay = (soundOverride?: Sound) => {
    audioEngine.playSound(soundOverride || activeSound);
  };

  const handleGenerate = async () => {
      if(!prompt) return;
      setGenerating(true);
      const data = await generateSound(prompt);
      if(data) {
        // Update sound and history
        setProject(prev => {
            const newSounds = [...prev.sounds];
            const idx = newSounds.findIndex(s => s.id === selectedSoundId);
            if (idx !== -1) {
                newSounds[idx] = { ...newSounds[idx], ...data };
            }
            return { 
                ...prev, 
                sounds: newSounds,
                chatHistory: [
                    ...prev.chatHistory,
                    { role: 'user', content: `Generate sound ${selectedSoundId}: ${prompt}` },
                    { role: 'model', content: `Generated sound ${selectedSoundId} based on "${prompt}"` }
                ]
            };
        });
        
        // Play the generated sound immediately
        handlePlay({ ...activeSound, ...data });
        setPrompt('');
      }
      setGenerating(false);
  }

  const Slider = ({ label, value, min, max, step, onChange, unit = '' }: any) => (
      <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-400 mb-1 font-retro">
              <label>{label}</label>
              <span>{value}{unit}</span>
          </div>
          <input 
            type="range" min={min} max={max} step={step} value={value} 
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full accent-green-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
      </div>
  );

  return (
    <div className="flex h-full text-white bg-[#1a1c2c]">
      {/* List */}
      <div className="w-48 bg-gray-900 border-r border-gray-700 p-2">
         <h3 className="text-xs font-bold mb-2 uppercase text-gray-500 font-retro">SFX Bank</h3>
         <div className="space-y-1">
             {project.sounds.map(s => (
                 <div 
                    key={s.id}
                    onClick={() => setSelectedSoundId(s.id)}
                    className={`p-2 text-xs font-mono cursor-pointer flex justify-between items-center rounded ${selectedSoundId === s.id ? 'bg-green-900 text-green-100' : 'hover:bg-gray-800 text-gray-400'}`}
                 >
                     <span>{s.id.toString().padStart(2, '0')} {s.name || 'Untitled'}</span>
                     {selectedSoundId === s.id && <Volume2 size={12} />}
                 </div>
             ))}
         </div>
      </div>

      {/* Controls */}
      <div className="flex-1 p-8 overflow-y-auto">
         <div className="max-w-2xl mx-auto bg-gray-800 p-6 rounded-lg border border-gray-700 shadow-xl">
             <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
                 <input 
                    className="bg-transparent text-xl font-retro text-green-400 focus:outline-none"
                    value={activeSound.name}
                    onChange={(e) => updateSound({ name: e.target.value })}
                 />
                 <button 
                    onClick={() => handlePlay()}
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold font-retro flex items-center gap-2"
                 >
                     <Play size={16} fill="white" /> TEST
                 </button>
             </div>

             {/* AI Gen */}
             <div className="bg-gray-900/50 p-4 rounded mb-8 border border-gray-700">
                 <div className="flex items-center gap-2 mb-2 text-purple-400 font-retro text-[10px] uppercase">
                     <Wand2 size={12} /> AI Sound Generator
                 </div>
                 <div className="flex gap-2">
                     <input 
                        placeholder="Describe sound (e.g. 'retro jump', 'explosion', 'coin')" 
                        className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm focus:border-purple-500 outline-none transition-colors"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                     />
                     <button 
                        onClick={handleGenerate}
                        disabled={generating}
                        className="bg-purple-600 hover:bg-purple-500 px-4 rounded text-white disabled:opacity-50 font-bold text-xs font-retro flex items-center gap-2"
                     >
                         {generating ? <Loader2 className="animate-spin" size={14} /> : <Wand2 size={14} />}
                         GENERATE
                     </button>
                 </div>
             </div>

             <div className="grid grid-cols-2 gap-8">
                 <div>
                     <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase">Oscillator</h4>
                     <div className="flex gap-2 mb-4">
                         {['square', 'sawtooth', 'triangle', 'noise'].map((t) => (
                             <button
                                key={t}
                                onClick={() => updateSound({ type: t as any })}
                                className={`flex-1 py-2 text-[10px] uppercase rounded border ${activeSound.type === t ? 'bg-green-600 border-green-400' : 'bg-gray-700 border-gray-600 hover:bg-gray-600'}`}
                             >
                                 {t.substring(0, 4)}
                             </button>
                         ))}
                     </div>
                     <Slider label="Frequency" value={activeSound.frequency} min={50} max={2000} step={10} onChange={(v: number) => updateSound({ frequency: v })} unit="Hz" />
                     <Slider label="Volume" value={activeSound.volume} min={0} max={1} step={0.01} onChange={(v: number) => updateSound({ volume: v })} />
                 </div>
                 
                 <div>
                     <h4 className="text-sm font-bold text-gray-500 mb-4 uppercase">Envelope (ADSR)</h4>
                     <Slider label="Attack" value={activeSound.attack} min={0} max={1} step={0.01} onChange={(v: number) => updateSound({ attack: v })} unit="s" />
                     <Slider label="Decay" value={activeSound.decay} min={0} max={1} step={0.01} onChange={(v: number) => updateSound({ decay: v })} unit="s" />
                     <Slider label="Sustain" value={activeSound.sustain} min={0} max={1} step={0.01} onChange={(v: number) => updateSound({ sustain: v })} />
                     <Slider label="Release" value={activeSound.release} min={0} max={1} step={0.01} onChange={(v: number) => updateSound({ release: v })} unit="s" />
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
};