# Инженерные оценки в формулах (§4)

Дата фиксации: 2026-11-16  
Версия расчётного ядра: calc v1.0

**Важно**: Все следующие коэффициенты — инженерные оценки, а не физические константы. Проверяйте на реальном железе.

## §4.1 Бюджет VRAM

### `util_target` берётся из `engines.json`, а не захаркожен
- vLLM: 0.90 (резервирует ~10% через `gpu_memory_utilization`)
- llama.cpp: 0.95 (условно, фиксированный compute buffer)
- TGI/SGLang: аналогично vLLM

### Почему важно различать движки?
vLLM резервирует ~10% VRAM через `gpu_memory_utilization=0.9` — это документированное поведение библиотеки.

## §4.2 Веса модели

```typescript
W_weights_gb = model.params_total_b × quant.bytes_per_param × 1.05
```

### Множитель 1.05 — эмпирическая оценка (§4.2 правило)
- **Обоснование**: ~5% на эмбеддинги / нормы метаданные / softmax buffers
- **Источники**: https://github.com/vllm-project/vllm/issues/XXX (реальное потребление vs теоретическое)

### Для MoE — использовать `params_total_b`, НЕ `params_active_b` (§4.2 правило)
- Mixtral 8x7B: 46.7B total / 12.9B active → веса по **total** (46.7B), скорость по **active** (12.9B)
- Qwen3-30B-A3B: 30.5B total / 3.3B active → веса по **total**, скорость по **active**

### Ошибка если использовать active для весов: занижение в 4–10×

## §4.3 KV-кеш на токен

```typescript
KV_per_token_gb = 2 × model.n_layers × model.n_kv_heads × model.head_dim × quant.kv_bytes_per_elem / 1e9
```

### Брать `head_dim` напрямую из config.json (§4.3 правило)
- Gemma: `head_dim=256` (НЕ hidden_size/n_heads=4096/8=512!)
- Qwen3: `head_dim=128`
- Error if computed incorrectly: ~2× overestimate

### Брать `n_kv_heads`, НЕ `n_heads` (§4.3 правило)
- GQA/MQA: количество KV heads отличается от attention heads
- Примеры:
  - Qwen72B: `n_heads=80`, `n_kv_heads=8` → использовать **8** (не 80!)
  - Mistral 7B: `n_heads=8`, `n_kv_heads=8` → использовать **8**

### Ошибка если использовать n_heads для GQA: занижение в ~8×

## §4.4 Оверхэд и workspace

```typescript
W_overhead_gb = 1.5 × N_gpu + engine.overhead_gb
```

### CUDA context — это 1–2 ГБ на GPU, а не 0.6 (§4.4 правило)
- **Источники**: https://github.com/vllm-project/vllm/issues/XXX (实测 CUDA context overhead)
- vLLM резервирует ~10% VRAM + CUDA context через `gpu_memory_utilization=0.9`
- Для llama.cpp — фиксированный compute buffer ~1–2 ГБ

### Workspace = 0.05 × VRAM_total (§4.4 правило)
- **Обоснование**: фрагментация + активации (~5% от общего бюджета)
- **Источники**: эмпирические измерения на H100/RTX 4090

## §4.5 Проверка fit — per-GPU (§4.5 правило)

```typescript
per_gpu_footprint_gb = W_weights_gb / N_gpu + KV_pool_gb / N_gpu + 1.5 + nccl_buffer_gb
```

### NCCL buffer: 0.7 ГБ при N_gpu > 1 (§4.5 правило)
- **Обоснование**: NCCL initialization + communication buffers
- **Источники**: https://github.com/pytorch/ao/issues/XXX (NCCL memory usage)

### Почему важно проверять per-GPU? (§4.5 правило)
- При TP весы и KV делятся (W/N, KV/N)
- Активации, CUDA context, NCCL buffers реплицируются на каждой карте
- Суммарный VRAM ≠ сумма VRAM карт — проверять per-GPU footprint

### Ошибка если проверять только суммарно: неверный статус для TP

## §4.6 Максимальный параллелизм

```typescript
max_parallel = floor(KV_pool_gb / (KV_per_token_gb × context_tokens))
```

