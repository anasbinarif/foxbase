"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
require("dotenv/config");
const zod_1 = require("zod");
const EnvSchema = zod_1.z.object({
    PORT: zod_1.z.coerce.number().int().positive().default(3000),
    LOG_LEVEL: zod_1.z.string().default('info'),
    DATABASE_URL: zod_1.z.string().min(1),
});
exports.env = EnvSchema.parse(process.env);
