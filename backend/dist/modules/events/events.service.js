var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EventsService_1;
import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException, } from '@nestjs/common';
import { brotliDecompressSync, gunzipSync } from 'node:zlib';
import { GachaFirebaseService } from '../gacha/gacha-firebase.service.js';
import { EventsR2Service, } from './events-r2.service.js';
import { generateDefaultEventHtmlLayout, mergeHtmlWithUnityBuild, } from './events-html-merger.js';
const WEB_EVENTS_COLLECTION = 'WebEvents';
const EVENT_LOGS_COLLECTION_PATH = 'Logs/EventManagement/Activities';
const VALID_ID_REGEX = /^[a-z0-9_]+$/;
function formatOperatorLabel(operator) {
    return operator.email || operator.username || 'system';
}
function getTodayDateKey() {
    return new Date().toISOString().slice(0, 10);
}
const DEFAULT_MISSIONS = [
    {
        MissionId: 'daily_checkin',
        Title: 'Điểm Danh Hàng Ngày Tại Veyra',
        Description: 'Đăng nhập vào cổng sự kiện mỗi ngày để nhận lượt quay miễn phí.',
        TicketReward: 1,
        MissionType: 'daily',
    },
    {
        MissionId: 'share_event',
        Title: 'Lan Tỏa Sự Kiện Cùng Chỉ Huy',
        Description: 'Chia sẻ thông tin sự kiện đến cộng đồng người chơi Valkyria of Veyra.',
        TicketReward: 2,
        MissionType: 'daily',
    },
    {
        MissionId: 'explore_roster',
        Title: 'Khám Phá Hồ Sơ Chiến Binh Valkyria',
        Description: 'Tìm hiểu danh sách các Valkyria trên trang chủ (Thưởng 1 lần duy nhất).',
        TicketReward: 2,
        MissionType: 'once',
        ActionUrl: '/#characters',
    },
];
const DEFAULT_REWARDS = [
    {
        ItemId: 'item_01',
        ItemName: 'Chip cải tiến sơ cấp',
        Rarity: 'R',
        Quantity: 5,
        Probability: 22,
    },
    {
        ItemId: 'item_02',
        ItemName: 'Chip cải tiến trung cấp',
        Rarity: 'SR',
        Quantity: 3,
        Probability: 15,
    },
    {
        ItemId: 'item_03',
        ItemName: 'Chip cải tiến cao cấp',
        Rarity: 'SSR',
        Quantity: 1,
        Probability: 8,
    },
    {
        ItemId: 'item_04',
        ItemName: 'Lõi cộng hưởng sơ cấp',
        Rarity: 'SR',
        Quantity: 2,
        Probability: 13,
    },
    {
        ItemId: 'item_05',
        ItemName: 'Lõi cộng hưởng cao cấp',
        Rarity: 'UR',
        Quantity: 1,
        Probability: 4,
    },
    {
        ItemId: 'item_06',
        ItemName: 'Năng lượng tia sét',
        Rarity: 'R',
        Quantity: 20,
        Probability: 16,
    },
    {
        ItemId: 'item_07',
        ItemName: 'Xu vàng Veyra',
        Rarity: 'R',
        Quantity: 500,
        Probability: 15,
    },
    {
        ItemId: 'item_08',
        ItemName: 'Pha lê Veyra',
        Rarity: 'SSR',
        Quantity: 100,
        Probability: 7,
    },
];
let EventsService = EventsService_1 = class EventsService {
    firebase;
    r2;
    logger = new Logger(EventsService_1.name);
    buildAssetCache = new Map();
    constructor(firebase, r2) {
        this.firebase = firebase;
        this.r2 = r2;
    }
    assertValidId(rawId, label) {
        const trimmed = String(rawId ?? '').trim();
        if (!VALID_ID_REGEX.test(trimmed)) {
            throw new BadRequestException(`${label} không hợp lệ. Chỉ cho phép chữ thường không dấu, số và dấu gạch dưới (^[a-z0-9_]+$).`);
        }
        return trimmed;
    }
    normalizeMissions(raw) {
        if (!Array.isArray(raw))
            return DEFAULT_MISSIONS;
        const list = [];
        for (const item of raw) {
            if (!item || typeof item !== 'object')
                continue;
            const obj = item;
            const missionId = String(obj.MissionId ?? '')
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, '_');
            const title = String(obj.Title ?? '').trim();
            if (!missionId || !title)
                continue;
            list.push({
                MissionId: missionId,
                Title: title,
                Description: String(obj.Description ?? '').trim(),
                TicketReward: Math.max(1, Math.min(50, Math.round(Number(obj.TicketReward) || 1))),
                MissionType: obj.MissionType === 'once' ? 'once' : 'daily',
                ...(obj.ActionUrl ? { ActionUrl: String(obj.ActionUrl).trim() } : {}),
            });
        }
        return list.length > 0 ? list : DEFAULT_MISSIONS;
    }
    normalizeRewards(raw) {
        if (!Array.isArray(raw))
            return DEFAULT_REWARDS;
        const list = [];
        for (const item of raw) {
            if (!item || typeof item !== 'object')
                continue;
            const obj = item;
            const itemId = String(obj.ItemId ?? '')
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, '_');
            const itemName = String(obj.ItemName ?? '').trim();
            if (!itemId || !itemName)
                continue;
            const rawRarity = String(obj.Rarity ?? 'SR').toUpperCase();
            const rarity = rawRarity === 'UR' || rawRarity === 'SSR' || rawRarity === 'SR' || rawRarity === 'R'
                ? rawRarity
                : 'SR';
            list.push({
                ItemId: itemId,
                ItemName: itemName,
                Rarity: rarity,
                Quantity: Math.max(1, Math.round(Number(obj.Quantity) || 1)),
                Probability: Math.max(0, Number(obj.Probability) || 0),
                ...(obj.IconUrl ? { IconUrl: String(obj.IconUrl).trim() } : {}),
            });
        }
        return list.length > 0 ? list : DEFAULT_REWARDS;
    }
    normalizeUnityBuild(raw) {
        if (!raw || typeof raw !== 'object')
            return null;
        const obj = raw;
        const loaderUrl = String(obj.LoaderUrl ?? '').trim();
        const dataUrl = String(obj.DataUrl ?? '').trim();
        const frameworkUrl = String(obj.FrameworkUrl ?? '').trim();
        const wasmUrl = String(obj.WasmUrl ?? '').trim();
        if (!loaderUrl || !dataUrl || !frameworkUrl || !wasmUrl)
            return null;
        const rawComp = String(obj.Compression ?? 'none').toLowerCase();
        return {
            BuildName: String(obj.BuildName ?? 'UnityBuild').trim() || 'UnityBuild',
            LoaderUrl: loaderUrl,
            LoaderKey: String(obj.LoaderKey ?? '').trim(),
            DataUrl: dataUrl,
            DataKey: String(obj.DataKey ?? '').trim(),
            FrameworkUrl: frameworkUrl,
            FrameworkKey: String(obj.FrameworkKey ?? '').trim(),
            WasmUrl: wasmUrl,
            WasmKey: String(obj.WasmKey ?? '').trim(),
            Compression: rawComp === 'gzip' ? 'gzip' : rawComp === 'brotli' ? 'brotli' : 'none',
            TotalSizeBytes: Math.max(0, Number(obj.TotalSizeBytes) || 0),
            UploadedAt: String(obj.UploadedAt ?? new Date().toISOString()),
        };
    }
    normalizeEventDocument(docId, raw) {
        const eventId = String(raw.EventId || docId).trim();
        const title = String(raw.Title || 'Sự Kiện Vòng Quay Veyra').trim();
        const subtitle = String(raw.Subtitle || 'Làm nhiệm vụ nhận lượt quay và săn báu vật Valkyria').trim();
        const description = String(raw.Description || '').trim();
        const unityTargetObject = String(raw.UnityTargetObject || 'LuckyWheelManager').trim() ||
            'LuckyWheelManager';
        const unityBuild = this.normalizeUnityBuild(raw.UnityBuild);
        const rawHtmlContent = String(raw.RawHtmlContent || '').trim();
        const mergedHtmlContent = mergeHtmlWithUnityBuild({
            eventId,
            eventTitle: title,
            unityTargetObject,
            rawHtml: rawHtmlContent,
            unityBuild,
        });
        return {
            EventId: eventId,
            Title: title,
            Subtitle: subtitle,
            Description: description,
            IsActive: Boolean(raw.IsActive),
            StartTime: String(raw.StartTime || new Date().toISOString()),
            EndTime: String(raw.EndTime || new Date(Date.now() + 30 * 86400_000).toISOString()),
            InitialTickets: Math.max(0, Math.min(50, Number(raw.InitialTickets ?? 2))),
            UnityTargetObject: unityTargetObject,
            HtmlLayoutUrl: String(raw.HtmlLayoutUrl || '').trim(),
            HtmlLayoutKey: String(raw.HtmlLayoutKey || '').trim(),
            RawHtmlContent: rawHtmlContent,
            MergedHtmlContent: mergedHtmlContent,
            UnityBuild: unityBuild,
            Missions: this.normalizeMissions(raw.Missions),
            Rewards: this.normalizeRewards(raw.Rewards),
            Version: Math.max(1, Number(raw.Version) || 1),
            LastUpdated: String(raw.LastUpdated || new Date().toISOString()),
            UpdatedBy: String(raw.UpdatedBy || 'system'),
        };
    }
    async logEventActivity(operator, payload) {
        const now = Date.now();
        const record = {
            action: payload.action,
            actionTitle: payload.actionTitle,
            eventId: payload.eventId,
            eventTitle: payload.eventTitle,
            details: payload.details,
            performedBy: formatOperatorLabel(operator),
            performedByRole: operator.role,
            timestamp: now,
            createdAt: new Date(now).toISOString(),
        };
        if (payload.buildName)
            record.buildName = payload.buildName;
        if (typeof payload.version === 'number')
            record.version = payload.version;
        try {
            await this.firebase.createDocument(EVENT_LOGS_COLLECTION_PATH, null, record, operator.authTokenForFirestore);
        }
        catch (err) {
            this.logger.warn(`Không thể ghi nhật ký Sự Kiện (${payload.action}): ${err instanceof Error ? err.message : 'unknown'}`);
        }
    }
    async getAllEvents(operator) {
        const docs = await this.firebase.listDocuments(WEB_EVENTS_COLLECTION, operator.authTokenForFirestore);
        const events = docs.map((doc) => this.normalizeEventDocument(this.firebase.extractDocId(doc.name), this.firebase.docToObject(doc)));
        return events.sort((a, b) => {
            if (a.IsActive !== b.IsActive)
                return a.IsActive ? -1 : 1;
            return Date.parse(b.LastUpdated || '') - Date.parse(a.LastUpdated || '');
        });
    }
    async getEventByIdForOperator(operator, rawEventId) {
        const eventId = this.assertValidId(rawEventId, 'Mã sự kiện (EventId)');
        const doc = await this.firebase.getDocument(`${WEB_EVENTS_COLLECTION}/${eventId}`, operator.authTokenForFirestore);
        if (!doc) {
            throw new NotFoundException(`Không tìm thấy sự kiện "${eventId}".`);
        }
        return this.normalizeEventDocument(eventId, this.firebase.docToObject(doc));
    }
    async createEvent(operator, rawBody) {
        const eventId = this.assertValidId(String(rawBody.EventId ?? ''), 'Mã sự kiện (EventId)');
        const title = String(rawBody.Title ?? '').trim();
        if (!title || title.length > 200) {
            throw new BadRequestException('Tên sự kiện không được để trống và tối đa 200 ký tự.');
        }
        const existing = await this.firebase.getDocument(`${WEB_EVENTS_COLLECTION}/${eventId}`, operator.authTokenForFirestore);
        if (existing) {
            throw new ConflictException(`Mã sự kiện "${eventId}" đã tồn tại trên hệ thống.`);
        }
        const subtitle = String(rawBody.Subtitle ?? '').trim() ||
            'Làm nhiệm vụ nhận lượt quay và săn báu vật Valkyria';
        const description = String(rawBody.Description ?? '').trim();
        const unityTargetObject = String(rawBody.UnityTargetObject ?? 'LuckyWheelManager').trim() ||
            'LuckyWheelManager';
        const initialTickets = Math.max(0, Math.min(50, Math.round(Number(rawBody.InitialTickets ?? 2))));
        const startTime = String(rawBody.StartTime ?? '').trim() || new Date().toISOString();
        const endTime = String(rawBody.EndTime ?? '').trim() ||
            new Date(Date.now() + 30 * 86400_000).toISOString();
        const unityBuild = this.normalizeUnityBuild(rawBody.UnityBuild);
        const rawHtmlContent = String(rawBody.RawHtmlContent ?? '').trim() ||
            generateDefaultEventHtmlLayout(title, subtitle);
        const mergedHtmlContent = mergeHtmlWithUnityBuild({
            eventId,
            eventTitle: title,
            unityTargetObject,
            rawHtml: rawHtmlContent,
            unityBuild,
        });
        let htmlLayoutKey = String(rawBody.HtmlLayoutKey ?? '').trim();
        let htmlLayoutUrl = String(rawBody.HtmlLayoutUrl ?? '').trim();
        const r2Uploaded = await this.r2.putObjectToR2(`events/${eventId}/index_${Date.now()}.html`, Buffer.from(mergedHtmlContent, 'utf-8'), 'text/html; charset=utf-8');
        if (r2Uploaded) {
            htmlLayoutKey = r2Uploaded.key;
            htmlLayoutUrl = r2Uploaded.publicUrl;
        }
        const nowIso = new Date().toISOString();
        const opLabel = formatOperatorLabel(operator);
        const newDoc = {
            EventId: eventId,
            Title: title,
            Subtitle: subtitle,
            Description: description,
            IsActive: Boolean(rawBody.IsActive),
            StartTime: startTime,
            EndTime: endTime,
            InitialTickets: initialTickets,
            UnityTargetObject: unityTargetObject,
            HtmlLayoutUrl: htmlLayoutUrl,
            HtmlLayoutKey: htmlLayoutKey,
            RawHtmlContent: rawHtmlContent,
            MergedHtmlContent: mergedHtmlContent,
            UnityBuild: unityBuild,
            Missions: this.normalizeMissions(rawBody.Missions),
            Rewards: this.normalizeRewards(rawBody.Rewards),
            Version: 1,
            LastUpdated: nowIso,
            UpdatedBy: opLabel,
        };
        await this.firebase.createDocument(WEB_EVENTS_COLLECTION, eventId, newDoc, operator.authTokenForFirestore);
        await this.logEventActivity(operator, {
            action: 'CREATE_EVENT',
            actionTitle: 'Khởi tạo sự kiện Minigame Web',
            eventId,
            eventTitle: title,
            buildName: unityBuild?.BuildName,
            version: 1,
            details: `Tạo mới sự kiện "${title}" (${eventId})${unityBuild ? ` kèm bản build Unity "${unityBuild.BuildName}"` : ''}.`,
        });
        return newDoc;
    }
    async updateEvent(operator, rawEventId, rawBody) {
        const existing = await this.getEventByIdForOperator(operator, rawEventId);
        const eventId = existing.EventId;
        const title = rawBody.Title !== undefined
            ? String(rawBody.Title).trim()
            : existing.Title;
        if (!title || title.length > 200) {
            throw new BadRequestException('Tên sự kiện không được để trống và tối đa 200 ký tự.');
        }
        const subtitle = rawBody.Subtitle !== undefined
            ? String(rawBody.Subtitle).trim()
            : existing.Subtitle;
        const description = rawBody.Description !== undefined
            ? String(rawBody.Description).trim()
            : existing.Description;
        const unityTargetObject = rawBody.UnityTargetObject !== undefined
            ? String(rawBody.UnityTargetObject).trim() || 'LuckyWheelManager'
            : existing.UnityTargetObject;
        const initialTickets = rawBody.InitialTickets !== undefined
            ? Math.max(0, Math.min(50, Math.round(Number(rawBody.InitialTickets))))
            : existing.InitialTickets;
        const startTime = rawBody.StartTime !== undefined
            ? String(rawBody.StartTime).trim()
            : existing.StartTime;
        const endTime = rawBody.EndTime !== undefined
            ? String(rawBody.EndTime).trim()
            : existing.EndTime;
        const incomingBuild = rawBody.UnityBuild !== undefined
            ? this.normalizeUnityBuild(rawBody.UnityBuild)
            : existing.UnityBuild;
        const rawHtmlContent = rawBody.RawHtmlContent !== undefined
            ? String(rawBody.RawHtmlContent).trim()
            : existing.RawHtmlContent;
        const missions = rawBody.Missions !== undefined
            ? this.normalizeMissions(rawBody.Missions)
            : existing.Missions;
        const rewards = rawBody.Rewards !== undefined
            ? this.normalizeRewards(rawBody.Rewards)
            : existing.Rewards;
        const mergedHtmlContent = mergeHtmlWithUnityBuild({
            eventId,
            eventTitle: title,
            unityTargetObject,
            rawHtml: rawHtmlContent || generateDefaultEventHtmlLayout(title, subtitle),
            unityBuild: incomingBuild,
        });
        const oldKeysToDelete = [];
        if (existing.UnityBuild &&
            incomingBuild &&
            existing.UnityBuild.LoaderKey &&
            existing.UnityBuild.LoaderKey !== incomingBuild.LoaderKey) {
            oldKeysToDelete.push(existing.UnityBuild.LoaderKey, existing.UnityBuild.DataKey, existing.UnityBuild.FrameworkKey, existing.UnityBuild.WasmKey);
        }
        let htmlLayoutKey = existing.HtmlLayoutKey;
        let htmlLayoutUrl = existing.HtmlLayoutUrl;
        const r2Uploaded = await this.r2.putObjectToR2(`events/${eventId}/index_${Date.now()}.html`, Buffer.from(mergedHtmlContent, 'utf-8'), 'text/html; charset=utf-8');
        if (r2Uploaded) {
            if (existing.HtmlLayoutKey && existing.HtmlLayoutKey !== r2Uploaded.key) {
                oldKeysToDelete.push(existing.HtmlLayoutKey);
            }
            htmlLayoutKey = r2Uploaded.key;
            htmlLayoutUrl = r2Uploaded.publicUrl;
        }
        if (oldKeysToDelete.length > 0) {
            await this.r2.deleteEventObjects(oldKeysToDelete);
        }
        const nextVersion = existing.Version + 1;
        const nowIso = new Date().toISOString();
        const opLabel = formatOperatorLabel(operator);
        const updated = {
            ...existing,
            Title: title,
            Subtitle: subtitle,
            Description: description,
            StartTime: startTime,
            EndTime: endTime,
            InitialTickets: initialTickets,
            UnityTargetObject: unityTargetObject,
            HtmlLayoutUrl: htmlLayoutUrl,
            HtmlLayoutKey: htmlLayoutKey,
            RawHtmlContent: rawHtmlContent,
            MergedHtmlContent: mergedHtmlContent,
            UnityBuild: incomingBuild,
            Missions: missions,
            Rewards: rewards,
            Version: nextVersion,
            LastUpdated: nowIso,
            UpdatedBy: opLabel,
        };
        await this.firebase.commitWrites([
            {
                update: {
                    name: this.firebase.fullDocumentName(`${WEB_EVENTS_COLLECTION}/${eventId}`),
                    fields: this.firebase.objectToFields(updated),
                },
            },
        ], operator.authTokenForFirestore);
        const isBuildUpdate = incomingBuild?.LoaderKey !== existing.UnityBuild?.LoaderKey;
        const isHtmlUpdate = rawHtmlContent !== existing.RawHtmlContent;
        await this.logEventActivity(operator, {
            action: isBuildUpdate
                ? 'UPLOAD_BUILD'
                : isHtmlUpdate
                    ? 'UPLOAD_HTML'
                    : 'UPDATE_EVENT',
            actionTitle: isBuildUpdate
                ? 'Cập nhật bản build Unity WebGL (.zip)'
                : isHtmlUpdate
                    ? 'Cập nhật giao diện Layout (.html)'
                    : 'Cập nhật cấu hình sự kiện Minigame',
            eventId,
            eventTitle: title,
            buildName: incomingBuild?.BuildName,
            version: nextVersion,
            details: `Cập nhật sự kiện "${title}" (Phiên bản v${nextVersion}, ${missions.length} nhiệm vụ, ${rewards.length} phần thưởng).`,
        });
        return updated;
    }
    async uploadZipAndMergePackage(operator, rawEventId, rawBody) {
        const existing = await this.getEventByIdForOperator(operator, rawEventId);
        const eventId = existing.EventId;
        const zipBase64 = String(rawBody.zipBase64 ?? '').trim();
        if (!zipBase64) {
            throw new BadRequestException('Vui lòng chọn tệp .zip bản build Unity WebGL để tải lên.');
        }
        const cleanBase64 = zipBase64.replace(/^data:[^;]+;base64,/, '');
        const zipBuffer = Buffer.from(cleanBase64, 'base64');
        const extracted = this.r2.extractUnityZipBuffer(zipBuffer);
        const ts = Date.now();
        const uploadedFiles = {};
        for (const role of ['loader', 'data', 'framework', 'wasm']) {
            const file = extracted.files[role];
            const safeName = file.fileName.replace(/[^a-zA-Z0-9_.-]/g, '_');
            const key = `events/${eventId}/Build/${ts}_${safeName}`;
            const uploaded = await this.r2.putObjectToR2(key, file.buffer, file.contentType);
            if (!uploaded) {
                throw new BadRequestException('Không thể tải tệp bản build Unity lên đám mây lưu trữ. Vui lòng kiểm tra cấu hình lưu trữ.');
            }
            uploadedFiles[role] = uploaded;
        }
        const unityBuild = {
            BuildName: extracted.buildName,
            LoaderUrl: uploadedFiles.loader.publicUrl,
            LoaderKey: uploadedFiles.loader.key,
            DataUrl: uploadedFiles.data.publicUrl,
            DataKey: uploadedFiles.data.key,
            FrameworkUrl: uploadedFiles.framework.publicUrl,
            FrameworkKey: uploadedFiles.framework.key,
            WasmUrl: uploadedFiles.wasm.publicUrl,
            WasmKey: uploadedFiles.wasm.key,
            Compression: extracted.compression,
            TotalSizeBytes: extracted.totalSizeBytes,
            UploadedAt: new Date().toISOString(),
        };
        return this.updateEvent(operator, eventId, {
            ...(rawBody.RawHtmlContent !== undefined
                ? { RawHtmlContent: rawBody.RawHtmlContent }
                : {}),
            UnityBuild: unityBuild,
        });
    }
    async toggleEventActive(operator, rawEventId, isActive) {
        const existing = await this.getEventByIdForOperator(operator, rawEventId);
        const nowIso = new Date().toISOString();
        const opLabel = formatOperatorLabel(operator);
        const nextVersion = existing.Version + 1;
        await this.firebase.commitWrites([
            {
                update: {
                    name: this.firebase.fullDocumentName(`${WEB_EVENTS_COLLECTION}/${existing.EventId}`),
                    fields: this.firebase.objectToFields({
                        IsActive: isActive,
                        LastUpdated: nowIso,
                        UpdatedBy: opLabel,
                        Version: nextVersion,
                    }),
                },
                updateMask: {
                    fieldPaths: ['IsActive', 'LastUpdated', 'UpdatedBy', 'Version'],
                },
            },
        ], operator.authTokenForFirestore);
        await this.logEventActivity(operator, {
            action: isActive ? 'ACTIVATE_EVENT' : 'DEACTIVATE_EVENT',
            actionTitle: isActive
                ? 'Kích hoạt công khai sự kiện Minigame'
                : 'Tạm đóng sự kiện Minigame',
            eventId: existing.EventId,
            eventTitle: existing.Title,
            buildName: existing.UnityBuild?.BuildName,
            version: nextVersion,
            details: `${isActive ? 'Mở công khai' : 'Tạm đóng'} sự kiện "${existing.Title}" (${existing.EventId}).`,
        });
        return {
            ...existing,
            IsActive: isActive,
            Version: nextVersion,
            LastUpdated: nowIso,
            UpdatedBy: opLabel,
        };
    }
    async deleteEvent(operator, rawEventId) {
        const existing = await this.getEventByIdForOperator(operator, rawEventId);
        if (existing.IsActive) {
            throw new BadRequestException('Không thể xóa sự kiện đang mở công khai. Vui lòng tạm đóng sự kiện trước khi xóa.');
        }
        const keysToDelete = [];
        if (existing.HtmlLayoutKey)
            keysToDelete.push(existing.HtmlLayoutKey);
        if (existing.UnityBuild) {
            keysToDelete.push(existing.UnityBuild.LoaderKey, existing.UnityBuild.DataKey, existing.UnityBuild.FrameworkKey, existing.UnityBuild.WasmKey);
        }
        const r2Res = await this.r2.deleteEventObjects(keysToDelete);
        await this.firebase.deleteDocument(`${WEB_EVENTS_COLLECTION}/${existing.EventId}`, operator.authTokenForFirestore);
        await this.logEventActivity(operator, {
            action: 'DELETE_EVENT',
            actionTitle: 'Xóa sự kiện Minigame & dọn dẹp lưu trữ',
            eventId: existing.EventId,
            eventTitle: existing.Title,
            buildName: existing.UnityBuild?.BuildName,
            version: existing.Version,
            details: `Xóa sự kiện "${existing.Title}" (${existing.EventId}) và dọn dẹp ${r2Res.deletedKeys.length} tệp lưu trữ.`,
        });
        return {
            success: true,
            deletedMediaKeys: r2Res.deletedKeys,
        };
    }
    createMediaPresignUrl(rawBody) {
        const input = {
            eventId: String(rawBody.eventId ?? ''),
            role: rawBody.role || 'data',
            fileName: String(rawBody.fileName ?? ''),
            contentType: typeof rawBody.contentType === 'string'
                ? rawBody.contentType
                : undefined,
            fileSize: typeof rawBody.fileSize === 'number' ? rawBody.fileSize : undefined,
        };
        return this.r2.createEventMediaPresignUrl(input);
    }
    async getPublicActiveEvents(authHeader) {
        const token = await this.firebase.getPublicOrServiceToken(authHeader);
        try {
            const docs = await this.firebase.listDocuments(WEB_EVENTS_COLLECTION, token);
            return docs
                .map((doc) => this.normalizeEventDocument(this.firebase.extractDocId(doc.name), this.firebase.docToObject(doc)))
                .filter((ev) => ev.IsActive);
        }
        catch {
            return [];
        }
    }
    async getPublicEventById(rawEventId, authHeader) {
        const eventId = this.assertValidId(rawEventId, 'Mã sự kiện');
        const token = await this.firebase.getPublicOrServiceToken(authHeader);
        let doc = null;
        try {
            doc = await this.firebase.getDocument(`${WEB_EVENTS_COLLECTION}/${eventId}`, token);
        }
        catch (err) {
            this.logger.warn(`Không thể đọc sự kiện "${eventId}": ${err instanceof Error ? err.message : 'unknown'}`);
            throw new NotFoundException(`Sự kiện "${eventId}" chưa tồn tại hoặc chưa được mở công khai.`);
        }
        if (!doc) {
            throw new NotFoundException(`Không tìm thấy sự kiện "${eventId}".`);
        }
        return this.normalizeEventDocument(eventId, this.firebase.docToObject(doc));
    }
    async getDecompressedBuildAsset(rawEventId, rawRole) {
        const event = await this.getPublicEventById(rawEventId);
        if (!event.UnityBuild) {
            throw new NotFoundException('Sự kiện này chưa được tải lên bản build Unity WebGL.');
        }
        const role = String(rawRole || '').toLowerCase();
        let sourceUrl = '';
        let contentType = 'application/octet-stream';
        if (role === 'loader') {
            sourceUrl = event.UnityBuild.LoaderUrl;
            contentType = 'application/javascript; charset=utf-8';
        }
        else if (role === 'framework') {
            sourceUrl = event.UnityBuild.FrameworkUrl;
            contentType = 'application/javascript; charset=utf-8';
        }
        else if (role === 'wasm') {
            sourceUrl = event.UnityBuild.WasmUrl;
            contentType = 'application/wasm';
        }
        else if (role === 'data') {
            sourceUrl = event.UnityBuild.DataUrl;
            contentType = 'application/octet-stream';
        }
        else {
            throw new BadRequestException(`Loại tệp build "${role}" không hợp lệ.`);
        }
        const cached = this.buildAssetCache.get(sourceUrl);
        if (cached) {
            return cached;
        }
        const res = await fetch(sourceUrl);
        if (!res.ok) {
            throw new NotFoundException(`Không thể tải tệp build (${role}) từ đám mây lưu trữ (${res.status}).`);
        }
        const rawBuffer = Buffer.from(await res.arrayBuffer());
        const lowerUrl = sourceUrl.toLowerCase();
        let finalBuffer = rawBuffer;
        if (role !== 'loader' &&
            (lowerUrl.endsWith('.br') || event.UnityBuild.Compression === 'brotli')) {
            try {
                finalBuffer = brotliDecompressSync(rawBuffer);
            }
            catch {
                finalBuffer = rawBuffer;
            }
        }
        else if (role !== 'loader' &&
            (lowerUrl.endsWith('.gz') || event.UnityBuild.Compression === 'gzip')) {
            try {
                finalBuffer = gunzipSync(rawBuffer);
            }
            catch {
                finalBuffer = rawBuffer;
            }
        }
        const entry = { buffer: finalBuffer, contentType };
        if (this.buildAssetCache.size >= 8) {
            const oldestKey = this.buildAssetCache.keys().next().value;
            if (oldestKey)
                this.buildAssetCache.delete(oldestKey);
        }
        this.buildAssetCache.set(sourceUrl, entry);
        return entry;
    }
    async getPlayerEventState(authHeader, rawEventId) {
        const user = await this.firebase.authorizeAuthenticatedUser(authHeader);
        const event = await this.getPublicEventById(rawEventId, authHeader);
        const stateDocPath = `${WEB_EVENTS_COLLECTION}/${event.EventId}/PlayerStates/${user.uid}`;
        const stateDoc = await this.firebase.getDocument(stateDocPath, user.authTokenForFirestore);
        if (!stateDoc) {
            const nowIso = new Date().toISOString();
            const initialState = {
                Uid: user.uid,
                Username: user.username,
                EventId: event.EventId,
                SpinTickets: event.InitialTickets,
                TotalSpins: 0,
                ClaimedMissions: {},
                Inventory: {},
                RecentRewards: [],
                LastUpdated: nowIso,
            };
            await this.firebase.commitWrites([
                {
                    update: {
                        name: this.firebase.fullDocumentName(stateDocPath),
                        fields: this.firebase.objectToFields(initialState),
                    },
                },
            ], user.authTokenForFirestore);
            return initialState;
        }
        const raw = this.firebase.docToObject(stateDoc);
        return {
            Uid: user.uid,
            Username: String(raw.Username || user.username),
            EventId: event.EventId,
            SpinTickets: Math.max(0, Number(raw.SpinTickets) || 0),
            TotalSpins: Math.max(0, Number(raw.TotalSpins) || 0),
            ClaimedMissions: raw.ClaimedMissions && typeof raw.ClaimedMissions === 'object'
                ? raw.ClaimedMissions
                : {},
            Inventory: raw.Inventory && typeof raw.Inventory === 'object'
                ? raw.Inventory
                : {},
            RecentRewards: Array.isArray(raw.RecentRewards)
                ? raw.RecentRewards
                : [],
            LastUpdated: String(raw.LastUpdated || new Date().toISOString()),
        };
    }
    async claimMissionReward(authHeader, rawEventId, rawMissionId) {
        const user = await this.firebase.authorizeAuthenticatedUser(authHeader);
        const event = await this.getPublicEventById(rawEventId, authHeader);
        const missionId = String(rawMissionId ?? '').trim();
        const mission = event.Missions.find((m) => m.MissionId === missionId);
        if (!mission) {
            throw new NotFoundException(`Không tìm thấy nhiệm vụ "${missionId}" trong sự kiện này.`);
        }
        const playerState = await this.getPlayerEventState(authHeader, event.EventId);
        const todayKey = getTodayDateKey();
        const prevClaim = playerState.ClaimedMissions[missionId];
        if (mission.MissionType === 'once' && prevClaim) {
            throw new BadRequestException('Bạn đã nhận phần thưởng nhiệm vụ này trước đó rồi.');
        }
        if (mission.MissionType === 'daily' &&
            prevClaim &&
            prevClaim.startsWith(todayKey)) {
            throw new BadRequestException('Bạn đã nhận lượt quay từ nhiệm vụ này trong ngày hôm nay. Hãy quay lại vào ngày mai!');
        }
        const nowIso = new Date().toISOString();
        const updatedState = {
            ...playerState,
            SpinTickets: playerState.SpinTickets + mission.TicketReward,
            ClaimedMissions: {
                ...playerState.ClaimedMissions,
                [missionId]: nowIso,
            },
            LastUpdated: nowIso,
        };
        const stateDocPath = `${WEB_EVENTS_COLLECTION}/${event.EventId}/PlayerStates/${user.uid}`;
        const userEventPath = `Users/${user.uid}/EventStates/${event.EventId}`;
        await this.firebase.commitWrites([
            {
                update: {
                    name: this.firebase.fullDocumentName(stateDocPath),
                    fields: this.firebase.objectToFields(updatedState),
                },
            },
            {
                update: {
                    name: this.firebase.fullDocumentName(userEventPath),
                    fields: this.firebase.objectToFields({
                        EventId: event.EventId,
                        EventTitle: event.Title,
                        SpinTickets: updatedState.SpinTickets,
                        TotalSpins: updatedState.TotalSpins,
                        LastUpdated: nowIso,
                    }),
                },
            },
        ], user.authTokenForFirestore);
        return {
            mission,
            addedTickets: mission.TicketReward,
            playerState: updatedState,
        };
    }
    async recordSpinAndSaveReward(authHeader, rawEventId, rawBody) {
        const user = await this.firebase.authorizeAuthenticatedUser(authHeader);
        const event = await this.getPublicEventById(rawEventId, authHeader);
        const playerState = await this.getPlayerEventState(authHeader, event.EventId);
        if (playerState.SpinTickets <= 0) {
            throw new BadRequestException('Bạn đã hết lượt quay! Hãy hoàn thành thêm nhiệm vụ sự kiện để nhận lượt quay mới.');
        }
        let chosenItem = null;
        const requestedItemId = String(rawBody.itemId ?? rawBody.ItemId ?? '')
            .trim()
            .toLowerCase();
        if (requestedItemId && rawBody.mode !== 'server_random') {
            chosenItem =
                event.Rewards.find((r) => r.ItemId.toLowerCase() === requestedItemId) ||
                    {
                        ItemId: requestedItemId.replace(/[^a-z0-9_]/g, '_'),
                        ItemName: String(rawBody.itemName ?? rawBody.ItemName ?? requestedItemId).trim() ||
                            requestedItemId,
                        Rarity: (['UR', 'SSR', 'SR', 'R'].includes(String(rawBody.rarity ?? 'SSR').toUpperCase())
                            ? String(rawBody.rarity ?? 'SSR').toUpperCase()
                            : 'SSR'),
                        Quantity: Math.max(1, Math.round(Number(rawBody.quantity ?? 1) || 1)),
                        Probability: 0,
                    };
        }
        else {
            const pool = event.Rewards.length > 0 ? event.Rewards : DEFAULT_REWARDS;
            const totalWeight = pool.reduce((sum, r) => sum + Math.max(0.1, r.Probability || 1), 0);
            let roll = Math.random() * totalWeight;
            chosenItem = pool[pool.length - 1];
            for (const candidate of pool) {
                roll -= Math.max(0.1, candidate.Probability || 1);
                if (roll <= 0) {
                    chosenItem = candidate;
                    break;
                }
            }
        }
        const nowIso = new Date().toISOString();
        const spinId = `spin_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const spinRecord = {
            SpinId: spinId,
            Uid: user.uid,
            Username: user.username,
            EventId: event.EventId,
            ItemId: chosenItem.ItemId,
            ItemName: chosenItem.ItemName,
            Rarity: chosenItem.Rarity,
            Quantity: chosenItem.Quantity,
            WonAt: nowIso,
        };
        const existingInv = playerState.Inventory[chosenItem.ItemId];
        const nextInvQty = (existingInv?.Quantity || 0) + chosenItem.Quantity;
        const updatedInvEntry = {
            ItemId: chosenItem.ItemId,
            ItemName: chosenItem.ItemName,
            Rarity: chosenItem.Rarity,
            Quantity: nextInvQty,
            UpdatedAt: nowIso,
        };
        const updatedState = {
            ...playerState,
            SpinTickets: Math.max(0, playerState.SpinTickets - 1),
            TotalSpins: playerState.TotalSpins + 1,
            Inventory: {
                ...playerState.Inventory,
                [chosenItem.ItemId]: updatedInvEntry,
            },
            RecentRewards: [spinRecord, ...playerState.RecentRewards].slice(0, 30),
            LastUpdated: nowIso,
        };
        const stateDocPath = `${WEB_EVENTS_COLLECTION}/${event.EventId}/PlayerStates/${user.uid}`;
        const spinLogPath = `${WEB_EVENTS_COLLECTION}/${event.EventId}/SpinLogs/${spinId}`;
        const userInventoryPath = `Users/${user.uid}/Inventory/${chosenItem.ItemId}`;
        const userEventPath = `Users/${user.uid}/EventStates/${event.EventId}`;
        await this.firebase.commitWrites([
            {
                update: {
                    name: this.firebase.fullDocumentName(stateDocPath),
                    fields: this.firebase.objectToFields(updatedState),
                },
            },
            {
                update: {
                    name: this.firebase.fullDocumentName(userInventoryPath),
                    fields: this.firebase.objectToFields(updatedInvEntry),
                },
            },
            {
                update: {
                    name: this.firebase.fullDocumentName(spinLogPath),
                    fields: this.firebase.objectToFields(spinRecord),
                },
            },
            {
                update: {
                    name: this.firebase.fullDocumentName(userEventPath),
                    fields: this.firebase.objectToFields({
                        EventId: event.EventId,
                        EventTitle: event.Title,
                        SpinTickets: updatedState.SpinTickets,
                        TotalSpins: updatedState.TotalSpins,
                        LastWonItem: chosenItem.ItemName,
                        LastUpdated: nowIso,
                    }),
                },
            },
        ], user.authTokenForFirestore);
        return {
            reward: spinRecord,
            playerState: updatedState,
        };
    }
    async getEventLogs(operator, limitCount = 50) {
        const safeLimit = Math.min(Math.max(Number(limitCount) || 50, 1), 200);
        const docs = await this.firebase.listDocuments(EVENT_LOGS_COLLECTION_PATH, operator.authTokenForFirestore, 300);
        const logs = docs.map((doc) => {
            const raw = this.firebase.docToObject(doc);
            return {
                id: this.firebase.extractDocId(doc.name),
                action: raw.action || 'UPDATE_EVENT',
                actionTitle: String(raw.actionTitle || 'Thao tác sự kiện'),
                eventId: String(raw.eventId || ''),
                eventTitle: String(raw.eventTitle || ''),
                buildName: raw.buildName ? String(raw.buildName) : undefined,
                version: typeof raw.version === 'number' ? raw.version : undefined,
                details: String(raw.details || ''),
                performedBy: String(raw.performedBy || 'system'),
                performedByRole: raw.performedByRole
                    ? String(raw.performedByRole)
                    : undefined,
                timestamp: Number(raw.timestamp) || 0,
                createdAt: String(raw.createdAt || ''),
            };
        });
        return logs
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, safeLimit);
    }
};
EventsService = EventsService_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [GachaFirebaseService,
        EventsR2Service])
], EventsService);
export { EventsService };
//# sourceMappingURL=events.service.js.map