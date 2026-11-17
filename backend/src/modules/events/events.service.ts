import crypto from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { brotliDecompressSync, gunzipSync } from 'node:zlib';
import { GachaFirebaseService } from '../gacha/gacha-firebase.service.js';
import { AuthenticatedOperator } from '../gacha/gacha.types.js';
import {
  CreateEventMediaPresignInput,
  EventMediaPresignResult,
  EventsR2Service,
} from './events-r2.service.js';
import {
  generateDefaultEventHtmlLayout,
  mergeHtmlWithUnityBuild,
} from './events-html-merger.js';
import {
  EventActivityLog,
  EventLogAction,
  EventMissionConfig,
  EventRewardItemConfig,
  EventRewardRarity,
  PlayerEventState,
  PlayerInventoryEntry,
  PlayerSpinRecord,
  ReferralHelpEntry,
  UnityWebGlBuildInfo,
  WebEventDocument,
} from './events.types.js';

const WEB_EVENTS_COLLECTION = 'WebEvents';
const EVENT_LOGS_COLLECTION_PATH = 'Logs/EventManagement/Activities';
const VALID_ID_REGEX = /^[a-z0-9_]+$/;
const DAILY_CHECKIN_MISSION_ID = 'daily_checkin';
const MAX_REFERRAL_GIVEN = 5;
const MAX_REFERRAL_RECEIVED = 5;
const UPPER_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER_CHARS = 'abcdefghijklmnopqrstuvwxyz';
const DIGIT_CHARS = '0123456789';
const INVITE_CODE_ALPHABET = UPPER_CHARS + LOWER_CHARS + DIGIT_CHARS;
const INVITE_CODE_LENGTH = 8;

function formatOperatorLabel(operator: AuthenticatedOperator): string {
  return operator.email || operator.username || 'system';
}

function formatPublicCommanderName(rawName: string): string {
  const trimmed = String(rawName || '').trim();
  if (!trimmed) return 'Chỉ Huy';
  const safe = trimmed.includes('@') ? trimmed.split('@')[0] : trimmed;
  return (safe || 'Chỉ Huy').slice(0, 100);
}

function getTodayDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function generateRandomInviteCode(): string {
  let code = '';
  do {
    const chars = [
      UPPER_CHARS[crypto.randomInt(0, UPPER_CHARS.length)],
      LOWER_CHARS[crypto.randomInt(0, LOWER_CHARS.length)],
      DIGIT_CHARS[crypto.randomInt(0, DIGIT_CHARS.length)],
    ];
    while (chars.length < INVITE_CODE_LENGTH) {
      chars.push(
        INVITE_CODE_ALPHABET[crypto.randomInt(0, INVITE_CODE_ALPHABET.length)],
      );
    }
    for (let i = chars.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      const tmp = chars[i];
      chars[i] = chars[j];
      chars[j] = tmp;
    }
    code = chars.join('');
  } while (code.startsWith('VR'));
  return code;
}

const DEFAULT_MISSIONS: EventMissionConfig[] = [
  {
    MissionId: DAILY_CHECKIN_MISSION_ID,
    Title: 'Điểm Danh Hàng Ngày Tại Veyra',
    Description:
      'Điểm danh mỗi ngày để nhận lượt quay miễn phí (Làm mới mỗi ngày).',
    TicketReward: 1,
    MissionType: 'daily',
  },
];

