"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const files_js_1 = require("./routes/files.js");
const generate_js_1 = require("./routes/generate.js");
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '3001', 10);
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', version: '1.0.0' });
});
app.use('/api/files', files_js_1.filesRouter);
app.use('/api/generate', generate_js_1.generateRouter);
app.listen(PORT, () => {
    console.log(`Code by Design backend running on http://localhost:${PORT}`);
});
exports.default = app;
