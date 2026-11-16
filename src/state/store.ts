/**
 * Zustand стейт с localStorage и query-sync - упрощённая версия для MVP
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { GPU, Model, Quantization, Engine, CPU } from '../data/loader';

// Заглушки для загрузки каталогов (в реальном приложении — из файлов)
const _loadGpus = () => [] as any;
const _loadModels = () => [] as any;
const _loadQuantizations = () => [] as any;
const _loadEngines = () => [] as any;
const _loadCpus = () => [] as any;

// Типы каталогов из loader.ts (без full typing)
export interface GpuCatalogEntry extends Omit<GPU, 'id'> { id: string; }
export interface ModelCatalogEntry extends Omit<Model, 'id'> { id: string; }
export interface QuantizationCatalogEntry extends Omit<Quantization, 'id'> { id: string; }
export interface EngineCatalogEntry extends Omit<Engine, 'id'> { id: string; }
export interface CpuCatalogEntry extends Omit<CPU, 'id'> { id: string; }

// Типы формы для режима A и B
export interface ModeAFormState {
  gpu?: string;
  nGpu?: number | null;
  quantizationId?: string;
  engineId?: string;
  contextTokens?: string;
  userCount?: string;
  validationErrors?: Record<string, string>;
}

export interface ModeBFormState {
  modelId?: string;
  gpuId?: string;
  nGpu?: number | null;
  quantizationId?: string;
  engineId?: string;
  contextTokens?: string;
  userCount?: string;
  validationErrors?: Record<string, string>;
}

/**
 * Упрощённая версия AppState без конфликта inheritance
 */
export interface AppState {
  // Каталог GPU
  gpus: GpuCatalogEntry[];
  
  // Каталог моделей
  models: ModelCatalogEntry[];
  
  // Каталог квантизаций
  quantizations: QuantizationCatalogEntry[];
  
  // Каталог движков
  engines: EngineCatalogEntry[];
  
  // Каталог CPU
  cpus: CpuCatalogEntry[];
  
  // Текущий режим
  mode: 'A' | 'B';
  
  // Стейт формы режима A
  modeAForm: ModeAFormState;
  
  // Стейт формы режима B (опционально)
  modeBForm?: ModeBFormState;
  
  // Результаты расчёта для модели (только режим B)
  modelConfig?: {
    min?: GPU[];
    optimal?: GPU[];
    max?: GPU[];
    status?: 'CONFIGURED' | 'IMPOSSIBLE';
    recommendations?: string[];
    optimalEqualsMax?: boolean;
  };
  
  // Статус загрузки данных
  loading: boolean;
  
  // Ошибки загрузки
  error: string | null;
}

/** Actions для режима A */
export interface ModeAActions {
  setModeAForm: (data: Partial<ModeAFormState>) => void;
  resetModeAForm: () => void;
  validateInputs: () => Record<string, string>;
}

/** Actions для режима B */
export interface ModeBActions {
  setModeBForm: (data: Partial<ModeBFormState>) => void;
  resetModeBForm: () => void;
  validateInputs: () => Record<string, string>;
  calculateConfigs: (modelId: string) => Promise<void>;
}

/** Actions для каталога */
export interface CatalogActions {
  setGpus: (gpus: GpuCatalogEntry[]) => void;
  setModels: (models: ModelCatalogEntry[]) => void;
  setQuantizations: (quantizations: QuantizationCatalogEntry[]) => void;
  setEngines: (engines: EngineCatalogEntry[]) => void;
  setCpus: (cpus: CpuCatalogEntry[]) => void;
}

/** Общие actions */
export interface GeneralActions {
  setMode: (mode: 'A' | 'B') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  resetAll: () => void;
}

// Объединяем все actions
export type AppActions = ModeAActions & ModeBActions & CatalogActions & GeneralActions;

/** Инициализация каталога из файлов */
async function initializeCatalog(): Promise<void> {
  try {
    // Пути к файлам данных (относительно public/data)
    const gpuFilePath = '/data/gpus.json';
    const modelFilePath = '/data/models.json';
    const quantizationFilePath = '/data/quantizations.json';
    const engineFilePath = '/data/engines.json';
    const cpuFilePath = '/data/cpus.json';
    
    // Загружаем каталоги (в реальном приложении — через import.meta.resolve)
    // Для MVP: используем имитацию загрузки
    
    // В реальном приложении это было бы:
    // const gpus = await import(gpuFilePath);
    // Но здесь упрощённо — данные будут загружены при первом рендере
    
  } catch (error) {
    console.error('Error initializing catalog:', error);
  }
}

/**
 * Создаём store Zustand с persist и query-sync
 */
