import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { defaultPrefs } from '../shared/defaults';
import { GamepadConfig, GlobalPrefs } from '../shared/types';

interface PresetState {
  presetName: string | null;
  preset: GamepadConfig | null;
}

const initialPresetState: PresetState = {
  presetName: null,
  preset: null,
};

const presetSlice = createSlice({
  name: 'preset',
  initialState: initialPresetState,
  reducers: {
    updatePreset: (state, action: PayloadAction<{ presetName: string | null; preset: GamepadConfig | null }>) => {
      const { presetName, preset } = action.payload;
      state.presetName = presetName;
      state.preset = preset;
    },
  },
});

export interface MouseState {
  status: 'listening' | 'error' | 'not-listening';
}

const initialMouseState: MouseState = {
  status: 'not-listening',
};

const mouseSlice = createSlice({
  name: 'mouse',
  initialState: initialMouseState,
  reducers: {
    setListening: (state, action: PayloadAction<MouseState['status']>) => {
      state.status = action.payload;
    },
  },
});

const prefsSlice = createSlice({
  name: 'prefs',
  initialState: defaultPrefs,
  reducers: {
    updatePrefs: (state, action: PayloadAction<GlobalPrefs>) => {
      return action.payload;
    },
  },
});

export const store = configureStore({
  reducer: {
    preset: presetSlice.reducer,
    mouse: mouseSlice.reducer,
    prefs: prefsSlice.reducer,
  },
});

export const actions = {
  ...mouseSlice.actions,
  ...presetSlice.actions,
  ...prefsSlice.actions,
};

export const selectors = {
  selectMouse: (state: RootState) => state.mouse,
  selectPreset: (state: RootState) => state.preset,
  selectPrefs: (state: RootState) => state.prefs,
};

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
