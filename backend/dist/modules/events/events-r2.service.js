var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var EventsR2Service_1;
import { BadRequestException, Injectable, Logger, } from '@nestjs/common';
import { createHash, createHmac } from 'node:crypto';
import { inflateRawSync } from 'node:zlib';
const VALID_ID_REGEX = /^[a-z0-9_]+$/;
const SAFE_EVENT_KEY_REGEX = /^events\/[a-z0-9_]+\/(Build\/)?[a-zA-Z0-9_.-]+$/;
const PRESIGN_EXPIRES_SECONDS = 900;
const EMPTY_SHA256_HEX = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
function encodeRfc3986(value) {
    return encodeURIComponent(value).replace(/[!'()*]/g, (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`);
}
function encodeObjectPath(key) {
    return key
        .split('/')
        .filter((segment) => segment.length > 0)
        .map((segment) => encodeRfc3986(segment))
        .join('/');
}
function sha256Hex(value) {
    return createHash('sha256').update(value).digest('hex');
}
function hmacSha256(key, data) {
    return createHmac('sha256', key).update(data).digest();
}
function deriveSigningKey(secretAccessKey, dateStamp, region, service) {
    const kDate = hmacSha256(`AWS4${secretAccessKey}`, dateStamp);
    const kRegion = hmacSha256(kDate, region);
    const kService = hmacSha256(kRegion, service);
    return hmacSha256(kService, 'aws4_request');
}
function formatAmzTimestamps(date) {
    const iso = date.toISOString();
    const dateStamp = iso.slice(0, 10).replace(/-/g, '');
    const timePart = iso.slice(11, 19).replace(/:/g, '');
    return {
        amzDate: `${dateStamp}T${timePart}Z`,
        dateStamp,
    };
}
function isSafeEventObjectKey(key) {
    if (!key || key.includes('..') || key.startsWith('/')) {
        return false;
    }
    return SAFE_EVENT_KEY_REGEX.test(key);
}
export function classifyUnityBuildFileName(rawName) {
    const baseName = rawName.split('/').pop()?.split('\\').pop()?.trim() || '';
    if (!baseName || baseName.startsWith('.'))
        return null;
    const lower = baseName.toLowerCase();
    if (lower.endsWith('.loader.js')) {
        return {
            role: 'loader',
            buildName: baseName.slice(0, -'.loader.js'.length) || 'UnityBuild',
            compression: 'none',
            contentType: 'application/javascript',
        };
    }
    const frameworkMatch = baseName.match(/^(.+?)\.framework\.js(\.(gz|br|unityweb))?$/i);
    if (frameworkMatch) {
        const ext = (frameworkMatch[3] || '').toLowerCase();
        return {
            role: 'framework',
            buildName: frameworkMatch[1] || 'UnityBuild',
            compression: ext === 'gz' ? 'gzip' : ext === 'br' ? 'brotli' : 'none',
            contentType: 'application/javascript',
        };
    }
    const wasmMatch = baseName.match(/^(.+?)\.wasm(\.(gz|br|unityweb))?$/i);
    if (wasmMatch) {
        const ext = (wasmMatch[3] || '').toLowerCase();
        return {
            role: 'wasm',
            buildName: wasmMatch[1] || 'UnityBuild',
            compression: ext === 'gz' ? 'gzip' : ext === 'br' ? 'brotli' : 'none',
            contentType: 'application/wasm',
        };
    }
    const dataMatch = baseName.match(/^(.+?)\.data(\.(gz|br|unityweb))?$/i);
    if (dataMatch) {
        const ext = (dataMatch[3] || '').toLowerCase();
        return {
            role: 'data',
            buildName: dataMatch[1] || 'UnityBuild',
            compression: ext === 'gz' ? 'gzip' : ext === 'br' ? 'brotli' : 'none',
            contentType: 'application/octet-stream',
        };
    }
    return null;
}
let EventsR2Service = EventsR2Service_1 = class EventsR2Service {
    logger = new Logger(EventsR2Service_1.name);
    getConfigOrNull() {
        const accountId = (process.env.R2_ACCOUNT_ID ?? '').trim();
        const accessKeyId = (process.env.R2_ACCESS_KEY_ID ?? '').trim();
        const secretAccessKey = (process.env.R2_SECRET_ACCESS_KEY ?? '').trim();
        const bucketName = (process.env.R2_BUCKET_NAME ?? '').trim();
        const rawPublicUrl = (process.env.R2_PUBLIC_DOMAIN ||
            process.env.R2_PUBLIC_URL ||
            process.env.NEXT_PUBLIC_R2_PUBLIC_DOMAIN ||
            '')
            .trim()
            .replace(/\/+$/, '');
        if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
            return null;
        }
        const publicUrl = rawPublicUrl || `https://${bucketName}.${accountId}.r2.dev`;
        return {
            accountId,
            accessKeyId,
            secretAccessKey,
            bucketName,
            publicUrl,
        };
    }
    getRequiredConfig() {
        const config = this.getConfigOrNull();
        if (!config) {
            throw new BadRequestException('Dịch vụ lưu trữ đám mây chưa được cấu hình đầy đủ trên máy chủ.');
        }
        return config;
    }
    createEventMediaPresignUrl(input) {
        const eventId = (input.eventId ?? '').trim();
        if (!VALID_ID_REGEX.test(eventId)) {
            throw new BadRequestException('Mã sự kiện (EventId) không hợp lệ. Chỉ dùng chữ thường, số và dấu gạch dưới.');
        }
        const rawFileName = (input.fileName ?? '')
            .split('/')
            .pop()
            ?.split('\\')
            .pop()
            ?.replace(/[^a-zA-Z0-9_.-]/g, '_') || 'file.bin';
        const role = input.role;
        let contentType = (input.contentType ?? '').trim();
        if (!contentType) {
            if (role === 'html')
                contentType = 'text/html; charset=utf-8';
            else if (role === 'loader' || role === 'framework')
                contentType = 'application/javascript';
            else if (role === 'wasm')
                contentType = 'application/wasm';
            else
                contentType = 'application/octet-stream';
        }
        const config = this.getRequiredConfig();
        const ts = Date.now();
        const key = role === 'html'
            ? `events/${eventId}/index_${ts}.html`
            : `events/${eventId}/Build/${ts}_${rawFileName}`;
        const host = `${config.accountId}.r2.cloudflarestorage.com`;
        const canonicalUri = `/${encodeRfc3986(config.bucketName)}/${encodeObjectPath(key)}`;
        const { amzDate, dateStamp } = formatAmzTimestamps(new Date());
        const region = 'auto';
        const service = 's3';
        const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
        const queryEntries = [
            ['X-Amz-Algorithm', 'AWS4-HMAC-SHA256'],
            ['X-Amz-Credential', `${config.accessKeyId}/${credentialScope}`],
            ['X-Amz-Date', amzDate],
            ['X-Amz-Expires', String(PRESIGN_EXPIRES_SECONDS)],
            ['X-Amz-SignedHeaders', 'content-type;host'],
        ];
        queryEntries.sort(([a], [b]) => a.localeCompare(b));
        const canonicalQueryString = queryEntries
            .map(([k, v]) => `${encodeRfc3986(k)}=${encodeRfc3986(v)}`)
            .join('&');
        const canonicalHeaders = `content-type:${contentType}\n` + `host:${host}\n`;
        const canonicalRequest = [
            'PUT',
            canonicalUri,
            canonicalQueryString,
            canonicalHeaders,
            'content-type;host',
            'UNSIGNED-PAYLOAD',
        ].join('\n');
        const stringToSign = [
            'AWS4-HMAC-SHA256',
            amzDate,
            credentialScope,
            sha256Hex(canonicalRequest),
        ].join('\n');
        const signingKey = deriveSigningKey(config.secretAccessKey, dateStamp, region, service);
        const signature = createHmac('sha256', signingKey)
            .update(stringToSign)
            .digest('hex');
        const uploadUrl = `https://${host}${canonicalUri}?${canonicalQueryString}&X-Amz-Signature=${signature}`;
        const publicUrl = `${config.publicUrl}/${key}`;
        return {
            uploadUrl,
            publicUrl,
            key,
            contentType,
            expiresInSeconds: PRESIGN_EXPIRES_SECONDS,
        };
    }
    async putObjectToR2(key, bodyBuffer, contentType) {
        if (!isSafeEventObjectKey(key)) {
            throw new BadRequestException('Đường dẫn lưu trữ tệp sự kiện không hợp lệ.');
        }
        const config = this.getConfigOrNull();
        if (!config) {
            return null;
        }
        const host = `${config.accountId}.r2.cloudflarestorage.com`;
        const canonicalUri = `/${encodeRfc3986(config.bucketName)}/${encodeObjectPath(key)}`;
        const { amzDate, dateStamp } = formatAmzTimestamps(new Date());
        const region = 'auto';
        const service = 's3';
        const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
        const payloadHash = sha256Hex(bodyBuffer);
        const canonicalHeaders = `content-type:${contentType}\n` +
            `host:${host}\n` +
            `x-amz-content-sha256:${payloadHash}\n` +
            `x-amz-date:${amzDate}\n`;
        const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date';
        const canonicalRequest = [
            'PUT',
            canonicalUri,
            '',
            canonicalHeaders,
            signedHeaders,
            payloadHash,
        ].join('\n');
        const stringToSign = [
            'AWS4-HMAC-SHA256',
            amzDate,
            credentialScope,
            sha256Hex(canonicalRequest),
        ].join('\n');
        const signingKey = deriveSigningKey(config.secretAccessKey, dateStamp, region, service);
        const signature = createHmac('sha256', signingKey)
            .update(stringToSign)
            .digest('hex');
        const authorization = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, ` +
            `SignedHeaders=${signedHeaders}, Signature=${signature}`;
        const response = await fetch(`https://${host}${canonicalUri}`, {
            method: 'PUT',
            headers: {
                'Content-Type': contentType,
                'x-amz-content-sha256': payloadHash,
                'x-amz-date': amzDate,
                Authorization: authorization,
            },
            body: new Uint8Array(bodyBuffer),
        });
        if (!response.ok) {
            this.logger.warn(`R2 PUT failed (${response.status}) for key=${key}`);
            return null;
        }
        return {
            key,
            publicUrl: `${config.publicUrl}/${key}`,
        };
    }
    async deleteEventObjects(keys) {
        const uniqueSafeKeys = Array.from(new Set(keys
            .map((k) => (typeof k === 'string' ? k.trim() : ''))
            .filter((k) => isSafeEventObjectKey(k))));
        if (uniqueSafeKeys.length === 0) {
            return { deletedKeys: [], failedKeys: [] };
        }
        const config = this.getConfigOrNull();
        if (!config) {
            return { deletedKeys: [], failedKeys: uniqueSafeKeys };
        }
        const deletedKeys = [];
        const failedKeys = [];
        for (const key of uniqueSafeKeys) {
            try {
                await this.deleteSingleObject(config, key);
                deletedKeys.push(key);
            }
            catch {
                failedKeys.push(key);
            }
        }
        return { deletedKeys, failedKeys };
    }
    async deleteSingleObject(config, key) {
        const host = `${config.accountId}.r2.cloudflarestorage.com`;
        const canonicalUri = `/${encodeRfc3986(config.bucketName)}/${encodeObjectPath(key)}`;
        const { amzDate, dateStamp } = formatAmzTimestamps(new Date());
        const region = 'auto';
        const service = 's3';
        const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
        const canonicalHeaders = `host:${host}\n` +
            `x-amz-content-sha256:${EMPTY_SHA256_HEX}\n` +
            `x-amz-date:${amzDate}\n`;
        const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
        const canonicalRequest = [
            'DELETE',
            canonicalUri,
            '',
            canonicalHeaders,
            signedHeaders,
            EMPTY_SHA256_HEX,
        ].join('\n');
        const stringToSign = [
            'AWS4-HMAC-SHA256',
            amzDate,
            credentialScope,
            sha256Hex(canonicalRequest),
        ].join('\n');
        const signingKey = deriveSigningKey(config.secretAccessKey, dateStamp, region, service);
        const signature = createHmac('sha256', signingKey)
            .update(stringToSign)
            .digest('hex');
        const authorization = `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${credentialScope}, ` +
            `SignedHeaders=${signedHeaders}, Signature=${signature}`;
        const response = await fetch(`https://${host}${canonicalUri}`, {
            method: 'DELETE',
            headers: {
                'x-amz-content-sha256': EMPTY_SHA256_HEX,
                'x-amz-date': amzDate,
                Authorization: authorization,
            },
        });
        if (!response.ok && response.status !== 404) {
            throw new Error(`R2 delete failed with HTTP ${response.status}`);
        }
    }
    extractUnityZipBuffer(zipBuffer) {
        let eocdOffset = -1;
        const minEocdOffset = Math.max(0, zipBuffer.length - 65557);
        for (let i = zipBuffer.length - 22; i >= minEocdOffset; i--) {
            if (zipBuffer.readUInt32LE(i) === 0x06054b50) {
                eocdOffset = i;
                break;
            }
        }
        if (eocdOffset < 0) {
            throw new BadRequestException('Tệp .zip không hợp lệ hoặc bị hỏng cấu trúc.');
        }
        const totalEntries = zipBuffer.readUInt16LE(eocdOffset + 10);
        const centralDirOffset = zipBuffer.readUInt32LE(eocdOffset + 16);
        const found = {};
        let detectedBuildName = 'UnityBuild';
        let detectedCompression = 'none';
        let totalSizeBytes = 0;
        let ptr = centralDirOffset;
        for (let idx = 0; idx < totalEntries && ptr + 46 <= zipBuffer.length; idx++) {
            const sig = zipBuffer.readUInt32LE(ptr);
            if (sig !== 0x02014b50)
                break;
            const compressionMethod = zipBuffer.readUInt16LE(ptr + 10);
            const compressedSize = zipBuffer.readUInt32LE(ptr + 20);
            const fileNameLen = zipBuffer.readUInt16LE(ptr + 28);
            const extraLen = zipBuffer.readUInt16LE(ptr + 30);
            const commentLen = zipBuffer.readUInt16LE(ptr + 32);
            const localHeaderOffset = zipBuffer.readUInt32LE(ptr + 42);
            const entryName = zipBuffer
                .subarray(ptr + 46, ptr + 46 + fileNameLen)
                .toString('utf-8');
            ptr += 46 + fileNameLen + extraLen + commentLen;
            if (entryName.endsWith('/') || entryName.includes('__MACOSX'))
                continue;
            const classified = classifyUnityBuildFileName(entryName);
            if (!classified)
                continue;
            if (localHeaderOffset + 30 > zipBuffer.length)
                continue;
            const localSig = zipBuffer.readUInt32LE(localHeaderOffset);
            if (localSig !== 0x04034b50)
                continue;
            const localNameLen = zipBuffer.readUInt16LE(localHeaderOffset + 26);
            const localExtraLen = zipBuffer.readUInt16LE(localHeaderOffset + 28);
            const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
            const compressedSlice = zipBuffer.subarray(dataStart, dataStart + compressedSize);
            let uncompressed;
            if (compressionMethod === 0) {
                uncompressed = Buffer.from(compressedSlice);
            }
            else if (compressionMethod === 8) {
                uncompressed = inflateRawSync(compressedSlice);
            }
            else {
                throw new BadRequestException(`Phương thức nén ZIP (${compressionMethod}) trong tệp "${entryName}" không được hỗ trợ. Vui lòng nén ZIP chuẩn Deflate/Store.`);
            }
            const cleanFileName = entryName.split('/').pop()?.split('\\').pop() || entryName;
            found[classified.role] = {
                role: classified.role,
                fileName: cleanFileName,
                contentType: classified.contentType,
                buffer: uncompressed,
            };
            detectedBuildName = classified.buildName;
            if (classified.compression !== 'none') {
                detectedCompression = classified.compression;
            }
            totalSizeBytes += uncompressed.length;
        }
        const missingRoles = [];
        if (!found.loader)
            missingRoles.push('*.loader.js');
        if (!found.data)
            missingRoles.push('*.data');
        if (!found.framework)
            missingRoles.push('*.framework.js');
        if (!found.wasm)
            missingRoles.push('*.wasm');
        if (missingRoles.length > 0) {
            throw new BadRequestException(`Tệp .zip bản build Unity WebGL thiếu các thành phần bắt buộc: ${missingRoles.join(', ')}.`);
        }
        return {
            buildName: detectedBuildName,
            compression: detectedCompression,
            totalSizeBytes,
            files: {
                loader: found.loader,
                data: found.data,
                framework: found.framework,
                wasm: found.wasm,
            },
        };
    }
};
EventsR2Service = EventsR2Service_1 = __decorate([
    Injectable()
], EventsR2Service);
export { EventsR2Service };
//# sourceMappingURL=events-r2.service.js.map