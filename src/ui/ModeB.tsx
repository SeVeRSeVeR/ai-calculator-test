/**
 * Компонент формы режима B — "От модели к железу" - упрощённая версия для MVP
 */

import React, { useEffect, useState } from 'react';
import ConfigCard from './ConfigCard';
import ValidatedInput from './ValidatedInput';
import Disclaimer from './Disclaimer';
import { useAppStore } from '../state/store';

// Типы (упрощённые)
type Quantization = { id: string; name: string; bytes_per_param: number };
type Model = { 
  id: string; 
  family: string; 
  name: string; 
  params_total_b: number; 
  bytes_per_param: number;
  n_layers: number;
  n_kv_heads: number;
  head_dim: number;
  max_context: number;
};

interface ModeBProps {
  gpus: any[];
  models: Model[];
  quantizations: Quantization[];
  engines: any[];
  onError: (error: string) => void;
}

function formatNumber(num: number): string {
  return num.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
}

export default function ModeB({ gpus, models, quantizations, engines, onError }: ModeBProps) {
  // Состояние формы
  const [modelId, setModelId] = useState<string>('');
  const [quantizationId, setQuantizationId] = useState<string>('q4_k_m');
  const [contextTokens, setContextTokens] = useState<number>(4096);
  const [userCount, setUserCount] = useState<number>(1);
  const [targetTokS, setTargetTokS] = useState<number>(15);

  // Состояния валидации
  const [errors, setErrors] = useState<Record<string, string>>({
    modelId: '',
    contextTokens: '',
    userCount: ''
  });

  // Результат расчёта
  const [resultB, setResultB] = useState<{
    minConfig?: { type: 'MIN'; vramBudgetGb: number; kvPoolGb: number; fits: boolean; maxParallel: number; tokensPerSeq: number; gpuCount: number };
    optimalConfig?: { type: 'OPTIMAL'; vramBudgetGb: number; kvPoolGb: number; fits: boolean; maxParallel: number; tokensPerSeq: number; gpuCount: number };
    maxConfig?: { type: 'MAX'; vramBudgetGb: number; kvPoolGb: number; fits: boolean; maxParallel: number; tokensPerSeq: number; gpuCount: number };
    status?: 'ALL_OK' | 'IMPOSSIBLE';
    recommendations?: string[];
  }>({});

  // Выбранная модель и квантизация для расчёта
  const selectedModel = models.find(m => m.id === modelId) || models[0];
  const selectedQuantization = quantizations.find(q => q.id === quantizationId) || quantizations[0];

  // Инициализация при загрузке данных
  useEffect(() => {
    window['__INITIALIZE_MODE_B__'] = (modelIds: string[]) => {
      if (!models.length) return;

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
      } else {
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
      } else {
        setErrors(prev => ({ ...prev, contextTokens: '' }));
      }
    }
  }, [modelId, contextTokens]);

  // Проверка валидности формы
  const isValid = () => !errors.modelId && !errors.contextTokens && !errors.userCount;

  // Обработка ошибок валидации
  const validateInputs = () => {
    const newErrors: Record<string, string> = {};

    if (!modelId) {
      newErrors.modelId = 'Выберите модель';
    }

    if (contextTokens < 512) {
      newErrors.contextTokens = `Контекст должен быть ≥ 512 токенов`;
    } else if (contextTokens > 1000000) {
      newErrors.contextTokens = `Контекст не может превышать 1M токенов`;
    }

    if (userCount < 1 || userCount > 10000) {
      newErrors.userCount = 'Количество пользователей должно быть от 1 до 10000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Обработка изменения контекста
  const handleContextChange = (value: number) => {
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
    } else {
      setErrors(prev => ({ ...prev, contextTokens: '' }));
    }

    setContextTokens(parsed);
  };

  // Обработка изменения пользователей
  const handleUserCountChange = (value: number) => {
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

    if (!selectedModel) return;

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

  return (
    <div className="mode-b">
      {/* Форма */}
      <section className="form-section">
        <h3>Параметры расчёта</h3>
        
        <div className="input-group">
          {/* Модель выбор */}
          <div className="input-item">
            <ValidatedInput
              id="model-select"
              label="Модель"
              type="select"
              value={modelId || ''}
              onChange={(value: string) => { setModelId(value); if (errors.modelId) validateInputs(); }}
              options={models.slice(0, 8).map(model => ({ 
                value: model.id, 
                label: `${model.name} (${formatNumber(model.params_total_b)}B)` 
              }))}
              placeholder="Выберите модель..."
              errors={{ modelId: errors.modelId || undefined }}
            />
          </div>

          {/* Контекст */}
          <ValidatedInput
            id="context-input-b"
            label="Контекст (токенов)"
            type="number"
            value={contextTokens}
            onChange={(value: number) => handleContextChange(value)}
            min={512}
            max={1000000}
            step={1024}
            errors={{ contextTokens: errors.contextTokens || undefined }}
          />

          {/* Пользователи */}
          <ValidatedInput
            id="users-input-b"
            label="Пользователи"
            type="number"
            value={userCount}
            onChange={(value: number) => handleUserCountChange(value)}
            min={1}
            max={10000}
            step={1}
            errors={{ userCount: errors.userCount || undefined }}
          />

          {/* Квантизация */}
          <div className="input-item">
            <select 
              className="quantization-select"
              value={quantizationId}
              onChange={(e) => {
                const id = e.target.value;
                setQuantizationId(id);
              }}
            >
              {quantizations.map(q => (
                <option key={q.id} value={q.id}>{q.name}</option>
              ))}
            </select>
          </div>

          {/* Целевой tok/s */}
          <ValidatedInput
            id="target-toks-input"
            label="Целевой tok/s"
            type="number"
            value={targetTokS}
            onChange={(value: number) => setTargetTokS(parseFloat(String(value)))}
            min={5}
            max={100}
            step={1}
            errors={{ targetTokS: undefined }}
          />

          {/* Кнопка расчёта */}
          <div className="input-item">
            <button 
              className="calculate-button"
              onClick={handleCalculate}
              disabled={!isValid()}
            >
              Рассчитать конфигурации
            </button>
          </div>

          {/* Дисклеймер */}
          <Disclaimer version="2026.11" />
        </div>
      </section>

      {/* Результаты расчёта */}
      {resultB.minConfig || resultB.optimalConfig || resultB.maxConfig
        ? (
            <section className="results-section">
              <h3>Конфигурации</h3>

              {/* Минимальная конфигурация */}
              {resultB.minConfig && (
                <>
                  <ConfigCard
                    config={resultB.minConfig}
                    modelWeightsGb={(selectedModel?.params_total_b ?? 7e9) * selectedQuantization.bytes_per_param / 1e9}
                    kvPerTokenGb={0.001}
                    targetTokS={targetTokS}
                  />

                  {/* Дисклеймер для MIN конфигурации */}
                  <div className="min-config-note">
                    <strong>MIN:</strong> {Math.round(20)}% весов в RAM, 
                    ожидаемое падение скорости ~1.2×
                  </div>
                </>
              )}

              {/* Оптимальная конфигурация */}
              {resultB.optimalConfig && (
                <ConfigCard
                  config={resultB.optimalConfig}
                  modelWeightsGb={(selectedModel?.params_total_b ?? 7e9) * selectedQuantization.bytes_per_param / 1e9}
                  kvPerTokenGb={0.001}
                  targetTokS={targetTokS}
                />
              )}

              {/* Максимальная конфигурация */}
              {resultB.maxConfig && (
                <ConfigCard
                  config={resultB.maxConfig}
                  modelWeightsGb={(selectedModel?.params_total_b ?? 7e9) * selectedQuantization.bytes_per_param / 1e9}
                  kvPerTokenGb={0.001}
                  targetTokS={targetTokS}
                />
              )}

              {/* Совпадение OPTIMAL и MAX */}
              {resultB.optimalConfig && resultB.maxConfig && (
                <div className="optimal-max-note">
                  <strong>MAX не требуется:</strong> OPTIMAL покрывает рост
                </div>
              )}
            </section>
          )
        : (
            <section className="results-section empty-state">
              <p>Конфигурации будут показаны после расчёта.</p>
              
              <div className="quick-actions">
                <button onClick={() => setQuantizationId('q3_k_m')}>Снизить квантизацию</button>
                <button onClick={() => setContextTokens(Math.floor(contextTokens * 0.7))}>Уменьшить контекст</button>
                <button onClick={() => setModelId(models.find(m => m.params_total_b === 8)?.id || '')}>Взять модель меньше</button>
              </div>

              <Disclaimer version="2026.11" />
            </section>
          )}
    </div>
  );
};