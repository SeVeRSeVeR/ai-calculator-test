/**
 * Unit-тесты конфигураций (tests/configs.test.ts)
 */

import { compareConfigs } from '../src/calc/configs';

/**
 * ТЕСТ ИНВАРИАНТА: min.VRAM ≤ optimal.VRAM ≤ max.VRAM (§9)
 */
test('compareConfigs invariant holds for valid configs', () => {
  const minConfig = [{ id: 'g1', vram_gb: 80 }];
  const optimalConfig = [{ id: 'g1', vram_gb: 96 }];
  const maxConfig = [{ id: 'g2', vram_gb: 144 }];

  const result = compareConfigs(minConfig, optimalConfig, maxConfig);

  expect(result.invariantHolds).toBe(true);
  expect(result.violations).toEqual([]);
});

test('compareConfigs detects violation min > optimal', () => {
  const minConfig = [{ id: 'g1', vram_gb: 96 }];
  const optimalConfig = [{ id: 'g1', vram_gb: 80 }]; // Неправильно: меньше чем min

  const result = compareConfigs(minConfig, optimalConfig, null);

  expect(result.invariantHolds).toBe(false);
  expect(result.violations.length).toBeGreaterThan(0);
});

test('compareConfigs detects violation optimal > max', () => {
  const minConfig = [{ id: 'g1', vram_gb: 80 }];
  const optimalConfig = [{ id: 'g1', vram_gb: 96 }];
  const maxConfig = [{ id: 'g2', vram_gb: 85 }]; // Неправильно: меньше чем optimal

  const result = compareConfigs(minConfig, optimalConfig, maxConfig);

  expect(result.invariantHolds).toBe(false);
});
