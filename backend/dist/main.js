import fs from 'node:fs';
import path from 'node:path';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
function parseEnvFile(filePath) {
    if (!fs.existsSync(filePath))
        return {};
    const result = {};
    const content = fs.readFileSync(filePath, 'utf-8');
    for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#'))
            continue;
        const eqIndex = line.indexOf('=');
        if (eqIndex <= 0)
            continue;
        const key = line.slice(0, eqIndex).trim();
        let val = line.slice(eqIndex + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) ||
            (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
        }
        if (key)
            result[key] = val;
    }
    return result;
}
function loadEnvironmentVariables() {
    const cwd = process.cwd();
    const backendEnvPath = path.resolve(cwd, '.env');
    const backendVars = parseEnvFile(backendEnvPath);
    for (const [key, val] of Object.entries(backendVars)) {
        if (process.env[key] === undefined) {
            process.env[key] = val;
        }
    }
    if ((process.env.NODE_ENV || 'development') !== 'production') {
        const devFallbackKeys = [
            'R2_ACCOUNT_ID',
            'R2_ACCESS_KEY_ID',
            'R2_SECRET_ACCESS_KEY',
            'R2_BUCKET_NAME',
            'R2_PUBLIC_DOMAIN',
            'R2_PUBLIC_URL',
            'NEXT_PUBLIC_R2_PUBLIC_DOMAIN',
            'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
        ];
        const frontendEnvPath = path.resolve(cwd, '..', 'frontend', '.env.local');
        const frontendVars = parseEnvFile(frontendEnvPath);
        for (const key of devFallbackKeys) {
            if (!process.env[key] && frontendVars[key]) {
                process.env[key] = frontendVars[key];
            }
        }
        if (!process.env.FIREBASE_PROJECT_ID && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
            process.env.FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
        }
    }
}
loadEnvironmentVariables();
const { AppModule } = await import('./app.module.js');
async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        bodyParser: false,
    });
    app.useBodyParser('json', { limit: '100mb' });
    app.useBodyParser('urlencoded', { limit: '100mb', extended: true });
    app.enableCors({
        origin: [
            process.env.FRONTEND_URL ?? 'http://localhost:3002',
            'http://localhost:3002',
            'http://localhost:3000',
        ],
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: true,
    });
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    app.setGlobalPrefix('api');
    const port = process.env.PORT ?? 3001;
    await app.listen(port);
    console.log(`🚀 Backend running on: http://localhost:${port}/api`);
}
await bootstrap();
//# sourceMappingURL=main.js.map