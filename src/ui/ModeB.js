import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Компонент формы режима B — "От модели к железу" - упрощённая версия для MVP
 */
import { useEffect, useState } from 'react';
import ConfigCard from './ConfigCard';
import ValidatedInput from './ValidatedInput';
import Disclaimer from './Disclaimer';
import { useAppStore } from '../state/store';
function formatNumber(num) {
    return num.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
}
export default function ModeB({ gpus, models, quantizations, engines, onError }) {
    // Состояние формы
    const [modelId, setModelId] = useState('');
    const [quantizationId, setQuantizationId] = useState('q4_k_m');
    const [contextTokens, setContextTokens] = useState(4096);
    const [userCount, setUserCount] = useState(1);
    const [targetTokS, setTargetTokS] = useState(15);
    // Состояния валидации
    const [errors, setErrors] = useState({
        modelId: '',
        contextTokens: '',
        userCount: ''
    });
    // Результат расчёта
    const [resultB, setResultB] = useState({});
    // Выбранная модель и квантизация для расчёта
    const selectedModel = models.find(m => m.id === modelId) || models[0];
    const selectedQuantization = quantizations.find(q => q.id === quantizationId) || quantizations[0];
    // Инициализация при загрузке данных
    useEffect(() => {
        window['__INITIALIZE_MODE_B__'] = (modelIds) => {
            if (!models.length)
                return;
            const savedContextTokens = localStorage.getItem('mode_b_context_tokens');
            if (savedContextTokens) {
                setContextTokens(parseInt(savedContextTokens));
            }
            const savedUserCount = localStorage.getItem('mode_b_user_count');
            if (savedUserCount) {
                setUserCount(parseInt(savedUserCount));
            }
            const savedQuantizationId = localStorage.getItem('mode_b_quantization_id');
            if (!savedQuantizationId) {
                setQuantizationId('q4_k_m');
            }
            else {
                setQuantizationId(savedQuantizationId);
            }
        };
    }, []);
    // Валидация модели при изменении
    useEffect(() => {
        if (!modelId) {
            setErrors(prev => ({ ...prev, modelId: 'Выберите модель' }));
            return;
        }
        const model = models.find(m => m.id === modelId);
        if (model?.max_context !== null && model?.max_context !== undefined) {
            if (contextTokens > model.max_context) {
                setErrors(prev => ({
                    ...prev,
                    contextTokens: `Контекст ${contextTokens} превышает max_context=${model.max_context}`
                }));
            }
            else {
                setErrors(prev => ({ ...prev, contextTokens: '' }));
            }
        }
    }, [modelId, contextTokens]);
    // Проверка валидности формы
    const isValid = () => !errors.modelId && !errors.contextTokens && !errors.userCount;
    // Обработка ошибок валидации
    const validateInputs = () => {
        const newErrors = {};
        if (!modelId) {
            newErrors.modelId = 'Выберите модель';
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
    // Обработка изменения контекста
    const handleContextChange = (value) => {
        const parsed = parseInt(String(value));
        if (isNaN(parsed)) {
            setErrors(prev => ({ ...prev, contextTokens: 'Должно быть числом' }));
            return;
        }
        const model = models.find(m => m.id === modelId);
        if (model && parsed > model.max_context) {
            setErrors(prev => ({
                ...prev,
                contextTokens: `Контекст ${parsed} превышает max_context=${model.max_context}`
            }));
        }
        else {
            setErrors(prev => ({ ...prev, contextTokens: '' }));
        }
        setContextTokens(parsed);
    };
    // Обработка изменения пользователей
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
    // Расчёт при изменении параметров
    const handleCalculate = () => {
        if (!isValid()) {
            validateInputs();
            return;
        }
        if (!selectedModel)
            return;
        // Упрощённые значения для MVP
        setResultB({
            minConfig: {
                type: 'MIN',
                vramBudgetGb: 85,
                kvPoolGb: 40,
                fits: true,
                maxParallel: userCount,
                tokensPerSeq: 8,
                gpuCount: 1
            },
            optimalConfig: {
                type: 'OPTIMAL',
                vramBudgetGb: 96,
                kvPoolGb: 50,
                fits: true,
                maxParallel: userCount * 2,
                tokensPerSeq: 25,
                gpuCount: 1
            },
            maxConfig: {
                type: 'MAX',
                vramBudgetGb: 144,
                kvPoolGb: 80,
                fits: true,
                maxParallel: userCount * 4,
                tokensPerSeq: 35,
                gpuCount: 1
            },
            status: 'ALL_OK',
            recommendations: []
        });
        // Сохранение в localStorage
        const state = {
            modelId,
            quantizationId,
            contextTokens,
            userCount,
            targetTokS
        };
        localStorage.setItem('mode_b_context_tokens', String(contextTokens));
        localStorage.setItem('mode_b_user_count', String(userCount));
        localStorage.setItem('mode_b_quantization_id', quantizationId);
        localStorage.setItem('mode_b_target_tok_s', String(targetTokS));
        // Сохранение в store (для синхронизации)
        const { setModeBForm } = useAppStore.getState();
        setModeBForm({ modelId, quantizationId });
    };
    return (_jsxs("div", { className: "mode-b", children: [_jsxs("section", { className: "form-section", children: [_jsx("h3", { children: "\u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u0440\u0430\u0441\u0447\u0451\u0442\u0430" }), _jsxs("div", { className: "input-group", children: [_jsx("div", { className: "input-item", children: _jsx(ValidatedInput, { id: "model-select", label: "\u041C\u043E\u0434\u0435\u043B\u044C", type: "select", value: modelId || '', onChange: (value) => { setModelId(value); if (errors.modelId)
                                        validateInputs(); }, options: models.slice(0, 8).map(model => ({
                                        value: model.id,
                                        label: `${model.name} (${formatNumber(model.params_total_b)}B)`
                                    })), placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u043C\u043E\u0434\u0435\u043B\u044C...", errors: { modelId: errors.modelId || undefined } }) }), _jsx(ValidatedInput, { id: "context-input-b", label: "\u041A\u043E\u043D\u0442\u0435\u043A\u0441\u0442 (\u0442\u043E\u043A\u0435\u043D\u043E\u0432)", type: "number", value: contextTokens, onChange: (value) => handleContextChange(value), min: 512, max: 1000000, step: 1024, errors: { contextTokens: errors.contextTokens || undefined } }), _jsx(ValidatedInput, { id: "users-input-b", label: "\u041F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0438", type: "number", value: userCount, onChange: (value) => handleUserCountChange(value), min: 1, max: 10000, step: 1, errors: { userCount: errors.userCount || undefined } }), _jsx("div", { className: "input-item", children: _jsx("select", { className: "quantization-select", value: quantizationId, onChange: (e) => {
                                        const id = e.target.value;
                                        setQuantizationId(id);
                                    }, children: quantizations.map(q => (_jsx("option", { value: q.id, children: q.name }, q.id))) }) }), _jsx(ValidatedInput, { id: "target-toks-input", label: "\u0426\u0435\u043B\u0435\u0432\u043E\u0439 tok/s", type: "number", value: targetTokS, onChange: (value) => setTargetTokS(parseFloat(String(value))), min: 5, max: 100, step: 1, errors: { targetTokS: undefined } }), _jsx("div", { className: "input-item", children: _jsx("button", { className: "calculate-button", onClick: handleCalculate, disabled: !isValid(), children: "\u0420\u0430\u0441\u0441\u0447\u0438\u0442\u0430\u0442\u044C \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u0438" }) }), _jsx(Disclaimer, { version: "2026.11" })] })] }), resultB.minConfig || resultB.optimalConfig || resultB.maxConfig
                ? (_jsxs("section", { className: "results-section", children: [_jsx("h3", { children: "\u041A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u0438" }), resultB.minConfig && (_jsxs(_Fragment, { children: [_jsx(ConfigCard, { config: resultB.minConfig, modelWeightsGb: (selectedModel?.params_total_b ?? 7e9) * selectedQuantization.bytes_per_param / 1e9, kvPerTokenGb: 0.001, targetTokS: targetTokS }), _jsxs("div", { className: "min-config-note", children: [_jsx("strong", { children: "MIN:" }), " ", Math.round(20), "% \u0432\u0435\u0441\u043E\u0432 \u0432 RAM, \u043E\u0436\u0438\u0434\u0430\u0435\u043C\u043E\u0435 \u043F\u0430\u0434\u0435\u043D\u0438\u0435 \u0441\u043A\u043E\u0440\u043E\u0441\u0442\u0438 ~1.2\u00D7"] })] })), resultB.optimalConfig && (_jsx(ConfigCard, { config: resultB.optimalConfig, modelWeightsGb: (selectedModel?.params_total_b ?? 7e9) * selectedQuantization.bytes_per_param / 1e9, kvPerTokenGb: 0.001, targetTokS: targetTokS })), resultB.maxConfig && (_jsx(ConfigCard, { config: resultB.maxConfig, modelWeightsGb: (selectedModel?.params_total_b ?? 7e9) * selectedQuantization.bytes_per_param / 1e9, kvPerTokenGb: 0.001, targetTokS: targetTokS })), resultB.optimalConfig && resultB.maxConfig && (_jsxs("div", { className: "optimal-max-note", children: [_jsx("strong", { children: "MAX \u043D\u0435 \u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F:" }), " OPTIMAL \u043F\u043E\u043A\u0440\u044B\u0432\u0430\u0435\u0442 \u0440\u043E\u0441\u0442"] }))] }))
                : (_jsxs("section", { className: "results-section empty-state", children: [_jsx("p", { children: "\u041A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u0438 \u0431\u0443\u0434\u0443\u0442 \u043F\u043E\u043A\u0430\u0437\u0430\u043D\u044B \u043F\u043E\u0441\u043B\u0435 \u0440\u0430\u0441\u0447\u0451\u0442\u0430." }), _jsxs("div", { className: "quick-actions", children: [_jsx("button", { onClick: () => setQuantizationId('q3_k_m'), children: "\u0421\u043D\u0438\u0437\u0438\u0442\u044C \u043A\u0432\u0430\u043D\u0442\u0438\u0437\u0430\u0446\u0438\u044E" }), _jsx("button", { onClick: () => setContextTokens(Math.floor(contextTokens * 0.7)), children: "\u0423\u043C\u0435\u043D\u044C\u0448\u0438\u0442\u044C \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442" }), _jsx("button", { onClick: () => setModelId(models.find(m => m.params_total_b === 8)?.id || ''), children: "\u0412\u0437\u044F\u0442\u044C \u043C\u043E\u0434\u0435\u043B\u044C \u043C\u0435\u043D\u044C\u0448\u0435" })] }), _jsx(Disclaimer, { version: "2026.11" })] }))] }));
}
;
