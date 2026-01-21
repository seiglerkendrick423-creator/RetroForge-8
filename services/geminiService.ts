import { GoogleGenAI } from "@google/genai";
import { Sound, Sprite, ProjectState } from "../types";

const initGenAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.warn("No API_KEY provided for Gemini");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateSprite = async (prompt: string): Promise<number[] | null> => {
  const ai = initGenAI();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a 8x8 pixel art sprite of: ${prompt}. 
      Return ONLY a JSON array of 64 integers (0-15) representing the color palette indices.
      Palette: 0=black, 1=dk_blue, 2=dk_purple, 3=dk_green, 4=brown, 5=dk_grey, 6=lt_grey, 7=white, 8=red, 9=orange, 10=yellow, 11=green, 12=blue, 13=indigo, 14=pink, 15=peach.
      Example: [0,0,1,1,0...]`,
      config: {
        responseMimeType: "application/json",
      }
    });
    
    const text = response.text;
    if (text) {
        return JSON.parse(text);
    }
  } catch (e) {
    console.error("Gemini Sprite Gen Error", e);
  }
  return null;
};

export const generateSound = async (prompt: string): Promise<Partial<Sound> | null> => {
  const ai = initGenAI();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate an 8-bit sound effect configuration for: ${prompt}.
      Return ONLY a JSON object with keys: type (string: 'square', 'sawtooth', 'triangle', 'noise'), frequency (number 50-1000), attack (0-1), decay (0-1), sustain (0-1), release (0-1), volume (0-1).`,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (text) {
        return JSON.parse(text);
    }
  } catch (e) {
    console.error("Gemini Sound Gen Error", e);
  }
  return null;
};

export const generateCode = async (prompt: string, currentCode: string): Promise<string | null> => {
    const ai = initGenAI();
    if (!ai) return null;
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `You are an expert game developer using a PICO-8 style JavaScript API.
        The user wants to update their game code.
        
        Current Code:
        ${currentCode}
        
        User Request:
        ${prompt}
        
        API Reference:
        - _init(), _update(), _draw() are lifecycle hooks.
        - spr(id, x, y) draws a sprite.
        - btn(0..3) returns true if arrow keys (L,R,U,D) are held. btn(4) is Z, btn(5) is X.
        - btnp(i) is button pressed this frame.
        - cls(color) clears screen.
        - print(text, x, y, color) prints text.
        - map(mx, my, dx, dy, w, h) draws map tiles.
        - sfx(id) plays sound.
        - mget(tx, ty) get tile id. mset(tx, ty, id) set tile id.
        
        Return ONLY the updated full code as a plain string. Do not use markdown blocks.`,
      });
  
      const text = response.text;
      return text || null;
    } catch (e) {
      console.error("Gemini Code Gen Error", e);
    }
    return null;
  };

export const generateDocs = async (prompt: string, currentDocs: string): Promise<string | null> => {
    const ai = initGenAI();
    if (!ai) return null;
  
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `You are a technical writer for a retro game project.
        User Request: ${prompt}
        
        Current Documentation:
        ${currentDocs}
        
        Return the updated documentation in Markdown format. Return ONLY the markdown.`,
      });
  
      const text = response.text;
      return text || null;
    } catch (e) {
      console.error("Gemini Docs Gen Error", e);
    }
    return null;
  };

export interface AgentResponse {
  message: string;
  updates?: {
    code?: string;
    docs?: string;
    sprites?: Partial<Sprite>[];
    map?: { tiles: number[] };
    sounds?: Partial<Sound>[];
  }
}

export const agentChat = async (
  userMessage: string, 
  history: { role: string, content: string }[],
  currentProject: ProjectState
): Promise<AgentResponse | null> => {
  const ai = initGenAI();
  if (!ai) return null;

  // Summarize project state to save tokens, but enough for context
  const projectSummary = JSON.stringify({
    codeSample: currentProject.code.substring(0, 500) + "...",
    spriteCount: currentProject.sprites.length,
    mapSample: currentProject.map.tiles.slice(0, 20),
    soundCount: currentProject.sounds.length
  });

  const prompt = `
  You are 'RetroForge Agent', an expert AI game engine capable of creating full retro games (PICO-8 style).
  
  User Input: "${userMessage}"
  
  Chat History:
  ${history.map(m => `${m.role}: ${m.content}`).join('\n')}
  
  Current Project State (Summary): ${projectSummary}

  Game Documentation / Rules (Use this as context if relevant):
  ${currentProject.docs}
  
  Your Goal:
  Understand the user's request (e.g., "Make a pong game", "Fix the movement", "Make sprite 0 a cat") and return a JSON response containing a message to the user and DIRECT UPDATES to the project assets.
  
  Capabilities:
  - Sprites: 8x8 grid, colors 0-15.
  - Map: 32x16 grid of sprite IDs.
  - Code: Javascript with specific API:
    - _init(), _update(), _draw()
    - spr(id, x, y), map(mx, my, dx, dy, w, h), cls(c), print(t,x,y,c), btn(i), sfx(id)
    - Globals: x,y,t, etc.
  
  RESPONSE FORMAT (JSON ONLY):
  {
    "message": "Friendly response describing what you did.",
    "updates": {
      "code": "FULL updated javascript code here (optional)",
      "docs": "Updated documentation markdown (optional)",
      "sprites": [ { "id": 0, "data": [0,1,...], "name": "ball" } ] (optional list of sprites to update),
      "map": { "tiles": [0,0,1...] } (optional map data, length 512),
      "sounds": [ { "id": 0, "type": "square", ... } ] (optional sounds)
    }
  }
  
  IMPORTANT:
  - If asked to create a game, generate ALL necessary assets: Code, Sprites (draw them in the data array), and Map.
  - Provide VALID working code that matches the sprites you generate.
  - Be creative!
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text) as AgentResponse;
    }
  } catch (e) {
    console.error("Agent Chat Error", e);
  }
  return null;
};
