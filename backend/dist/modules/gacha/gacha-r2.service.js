var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { BadRequestException, Injectable, InternalServerErrorException, } from '@nestjs/common';
import { createHash, createHmac } from 'node:crypto';
import { VALID_ID_REGEX } from './gacha.validation.js';
const MAX_BANNER_IMAGE_BYTES = 10 * 1024 * 1024;
const PRESIGN_EXPIRES_SECONDS = 300;
const EMPTY_SHA256_HEX = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
const SAFE_KEY_REGEX = /^banners\/[a-z0-9_]+\/[a-zA-Z0-9_.-]+$/;
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
function isSafeBannerObjectKey(key) {
    if (!key || key.includes('..') || key.startsWith('/')) {
        return false;
    }
    return SAFE_KEY_REGEX.test(key);
}
let GachaR2Service = class GachaR2Service {
    getConfig() {
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
            throw new InternalServerErrorException('Dịch vụ lưu trữ hình ảnh chưa được cấu hình đầy đủ trên máy chủ.');
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
    validateGachaBannerUploadInput(input) {
        const seasonId = (input.seasonId ?? '').trim();
        const bannerId = (input.bannerId ?? '').trim();
        const variant = input.variant === 'tab' ? 'tab' : 'main';
        const rawContentType = (input.contentType ?? '').trim().toLowerCase();
        const lowerFileName = (input.fileName ?? '').trim().toLowerCase();
        if (!VALID_ID_REGEX.test(seasonId)) {
            throw new BadRequestException('Mã mùa (SeasonId) không hợp lệ. Chỉ dùng chữ thường, số và dấu gạch dưới.');
        }
        if (!VALID_ID_REGEX.test(bannerId)) {
            throw new BadRequestException('Mã banner (BannerId) không hợp lệ. Chỉ dùng chữ thường, số và dấu gạch dưới.');
        }
        if (rawContentType === 'image/webp' ||
            lowerFileName.endsWith('.webp')) {
            throw new BadRequestException('Banner Gacha KHÔNG chấp nhận định dạng .webp. Vui lòng chọn ảnh PNG hoặc JPG/JPEG.');
        }
        let contentType;
        let extension;
        if (rawContentType === 'image/png') {
            contentType = 'image/png';
            extension = 'png';
        }
        else if (rawContentType === 'image/jpeg' ||
            rawContentType === 'image/jpg') {
            contentType = 'image/jpeg';
            extension = 'jpg';
        }
        else {
            throw new BadRequestException('Định dạng ảnh banner Gacha không hợp lệ. Chỉ hỗ trợ image/png hoặc image/jpeg.');
        }
        if (lowerFileName) {
            const hasMatchingExt = (contentType === 'image/png' && lowerFileName.endsWith('.png')) ||
                (contentType === 'image/jpeg' &&
                    (lowerFileName.endsWith('.jpg') || lowerFileName.endsWith('.jpeg')));
            if (!hasMatchingExt) {
                throw new BadRequestException('Phần mở rộng tệp ảnh không khớp với định dạng PNG/JPEG được chọn.');
            }
        }
        if (input.fileSize !== undefined) {
            if (typeof input.fileSize !== 'number' ||
                !Number.isFinite(input.fileSize) ||
                input.fileSize <= 0) {
                throw new BadRequestException('Kích thước tệp ảnh không hợp lệ.');
            }
            if (input.fileSize > MAX_BANNER_IMAGE_BYTES) {
                throw new BadRequestException('Dung lượng ảnh banner vượt quá giới hạn 10MB.');
            }
        }
        return { seasonId, bannerId, variant, contentType, extension };
    }
    createGachaBannerPresignUrl(input) {
        const validated = this.validateGachaBannerUploadInput(input);
        const config = this.getConfig();
        const suffix = validated.variant === 'tab' ? '_tab' : '';
        const key = `banners/${validated.seasonId}/${validated.bannerId}${suffix}_${Date.now()}.${validated.extension}`;
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
        const canonicalHeaders = `content-type:${validated.contentType}\n` + `host:${host}\n`;
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
            contentType: validated.contentType,
            expiresInSeconds: PRESIGN_EXPIRES_SECONDS,
        };
    }
    async deleteBannerObjects(keys) {
        const uniqueSafeKeys = Array.from(new Set(keys
            .map((k) => (typeof k === 'string' ? k.trim() : ''))
            .filter((k) => isSafeBannerObjectKey(k))));
        if (uniqueSafeKeys.length === 0) {
            return { deletedKeys: [], failedKeys: [] };
        }
        const config = this.getConfig();
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
};
GachaR2Service = __decorate([
    Injectable()
], GachaR2Service);
export { GachaR2Service };
//# sourceMappingURL=gacha-r2.service.js.map