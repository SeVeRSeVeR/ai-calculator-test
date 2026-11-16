/**
 * Zustand стейт с localStorage и query-sync - упрощённая версия для MVP
 */
import { create } from 'zustand';
// Заглушки для загрузки каталогов (в реальном приложении — из файлов)
const _loadGpus = () => [];
const _loadModels = () => [];
const _loadQuantizations = () => [];
const _loadEngines = () => [];
const _loadCpus = () => [];
/** Инициализация каталога из файлов */
async function initializeCatalog() {
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
    }
    catch (error) {
        console.error('Error initializing catalog:', error);
    }
}
/**
 * Создаём store Zustand с persist и query-sync
 */
export const useAppStore = create((set, get) => ({
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
        const errors = {};
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
    loadModelsForGpu: async (gpuId) => {
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
        const errors = {};
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
    calculateConfigs: async (modelId) => {
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
export async function exportCatalogToStorage() {
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
    }
    catch (error) {
        console.error('Error exporting catalog:', error);
    }
}
/**
 * Импорт каталога из localStorage
 */
export async function importCatalogFromStorage() {
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
    }
    catch (error) {
        console.error('Error importing catalog:', error);
    }
}
