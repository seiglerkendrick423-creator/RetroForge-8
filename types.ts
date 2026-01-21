import React from 'react';

export interface Sprite {
  id: number;
  data: number[]; // 8x8 grid, 64 integers representing color indices
  name: string;
}

export interface MapData {
  width: number;
  height: number;
  tiles: number[]; // Array of sprite IDs
}

export interface Sound {
  id: number;
  name: string;
  type: 'square' | 'sawtooth' | 'triangle' | 'sine' | 'noise';
  frequency: number;
  attack: number;
  decay: number;
  sustain: number;
  release: number;
  volume: number;
}

export interface MusicTrack {
  id: number;
  name: string;
  notes: { note: number; duration: number; instrument: number }[];
  speed: number;
}

export interface ChatMessage {
  role: string;
  content: string;
}

export interface ProjectState {
  sprites: Sprite[];
  map: MapData;
  code: string;
  docs: string;
  sounds: Sound[];
  music: MusicTrack[];
  palette: string[];
  chatHistory: ChatMessage[];
}

export enum ToolMode {
  CODE = 'CODE',
  SPRITE = 'SPRITE',
  MAP = 'MAP',
  SFX = 'SFX',
  MUSIC = 'MUSIC',
  DOCS = 'DOCS',
  RUN = 'RUN',
  AGENT = 'AGENT',
}

export interface EditorProps {
  project: ProjectState;
  setProject: React.Dispatch<React.SetStateAction<ProjectState>>;
}