# Источники данных каталога

Дата сборки: 2026-11-16  
Версия каталога: v2026.11

## GPU (§3.1)

### Официальные источники

#### NVIDIA Consumer / Prosumer
- [TechPowerUp GPU Database](https://www.techpowerup.com/gpulist?gpu=consumer&sort=-releasedate) — consumer карты
- [NVIDIA RTX PRO 6000 Blackwell Datasheet](https://www.nvidia.com/en-us/data-center/rtx-pro-6000/) — workstation/prosumer

#### NVIDIA Datacenter
- [NVIDIA H100 SXM Datasheet](https://www.nvidia.com/en-us/data-center/h100/) — datacenter GPU, 80 GB HBM3, 3.35 TB/s bandwidth
- [NVIDIA H200 SXM Datasheet](https://www.nvidia.com/en-us/data-center/h200/) — datacenter GPU, 141 GB HBM3e, 4.8 TB/s bandwidth  
- [NVIDIA B200 SXM Datasheet](https://www.nvidia.com/en-us/data-center/b200/) — datacenter GPU, 192 GB HBM3e, requires liquid cooling

#### AMD Consumer (ROCm)
- [TechPowerUp AMD GPUs](https://www.techpowerup.com/gpulist?gpu=amd&sort=-releasedate) — Radeon RX серии
- [AMD ROCm Support Matrix](https://rocm.docs.amd.com/) — совместимость с CUDA API

### Прочие источники

- [Aquanode GPU Database](https://www.aquanode.ai/hardware/gpu-listing/) — независимый свод GPU характеристик
- [MillionMiner Mining Statistics](https://millmin.net/mining-statistics) — реальная нагрузка на карты

---

## Модели (§3.2)

### Oфициальные источники

#### Hugging Face Models Repository
- https://huggingface.co/models  
  Все модели имеют `config.json` с геометрией архитектуры:
  - `n_layers` — число слоев
  - `n_kv_heads` — число KV heads (для GQA/MQA важно: использовать НЕ `n_heads`)
  - `head_dim` — размер head в элементах (**БРАТЬ ПРЯМО ИЗ config.json**, НЕ выводить из `hidden_size/n_heads`)

#### Llama Meta Models
- https://ai.meta.com/llama/  
  Llama 3.1, 3.3, Llama 4 (announced)

#### Qwen Alibaba Models
- https://qwenlm.github.io/  
  Qwen2.5, Qwen3, Qwen3-AxxB (MoE серии)

#### Mistral AI Models
- https://mistral.ai/  
  Mistral, Mixtral 8x7B, 8x22B, Mistral Small

#### DeepSeek Models
- https://www.deepseek.com/models/  
  DeepSeek-V3, V4-Flash, V4-Pro (MoE)

#### Kimi ModelScope
- https://modelscope.cn/organization/Kimi  
  Kimi K2.6 (1T total params MoE)

### Лицензии и коммерческое использование

| Модель | License | Commercial |
|--------|---------|------------|
| Llama 3.1 8B, 70B | llama3 | false |
| Qwen2.5-72B, Qwen3* | MIT | true |
| Gemma 27B/7B | gemma | true |
| Mistral 7B | Apache-2.0/MIT | true |
| Mixtral 8x7B/8x22B | MIT | true |
| DeepSeek-V3/4 | Other | false (check source) |

---

## Квантизации (§3.3)

### FP16/BF16 — full precision
- `bytes_per_param`: 2.0 ГБ/билин параметров
- `kv_bytes_per_elem`: 2 (FP16 для KV-кеша)

### INT8 / FP8 — low precision
- `bytes_per_param`: 1.0 ГБ/билин
- `kv_bytes_per_elem`: 1 (KV часто не квантуется так же)

### GGUF quantizations (llama.cpp format)
| Квантизация | bytes_per_param | kv_bytes_per_elem | Примечание |
|-------------|-----------------|-------------------|-------------|
| Q8_0 | 1.06 | 1 | 8-bit |
| Q6_K | 0.82 | 1 | 6-bit (k-quantized) |
| Q5_K_M | 0.70 | 1 | ~6.92-bit |
| Q4_K_M | 0.55 | 1 | ~5.2-bit |
| Q3_K_M | 0.43 | 1 | ~4-bit |
| Q4_0 | 0.52 | 0.5 | 4-bit (full) |
| Q3_0 | 0.37 | 0.5 | 3-bit (full) |

### AWQ / GPTQ — weights-only quantization
- `bytes_per_param`: 0.55 ГБ/билин
- `kv_bytes_per_elem`: 1 (KV остаётся FP16)
- Источник: https://arxiv.org/abs/2306.0533 (AWQ), https://arxiv.org/abs/2209.10507 (GPTQ)

### NF4 — exL2 weights-only quantization
- `bytes_per_param`: 0.58 ГБ/билин
- Источник: https://github.com/turbopair/exllamav2#quantizations

---

## Движки (§3.3)

### vLLM
- `gpu_only`: true
- `default_util_target`: 0.90 — резервирует ~10% VRAM через `gpu_memory_utilization=0.9`
- `supports_tp`: true
- `kv_bytes_per_elem`: 2 (KV в FP16)
- Источник: https://docs.vllm.ai/

### llama.cpp
- `gpu_only`: false — offload весов и KV в RAM через `n_gpu_layers`
- `default_util_target`: 0.95 (условно, фиксированный compute buffer)
- `overhead_gb`: 1.5 ГБ — CUDA context + буферы
- Источник: https://github.com/ggml-org/llama.cpp

### Text Generation Inference (TGI)
- vLLM в режиме API inference
- `default_util_target`: 0.90
- Источник: https://huggingface.co/docs/text-generation-inference

### SGLang
- Paged-сервер с динамическим распределением KV-пула
- `default_util_target`: 0.90
- Источник: https://glaros.org/sglang

---

## CPU (§4.12)

### Intel Xeon / Core
- **Xeon Silver/Gold**: 8-64 cores, SP3 socket, PCIe lanes 64-128
  - Пример: Xeon Gold 6430 — 16 cores, 128 PCIe lanes, SP3
- **Core i9**: consumer/workstation, LGA1700, PCIe lanes до 80
  - Пример: Core i9-14900K — 24 cores/threads, 80 PCIe lanes

### AMD EPYC / Ryzen Threadripper
- **EPYC 9654**: server, 64 cores, SP3 socket, PCIe x16×4 = x64
- **Threadripper PRO 7995WX**: workstation, 128 cores, TRX4 socket
- **Ryzen 9/7**: consumer/workstation, AM5 socket

### Apple Silicon
- **M4 Max**: unified memory architecture
  - `unified_memory`: true — доступная RAM = vram
  - Пример: M4 Max 16-Core — 16 CPU cores, up to 192 GB unified memory

---

## Формулы расчёта (ASSUMPTIONS)

Все инженерные оценки зафиксированы в [`ASSUMPTIONS.md`](./ASSUMPTIONS.md):
- `1.05` — множитель на веса (эмбеддинги/нормы)
- `1.5 ГБ × N_gpu` — CUDA context + overhead
- `0.05 × VRAM_total` — workspace (фрагментация)
- `tp_factor`: 1.0 (single GPU), 0.35 (PCIe TP), 0.65 (NVLink)
- `batch_efficiency`: 0.85, 0.60, 0.45 для max_parallel ≤ 8, 9-32, >32

---

## Валидация в CI

Все JSON-файлы валидируются по JSON Schema перед сборкой:
```yaml
# .github/workflows/ci.yml snippet
steps:
  - run: npm install
  - run: npx ajv validate --all
  - run: npm run typecheck
  - run: npm test
```

---

**Дата обновления источников**: 2026-11-16  
**Ответственный за обновление данных**: developer@ai-calculator.local