const DEFAULT_REWARDS: EventRewardItemConfig[] = [
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

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private readonly buildAssetCache = new Map<
    string,
    { buffer: Buffer; contentType: string }
  >();

  constructor(
    private readonly firebase: GachaFirebaseService,
    private readonly r2: EventsR2Service,
  ) { }

  private assertValidId(rawId: string, label: string): string {
    const trimmed = String(rawId ?? '').trim();
    if (!VALID_ID_REGEX.test(trimmed)) {
      throw new BadRequestException(
        `${label} không hợp lệ. Chỉ cho phép chữ thường không dấu, số và dấu gạch dưới (^[a-z0-9_]+$).`,
      );
    }
    return trimmed;
  }

  private normalizeMissions(raw: unknown): EventMissionConfig[] {
    if (!Array.isArray(raw)) return DEFAULT_MISSIONS;
    for (const item of raw) {
      if (!item || typeof item !== 'object') continue;
      const obj = item as Record<string, unknown>;
      const missionId = String(obj.MissionId ?? '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_');
      if (missionId !== DAILY_CHECKIN_MISSION_ID) continue;
      const title =
        String(obj.Title ?? '').trim() || DEFAULT_MISSIONS[0].Title;
      const description =
        String(obj.Description ?? '').trim() || DEFAULT_MISSIONS[0].Description;
      return [
        {
          MissionId: DAILY_CHECKIN_MISSION_ID,
          Title: title,
          Description: description,
          TicketReward: Math.max(
            1,
            Math.min(50, Math.round(Number(obj.TicketReward) || 1)),
          ),
          MissionType: 'daily',
        },
      ];
    }
    return DEFAULT_MISSIONS;
  }

  private normalizeRewards(raw: unknown): EventRewardItemConfig[] {
    if (!Array.isArray(raw)) return DEFAULT_REWARDS;
    const list: EventRewardItemConfig[] = [];
    for (const item of raw) {
      if (!item || typeof item !== 'object') continue;
      const obj = item as Record<string, unknown>;
      const itemId = String(obj.ItemId ?? '')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_');
      const itemName = String(obj.ItemName ?? '').trim();
      if (!itemId || !itemName) continue;
      const rawRarity = String(obj.Rarity ?? 'SR').toUpperCase();
      const rarity: EventRewardRarity =
        rawRarity === 'UR' || rawRarity === 'SSR' || rawRarity === 'SR' || rawRarity === 'R'
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

  private normalizeUnityBuild(raw: unknown): UnityWebGlBuildInfo | null {
    if (!raw || typeof raw !== 'object') return null;
    const obj = raw as Record<string, unknown>;
    const loaderUrl = String(obj.LoaderUrl ?? '').trim();
    const dataUrl = String(obj.DataUrl ?? '').trim();
    const frameworkUrl = String(obj.FrameworkUrl ?? '').trim();
    const wasmUrl = String(obj.WasmUrl ?? '').trim();
    if (!loaderUrl || !dataUrl || !frameworkUrl || !wasmUrl) return null;

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
      Compression:
        rawComp === 'gzip' ? 'gzip' : rawComp === 'brotli' ? 'brotli' : 'none',
      TotalSizeBytes: Math.max(0, Number(obj.TotalSizeBytes) || 0),
      UploadedAt: String(obj.UploadedAt ?? new Date().toISOString()),
    };
  }

  private normalizeEventDocument(
    docId: string,
    raw: Record<string, unknown>,
  ): WebEventDocument {
    const eventId = String(raw.EventId || docId).trim();
    const title = String(raw.Title || 'Sự Kiện Vòng Quay Veyra').trim();
    const subtitle = String(
      raw.Subtitle || 'Làm nhiệm vụ nhận lượt quay và săn báu vật Valkyria',
    ).trim();
    const description = String(raw.Description || '').trim();
    const unityTargetObject =
      String(raw.UnityTargetObject || 'LuckyWheelManager').trim() ||
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
      EndTime: String(
        raw.EndTime || new Date(Date.now() + 30 * 86400_000).toISOString(),
      ),
      InitialTickets: Math.max(0, Math.min(50, Number(raw.InitialTickets ?? 2))),
      ReferralTicketReward: Math.max(
        1,
        Math.min(10, Math.round(Number(raw.ReferralTicketReward ?? 1) || 1)),
      ),
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

  private async logEventActivity(
    operator: AuthenticatedOperator,
    payload: {
      action: EventLogAction;
      actionTitle: string;
      eventId: string;
      eventTitle: string;
      buildName?: string;
      version?: number;
      details: string;
    },
  ): Promise<void> {
    const now = Date.now();
    const record: Record<string, unknown> = {
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
    if (payload.buildName) record.buildName = payload.buildName;
    if (typeof payload.version === 'number') record.version = payload.version;

    try {
      await this.firebase.createDocument(
        EVENT_LOGS_COLLECTION_PATH,
        null,
        record,
        operator.authTokenForFirestore,
      );
    } catch (err) {
      this.logger.warn(
        `Không thể ghi nhật ký Sự Kiện (${payload.action}): ${err instanceof Error ? err.message : 'unknown'}`,
      );
    }
  }

  // ==================== ADMIN / MANAGER CRUD ====================

  async getAllEvents(
    operator: AuthenticatedOperator,
  ): Promise<WebEventDocument[]> {
    const docs = await this.firebase.listDocuments(
      WEB_EVENTS_COLLECTION,
      operator.authTokenForFirestore,
    );
    const events = docs.map((doc) =>
      this.normalizeEventDocument(
        this.firebase.extractDocId(doc.name),
        this.firebase.docToObject(doc),
      ),
    );
    return events.sort((a, b) => {
      if (a.IsActive !== b.IsActive) return a.IsActive ? -1 : 1;
      return Date.parse(b.LastUpdated || '') - Date.parse(a.LastUpdated || '');
    });
  }

  async getEventByIdForOperator(
    operator: AuthenticatedOperator,
    rawEventId: string,
  ): Promise<WebEventDocument> {
    const eventId = this.assertValidId(rawEventId, 'Mã sự kiện (EventId)');
    const doc = await this.firebase.getDocument(
      `${WEB_EVENTS_COLLECTION}/${eventId}`,
      operator.authTokenForFirestore,
    );
    if (!doc) {
      throw new NotFoundException(`Không tìm thấy sự kiện "${eventId}".`);
    }
    return this.normalizeEventDocument(eventId, this.firebase.docToObject(doc));
  }

  async createEvent(
    operator: AuthenticatedOperator,
    rawBody: Record<string, unknown>,
  ): Promise<WebEventDocument> {
    const eventId = this.assertValidId(
      String(rawBody.EventId ?? ''),
      'Mã sự kiện (EventId)',
    );
    const title = String(rawBody.Title ?? '').trim();
    if (!title || title.length > 200) {
      throw new BadRequestException(
        'Tên sự kiện không được để trống và tối đa 200 ký tự.',
      );
    }

    const existing = await this.firebase.getDocument(
      `${WEB_EVENTS_COLLECTION}/${eventId}`,
      operator.authTokenForFirestore,
    );
    if (existing) {
      throw new ConflictException(
        `Mã sự kiện "${eventId}" đã tồn tại trên hệ thống.`,
      );
    }

    const subtitle =
      String(rawBody.Subtitle ?? '').trim() ||
      'Làm nhiệm vụ nhận lượt quay và săn báu vật Valkyria';
    const description = String(rawBody.Description ?? '').trim();
    const unityTargetObject =
      String(rawBody.UnityTargetObject ?? 'LuckyWheelManager').trim() ||
      'LuckyWheelManager';
    const initialTickets = Math.max(
      0,
      Math.min(50, Math.round(Number(rawBody.InitialTickets ?? 2))),
    );
    const referralTicketReward = Math.max(
      1,
      Math.min(10, Math.round(Number(rawBody.ReferralTicketReward ?? 1) || 1)),
    );
    const startTime =
      String(rawBody.StartTime ?? '').trim() || new Date().toISOString();
    const endTime =
      String(rawBody.EndTime ?? '').trim() ||
      new Date(Date.now() + 30 * 86400_000).toISOString();

    const unityBuild = this.normalizeUnityBuild(rawBody.UnityBuild);
    const rawHtmlContent =
      String(rawBody.RawHtmlContent ?? '').trim() ||
      generateDefaultEventHtmlLayout(title, subtitle);

    const mergedHtmlContent = mergeHtmlWithUnityBuild({
      eventId,
      eventTitle: title,
      unityTargetObject,
      rawHtml: rawHtmlContent,
      unityBuild,
    });

    // Tự động đẩy file HTML đã hợp nhất lên Cloudflare R2 (nếu R2 sẵn sàng)
    let htmlLayoutKey = String(rawBody.HtmlLayoutKey ?? '').trim();
    let htmlLayoutUrl = String(rawBody.HtmlLayoutUrl ?? '').trim();
    const r2Uploaded = await this.r2.putObjectToR2(
      `events/${eventId}/index_${Date.now()}.html`,
      Buffer.from(mergedHtmlContent, 'utf-8'),
      'text/html; charset=utf-8',
    );
    if (r2Uploaded) {
      htmlLayoutKey = r2Uploaded.key;
      htmlLayoutUrl = r2Uploaded.publicUrl;
    }

    const nowIso = new Date().toISOString();
    const opLabel = formatOperatorLabel(operator);

    const newDoc: WebEventDocument = {
      EventId: eventId,
      Title: title,
      Subtitle: subtitle,
      Description: description,
      IsActive: Boolean(rawBody.IsActive),
      StartTime: startTime,
      EndTime: endTime,
      InitialTickets: initialTickets,
      ReferralTicketReward: referralTicketReward,
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

    await this.firebase.createDocument(
      WEB_EVENTS_COLLECTION,
      eventId,
      newDoc as unknown as Record<string, unknown>,
      operator.authTokenForFirestore,
    );

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

  async updateEvent(
    operator: AuthenticatedOperator,
    rawEventId: string,
    rawBody: Record<string, unknown>,
  ): Promise<WebEventDocument> {
    const existing = await this.getEventByIdForOperator(operator, rawEventId);
    const eventId = existing.EventId;

    const title =
      rawBody.Title !== undefined
        ? String(rawBody.Title).trim()
        : existing.Title;
    if (!title || title.length > 200) {
      throw new BadRequestException(
        'Tên sự kiện không được để trống và tối đa 200 ký tự.',
      );
    }

    const subtitle =
      rawBody.Subtitle !== undefined
        ? String(rawBody.Subtitle).trim()
        : existing.Subtitle;
    const description =
      rawBody.Description !== undefined
        ? String(rawBody.Description).trim()
        : existing.Description;
    const unityTargetObject =
      rawBody.UnityTargetObject !== undefined
        ? String(rawBody.UnityTargetObject).trim() || 'LuckyWheelManager'
        : existing.UnityTargetObject;
    const initialTickets =
      rawBody.InitialTickets !== undefined
        ? Math.max(0, Math.min(50, Math.round(Number(rawBody.InitialTickets))))
        : existing.InitialTickets;
    const referralTicketReward =
      rawBody.ReferralTicketReward !== undefined
        ? Math.max(
            1,
            Math.min(10, Math.round(Number(rawBody.ReferralTicketReward) || 1)),
          )
        : (existing.ReferralTicketReward ?? 1);
    const startTime =
      rawBody.StartTime !== undefined
        ? String(rawBody.StartTime).trim()
        : existing.StartTime;
    const endTime =
      rawBody.EndTime !== undefined
        ? String(rawBody.EndTime).trim()
        : existing.EndTime;

    const incomingBuild =
      rawBody.UnityBuild !== undefined
        ? this.normalizeUnityBuild(rawBody.UnityBuild)
        : existing.UnityBuild;

    const rawHtmlContent =
      rawBody.RawHtmlContent !== undefined
        ? String(rawBody.RawHtmlContent).trim()
        : existing.RawHtmlContent;

    const missions =
      rawBody.Missions !== undefined
        ? this.normalizeMissions(rawBody.Missions)
        : existing.Missions;
    const rewards =
      rawBody.Rewards !== undefined
        ? this.normalizeRewards(rawBody.Rewards)
        : existing.Rewards;

    const mergedHtmlContent = mergeHtmlWithUnityBuild({
      eventId,
      eventTitle: title,
      unityTargetObject,
      rawHtml:
        rawHtmlContent || generateDefaultEventHtmlLayout(title, subtitle),
      unityBuild: incomingBuild,
    });

    // Dọn dẹp các file R2 cũ nếu thay bản build mới hoặc cập nhật HTML mới
    const oldKeysToDelete: string[] = [];
    if (
      existing.UnityBuild &&
      incomingBuild &&
      existing.UnityBuild.LoaderKey &&
      existing.UnityBuild.LoaderKey !== incomingBuild.LoaderKey
    ) {
      oldKeysToDelete.push(
        existing.UnityBuild.LoaderKey,
        existing.UnityBuild.DataKey,
        existing.UnityBuild.FrameworkKey,
        existing.UnityBuild.WasmKey,
      );
    }

    let htmlLayoutKey = existing.HtmlLayoutKey;
    let htmlLayoutUrl = existing.HtmlLayoutUrl;
    const r2Uploaded = await this.r2.putObjectToR2(
      `events/${eventId}/index_${Date.now()}.html`,
      Buffer.from(mergedHtmlContent, 'utf-8'),
      'text/html; charset=utf-8',
    );
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

    const updated: WebEventDocument = {
      ...existing,
      Title: title,
      Subtitle: subtitle,
      Description: description,
      StartTime: startTime,
      EndTime: endTime,
      InitialTickets: initialTickets,
      ReferralTicketReward: referralTicketReward,
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

    await this.firebase.commitWrites(
      [
        {
          update: {
            name: this.firebase.fullDocumentName(
              `${WEB_EVENTS_COLLECTION}/${eventId}`,
            ),
            fields: this.firebase.objectToFields(
              updated as unknown as Record<string, unknown>,
            ),
          },
        },
      ],
      operator.authTokenForFirestore,
    );

    const isBuildUpdate =
      incomingBuild?.LoaderKey !== existing.UnityBuild?.LoaderKey;
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

  /**
   * Nhận trực tiếp gói .zip (Base64) và file .html từ Manager, giải nén bằng node:zlib,
   * đẩy 4 file Unity WebGL + file HTML hợp nhất lên Cloudflare R2 và lưu vào Firestore
   */
  async uploadZipAndMergePackage(
    operator: AuthenticatedOperator,
    rawEventId: string,
    rawBody: Record<string, unknown>,
  ): Promise<WebEventDocument> {
    const existing = await this.getEventByIdForOperator(operator, rawEventId);
    const eventId = existing.EventId;

    const zipBase64 = String(rawBody.zipBase64 ?? '').trim();
    if (!zipBase64) {
      throw new BadRequestException(
        'Vui lòng chọn tệp .zip bản build Unity WebGL để tải lên.',
      );
    }

    const cleanBase64 = zipBase64.replace(/^data:[^;]+;base64,/, '');
    const zipBuffer = Buffer.from(cleanBase64, 'base64');
    const extracted = this.r2.extractUnityZipBuffer(zipBuffer);

    const ts = Date.now();
    const uploadedFiles: Partial<
      Record<'loader' | 'data' | 'framework' | 'wasm', { key: string; publicUrl: string }>
    > = {};

    for (const role of ['loader', 'data', 'framework', 'wasm'] as const) {
      const file = extracted.files[role];
      const safeName = file.fileName.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const key = `events/${eventId}/Build/${ts}_${safeName}`;
      const uploaded = await this.r2.putObjectToR2(
        key,
        file.buffer,
        file.contentType,
      );
      if (!uploaded) {
        throw new BadRequestException(
          'Không thể tải tệp bản build Unity lên đám mây lưu trữ. Vui lòng kiểm tra cấu hình lưu trữ.',
        );
      }
      uploadedFiles[role] = uploaded;
    }

    const unityBuild: UnityWebGlBuildInfo = {
      BuildName: extracted.buildName,
      LoaderUrl: uploadedFiles.loader!.publicUrl,
      LoaderKey: uploadedFiles.loader!.key,
      DataUrl: uploadedFiles.data!.publicUrl,
      DataKey: uploadedFiles.data!.key,
      FrameworkUrl: uploadedFiles.framework!.publicUrl,
      FrameworkKey: uploadedFiles.framework!.key,
      WasmUrl: uploadedFiles.wasm!.publicUrl,
      WasmKey: uploadedFiles.wasm!.key,
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

  async toggleEventActive(
    operator: AuthenticatedOperator,
    rawEventId: string,
    isActive: boolean,
  ): Promise<WebEventDocument> {
    const existing = await this.getEventByIdForOperator(operator, rawEventId);
    const nowIso = new Date().toISOString();
    const opLabel = formatOperatorLabel(operator);
    const nextVersion = existing.Version + 1;

    await this.firebase.commitWrites(
      [
        {
          update: {
            name: this.firebase.fullDocumentName(
              `${WEB_EVENTS_COLLECTION}/${existing.EventId}`,
            ),
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
      ],
      operator.authTokenForFirestore,
    );

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

  async deleteEvent(
    operator: AuthenticatedOperator,
    rawEventId: string,
  ): Promise<{ success: boolean; deletedMediaKeys: string[] }> {
    const existing = await this.getEventByIdForOperator(operator, rawEventId);
    if (existing.IsActive) {
      throw new BadRequestException(
        'Không thể xóa sự kiện đang mở công khai. Vui lòng tạm đóng sự kiện trước khi xóa.',
      );
    }

    const keysToDelete: string[] = [];
    if (existing.HtmlLayoutKey) keysToDelete.push(existing.HtmlLayoutKey);
    if (existing.UnityBuild) {
      keysToDelete.push(
        existing.UnityBuild.LoaderKey,
        existing.UnityBuild.DataKey,
        existing.UnityBuild.FrameworkKey,
        existing.UnityBuild.WasmKey,
      );
    }

    const r2Res = await this.r2.deleteEventObjects(keysToDelete);
    await this.firebase.deleteDocument(
      `${WEB_EVENTS_COLLECTION}/${existing.EventId}`,
      operator.authTokenForFirestore,
    );

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

  createMediaPresignUrl(
    rawBody: Record<string, unknown>,
  ): EventMediaPresignResult {
    const input: CreateEventMediaPresignInput = {
      eventId: String(rawBody.eventId ?? ''),
      role: (rawBody.role as CreateEventMediaPresignInput['role']) || 'data',
      fileName: String(rawBody.fileName ?? ''),
      contentType:
        typeof rawBody.contentType === 'string'
          ? rawBody.contentType
          : undefined,
      fileSize:
        typeof rawBody.fileSize === 'number' ? rawBody.fileSize : undefined,
    };
    return this.r2.createEventMediaPresignUrl(input);
  }

  // ==================== PUBLIC & PLAYER INTERACTIONS ====================

  async getPublicActiveEvents(
    authHeader?: string,
  ): Promise<WebEventDocument[]> {
    const token = await this.firebase.getPublicOrServiceToken(authHeader);
    try {
      const docs = await this.firebase.listDocuments(
        WEB_EVENTS_COLLECTION,
        token,
      );
      return docs
        .map((doc) =>
          this.normalizeEventDocument(
            this.firebase.extractDocId(doc.name),
            this.firebase.docToObject(doc),
          ),
        )
        .filter((ev) => ev.IsActive);
    } catch {
      return [];
    }
  }

  async getPublicEventById(
    rawEventId: string,
    authHeader?: string,
  ): Promise<WebEventDocument> {
    const eventId = this.assertValidId(rawEventId, 'Mã sự kiện');
    const token = await this.firebase.getPublicOrServiceToken(authHeader);
    let doc = null;
    try {
      doc = await this.firebase.getDocument(
        `${WEB_EVENTS_COLLECTION}/${eventId}`,
        token,
      );
    } catch (err) {
      this.logger.warn(
        `Không thể đọc sự kiện "${eventId}": ${err instanceof Error ? err.message : 'unknown'}`,
      );
      throw new NotFoundException(
        `Sự kiện "${eventId}" chưa tồn tại hoặc chưa được mở công khai.`,
      );
    }
    if (!doc) {
      throw new NotFoundException(`Không tìm thấy sự kiện "${eventId}".`);
    }
    return this.normalizeEventDocument(eventId, this.firebase.docToObject(doc));
  }

  /**
   * Tải tệp build Unity WebGL từ lưu trữ đám mây, tự động giải nén Brotli (.br) / Gzip (.gz)
   * và lưu đệm trong bộ nhớ để trình duyệt nạp trực tiếp không bị lỗi CORS hay lỗi Content-Encoding
   */
  async getDecompressedBuildAsset(
    rawEventId: string,
    rawRole: string,
  ): Promise<{ buffer: Buffer; contentType: string }> {
    const event = await this.getPublicEventById(rawEventId);
    if (!event.UnityBuild) {
      throw new NotFoundException(
        'Sự kiện này chưa được tải lên bản build Unity WebGL.',
      );
    }

    const role = String(rawRole || '').toLowerCase();
    let sourceUrl = '';
    let contentType = 'application/octet-stream';

    if (role === 'loader') {
      sourceUrl = event.UnityBuild.LoaderUrl;
      contentType = 'application/javascript; charset=utf-8';
    } else if (role === 'framework') {
      sourceUrl = event.UnityBuild.FrameworkUrl;
      contentType = 'application/javascript; charset=utf-8';
    } else if (role === 'wasm') {
      sourceUrl = event.UnityBuild.WasmUrl;
      contentType = 'application/wasm';
    } else if (role === 'data') {
      sourceUrl = event.UnityBuild.DataUrl;
      contentType = 'application/octet-stream';
    } else {
      throw new BadRequestException(`Loại tệp build "${role}" không hợp lệ.`);
    }

    const cached = this.buildAssetCache.get(sourceUrl);
    if (cached) {
      return cached;
    }

    const res = await fetch(sourceUrl);
    if (!res.ok) {
      throw new NotFoundException(
        `Không thể tải tệp build (${role}) từ đám mây lưu trữ (${res.status}).`,
      );
    }

    const rawBuffer = Buffer.from(await res.arrayBuffer());
    const lowerUrl = sourceUrl.toLowerCase();
    let finalBuffer = rawBuffer;

    if (
      role !== 'loader' &&
      (lowerUrl.endsWith('.br') || event.UnityBuild.Compression === 'brotli')
    ) {
      try {
        finalBuffer = brotliDecompressSync(rawBuffer);
      } catch {
        finalBuffer = rawBuffer;
      }
    } else if (
      role !== 'loader' &&
      (lowerUrl.endsWith('.gz') || event.UnityBuild.Compression === 'gzip')
    ) {
      try {
        finalBuffer = gunzipSync(rawBuffer);
      } catch {
        finalBuffer = rawBuffer;
      }
    }

    const entry = { buffer: finalBuffer, contentType };
    if (this.buildAssetCache.size >= 8) {
      const oldestKey = this.buildAssetCache.keys().next().value;
      if (oldestKey) this.buildAssetCache.delete(oldestKey);
    }
    this.buildAssetCache.set(sourceUrl, entry);

    return entry;
  }

  private buildFirestorePlayerDoc(
    state: PlayerEventState,
    helpedTargetUids: string[],
    claimedHelperUids: string[],
  ): Record<string, unknown> {
    return {
      ...state,
      HelpedTargetUids: helpedTargetUids,
      ClaimedHelperUids: claimedHelperUids,
    };
  }

  private async ensurePlayerInviteCode(
    eventId: string,
    uid: string,
    username: string,
    token: string,
    preferredCode?: string,
  ): Promise<string> {
    const cleanPreferred = String(preferredCode || '')
      .trim()
      .replace(/[^A-Za-z0-9]/g, '');
    const nowIso = new Date().toISOString();

    const tryClaimCode = async (candidate: string): Promise<boolean> => {
      const codePath = `${WEB_EVENTS_COLLECTION}/${eventId}/InviteCodes/${candidate}`;
      const existing = await this.firebase.getDocument(codePath, token);
      if (existing) {
        const raw = this.firebase.docToObject(existing);
        return String(raw.OwnerUid || '') === uid;
      }
      try {
        await this.firebase.createDocument(
          `${WEB_EVENTS_COLLECTION}/${eventId}/InviteCodes`,
          candidate,
          {
            InviteCode: candidate,
            OwnerUid: uid,
            OwnerUsername: formatPublicCommanderName(username),
            EventId: eventId,
            CreatedAt: nowIso,
          },
          token,
        );
        return true;
      } catch {
        const recheck = await this.firebase.getDocument(codePath, token);
        if (recheck) {
          const raw = this.firebase.docToObject(recheck);
          return String(raw.OwnerUid || '') === uid;
        }
        return false;
      }
    };

    if (cleanPreferred.length >= 4 && cleanPreferred.length <= 24) {
      let shouldUpgradeLegacy = false;
      if (/^VR[A-Z0-9]{6}$/.test(cleanPreferred)) {
        const legacyHelps = await this.listSortedHelpsForInviteCode(
          eventId,
          cleanPreferred,
          1,
          token,
        );
        shouldUpgradeLegacy = legacyHelps.length === 0;
      }
      if (!shouldUpgradeLegacy && (await tryClaimCode(cleanPreferred))) {
        return cleanPreferred;
      }
    }

    for (let attempt = 0; attempt < 15; attempt++) {
      const candidate = generateRandomInviteCode();
      if (await tryClaimCode(candidate)) {
        return candidate;
      }
    }

    const fallback = generateRandomInviteCode();
    await tryClaimCode(fallback);
    return fallback;
  }

  private normalizeReferralHelpList(raw: unknown): ReferralHelpEntry[] {
    if (!Array.isArray(raw)) return [];
    const list: ReferralHelpEntry[] = [];
    for (const entry of raw) {
      if (!entry || typeof entry !== 'object') continue;
      const obj = entry as Record<string, unknown>;
      const username = String(obj.Username || 'Chỉ Huy').trim() || 'Chỉ Huy';
      list.push({
        Username: username,
        TicketsEarned: Math.max(1, Math.round(Number(obj.TicketsEarned) || 1)),
        CreatedAt: String(obj.CreatedAt || ''),
      });
    }
    return list;
  }

  private async listSortedHelpsForInviteCode(
    eventId: string,
    inviteCode: string,
    defaultTickets: number,
    token: string,
  ): Promise<
    Array<{
      helperUid: string;
      username: string;
      ticketsEarned: number;
      createdAt: string;
    }>
  > {
    if (!inviteCode) return [];
    let docs = [];
    try {
      docs = await this.firebase.listDocuments(
        `${WEB_EVENTS_COLLECTION}/${eventId}/InviteCodes/${inviteCode}/Helps`,
        token,
        100,
      );
    } catch {
      return [];
    }

    return docs
      .map((doc) => {
        const raw = this.firebase.docToObject(doc);
        const helperUid = String(
          raw.HelperUid || this.firebase.extractDocId(doc.name) || '',
        ).trim();
        return {
          helperUid,
          username:
            String(raw.HelperUsername || 'Chỉ Huy').trim() || 'Chỉ Huy',
          ticketsEarned: Math.max(
            1,
            Math.min(
              10,
              Math.round(Number(raw.TicketsEarned) || defaultTickets || 1),
            ),
          ),
          createdAt: String(raw.CreatedAt || doc.createTime || ''),
        };
      })
      .filter((entry) => Boolean(entry.helperUid))
      .sort((a, b) => {
        const cmp = a.createdAt.localeCompare(b.createdAt);
        return cmp !== 0 ? cmp : a.helperUid.localeCompare(b.helperUid);
      });
  }

  private async loadStoredPlayerState(
    authHeader: string | undefined,
    event: WebEventDocument,
  ): Promise<{
    user: Awaited<ReturnType<GachaFirebaseService['authorizeAuthenticatedUser']>>;
    state: PlayerEventState;
    helpedTargetUids: string[];
    claimedHelperUids: string[];
  }> {
    const user = await this.firebase.authorizeAuthenticatedUser(authHeader);
    const stateDocPath = `${WEB_EVENTS_COLLECTION}/${event.EventId}/PlayerStates/${user.uid}`;
    const userEventPath = `Users/${user.uid}/EventStates/${event.EventId}`;

    const stateDoc = await this.firebase.getDocument(
      stateDocPath,
      user.authTokenForFirestore,
    );

    const nowIso = new Date().toISOString();
    const referralDefaultTickets = event.ReferralTicketReward ?? 1;

    if (!stateDoc) {
      const inviteCode = await this.ensurePlayerInviteCode(
        event.EventId,
        user.uid,
        user.username,
        user.authTokenForFirestore,
      );
      const initialState: PlayerEventState = {
        Uid: user.uid,
        Username: user.username,
        EventId: event.EventId,
        SpinTickets: event.InitialTickets,
        TotalSpins: 0,
        ClaimedMissions: {},
        Inventory: {},
        RecentRewards: [],
        InviteCode: inviteCode,
        HelpGivenCount: 0,
        HelpReceivedCount: 0,
        MaxHelpGiven: MAX_REFERRAL_GIVEN,
        MaxHelpReceived: MAX_REFERRAL_RECEIVED,
        UsedHelps: [],
        ReceivedHelps: [],
        LastUpdated: nowIso,
      };
      await this.firebase.commitWrites(
        [
          {
            update: {
              name: this.firebase.fullDocumentName(stateDocPath),
              fields: this.firebase.objectToFields(
                this.buildFirestorePlayerDoc(initialState, [], []),
              ),
            },
          },
        ],
        user.authTokenForFirestore,
      );
      return {
        user,
        state: initialState,
        helpedTargetUids: [],
        claimedHelperUids: [],
      };
    }

    const raw = this.firebase.docToObject(stateDoc);
    const existingInviteCode = String(raw.InviteCode || '').trim();
    const inviteCode = await this.ensurePlayerInviteCode(
      event.EventId,
      user.uid,
      String(raw.Username || user.username),
      user.authTokenForFirestore,
      existingInviteCode,
    );

    const helpedTargetUids = Array.isArray(raw.HelpedTargetUids)
      ? Array.from(
          new Set(
            raw.HelpedTargetUids.map((id: unknown) => String(id || '').trim()).filter(
              Boolean,
            ),
          ),
        ).slice(0, MAX_REFERRAL_GIVEN)
      : [];

    const existingClaimedHelperUids = Array.isArray(raw.ClaimedHelperUids)
      ? Array.from(
          new Set(
            raw.ClaimedHelperUids.map((id: unknown) =>
              String(id || '').trim(),
            ).filter(Boolean),
          ),
        ).slice(0, MAX_REFERRAL_RECEIVED)
      : [];

    const usedHelps = this.normalizeReferralHelpList(raw.UsedHelps).slice(
      0,
      MAX_REFERRAL_GIVEN,
    );
    const prevReceivedHelps = this.normalizeReferralHelpList(
      raw.ReceivedHelps,
    ).slice(0, MAX_REFERRAL_RECEIVED);

    // Đồng bộ các lượt người khác đã nhập mã của mình (tối đa 5 lượt vĩnh viễn, không reset)
    const sortedHelps = await this.listSortedHelpsForInviteCode(
      event.EventId,
      inviteCode,
      referralDefaultTickets,
      user.authTokenForFirestore,
    );
    const validTopHelps = sortedHelps.slice(0, MAX_REFERRAL_RECEIVED);

    const nextClaimedHelperUids = [...existingClaimedHelperUids];
    let newlyCreditedTickets = 0;
    for (const help of validTopHelps) {
      if (!nextClaimedHelperUids.includes(help.helperUid)) {
        nextClaimedHelperUids.push(help.helperUid);
        newlyCreditedTickets += help.ticketsEarned;
      }
    }

    const receivedHelps: ReferralHelpEntry[] = validTopHelps.map((h) => ({
      Username: h.username,
      TicketsEarned: h.ticketsEarned,
      CreatedAt: h.createdAt,
    }));

    const baseTickets = Math.max(0, Number(raw.SpinTickets) || 0);
    const totalSpins = Math.max(0, Number(raw.TotalSpins) || 0);
    const needsPersist =
      existingInviteCode !== inviteCode ||
      newlyCreditedTickets > 0 ||
      receivedHelps.length !== prevReceivedHelps.length ||
      raw.HelpReceivedCount !== receivedHelps.length ||
      raw.HelpGivenCount !== helpedTargetUids.length;

    const syncedState: PlayerEventState = {
      Uid: user.uid,
      Username: String(raw.Username || user.username),
      EventId: event.EventId,
      SpinTickets: baseTickets + newlyCreditedTickets,
      TotalSpins: totalSpins,
      ClaimedMissions:
        raw.ClaimedMissions && typeof raw.ClaimedMissions === 'object'
          ? (raw.ClaimedMissions as Record<string, string>)
          : {},
      Inventory:
        raw.Inventory && typeof raw.Inventory === 'object'
          ? (raw.Inventory as Record<string, PlayerInventoryEntry>)
          : {},
      RecentRewards: Array.isArray(raw.RecentRewards)
        ? (raw.RecentRewards as PlayerSpinRecord[])
        : [],
      InviteCode: inviteCode,
      HelpGivenCount: helpedTargetUids.length,
      HelpReceivedCount: receivedHelps.length,
      MaxHelpGiven: MAX_REFERRAL_GIVEN,
      MaxHelpReceived: MAX_REFERRAL_RECEIVED,
      UsedHelps: usedHelps,
      ReceivedHelps: receivedHelps,
      LastUpdated: needsPersist
        ? nowIso
        : String(raw.LastUpdated || nowIso),
    };

    if (needsPersist) {
      await this.firebase.commitWrites(
        [
          {
            update: {
              name: this.firebase.fullDocumentName(stateDocPath),
              fields: this.firebase.objectToFields(
                this.buildFirestorePlayerDoc(
                  syncedState,
                  helpedTargetUids,
                  nextClaimedHelperUids,
                ),
              ),
            },
          },
          {
            update: {
              name: this.firebase.fullDocumentName(userEventPath),
              fields: this.firebase.objectToFields({
                EventId: event.EventId,
                EventTitle: event.Title,
                SpinTickets: syncedState.SpinTickets,
                TotalSpins: syncedState.TotalSpins,
                LastUpdated: syncedState.LastUpdated,
              }),
            },
          },
        ],
        user.authTokenForFirestore,
      );
    }

    return {
      user,
      state: syncedState,
      helpedTargetUids,
      claimedHelperUids: nextClaimedHelperUids,
    };
  }

  async getPlayerEventState(
    authHeader: string | undefined,
    rawEventId: string,
  ): Promise<PlayerEventState> {
    const event = await this.getPublicEventById(rawEventId, authHeader);
    const { state } = await this.loadStoredPlayerState(authHeader, event);
    return state;
  }

  async claimMissionReward(
    authHeader: string | undefined,
    rawEventId: string,
    rawMissionId: string,
  ): Promise<{
    mission: EventMissionConfig;
    addedTickets: number;
    playerState: PlayerEventState;
  }> {
    const event = await this.getPublicEventById(rawEventId, authHeader);
    const missionId = String(rawMissionId ?? '').trim();
    if (missionId !== DAILY_CHECKIN_MISSION_ID) {
      throw new BadRequestException(
        'Nhiệm vụ này đã ngừng áp dụng. Sự kiện chỉ nhận lượt qua Điểm Danh Hằng Ngày và Mã Hỗ Trợ.',
      );
    }

    const mission =
      event.Missions.find((m) => m.MissionId === DAILY_CHECKIN_MISSION_ID) ||
      DEFAULT_MISSIONS[0];

    const { user, state, helpedTargetUids, claimedHelperUids } =
      await this.loadStoredPlayerState(authHeader, event);

    const todayKey = getTodayDateKey();
    const prevClaim = state.ClaimedMissions[DAILY_CHECKIN_MISSION_ID];
    if (prevClaim && prevClaim.startsWith(todayKey)) {
      throw new BadRequestException(
        'Bạn đã điểm danh nhận lượt trong ngày hôm nay. Hãy quay lại vào ngày mai!',
      );
    }

    const nowIso = new Date().toISOString();
    const updatedState: PlayerEventState = {
      ...state,
      SpinTickets: state.SpinTickets + mission.TicketReward,
      ClaimedMissions: {
        ...state.ClaimedMissions,
        [DAILY_CHECKIN_MISSION_ID]: nowIso,
      },
      LastUpdated: nowIso,
    };

    const stateDocPath = `${WEB_EVENTS_COLLECTION}/${event.EventId}/PlayerStates/${user.uid}`;
    const userEventPath = `Users/${user.uid}/EventStates/${event.EventId}`;

    await this.firebase.commitWrites(
      [
        {
          update: {
            name: this.firebase.fullDocumentName(stateDocPath),
            fields: this.firebase.objectToFields(
              this.buildFirestorePlayerDoc(
                updatedState,
                helpedTargetUids,
                claimedHelperUids,
              ),
            ),
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
      ],
      user.authTokenForFirestore,
    );

    return {
      mission,
      addedTickets: mission.TicketReward,
      playerState: updatedState,
    };
  }

  async redeemInviteCode(
    authHeader: string | undefined,
    rawEventId: string,
    rawCode: string,
  ): Promise<{
    addedTickets: number;
    targetUsername: string;
    playerState: PlayerEventState;
  }> {
    const event = await this.getPublicEventById(rawEventId, authHeader);
    const code = String(rawCode ?? '')
      .trim()
      .replace(/[^A-Za-z0-9]/g, '');

    if (code.length < 4 || code.length > 24) {
      throw new BadRequestException(
        'Mã hỗ trợ không hợp lệ. Vui lòng nhập đúng mã gồm chữ và số.',
      );
    }

    const { user, state, helpedTargetUids, claimedHelperUids } =
      await this.loadStoredPlayerState(authHeader, event);

    if (helpedTargetUids.length >= MAX_REFERRAL_GIVEN) {
      throw new BadRequestException(
        `Bạn đã dùng hết ${MAX_REFERRAL_GIVEN}/${MAX_REFERRAL_GIVEN} lần nhập mã hỗ trợ người khác trong sự kiện này (không làm mới).`,
      );
    }

    const inviteDocPath = `${WEB_EVENTS_COLLECTION}/${event.EventId}/InviteCodes/${code}`;
    const inviteDoc = await this.firebase.getDocument(
      inviteDocPath,
      user.authTokenForFirestore,
    );
    if (!inviteDoc) {
      throw new NotFoundException(
        'Không tìm thấy mã hỗ trợ này trong sự kiện. Vui lòng kiểm tra lại mã hoặc nhắc bạn bè mở trang sự kiện trước.',
      );
    }

    const inviteData = this.firebase.docToObject(inviteDoc);
    const ownerUid = String(inviteData.OwnerUid || '').trim();
    const ownerUsername = formatPublicCommanderName(
      String(inviteData.OwnerUsername || 'Chỉ Huy'),
    );

    if (!ownerUid) {
      throw new NotFoundException('Mã hỗ trợ không hợp lệ.');
    }

    if (ownerUid === user.uid || code === state.InviteCode) {
      throw new BadRequestException(
        'Bạn không thể tự nhập mã hỗ trợ của chính mình.',
      );
    }

    if (helpedTargetUids.includes(ownerUid)) {
      throw new BadRequestException(
        'Bạn đã nhập mã hỗ trợ cho người chơi này trước đó rồi.',
      );
    }

    const existingHelps = await this.listSortedHelpsForInviteCode(
      event.EventId,
      code,
      event.ReferralTicketReward ?? 1,
      user.authTokenForFirestore,
    );
    if (existingHelps.some((h) => h.helperUid === user.uid)) {
      throw new BadRequestException(
        'Bạn đã nhập mã hỗ trợ cho người chơi này trước đó rồi.',
      );
    }
    if (existingHelps.length >= MAX_REFERRAL_RECEIVED) {
      throw new BadRequestException(
        `Người chơi này đã nhận đủ tối đa ${MAX_REFERRAL_RECEIVED}/${MAX_REFERRAL_RECEIVED} lượt hỗ trợ từ người khác (không làm mới).`,
      );
    }

    const nowIso = new Date().toISOString();
    const ticketReward = event.ReferralTicketReward ?? 1;

    try {
      await this.firebase.createDocument(
        `${WEB_EVENTS_COLLECTION}/${event.EventId}/InviteCodes/${code}/Helps`,
        user.uid,
        {
          HelperUid: user.uid,
          HelperUsername: formatPublicCommanderName(user.username),
          OwnerUid: ownerUid,
          InviteCode: code,
          TicketsEarned: ticketReward,
          CreatedAt: nowIso,
        },
        user.authTokenForFirestore,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('ALREADY_EXISTS') || msg.includes('409')) {
        throw new BadRequestException(
          'Bạn đã nhập mã hỗ trợ cho người chơi này trước đó rồi.',
        );
      }
      throw err;
    }

    // Xác minh thứ tự ghi nhận trong giới hạn tối đa 5 lượt (tránh đua luồng đồng thời)
    const afterHelps = await this.listSortedHelpsForInviteCode(
      event.EventId,
      code,
      ticketReward,
      user.authTokenForFirestore,
    );
    const rank = afterHelps.findIndex((h) => h.helperUid === user.uid);
    if (rank === -1 || rank >= MAX_REFERRAL_RECEIVED) {
      throw new BadRequestException(
        `Người chơi này vừa đạt đủ tối đa ${MAX_REFERRAL_RECEIVED}/${MAX_REFERRAL_RECEIVED} lượt hỗ trợ trong sự kiện.`,
      );
    }

    const nextHelpedTargetUids = [...helpedTargetUids, ownerUid];
    const nextUsedHelps: ReferralHelpEntry[] = [
      ...state.UsedHelps,
      {
        Username: ownerUsername,
        TicketsEarned: ticketReward,
        CreatedAt: nowIso,
      },
    ];

    const updatedState: PlayerEventState = {
      ...state,
      SpinTickets: state.SpinTickets + ticketReward,
      HelpGivenCount: nextHelpedTargetUids.length,
      UsedHelps: nextUsedHelps,
      LastUpdated: nowIso,
    };

    const stateDocPath = `${WEB_EVENTS_COLLECTION}/${event.EventId}/PlayerStates/${user.uid}`;
    const userEventPath = `Users/${user.uid}/EventStates/${event.EventId}`;

    await this.firebase.commitWrites(
      [
        {
          update: {
            name: this.firebase.fullDocumentName(stateDocPath),
            fields: this.firebase.objectToFields(
              this.buildFirestorePlayerDoc(
                updatedState,
                nextHelpedTargetUids,
                claimedHelperUids,
              ),
            ),
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
      ],
      user.authTokenForFirestore,
    );

    return {
      addedTickets: ticketReward,
      targetUsername: ownerUsername,
      playerState: updatedState,
    };
  }

  /**
   * Trừ 1 lượt quay & Lưu "Sản phẩm X" trúng thưởng vào Firestore
   * Hỗ trợ cả 2 chế độ:
   * - Unity gửi mã sản phẩm X vừa quay trúng (itemId, itemName, quantity, rarity)
   * - Hoặc Server tự quay ngẫu nhiên theo tỉ lệ Probability trong danh sách Rewards
   */
  async recordSpinAndSaveReward(
    authHeader: string | undefined,
    rawEventId: string,
    rawBody: Record<string, unknown>,
  ): Promise<{
    reward: PlayerSpinRecord;
    playerState: PlayerEventState;
  }> {
    const event = await this.getPublicEventById(rawEventId, authHeader);
    const {
      user,
      state: playerState,
      helpedTargetUids,
      claimedHelperUids,
    } = await this.loadStoredPlayerState(authHeader, event);

    if (playerState.SpinTickets <= 0) {
      throw new BadRequestException(
        'Bạn đã hết lượt quay! Hãy điểm danh hằng ngày hoặc dùng mã hỗ trợ để nhận thêm lượt.',
      );
    }

    // Xác định Sản phẩm X trúng thưởng
    let chosenItem: EventRewardItemConfig | null = null;
    const requestedItemId = String(rawBody.itemId ?? rawBody.ItemId ?? '')
      .trim()
      .toLowerCase();

    if (requestedItemId && rawBody.mode !== 'server_random') {
      chosenItem =
        event.Rewards.find((r) => r.ItemId.toLowerCase() === requestedItemId) ||
        ({
          ItemId: requestedItemId.replace(/[^a-z0-9_]/g, '_'),
          ItemName:
            String(rawBody.itemName ?? rawBody.ItemName ?? requestedItemId).trim() ||
            requestedItemId,
          Rarity: (['UR', 'SSR', 'SR', 'R'].includes(
            String(rawBody.rarity ?? 'SSR').toUpperCase(),
          )
            ? String(rawBody.rarity ?? 'SSR').toUpperCase()
            : 'SSR') as EventRewardRarity,
          Quantity: Math.max(1, Math.round(Number(rawBody.quantity ?? 1) || 1)),
          Probability: 0,
        } satisfies EventRewardItemConfig);
    } else {
      // Server quay ngẫu nhiên theo trọng số Probability
      const pool = event.Rewards.length > 0 ? event.Rewards : DEFAULT_REWARDS;
      const totalWeight = pool.reduce(
        (sum, r) => sum + Math.max(0.1, r.Probability || 1),
        0,
      );
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

    const spinRecord: PlayerSpinRecord = {
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
    const updatedInvEntry: PlayerInventoryEntry = {
      ItemId: chosenItem.ItemId,
      ItemName: chosenItem.ItemName,
      Rarity: chosenItem.Rarity,
      Quantity: nextInvQty,
      UpdatedAt: nowIso,
    };

    const updatedState: PlayerEventState = {
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

    await this.firebase.commitWrites(
      [
        {
          update: {
            name: this.firebase.fullDocumentName(stateDocPath),
            fields: this.firebase.objectToFields(
              this.buildFirestorePlayerDoc(
                updatedState,
                helpedTargetUids,
                claimedHelperUids,
              ),
            ),
          },
        },
        {
          update: {
            name: this.firebase.fullDocumentName(userInventoryPath),
            fields: this.firebase.objectToFields(
              updatedInvEntry as unknown as Record<string, unknown>,
            ),
          },
        },
        {
          update: {
            name: this.firebase.fullDocumentName(spinLogPath),
            fields: this.firebase.objectToFields(
              spinRecord as unknown as Record<string, unknown>,
            ),
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
      ],
      user.authTokenForFirestore,
    );

    return {
      reward: spinRecord,
      playerState: updatedState,
    };
  }

  // ==================== AUDIT LOGS (ADMIN ONLY) ====================

  async getEventLogs(
    operator: AuthenticatedOperator,
    limitCount = 50,
  ): Promise<EventActivityLog[]> {
    const safeLimit = Math.min(Math.max(Number(limitCount) || 50, 1), 200);
    const docs = await this.firebase.listDocuments(
      EVENT_LOGS_COLLECTION_PATH,
      operator.authTokenForFirestore,
      300,
    );

    const logs: EventActivityLog[] = docs.map((doc) => {
      const raw = this.firebase.docToObject(doc);
      return {
        id: this.firebase.extractDocId(doc.name),
        action: (raw.action as EventLogAction) || 'UPDATE_EVENT',
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
}
