'use client';

import { create } from 'zustand';
import { Tag } from '@/types';

interface CaptureState {
  content: string;
  tags: Tag[];
  title: string;

  // Actions
  setContent: (content: string) => void;
  addTag: (tag: Tag) => void;
  removeTag: (category: string, value: string) => void;
  setTitle: (title: string) => void;
  reset: () => void;
}

const initialState = {
  content: '',
  tags: [] as Tag[],
  title: '',
};

export const useCaptureStore = create<CaptureState>()((set) => ({
  ...initialState,

  setContent: (content) => set({ content }),

  addTag: (tag) => set((state) => {
    // Avoid duplicates
    const exists = state.tags.some(
      (t) => t.category === tag.category && t.value === tag.value
    );
    if (exists) return state;
    return { tags: [...state.tags, tag] };
  }),

  removeTag: (category, value) => set((state) => ({
    tags: state.tags.filter(
      (t) => !(t.category === category && t.value === value)
    ),
  })),

  setTitle: (title) => set({ title }),

  reset: () => set(initialState),
}));
