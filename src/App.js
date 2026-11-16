import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Главный компонент приложения (src/App.tsx) — роутинг и навигация между режимами
 */
import { useEffect, useState } from 'react';
import './App.css';
import ModeA from './ui/ModeA';
import ModeB from './ui/ModeB';
import Disclaimer from './ui/Disclaimer';
function App({ gpus, models, quantizations, engines }) {
    const [catalogError, setCatalogError] = useState(null);
    // Сохраняем каталог в глобальный state (для доступа из компонентов)
    useEffect(() => {
        const globalCatalog = window['__AI_CALCULATOR_CATALOG__'];
        if (!globalCatalog || !globalCatalog.gpus || !globalCatalog.models) {
            return; // Каталог ещё не загружен — будет после загрузки данных в main.tsx
        }
        // Сброс каталога для обновления данных (чтобы сбросить cache)
        globalCatalog.reset();
        window['__AI_CALCULATOR_CATALOG__'] = {
            gpus,
            models,
            quantizations,
            engines
        };
    }, [gpus, models, quantizations, engines]);
    // Проверка доступности каталога перед рендерингом компонентов
    const catalogAvailable = window['__AI_CALCULATOR_CATALOG__'] !== undefined;
    if (!catalogAvailable) {
        return (_jsx("div", { className: "app", children: _jsx("div", { className: "loading-catalog", children: "\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430 \u043A\u0430\u0442\u0430\u043B\u043E\u0433\u0430 \u0434\u0430\u043D\u043D\u044B\u0445..." }) }));
    }
    const [activeTab, setActiveTab] = useState();
    return (_jsxs("div", { className: "app", children: [_jsxs("header", { className: "app-header", children: [_jsx("h1", { children: "LLM Server Calculator" }), _jsxs("nav", { className: "mode-tabs", role: "tablist", children: [_jsx("button", { className: `tab ${activeTab === 'gpu' ? 'active' : ''}`, onClick: () => setActiveTab('gpu'), "aria-selected": activeTab === 'gpu', id: "tab-gpu", children: "\u0420\u0435\u0436\u0438\u043C A: \u041E\u0442 \u0436\u0435\u043B\u0435\u0437\u0430 \u043A \u043C\u043E\u0434\u0435\u043B\u0438" }), _jsx("button", { className: `tab ${activeTab === 'model' ? 'active' : ''}`, onClick: () => setActiveTab('model'), "aria-selected": activeTab === 'model', id: "tab-model", children: "\u0420\u0435\u0436\u0438\u043C B: \u041E\u0442 \u043C\u043E\u0434\u0435\u043B\u0438 \u043A \u0436\u0435\u043B\u0435\u0437\u0443" })] })] }), _jsx("main", { className: "app-main", children: _jsxs("div", { className: `content-section ${activeTab}`, role: "tabpanel", "aria-labelledby": activeTab === 'gpu' ? 'tab-gpu' : 'tab-model', children: [activeTab === 'gpu' && (_jsx(ModeA, { gpus: gpus, models: models, quantizations: quantizations, engines: engines, onError: (error) => setCatalogError(error) })), activeTab === 'model' && (_jsx(ModeB, { gpus: gpus, models: models, quantizations: quantizations, engines: engines, onError: (error) => setCatalogError(error) }))] }) }), _jsxs("footer", { className: "app-footer", children: [_jsx(Disclaimer, { version: "2026.11" }), catalogError && (_jsxs("div", { className: "error-message", role: "alert", children: [_jsx("strong", { children: "\u041E\u0448\u0438\u0431\u043A\u0430:" }), " ", catalogError, _jsx("button", { onClick: () => setCatalogError(null), children: "\u0417\u0430\u043A\u0440\u044B\u0442\u044C" })] })), _jsx("noscript", { children: "\u042D\u0442\u043E\u0442 \u043A\u0430\u043B\u044C\u043A\u0443\u043B\u044F\u0442\u043E\u0440 \u0442\u0440\u0435\u0431\u0443\u0435\u0442 JavaScript. \u041F\u043E\u0436\u0430\u043B\u0443\u0439\u0441\u0442\u0430, \u0432\u043A\u043B\u044E\u0447\u0438\u0442\u0435 \u0441\u043A\u0440\u0438\u043F\u0442\u044B \u0432 \u0432\u0430\u0448\u0435\u043C \u0431\u0440\u0430\u0443\u0437\u0435\u0440\u0435." })] })] }));
}
export default App;