export const useAppStore = create<AppState & AppActions>((set, get) => ({
  // Default values for catalog
  gpus: [],
  models: [],
  quantizations: [],
  engines: [],
  cpus: [],
  
  mode: 'A',
  
  modeAForm: {
    gpuId: '',
    nGpu: null,
    quantizationId: '',
    engineId: '',
    contextTokens: '',
    userCount: ''
  },
  
  modeBForm: {
    modelId: '',
    gpuId: '',
    nGpu: null,
    quantizationId: '',
    engineId: '',
    contextTokens: '',
    userCount: ''
  },
  
  modelConfig: undefined,
  
  loading: true,
  error: null,
  
  // Actions for Mode A
  setModeAForm: (data) => set(state => ({
    modeAForm: { ...state.modeAForm, ...data }
  })),
  
  resetModeAForm: () => set(state => ({
    modeAForm: {
      gpuId: '',
      nGpu: null,
      quantizationId: '',
      engineId: '',
      contextTokens: '',
      userCount: ''
    }
  })),
  
  validateInputs: () => {
    const { modeAForm } = get();
    const errors: Record<string, string> = {};
    
    if (!modeAForm.gpu) {
      errors.gpu = 'Выберите GPU';
    }
    if (!modeAForm.contextTokens) {
      errors.contextTokens = 'Укажите контекстные токены';
    }
    if (!modeAForm.userCount) {
      errors.userCount = 'Укажите количество пользователей';
    }
    
    return errors;
  },
  
  loadModelsForGpu: async (gpuId: string) => {
    // В реальном приложении: filter models by GPU compatibility
    console.log('Loading models for GPU:', gpuId);
  },
  
  setModeBForm: (data) => set(state => ({
    modeBForm: { ...(state.modeBForm || {}), ...data }
  })),
  
  resetModeBForm: () => set(state => ({
    modeBForm: {
      modelId: '',
      gpuId: '',
      nGpu: null,
      quantizationId: '',
      engineId: '',
      contextTokens: '',
      userCount: ''
    }
  })),
  
  validateInputsModeB: () => {
    const { modeBForm } = get();
    const errors: Record<string, string> = {};
    
    if (!modeBForm.modelId) {
      errors.modelId = 'Выберите модель';
    }
    if (!modeBForm.gpuId) {
      errors.gpuId = 'Выберите GPU';
    }
    if (!modeBForm.contextTokens) {
      errors.contextTokens = 'Укажите контекстные токены';
    }
    if (!modeBForm.userCount) {
      errors.userCount = 'Укажите количество пользователей';
    }
    
    return errors;
  },
  
  calculateConfigs: async (modelId: string) => {
    const { modeBForm, models, quantizations, engines, gpus } = get();
    
    if (!modelId || !modeBForm.gpuId) {
      console.warn('Missing required fields for calculateConfigs');
      return;
    }
    
    // В реальном приложении: вызывать calculateConfigs из calc/calculate-configs
    console.log('Calculating configs for model:', modelId);
  },
  
  // Actions for catalog
  setGpus: (gpus) => set({ gpus }),
  setModels: (models) => set({ models }),
  setQuantizations: (quantizations) => set({ quantizations }),
  setEngines: (engines) => set({ engines }),
  setCpus: (cpus) => set({ cpus }),
  
  // General actions
  setMode: (mode) => set({ mode }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  
  resetAll: () => set({
    gpus: [],
    models: [],
    quantizations: [],
    engines: [],
    cpus: [],
    mode: 'A',
    modeAForm: {
      gpu: '',
      nGpu: null,
      quantizationId: '',
      engineId: '',
      contextTokens: '',
      userCount: ''
    },
    modeBForm: {
      modelId: '',
      gpuId: '',
      nGpu: null,
      quantizationId: '',
      engineId: '',
      contextTokens: '',
      userCount: ''
    },
    modelConfig: undefined,
    loading: false,
    error: null
  })
}));

/**
 * Экспорт каталога в localStorage (для persistence)
 */
export async function exportCatalogToStorage(): Promise<void> {
  const state = useAppStore.getState();
  
  try {
    const storageData = {
      gpus: state.gpus,
      models: state.models,
      quantizations: state.quantizations,
      engines: state.engines,
      cpus: state.cpus
    };
    
    localStorage.setItem('ai_calculator_catalog', JSON.stringify(storageData));
  } catch (error) {
    console.error('Error exporting catalog:', error);
  }
}

/**
 * Импорт каталога из localStorage
 */
export async function importCatalogFromStorage(): Promise<void> {
  const storageData = localStorage.getItem('ai_calculator_catalog');
  
  if (!storageData) {
    return;
  }
  
  try {
    const data = JSON.parse(storageData);
    
    useAppStore.getState().setGpus(data.gpus || []);
    useAppStore.getState().setModels(data.models || []);
    useAppStore.getState().setQuantizations(data.quantizations || []);
    useAppStore.getState().setEngines(data.engines || []);
    useAppStore.getState().setCpus(data.cpus || []);
    
  } catch (error) {
    console.error('Error importing catalog:', error);
  }
}
