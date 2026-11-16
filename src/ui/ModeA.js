import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Компонент формы режима A — "От железа к модели" - упрощённая версия для MVP
 */
import { useEffect, useState } from 'react';
import ModelCard from './ModelCard';
import ValidatedInput from './ValidatedInput';
import Disclaimer from './Disclaimer';
function formatNumber(num) {
    return num.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
}
export default function ModeA({ gpus, models, quantizations, engines, onError }) {
    const [gpuId, setGpuId] = useState('');
    const [nGpu, setNpGpu] = useState(1);
    const [contextTokens, setContextTokens] = useState(4096);
    const [userCount, setUserCount] = useState(1);
    const [quantizationId, setQuantizationId] = useState('q4_k_m');
    const [engineId, setEngineId] = useState('vllm');
    const [errors, setErrors] = useState({
        gpu: '',
        nGpu: '',
        contextTokens: '',
        userCount: ''
    });
    const [result, setResult] = useState([]);
    // Инициализация при загрузке данных
    useEffect(() => {
        window['__INITIALIZE_MODE_A__'] = (gpuIds, modelIds) => {
            if (!gpus.length || !models.length)
                return;
            const savedGpuId = localStorage.getItem('mode_a_gpu_id');
            if (!savedGpuId) {
                setGpuId(gpuIds[0]);
            }
            const savedContextTokens = localStorage.getItem('mode_a_context_tokens');
            if (savedContextTokens) {
                setContextTokens(parseInt(savedContextTokens));
            }
            const savedUserCount = localStorage.getItem('mode_a_user_count');
            if (savedUserCount) {
                setUserCount(parseInt(savedUserCount));
            }
            const savedQuantizationId = localStorage.getItem('mode_a_quantization_id');
            if (!savedQuantizationId) {
                setQuantizationId('q4_k_m');
            }
            else {
                setQuantizationId(savedQuantizationId);
            }
            const savedEngineId = localStorage.getItem('mode_a_engine_id');
            if (!savedEngineId) {
                setEngineId('vllm');
            }
            else {
                setEngineId(savedEngineId);
            }
        };
    }, []);
    const isValid = () => !errors.gpu && !errors.nGpu && !errors.contextTokens && !errors.userCount;
    const validateInputs = () => {
        const newErrors = {};
        if (!gpuId) {
            newErrors.gpu = 'Выберите GPU';
        }
        if (nGpu < 1 || nGpu > 8) {
            newErrors.nGpu = 'Количество GPU должно быть от 1 до 8';
        }
        if (contextTokens < 512) {
            newErrors.contextTokens = `Контекст должен быть ≥ 512 токенов`;
        }
        else if (contextTokens > 1000000) {
            newErrors.contextTokens = `Контекст не может превышать 1M токенов`;
        }
        if (userCount < 1 || userCount > 10000) {
            newErrors.userCount = 'Количество пользователей должно быть от 1 до 10000';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };
    const handleContextChange = (value) => {
        const parsed = parseInt(String(value));
        if (isNaN(parsed)) {
            setErrors(prev => ({ ...prev, contextTokens: 'Должно быть числом' }));
            return;
        }
        if (parsed < 512) {
            setErrors(prev => ({ ...prev, contextTokens: `Минимум 512 токенов` }));
        }
        setContextTokens(parsed);
    };
    const handleUserCountChange = (value) => {
        const parsed = parseInt(String(value));
        if (isNaN(parsed)) {
            setErrors(prev => ({ ...prev, userCount: 'Должно быть числом' }));
            return;
        }
        if (parsed > 1000) {
            setErrors(prev => ({ ...prev, userCount: '>1K пользователей — нереалистично' }));
        }
        setUserCount(parsed);
    };
    const handleQuantizationChange = (value) => {
        setQuantizationId(value);
    };
    const handleEngineChange = (value) => {
        setEngineId(value);
    };
    const handleCalculate = () => {
        if (!isValid()) {
            validateInputs();
            return;
        }
        const mockResult = {
            model: models[0] || {
                id: 'test-model',
                family: 'Llama',
                name: 'Test Model',
                params_total_b: 7.0e9,
                bytes_per_param: 1.5,
                n_layers: 32,
                n_kv_heads: 8,
                head_dim: 128,
                max_context: 8192
            },
            quantization: quantizations[0],
            vramBudgetGb: (models[0]?.params_total_b ?? 7e9) * (quantizations[0]?.bytes_per_param || 1.5) + 5,
            modelWeightsGb: (models[0]?.params_total_b ?? 7e9) * (quantizations[0]?.bytes_per_param || 1.5),
            kvPerTokenGb: 0.05,
            overheadGb: 0.2,
            workspaceGb: 0.5,
            kvPoolGb: 0.2,
            fits: true,
            fitStatus: 'FITS_FULL',
            perGpuFootprintGb: 15,
            vramOneGb: 1.0,
            maxParallel: userCount || 4,
            tokensPerSeq: 40,
            totalTokensPerSecond: 120
        };
        setResult([mockResult]);
        localStorage.setItem('mode_a_gpu_id', gpuId);
        localStorage.setItem('mode_a_context_tokens', String(contextTokens));
        localStorage.setItem('mode_a_user_count', String(userCount));
        localStorage.setItem('mode_a_quantization_id', quantizationId);
        localStorage.setItem('mode_a_engine_id', engineId);
    };
    const usersCount = userCount || 4;
    return (_jsxs("div", { className: "mode-a", children: [_jsxs("section", { className: "form-section", children: [_jsx("h3", { children: "\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u0440\u0430\u0441\u0447\u0451\u0442\u0430" }), _jsxs("div", { className: "input-group", children: [_jsx("div", { className: "input-item", children: _jsx(ValidatedInput, { id: "gpu-select", label: "GPU", type: "select", value: gpuId, onChange: (value) => { setGpuId(value); if (errors.gpu)
                                        validateInputs(); }, options: gpus.slice(0, 5).map(gpu => ({ value: gpu.id, label: `${gpu.name} (${gpu.vram_gb} ГБ)` })), placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 GPU...", errors: { gpu: errors.gpu || undefined } }) }), _jsx(ValidatedInput, { id: "ngpu-input", label: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E GPU", type: "number", value: nGpu, onChange: (value) => setNpGpu(parseInt(String(value))), min: 1, max: 8, step: 1, errors: { nGpu: errors.nGpu || undefined } }), _jsx(ValidatedInput, { id: "context-input", label: "\u041A\u043E\u043D\u0442\u0435\u043A\u0441\u0442 (\u0442\u043E\u043A\u0435\u043D\u043E\u0432)", type: "number", value: contextTokens, onChange: (value) => handleContextChange(value), min: 512, max: 1000000, step: 1024, errors: { contextTokens: errors.contextTokens || undefined } }), _jsx(ValidatedInput, { id: "users-input", label: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0438", type: "number", value: userCount, onChange: (value) => handleUserCountChange(value), min: 1, max: 10000, step: 1, errors: { userCount: errors.userCount || undefined } }), _jsx("div", { className: "input-item", children: _jsx("select", { className: "quantization-select", value: quantizationId, onChange: (e) => handleQuantizationChange(e.target.value), children: quantizations.map(q => (_jsx("option", { value: q.id, children: q.name }, q.id))) }) }), _jsx("div", { className: "input-item", children: _jsx("select", { className: "engine-select", value: engineId, onChange: (e) => handleEngineChange(e.target.value), children: engines.map(e => (_jsx("option", { value: e.id, children: e.name }, e.id))) }) }), _jsx("div", { className: "input-item", children: _jsx("button", { className: "calculate-button", onClick: handleCalculate, disabled: !isValid(), children: "\u0420\u0430\u0441\u0441\u0447\u0438\u0442\u0430\u0442\u044C" }) })] }), _jsx(Disclaimer, { version: "2026.11" })] }), result.length > 0 && (_jsxs("section", { className: "results-section", children: [_jsxs("h3", { children: ["\u0420\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u044B (", result.length, " \u043C\u043E\u0434\u0435\u043B\u044C)", result.length !== 1 && 'ей'] }), _jsx("div", { className: "models-grid", children: result.map((modelResult, index) => (_jsx(ModelCard, { model: modelResult.model, selected: false, onSelectModel: (modelId) => console.log('Выбрана модель:', modelId) }, index))) }), result[0].fitStatus !== 'NO_FIT' && (_jsxs("section", { className: "platform-recommendation", children: [_jsx("h4", { children: "\u0420\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0443\u0435\u043C\u0430\u044F \u043F\u043B\u0430\u0442\u0444\u043E\u0440\u043C\u0430:" }), _jsxs("ul", { className: "platform-specs", children: [_jsxs("li", { children: [_jsx("span", { className: "spec-label", children: "CPU:" }), _jsxs("span", { className: "spec-value note", children: ["Intel Xeon 16-cores (min ", nGpu * 2, " \u044F\u0434\u0435\u0440)", _jsx("br", {}), _jsx("small", { style: { color: '#a0a0a0' }, children: "\u0414\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0438 \u043F\u043E\u043B\u043D\u043E\u043C \u0440\u0430\u0437\u043C\u0435\u0449\u0435\u043D\u0438\u0438 \u0432 VRAM" })] })] }), _jsxs("li", { children: [_jsx("span", { className: "spec-label", children: "RAM:" }), _jsxs("span", { className: "spec-value note", children: [result[0].vramBudgetGb > 96 ? 'Минимум для OS (32 ГБ достаточно)' : `~${Math.round(result[0].vramBudgetGb * 0.1)} ГБ`, _jsx("br", {}), _jsx("small", { style: { color: '#a0a0a0' }, children: "\u0414\u043E\u0441\u0442\u0430\u0442\u043E\u0447\u043D\u043E \u043F\u0440\u0438 \u043F\u043E\u043B\u043D\u043E\u043C \u0440\u0430\u0437\u043C\u0435\u0449\u0435\u043D\u0438\u0438 \u0432 VRAM" })] })] }), _jsxs("li", { children: [_jsx("span", { className: "spec-label", children: "NVMe:" }), _jsxs("span", { className: "spec-value", children: [result[0].modelWeightsGb * 3, " \u0413\u0411"] })] }), _jsxs("li", { children: [_jsx("span", { className: "spec-label", children: "PSU:" }), _jsx("span", { className: "spec-value", children: "850 \u0412\u0442 (\u0434\u043B\u044F RTX 4090)" })] }), _jsxs("li", { children: [_jsx("span", { className: "spec-label", children: "\u041E\u0445\u043B\u0430\u0436\u0434\u0435\u043D\u0438\u0435:" }), _jsx("span", { className: "spec-value air", children: "\u0412\u043E\u0437\u0434\u0443\u0445" })] }), _jsxs("li", { className: "cpu-disclaimer", children: [_jsx("span", { className: "spec-label", children: "\u041F\u0440\u0438\u043C\u0435\u0447\u0430\u043D\u0438\u0435:" }), _jsx("span", { className: "spec-value note", children: "CPU \u043D\u0435 \u0432\u043B\u0438\u044F\u0435\u0442 \u043D\u0430 \u0441\u043A\u043E\u0440\u043E\u0441\u0442\u044C \u0433\u0435\u043D\u0435\u0440\u0430\u0446\u0438\u0438 \u043F\u0440\u0438 \u043F\u043E\u043B\u043D\u043E\u043C \u0440\u0430\u0437\u043C\u0435\u0449\u0435\u043D\u0438\u0438 \u0432 VRAM. \u041E\u043D \u0432\u0430\u0436\u0435\u043D \u0434\u043B\u044F prefill, \u0442\u043E\u043A\u0435\u043D\u0438\u0437\u0430\u0446\u0438\u0438 \u0438 \u043F\u0440\u0438 offload." })] }), nGpu > 1 && (_jsxs("li", { className: "multi-gpu-warning", children: [_jsx("strong", { children: "\u041C\u0443\u043B\u044C\u0442\u0438-GPU:" }), " \u0411\u0435\u0437 NVLink \u0442\u0435\u0440\u044F\u0435\u0442\u0441\u044F \u043F\u0440\u043E\u0438\u0437\u0432\u043E\u0434\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C TP (~70%). \u0420\u0430\u0441\u0441\u043C\u043E\u0442\u0440\u0438\u0442\u0435 llama.cpp layer-split \u0432\u043C\u0435\u0441\u0442\u043E vLLM TP."] }))] })] })), !result[0].fits && result.length > 0 && (_jsxs("section", { className: "empty-state", children: [_jsx("p", { children: "\u041C\u043E\u0434\u0435\u043B\u044C \u043D\u0435 \u043F\u043E\u043C\u0435\u0449\u0430\u0435\u0442\u0441\u044F \u043F\u0440\u0438 \u0437\u0430\u0434\u0430\u043D\u043D\u044B\u0445 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u0430\u0445." }), _jsxs("div", { className: "quick-actions", children: [_jsx("button", { onClick: () => setQuantizationId('q3_k_m'), children: "\u0421\u043D\u0438\u0437\u0438\u0442\u044C \u043A\u0432\u0430\u043D\u0442\u0438\u0437\u0430\u0446\u0438\u044E" }), _jsx("button", { onClick: () => setContextTokens(Math.floor(contextTokens * 0.7)), children: "\u0423\u043C\u0435\u043D\u044C\u0448\u0438\u0442\u044C \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442" }), _jsx("button", { onClick: () => setNpGpu(nGpu + 1), children: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C GPU" })] })] }))] }))] }));
}
