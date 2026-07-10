import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  deckName: string;
  modelName: string;
  aiApiKey: string;
  imageApiKey: string;
  currentLevel: string;
  targetLevel: string;
  dailyStudyTime: number;
  examGoal: string;
  weakSkills: string[];
  preferredTopics: string[];
  availableDays: string[];
  
  setDeckName: (val: string) => void;
  setModelName: (val: string) => void;
  setAiApiKey: (val: string) => void;
  setImageApiKey: (val: string) => void;
  setCurrentLevel: (val: string) => void;
  setTargetLevel: (val: string) => void;
  setDailyStudyTime: (val: number) => void;
  setExamGoal: (val: string) => void;
  setWeakSkills: (val: string[]) => void;
  setPreferredTopics: (val: string[]) => void;
  setAvailableDays: (val: string[]) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      deckName: "English Vocabulary",
      modelName: "Basic",
      aiApiKey: "",
      imageApiKey: "",
      currentLevel: "B1",
      targetLevel: "B2",
      dailyStudyTime: 30,
      examGoal: "none",
      weakSkills: [],
      preferredTopics: [],
      availableDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],

      setDeckName: (val) => set({ deckName: val }),
      setModelName: (val) => set({ modelName: val }),
      setAiApiKey: (val) => set({ aiApiKey: val }),
      setImageApiKey: (val) => set({ imageApiKey: val }),
      setCurrentLevel: (val) => set({ currentLevel: val }),
      setTargetLevel: (val) => set({ targetLevel: val }),
      setDailyStudyTime: (val) => set({ dailyStudyTime: val }),
      setExamGoal: (val) => set({ examGoal: val }),
      setWeakSkills: (val) => set({ weakSkills: val }),
      setPreferredTopics: (val) => set({ preferredTopics: val }),
      setAvailableDays: (val) => set({ availableDays: val }),
    }),
    {
      name: 'anki-vocab-settings',
    }
  )
);
