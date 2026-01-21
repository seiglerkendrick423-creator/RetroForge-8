import { Sprite, Sound, MusicTrack, MapData } from './types';

// PICO-8 Palette
export const PALETTE = [
  '#000000', // 0: Black
  '#1D2B53', // 1: Dark Blue
  '#7E2553', // 2: Dark Purple
  '#008751', // 3: Dark Green
  '#AB5236', // 4: Brown
  '#5F574F', // 5: Dark Grey
  '#C2C3C7', // 6: Light Grey
  '#FFF1E8', // 7: White
  '#FF004D', // 8: Red
  '#FFA300', // 9: Orange
  '#FFEC27', // 10: Yellow
  '#00E436', // 11: Green
  '#29ADFF', // 12: Blue
  '#83769C', // 13: Indigo
  '#FF77A8', // 14: Pink
  '#FFCCAA', // 15: Peach
];

export const DEFAULT_SPRITE_SIZE = 8;
export const MAP_WIDTH = 32;
export const MAP_HEIGHT = 16;

export const DEFAULT_CODE = `
// RetroForge-8 Game Loop
// Global variables:
// x, y: Player position
// t: Time

let x = 64;
let y = 64;
let t = 0;

// _init() is called once at start
function _init() {
  log("Game Started!");
}

// _update() is called 60 times per second
function _update() {
  t++;
  
  // Movement
  if (btn(0)) x -= 1; // Left
  if (btn(1)) x += 1; // Right
  if (btn(2)) y -= 1; // Up
  if (btn(3)) y += 1; // Down
  
  // Play sound on button press
  if (btnp(4)) sfx(0); // Z key
}

// _draw() is called after update
function _draw() {
  cls(0); // Clear screen with color 0 (black)
  
  // Draw map
  map(0, 0, 0, 0, 32, 16);
  
  // Draw player sprite (sprite 0)
  spr(0, x, y);
  
  // Draw some text
  print("RetroForge-8", 40, 10, 7);
  print("Use Arrows to Move", 30, 110, 6);
  print("Z to Jump/SFX", 40, 120, 6);
}
`.trim();

export const DEFAULT_DOCS = `# Game Design Document

## Title: My Retro Game
## Genre: Platformer / Action

## Core Mechanics
- Player can move left/right and jump.
- Collect coins to increase score.
- Avoid enemies (spikes, monsters).

## Characters
- Hero: Small adventurer.
- Enemy: Green Slime.

## Levels
- Level 1: Forest
- Level 2: Dungeon
`.trim();

export const INITIAL_SPRITES: Sprite[] = Array.from({ length: 64 }, (_, i) => ({
  id: i,
  name: `Sprite ${i}`,
  data: new Array(64).fill(0), // Empty 8x8 sprite
}));

// Pre-fill sprite 0 with a simple smiley face
const SMILEY_DATA = new Array(64).fill(0);
[
  [2,3], [5,3],
  [1,5], [6,5],
  [2,6], [3,6], [4,6], [5,6]
].forEach(([x, y]) => {
  SMILEY_DATA[y * 8 + x] = 10; // Yellow
});
INITIAL_SPRITES[0].data = SMILEY_DATA;

export const INITIAL_MAP: MapData = {
  width: MAP_WIDTH,
  height: MAP_HEIGHT,
  tiles: new Array(MAP_WIDTH * MAP_HEIGHT).fill(-1),
};

export const INITIAL_SOUNDS: Sound[] = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  name: `SFX ${i}`,
  type: 'square',
  frequency: 440,
  attack: 0.01,
  decay: 0.1,
  sustain: 0.1,
  release: 0.1,
  volume: 0.5,
}));

export const INITIAL_MUSIC: MusicTrack[] = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  name: `Pattern ${i}`,
  notes: [],
  speed: 16,
}));

export const INITIAL_HISTORY = [
    { role: 'model', content: "Hello! I'm the RetroForge Agent. I can build games, draw sprites, write code, and compose sounds for you. Try asking: 'Make a space shooter game' or 'Create a mario-style platformer'." }
];