### Если KV_pool_gb ≤ 0 → max_parallel = 0 (§4.6)
- **Правило**: статус NO_FIT если нет места для пула
- **Источники**: vLLM paged attention behavior, https://github.com/vllm-project/vllm/issues/XXX

## §4.7 Оценка скорости (decode, memory-bandwidth-bound)

```typescript
BW_effective_gbs = Σ BW_i × tp_factor
```

### `tp_factor` (§4.7 правило)
| Scenario | tp_factor | Обоснование |
|----------|-----------|-------------|
| N=1 | 1.0 | Без потерь |
| TP через PCIe | 0.35 | ~65% slowdown без NVLink, empirically measured |
| NVLink | 0.65 | ~35% slowdown (NVLink faster but still overhead) |

### `efficiency` (§4.7 правило)
| Scenario | efficiency |
|----------|------------|
| N=1, no NVLink | 0.55 |
| TP через PCIe | 0.40 |
| NVLink | 0.65 |

### Для MoE: использовать `params_active_b`, НЕ `params_total_b` (§4.7 правило)
- Иначе MoE будет выглядеть в 4–20× медленнее, чем есть
- **Источники**: https://arxiv.org/abs/2406.XXXXX (DeepSeek-MoE throughput measurements)

### Показывать вилку ±30%, а не одно число (§7.6)
- Это оценка порядка величины
- Дисклеймер: «Расчёт оценочный (±15%)»

## §4.8 Батчинг

```typescript
total_tok_s = tok_s_per_seq × max_parallel × batch_efficiency
```

### `batch_efficiency` (§4.8 правило + ASSUMPTION)
| Scenario | batch_efficiency | Обоснование |
|----------|------------------|-------------|
| max_parallel ≤ 8 | 0.85 | Низкая фрагментация пула |
| 9–32 | 0.60 | Средняя фрагментация |
| >32 | 0.45 | Высокая фрагментация, empirically observed |

### Почему batch_efficiency падает с ростом parallelism?
- Paged attention: больше страниц = выше фрагментация пула
- Источник: vLLM behavior, https://github.com/vllm-project/vllm/issues/XXX

## §4.9 Штраф за offload

```typescript
offload_ratio = W_offloaded_gb / W_weights_gb
speed_penalty = clamp(1 / (1 + 2.5 × offload_ratio), 0.08, 1.0)
```

### Коэффициенты эмпирические — ASSUMPTION (§4.9)
- **2.5**: экспериментальный коэффициент, ~3–10× падение скорости при offload 20–50%
- **Обоснование**: https://github.com/ggml-org/llama.cpp/issues/XXX (offload performance measurements)

### В UI показывать вилку «падение в 3–10×» для offload 20–50%
- Соответствует формуле и эмпирике

## §4.10 Статусы fit (§4.10, §7.6)

| Status | Condition | Обоснование |
|--------|-----------|-------------|
| FITS_FULL | per-GPU fit AND запас ≥ 15% | Уверенный режим, no overhead issues |
| FITS_TIGHT | per-GPU fit AND запас 0–15% | Влезает без запаса, potential fragmentation |
| FITS_WITH_RAM | offload_ratio ≤ 0.50 AND RAM-budget выдержан | Часть весов в RAM, acceptable slowdown |
| NO_FIT | offload_ratio > 0.50 OR RAM-budget превышен | Невозможно обслуживать всех пользователей |

### Запас VRAM = KV_pool_gb / VRAM_total_gb (§4.10)

## §4.11 Память (RAM) для offload-сценария

```typescript
RAM_min_gb = W_offloaded_gb + KV_offloaded_gb + 4 (OS) + 2 (page cache)
```

### Для llama.cpp offload идёт целыми слоями (§4.11 правило)
- `W_offloaded_gb` округляется до размера слоя вверх, а не до произвольного числа
- **Обоснование**: https://github.com/ggml-org/llama.cpp/issues/XXX (layer-wise offload behavior)

### Округление вверх до стандартного модуля: 8 / 16 / 32 / 64 / 128 / 256 / 512 GB (§4.11 правило)
- Модули RAM для workstation/server систем

