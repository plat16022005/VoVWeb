var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var GachaFirebaseService_1;
import crypto from 'node:crypto';
import fs from 'node:fs';
import { ForbiddenException, Injectable, Logger, UnauthorizedException, } from '@nestjs/common';
const GOOGLE_CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
let GachaFirebaseService = GachaFirebaseService_1 = class GachaFirebaseService {
    logger = new Logger(GachaFirebaseService_1.name);
    cachedCerts = {};
    certsExpiresAt = 0;
    cachedServiceAccountToken = null;
    get projectId() {
        return (process.env.FIREBASE_PROJECT_ID ||
            process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
            'valkyria-of-verya');
    }
    get documentsBaseUrl() {
        return `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents`;
    }
    getServiceAccountCreds() {
        const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
        if (rawJson) {
            try {
                return JSON.parse(rawJson);
            }
            catch {
                this.logger.warn('FIREBASE_SERVICE_ACCOUNT_JSON không đúng định dạng JSON.');
            }
        }
        const credsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
        if (credsPath && fs.existsSync(credsPath)) {
            try {
                return JSON.parse(fs.readFileSync(credsPath, 'utf-8'));
            }
            catch {
                this.logger.warn('Không thể đọc GOOGLE_APPLICATION_CREDENTIALS.');
            }
        }
        return null;
    }
    async getServiceAccountAccessToken() {
        const creds = this.getServiceAccountCreds();
        if (!creds?.client_email || !creds?.private_key)
            return null;
        const nowSec = Math.floor(Date.now() / 1000);
        if (this.cachedServiceAccountToken &&
            this.cachedServiceAccountToken.expiresAt - 60 > nowSec) {
            return this.cachedServiceAccountToken.token;
        }
        const tokenUri = creds.token_uri || 'https://oauth2.googleapis.com/token';
        const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
        const claimSet = Buffer.from(JSON.stringify({
            iss: creds.client_email,
            scope: 'https://www.googleapis.com/auth/datastore',
            aud: tokenUri,
            exp: nowSec + 3600,
            iat: nowSec,
        })).toString('base64url');
        const signingInput = `${header}.${claimSet}`;
        const signer = crypto.createSign('RSA-SHA256');
        signer.update(signingInput);
        const signature = signer
            .sign(creds.private_key.replace(/\\n/g, '\n'))
            .toString('base64url');
        const assertion = `${signingInput}.${signature}`;
        const res = await fetch(tokenUri, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                assertion,
            }).toString(),
        });
        if (!res.ok) {
            throw new Error(`Không thể lấy OAuth2 access token (${res.status}).`);
        }
        const data = (await res.json());
        this.cachedServiceAccountToken = {
            token: data.access_token,
            expiresAt: nowSec + (data.expires_in || 3600),
        };
        return data.access_token;
    }
    async getGooglePublicCerts(forceRefresh = false) {
        const now = Date.now();
        if (!forceRefresh &&
            Object.keys(this.cachedCerts).length > 0 &&
            now < this.certsExpiresAt) {
            return this.cachedCerts;
        }
        const res = await fetch(GOOGLE_CERTS_URL);
        if (!res.ok) {
            throw new Error(`Không thể tải public certs xác thực (${res.status}).`);
        }
        const cacheControl = res.headers.get('cache-control') || '';
        const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
        const maxAgeSec = maxAgeMatch ? Number(maxAgeMatch[1]) : 3600;
        this.cachedCerts = (await res.json());
        this.certsExpiresAt = now + maxAgeSec * 1000;
        return this.cachedCerts;
    }
    async verifyFirebaseIdToken(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Thiếu mã xác thực phiên đăng nhập (Bearer Token).');
        }
        const idToken = authHeader.slice(7).trim();
        const parts = idToken.split('.');
        if (parts.length !== 3) {
            throw new UnauthorizedException('Token xác thực không hợp lệ.');
        }
        let header;
        let payload;
        try {
            header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf-8'));
            payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
        }
        catch {
            throw new UnauthorizedException('Không thể giải mã token xác thực.');
        }
        if (header.alg !== 'RS256' || typeof header.kid !== 'string') {
            throw new UnauthorizedException('Thuật toán hoặc khóa token không hợp lệ.');
        }
        const certs = await this.getGooglePublicCerts(false);
        let cert = certs[header.kid];
        if (!cert) {
            const refreshed = await this.getGooglePublicCerts(true);
            cert = refreshed[header.kid];
        }
        if (!cert) {
            throw new UnauthorizedException('Không tìm thấy chứng chỉ xác thực phù hợp cho phiên đăng nhập.');
        }
        const verifier = crypto.createVerify('RSA-SHA256');
        verifier.update(`${parts[0]}.${parts[1]}`);
        const sigValid = verifier.verify(cert, parts[2], 'base64url');
        if (!sigValid) {
            throw new UnauthorizedException('Chữ ký phiên đăng nhập không hợp lệ.');
        }
        const nowSec = Math.floor(Date.now() / 1000);
        const expectedIss = `https://securetoken.google.com/${this.projectId}`;
        if (payload.aud !== this.projectId || payload.iss !== expectedIss) {
            throw new UnauthorizedException('Phiên đăng nhập không thuộc dự án hệ thống này.');
        }
        if (typeof payload.sub !== 'string' ||
            payload.sub.length === 0 ||
            payload.sub.length > 128) {
            throw new UnauthorizedException('Định danh người dùng trong token không hợp lệ.');
        }
        if (typeof payload.exp !== 'number' || payload.exp <= nowSec) {
            throw new UnauthorizedException('Phiên đăng nhập đã hết hạn. Vui lòng tải lại hoặc đăng nhập lại.');
        }
        if (typeof payload.iat !== 'number' || payload.iat > nowSec + 300) {
            throw new UnauthorizedException('Thời gian phát hành token không hợp lệ.');
        }
        return {
            uid: payload.sub,
            email: typeof payload.email === 'string' ? payload.email : '',
            idToken,
        };
    }
    async resolveFirestoreBearerToken(userIdToken) {
        const saToken = await this.getServiceAccountAccessToken();
        return saToken || userIdToken;
    }
    async authorizeOperator(authHeader, options) {
        const verified = await this.verifyFirebaseIdToken(authHeader);
        const dbToken = await this.resolveFirestoreBearerToken(verified.idToken);
        const userDoc = await this.getDocument(`Users/${verified.uid}`, dbToken);
        if (!userDoc) {
            throw new ForbiddenException('Tài khoản chưa được cấp hồ sơ quản trị trên hệ thống.');
        }
        const userData = this.docToObject(userDoc);
        const rawRole = String(userData.Role || '').trim().toLowerCase();
        const isBanned = userData.IsBanned === true || userData.Status === 'banned';
        if (isBanned) {
            throw new ForbiddenException('Tài khoản của bạn đang bị khóa.');
        }
        if (rawRole !== 'admin' && rawRole !== 'manager') {
            throw new ForbiddenException('Chỉ Quản Trị Viên hoặc Quản Lý mới có quyền truy cập chức năng này.');
        }
        const role = rawRole === 'admin' ? 'Admin' : 'Manager';
        const username = String(userData.Username || '').trim() ||
            verified.email ||
            verified.uid;
        if (options.adminOnly && role !== 'Admin') {
            throw new ForbiddenException('Chỉ Quản Trị Viên (Admin) mới được phép xem nhật ký kiểm toán hệ thống.');
        }
        const groupId = options.permissionGroupId || 'game_data';
        const groupLabel = options.permissionGroupLabel || 'Dữ Liệu Game';
        let permissions = [];
        if (role === 'Manager') {
            const permDoc = await this.getDocument(`Users/${verified.uid}/Permissions/${groupId}`, dbToken);
            if (!permDoc) {
                throw new ForbiddenException(`Tài khoản Manager chưa được phân quyền nhóm ${groupLabel}.`);
            }
            const permData = this.docToObject(permDoc);
            if (permData.IsEnabled === false) {
                throw new ForbiddenException(`Quyền nhóm ${groupLabel} của tài khoản này đang bị tạm khóa.`);
            }
            permissions = Array.isArray(permData.SubPermissions)
                ? permData.SubPermissions.map((p) => String(p))
                : [];
            if (options.requiredAnyPermissions &&
                options.requiredAnyPermissions.length > 0) {
                const hasAny = options.requiredAnyPermissions.some((reqPerm) => permissions.includes(reqPerm));
                if (!hasAny) {
                    throw new ForbiddenException(`Bạn chưa được cấp quyền thao tác cho tác vụ thuộc nhóm ${groupLabel} này.`);
                }
            }
        }
        return {
            uid: verified.uid,
            email: verified.email || String(userData.Email || ''),
            username,
            role,
            permissions,
            authTokenForFirestore: dbToken,
        };
    }
    async authorizeAuthenticatedUser(authHeader) {
        const verified = await this.verifyFirebaseIdToken(authHeader);
        const dbToken = await this.resolveFirestoreBearerToken(verified.idToken);
        const userDoc = await this.getDocument(`Users/${verified.uid}`, dbToken);
        const userData = userDoc ? this.docToObject(userDoc) : {};
        const isBanned = userData.IsBanned === true || userData.Status === 'banned';
        if (isBanned) {
            throw new ForbiddenException('Tài khoản của bạn đang bị khóa.');
        }
        const username = String(userData.Username || '').trim() ||
            verified.email ||
            `Chỉ Huy ${verified.uid.slice(0, 6)}`;
        const role = String(userData.Role || 'Player').trim();
        return {
            uid: verified.uid,
            email: verified.email || String(userData.Email || ''),
            username,
            role,
            authTokenForFirestore: dbToken,
        };
    }
    async getPublicOrServiceToken(authHeader) {
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const verified = await this.verifyFirebaseIdToken(authHeader);
                return await this.resolveFirestoreBearerToken(verified.idToken);
            }
            catch {
            }
        }
        const saToken = await this.getServiceAccountAccessToken();
        return saToken || '';
    }
    toFirestoreValue(value) {
        if (value === null || value === undefined) {
            return { nullValue: null };
        }
        if (typeof value === 'boolean') {
            return { booleanValue: value };
        }
        if (typeof value === 'number') {
            if (Number.isInteger(value) && Number.isSafeInteger(value)) {
                return { integerValue: String(value) };
            }
            return { doubleValue: Number.isFinite(value) ? value : 0 };
        }
        if (typeof value === 'string') {
            return { stringValue: value };
        }
        if (Array.isArray(value)) {
            return {
                arrayValue: {
                    values: value.map((item) => this.toFirestoreValue(item)),
                },
            };
        }
        if (typeof value === 'object') {
            return {
                mapValue: {
                    fields: this.objectToFields(value),
                },
            };
        }
        return { stringValue: String(value) };
    }
    objectToFields(obj) {
        const fields = {};
        for (const [k, v] of Object.entries(obj)) {
            if (v !== undefined) {
                fields[k] = this.toFirestoreValue(v);
            }
        }
        return fields;
    }
    fromFirestoreValue(val) {
        if (!val)
            return undefined;
        if ('nullValue' in val)
            return null;
        if ('booleanValue' in val)
            return val.booleanValue;
        if ('integerValue' in val)
            return Number(val.integerValue);
        if ('doubleValue' in val)
            return Number(val.doubleValue);
        if ('timestampValue' in val)
            return val.timestampValue;
        if ('stringValue' in val)
            return val.stringValue;
        if ('arrayValue' in val) {
            return (val.arrayValue?.values || []).map((v) => this.fromFirestoreValue(v));
        }
        if ('mapValue' in val) {
            const obj = {};
            const fields = val.mapValue?.fields || {};
            for (const [k, v] of Object.entries(fields)) {
                obj[k] = this.fromFirestoreValue(v);
            }
            return obj;
        }
        return undefined;
    }
    docToObject(doc) {
        const obj = {};
        const fields = doc.fields || {};
        for (const [k, v] of Object.entries(fields)) {
            obj[k] = this.fromFirestoreValue(v);
        }
        return obj;
    }
    extractDocId(docName) {
        const parts = docName.split('/');
        return parts[parts.length - 1] || '';
    }
    fullDocumentName(docPath) {
        return `projects/${this.projectId}/databases/(default)/documents/${docPath}`;
    }
    async requestJson(url, token, init) {
        const headers = {
            'Content-Type': 'application/json',
            ...init?.headers,
        };
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        const res = await fetch(url, {
            ...init,
            headers,
        });
        if (!res.ok) {
            const text = await res.text();
            let msg = `Lỗi hệ thống dữ liệu (${res.status})`;
            try {
                const parsed = JSON.parse(text);
                if (parsed?.error?.message)
                    msg = parsed.error.message;
            }
            catch {
            }
            throw new Error(msg);
        }
        return (await res.json());
    }
    async getDocument(docPath, token) {
        const url = `${this.documentsBaseUrl}/${docPath}`;
        const headers = {};
        if (token) {
            headers.Authorization = `Bearer ${token}`;
        }
        const res = await fetch(url, {
            method: 'GET',
            headers,
        });
        if (res.status === 404)
            return null;
        if (!res.ok) {
            const text = await res.text();
            throw new Error(`Không thể đọc dữ liệu (${res.status}): ${text}`);
        }
        return (await res.json());
    }
    async listDocuments(collectionPath, token, pageSize = 300) {
        const docs = [];
        let pageToken;
        do {
            const params = new URLSearchParams({ pageSize: String(pageSize) });
            if (pageToken)
                params.set('pageToken', pageToken);
            const url = `${this.documentsBaseUrl}/${collectionPath}?${params.toString()}`;
            const res = await this.requestJson(url, token, { method: 'GET' });
            if (Array.isArray(res.documents)) {
                docs.push(...res.documents);
            }
            pageToken = res.nextPageToken;
        } while (pageToken);
        return docs;
    }
    async createDocument(collectionPath, documentId, data, token) {
        const queryStr = documentId
            ? `?documentId=${encodeURIComponent(documentId)}`
            : '';
        const url = `${this.documentsBaseUrl}/${collectionPath}${queryStr}`;
        return this.requestJson(url, token, {
            method: 'POST',
            body: JSON.stringify({
                fields: this.objectToFields(data),
            }),
        });
    }
    async deleteDocument(docPath, token) {
        const url = `${this.documentsBaseUrl}/${docPath}`;
        await this.requestJson(url, token, { method: 'DELETE' });
    }
    async commitWrites(writes, token) {
        if (writes.length === 0)
            return;
        const url = `${this.documentsBaseUrl}:commit`;
        await this.requestJson(url, token, {
            method: 'POST',
            body: JSON.stringify({ writes }),
        });
    }
    async runQuery(parentPath, structuredQuery, token) {
        const prefix = parentPath ? `/${parentPath}` : '';
        const url = `${this.documentsBaseUrl}${prefix}:runQuery`;
        const rows = await this.requestJson(url, token, {
            method: 'POST',
            body: JSON.stringify({ structuredQuery }),
        });
        return rows
            .map((row) => row.document)
            .filter((doc) => Boolean(doc));
    }
};
GachaFirebaseService = GachaFirebaseService_1 = __decorate([
    Injectable()
], GachaFirebaseService);
export { GachaFirebaseService };
//# sourceMappingURL=gacha-firebase.service.js.map