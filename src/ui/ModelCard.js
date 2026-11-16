import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Компонент карточки модели
 */
export const ModelCard = ({ model, selected, onSelectModel }) => {
    return (_jsxs("div", { className: `model-card ${selected ? 'selected' : ''}`, onClick: () => onSelectModel(model.id), children: [_jsxs("div", { className: "model-header", children: [_jsx("h3", { children: model.name }), _jsx("span", { className: "family-badge", children: model.family })] }), _jsxs("div", { className: "model-stats", children: [_jsxs("div", { className: "stat", children: [_jsx("span", { className: "stat-label", children: "\u0412\u0441\u0435\u0433\u043E \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u043E\u0432:" }), _jsxs("span", { className: "stat-value", children: [(model.params_total_b / 1e9).toFixed(2), "B"] })] }), _jsxs("div", { className: "stat", children: [_jsx("span", { className: "stat-label", children: "\u0412\u0435\u0441 \u043C\u043E\u0434\u0435\u043B\u0438 (FP16):" }), _jsxs("span", { className: "stat-value", children: [(model.params_total_b * 1.5).toFixed(2), " \u0413\u0411"] })] }), _jsxs("div", { className: "stat", children: [_jsx("span", { className: "stat-label", children: "\u041C\u0430\u043A\u0441. \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442:" }), _jsxs("span", { className: "stat-value", children: [model.max_context.toLocaleString(), " \u0442\u043E\u043A\u0435\u043D\u043E\u0432"] })] })] })] }));
};
export default ModelCard;
