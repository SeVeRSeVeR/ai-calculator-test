/**
 * Компонент формы режима A — "От железа к модели" - упрощённая версия для MVP
 */

import React, { useEffect, useState } from 'react';
import ModelCard from './ModelCard';
import ValidatedInput from './ValidatedInput';
import Disclaimer from './Disclaimer';

// Типы (упрощённые)
type Quantization = { id: string; name: string; bytes_per_param: number };
type Engine = { id: string; name: string; overhead_gb?: number };
type GPU = { id: string; vendor: string; name: string; vram_gb: number };
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

interface ModeAProps {
  gpus: GPU[];
  models: Model[];
  quantizations: Quantization[];
  engines: Engine[];
  onError: (error: string) => void;
}

function formatNumber(num: number): string {
  return num.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
}

export default function ModeA({ gpus, models, quantizations, engines, onError }: ModeAProps) {
  const [gpuId, setGpuId] = useState<string>('');
  const [nGpu, setNpGpu] = useState<number>(1);
  const [contextTokens, setContextTokens] = useState<number>(4096);
  const [userCount, setUserCount] = useState<number>(1);
  const [quantizationId, setQuantizationId] = useState<string>('q4_k_m');
  const [engineId, setEngineId] = useState<string>('vllm');

  const [errors, setErrors] = useState<Record<string, string>>({
    gpu: '',
    nGpu: '',
    contextTokens: '',
    userCount: ''
  });

  const [result, setResult] = useState<any[]>([]);

  // Инициализация при загрузке данных
  useEffect(() => {
    window['__INITIALIZE_MODE_A__'] = (gpuIds: string[], modelIds: string[]) => {
      if (!gpus.length || !models.length) return;

      const savedGpuId = localStorage.getItem('mode_a_gpu_id') as string | null;
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
      } else {
        setQuantizationId(savedQuantizationId);
      }

      const savedEngineId = localStorage.getItem('mode_a_engine_id');
      if (!savedEngineId) {
        setEngineId('vllm');
      } else {
        setEngineId(savedEngineId);
      }
    };
  }, []);

  const isValid = () => !errors.gpu && !errors.nGpu && !errors.contextTokens && !errors.userCount;

  const validateInputs = () => {
    const newErrors: Record<string, string> = {};

    if (!gpuId) {
      newErrors.gpu = 'Выберите GPU';
    }

    if (nGpu < 1 || nGpu > 8) {
      newErrors.nGpu = 'Количество GPU должно быть от 1 до 8';
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

  const handleContextChange = (value: number) => {
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

  const handleQuantizationChange = (value: string) => {
    setQuantizationId(value);
  };

  const handleEngineChange = (value: string) => {
    setEngineId(value);
  };

  const handleCalculate = () => {
    if (!isValid()) {
      validateInputs();
      return;
    }

    const mockResult: any = {
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

  return (
    <div className="mode-a">
      {/* Форма */}
      <section className="form-section">
        <h3>Параметры расчёта</h3>
        
        <div className="input-group">
          {/* GPU выбор */}
          <div className="input-item">
            <ValidatedInput
              id="gpu-select"
              label="GPU"
              type="select"
              value={gpuId}
              onChange={(value: string) => { setGpuId(value); if (errors.gpu) validateInputs(); }}
              options={gpus.slice(0, 5).map(gpu => ({ value: gpu.id, label: `${gpu.name} (${gpu.vram_gb} ГБ)` }))}
              placeholder="Выберите GPU..."
              errors={{ gpu: errors.gpu || undefined }}
            />
          </div>

          {/* Количество GPU */}
          <ValidatedInput
            id="ngpu-input"
            label="Количество GPU"
            type="number"
            value={nGpu}
            onChange={(value: number) => setNpGpu(parseInt(String(value)))}
            min={1}
            max={8}
            step={1}
            errors={{ nGpu: errors.nGpu || undefined }}
          />

          {/* Контекст */}
          <ValidatedInput
            id="context-input"
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
            id="users-input"
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
              onChange={(e) => handleQuantizationChange(e.target.value)}
            >
              {quantizations.map(q => (
                <option key={q.id} value={q.id}>{q.name}</option>
              ))}
            </select>
          </div>

          {/* Движок */}
          <div className="input-item">
            <select 
              className="engine-select"
              value={engineId}
              onChange={(e) => handleEngineChange(e.target.value)}
            >
              {engines.map(e => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

          {/* Кнопка расчёта */}
          <div className="input-item">
            <button 
              className="calculate-button"
              onClick={handleCalculate}
              disabled={!isValid()}
            >
              Рассчитать
            </button>
          </div>
        </div>

        {/* Дисклеймер */}
        <Disclaimer version="2026.11" />
      </section>

      {/* Результаты расчёта */}
      {result.length > 0 && (
        <section className="results-section">
          <h3>Результаты ({result.length} модель){result.length !== 1 && 'ей'}</h3>
          
          <div className="models-grid">
            {result.map((modelResult, index) => (
              <ModelCard
                key={index}
                model={modelResult.model}
                selected={false}
                onSelectModel={(modelId: string) => console.log('Выбрана модель:', modelId)}
              />
            ))}
          </div>

          {/* Платформа для выбранной модели */}
          {result[0].fitStatus !== 'NO_FIT' && (
            <section className="platform-recommendation">
              <h4>Рекомендуемая платформа:</h4>
              
              <ul className="platform-specs">
                <li>
                  <span className="spec-label">CPU:</span>
                  <span className="spec-value note">
                    Intel Xeon 16-cores (min {nGpu * 2} ядер)
                    <br />
                    <small style={{color: '#a0a0a0'}}>Достаточно при полном размещении в VRAM</small>
                  </span>
                </li>
                
                <li>
                  <span className="spec-label">RAM:</span>
                  <span className="spec-value note">
                    {result[0].vramBudgetGb > 96 ? 'Минимум для OS (32 ГБ достаточно)' : `~${Math.round(result[0].vramBudgetGb * 0.1)} ГБ`}
                    <br />
                    <small style={{color: '#a0a0a0'}}>Достаточно при полном размещении в VRAM</small>
                  </span>
                </li>
                
                <li>
                  <span className="spec-label">NVMe:</span>
                  <span className="spec-value">{result[0].modelWeightsGb * 3} ГБ</span>
                </li>
                
                <li>
                  <span className="spec-label">PSU:</span>
                  <span className="spec-value">850 Вт (для RTX 4090)</span>
                </li>

                <li>
                  <span className="spec-label">Охлаждение:</span>
                  <span className="spec-value air">Воздух</span>
                </li>

                <li className="cpu-disclaimer">
                  <span className="spec-label">Примечание:</span>
                  <span className="spec-value note">
                    CPU не влияет на скорость генерации при полном размещении в VRAM. 
                    Он важен для prefill, токенизации и при offload.
                  </span>
                </li>

                {nGpu > 1 && (
                  <li className="multi-gpu-warning">
                    <strong>Мульти-GPU:</strong> Без NVLink теряется производительность TP (~70%). 
                    Рассмотрите llama.cpp layer-split вместо vLLM TP.
                  </li>
                )}
              </ul>
            </section>
          )}

          {!result[0].fits && result.length > 0 && (
            <section className="empty-state">
              <p>Модель не помещается при заданных параметрах.</p>
              
              <div className="quick-actions">
                <button onClick={() => setQuantizationId('q3_k_m')}>Снизить квантизацию</button>
                <button onClick={() => setContextTokens(Math.floor(contextTokens * 0.7))}>Уменьшить контекст</button>
                <button onClick={() => setNpGpu(nGpu + 1)}>Добавить GPU</button>
              </div>
            </section>
          )}
        </section>
      )}
    </div>
  );
}
