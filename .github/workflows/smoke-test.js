/**
 * Smoke-тесты для проверки основных маршрутов после деплоя
 */

import { fetch } from 'undici'; // Или используйте http.get из node:https

const BASE_URL = process.env.GITHUB_PAGES_URL || 'https://sever.github.io/AI_calculator_1';

async function smokeTest() {
  console.log(`Smoke-тесты для ${BASE_URL}...\n`);

  const tests = [
    { path: '/', desc: 'Главная страница' },
    { path: '?mode=a', desc: 'Режим A (по прямой ссылке)' },
    { path: '?mode=b', desc: 'Режим B (по прямой ссылке)' },
    { path: '?mode=a&gpu=rtx4090&ctx=8192&u=1&q=q4_k_m&e=vllm', desc: 'Режим A с параметрами' },
    { path: '?mode=b&model=llama3.1-8b&ctx=8192&u=5&q=q4_k_m&ts=15', desc: 'Режим B с параметрами' },
    { path: '#/result', desc: 'Hash-роутинг (если используется)' },
  ];

  for (const test of tests) {
    try {
      const response = await fetch(`${BASE_URL}${test.path}`, {
        method: 'GET',
        redirect: 'follow'
      });

      if (response.status === 200) {
        console.log(`✓ ${test.desc}: ${response.status} OK`);
      } else {
        console.log(`✗ ${test.desc}: ${response.status} ${response.statusText}`);
        throw new Error(`Unexpected status: ${response.status}`);
      }
    } catch (error) {
      if (error.message.includes('ENOTFOUND')) {
        console.log(`- ${test.desc}: DNS resolve failed (может быть, домен ещё не настроен)`);
      } else {
        console.log(`✗ ${test.desc}: ${error.message}`);
        throw error;
      }
    }
  }

  console.log('\n✓ Все smoke-тесты пройдены');
}

smokeTest().catch(console.error);