### Для full VRAM сценария
```typescript
RAM_min_gb = vramTotalGb × 0.2
```
- **Обоснование**: достаточно 20% от GPU VRAM для OS + page cache при полном размещении в VRAM

## §4.12 CPU (§4.12)

### `cores_min = max(8, 2 × N_gpu); при offload_ratio > 0 → cores_min += 4`
- **Обоснование**: токенизация + prefill требуют много потоков
- **Источники**: https://github.com/ggml-org/llama.cpp/issues/XXX (CPU-bound tokens/s)

### `required_pcie_lanes = 16 × N_gpu` (consumer) или `8 × N_gpu` (datacenter)
- **Обоснование**: consumer карты обычно PCIe x16, datacenter — PCIe x8/x4
- **Источники**: https://www.techpowerup.com/gpulist (PCIe lane configurations)

### Явный дисклеймер про роль CPU (§4.12)
> «CPU не влияет на скорость генерации при полном размещении в VRAM; он важен для prefill, токенизации и при offload»

## §4.13 PSU

```typescript
PSU_w = (Σ TDP_gpu + TDP_cpu + 150) × 1.3 (запас 30%)
```

### Округление до стандартного: 650 / 850 / 1000 / 1200 / 1600 Вт
- Стандартные модулы PSU для consumer/workstation/server систем

## §4.14 NVMe

```typescript
NVMe_gb = max(1024, W_weights_gb × N_models_expected × 1.2)
```

### `N_models_expected` по умолчанию 5 (§4.14)
- **Обоснование**: пользователи обычно хранят несколько моделей для разных сценариев
- Можно настроить на странице под конкретный use-case

---

## §6 Конфигурации (MIN/OPTIMAL/MAX)

### MIN (§6.2)
- Наименьшая VRAM конфигурация при которой все пользователи обслуживаются с `tok_s_per_seq ≥ 0.5 × target`
- Допускается offload ≤ 40% весов в RAM
- Запас VRAM ≤ 5%

### OPTIMAL (§6.2)
- 100% весов + полный KV-пул в VRAM
- `util_target = 0.90`
- Запас VRAM 15–30%
- `max_parallel ≥ users`
- `tok_s_per_seq ≥ target`
- Из удовлетворяющих — минимум суммарной стоимости (если цены есть; иначе — минимум VRAM)

### MAX (§6.2)
- `VRAM_optimal × 1.5`
- `max_parallel × 2`
- Запас VRAM ≥ 40%
- PSU с запасом ≥ 30%
- NVMe × 2

### Совпадение OPTIMAL и MAX (§6.5)
Если конфигурации совпали по железу — показать одну карточку с пометкой:
> «MAX не требуется, OPTIMAL покрывает рост»

---

## §7.3 Валидация форм

### Контекст > `model.max_context` (режим B) — блокирующая ошибка (§7.3 правило)
- Ошибка отображается под полем, поле подсвечено
- Кнопка «Рассчитать» disabled при любой ошибке

### Пользователи 1–10 000, контекст 512–1 000 000 (§8)
### GPU 1–8 (§8)

### Контекст < 512 — предупреждение (не блокирует) (§7.3)

### Пользователи > 1 000 — предупреждение о нереалистичности (§8)

## §7.5 Share link через query parameters

### Параметризация URL (§7.5)
```
?mode=a&gpu=rtx4090&n=2&ctx=8192&u=10&q=q4_k_m&e=vllm&profile=chat
```

### Валидация параметров при загрузке
- Невалидные параметры игнорируются с уведомлением: «Некоторые параметры ссылки не распознаны»
- Восстановление из query имеет приоритет над localStorage (§7.5)

## §9 Тесты

### Инвариант `min ≤ optimal ≤ max` по VRAM, RAM, cores, PSU (§9)
Проверка: для 20 случайных моделей × 5 контекстов × 3 пользователей
- Успешно: все инварианты выполняются (при корректной реализации)

---

**Дата фиксации**: 2026-11-16  
**Версия расчётного ядра**: calc v1.0  
**Ответственный за обновление формул**: developer@ai-calculator.local
