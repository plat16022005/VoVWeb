import crypto from 'node:crypto';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  FirestoreBatchWrite,
  GachaFirebaseService,
} from '../gacha/gacha-firebase.service.js';
import { AuthenticatedOperator } from '../gacha/gacha.types.js';
import {
  GiftcodeActivityLog,
  GiftcodeCampaignCategory,
  GiftcodeDocument,
  GiftcodeLogAction,
  GiftcodeReferenceItem,
  GiftcodeReferenceServer,
  GiftcodeReferencesResponse,
  GiftcodeRewardItem,
  GiftcodeRewards,
  GiftcodeType,
  PublicGiftcodeItem,
} from './giftcodes.types.js';

const VALID_CAMPAIGN_CATEGORIES: readonly GiftcodeCampaignCategory[] = [
  'LAUNCH',
  'EVENT',
  'LIVESTREAM',
  'COMPENSATION',
  'PARTNER',
  'OTHER',
] as const;

function parseCampaignCategory(raw: unknown): GiftcodeCampaignCategory {
  if (typeof raw === 'string') {
    const upper = raw.trim().toUpperCase() as GiftcodeCampaignCategory;
    if (VALID_CAMPAIGN_CATEGORIES.includes(upper)) return upper;
  }
  return 'EVENT';
}

const GIFTCODES_COLLECTION = 'Giftcodes';
const ITEM_CONFIGS_COLLECTION = 'ItemConfigs';
const SERVER_LIST_DOC_PATH = 'GameConfig/ServerList';
const GIFTCODE_LOGS_PARENT_PATH = 'Logs/Giftcodes';
const GIFTCODE_LOGS_COLLECTION_PATH = 'Logs/Giftcodes/Activities';

const VALID_CODE_REGEX = /^[A-Z0-9_-]{4,32}$/;
const VALID_ITEM_ID_REGEX = /^[A-Za-z0-9_-]{1,80}$/;
// Bảng ký tự an toàn (loại bỏ 0/O, 1/I/L để người chơi không gõ nhầm)
const SAFE_CODE_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function formatOperatorLabel(operator: AuthenticatedOperator): string {
  return operator.email || operator.username || 'system';
}

function formatSafeCreatorLabel(operator: AuthenticatedOperator): string {
  return operator.username?.trim() || 'Quản Trị Viên';
}

function clampInt(
  val: unknown,
  min: number,
  max: number,
  fallback: number,
): number {
  const num = Number(val);
  if (!Number.isFinite(num)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(num)));
}

function parseIsoOrEmpty(val: unknown, fieldLabel: string): string {
  if (typeof val !== 'string' || !val.trim()) return '';
  const trimmed = val.trim();
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new BadRequestException(
      `${fieldLabel} không đúng định dạng thời gian hợp lệ.`,
    );
  }
  return parsed.toISOString();
}

function generateRandomSuffix(length: number): string {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += SAFE_CODE_CHARSET[bytes[i] % SAFE_CODE_CHARSET.length];
  }
  return out;
}

function summarizeRewards(rewards: GiftcodeRewards): string {
  const parts: string[] = [];
  if (rewards.Gold > 0) {
    parts.push(`${rewards.Gold.toLocaleString('vi-VN')} Vàng`);
  }
  if (rewards.Gems > 0) {
    parts.push(`${rewards.Gems.toLocaleString('vi-VN')} Ngọc`);
  }
  if (rewards.Energy > 0) {
    parts.push(`${rewards.Energy.toLocaleString('vi-VN')} Thể Lực`);
  }
  if (rewards.Items.length > 0) {
    const itemsStr = rewards.Items.map(
      (it) => `${it.ItemName || it.ItemId} x${it.Quantity}`,
    ).join(', ');
    parts.push(itemsStr);
  }
  return parts.length > 0 ? parts.join(' · ') : 'Không có phần thưởng';
}

@Injectable()
export class GiftcodesService {
  private readonly logger = new Logger(GiftcodesService.name);

  constructor(private readonly firebase: GachaFirebaseService) {}

  private assertValidCode(rawCode: unknown): string {
    const normalized =
      typeof rawCode === 'string'
        ? rawCode.trim().toUpperCase().replace(/\s+/g, '')
        : '';
    if (!VALID_CODE_REGEX.test(normalized)) {
      throw new BadRequestException(
        'Mã quà tặng không hợp lệ. Mã phải dài 4–32 ký tự và chỉ gồm chữ cái không dấu (A–Z), chữ số (0–9), gạch ngang (-) hoặc gạch dưới (_).',
      );
    }
    return normalized;
  }

  private normalizeRewards(raw: unknown): GiftcodeRewards {
    const obj =
      raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
    const gold = clampInt(obj.Gold, 0, 1000000000, 0);
    const gems = clampInt(obj.Gems, 0, 10000000, 0);
    const energy = clampInt(obj.Energy, 0, 100000, 0);

    const rawItems = Array.isArray(obj.Items) ? obj.Items : [];
    const items: GiftcodeRewardItem[] = [];
    for (const entry of rawItems) {
      if (!entry || typeof entry !== 'object') continue;
      const rec = entry as Record<string, unknown>;
      const itemId = typeof rec.ItemId === 'string' ? rec.ItemId.trim() : '';
      if (!itemId) continue;
      const itemName =
        typeof rec.ItemName === 'string' && rec.ItemName.trim()
          ? rec.ItemName.trim().slice(0, 120)
          : itemId;
      const quantity = clampInt(rec.Quantity, 1, 999999, 1);
      const rarity = clampInt(rec.Rarity, 0, 4, 0);
      items.push({
        ItemId: itemId,
        ItemName: itemName,
        Quantity: quantity,
        Rarity: rarity,
      });
    }

    return {
      Gold: gold,
      Gems: gems,
      Energy: energy,
      Items: items,
    };
  }

  private normalizeGiftcodeDocument(
    docId: string,
    raw: Record<string, unknown>,
  ): GiftcodeDocument {
    const code =
      (typeof raw.Code === 'string' && raw.Code.trim().toUpperCase()) ||
      docId.toUpperCase();
    const title =
      (typeof raw.Title === 'string' && raw.Title.trim()) || code;
    const description =
      typeof raw.Description === 'string' ? raw.Description.trim() : '';
    const codeType: GiftcodeType =
      raw.CodeType === 'SINGLE_USE' ? 'SINGLE_USE' : 'COMMON';
    const campaignCategory = parseCampaignCategory(raw.CampaignCategory);
    const campaignName =
      typeof raw.CampaignName === 'string' ? raw.CampaignName.trim() : '';
    const batchId =
      typeof raw.BatchId === 'string' && raw.BatchId.trim()
        ? raw.BatchId.trim()
        : undefined;
    const isActive = raw.IsActive !== false;
    const isPublicDisplay = raw.IsPublicDisplay === true;
    const maxRedemptions = clampInt(raw.MaxRedemptions, 0, 10000000, 0);
    const currentRedemptions = clampInt(raw.CurrentRedemptions, 0, 10000000, 0);
    const maxPerUser = clampInt(raw.MaxPerUser, 1, 100, 1);

    const rawServers = Array.isArray(raw.AllowedServers)
      ? raw.AllowedServers
          .map((s) => (typeof s === 'string' ? s.trim() : ''))
          .filter(Boolean)
      : [];
    const allowedServers = rawServers.length > 0 ? rawServers : ['ALL'];

    const startsAt =
      typeof raw.StartsAt === 'string' ? raw.StartsAt.trim() : '';
    const expiresAt =
      typeof raw.ExpiresAt === 'string' ? raw.ExpiresAt.trim() : '';
    const rewards = this.normalizeRewards(raw.Rewards);

    const createdAt =
      typeof raw.CreatedAt === 'string' && raw.CreatedAt.trim()
        ? raw.CreatedAt.trim()
        : new Date().toISOString();
    const updatedAt =
      typeof raw.UpdatedAt === 'string' && raw.UpdatedAt.trim()
        ? raw.UpdatedAt.trim()
        : createdAt;
    const createdBy =
      typeof raw.CreatedBy === 'string' && raw.CreatedBy.trim()
        ? raw.CreatedBy.trim()
        : 'system';
    const updatedBy =
      typeof raw.UpdatedBy === 'string' && raw.UpdatedBy.trim()
        ? raw.UpdatedBy.trim()
        : createdBy;

    return {
      Code: code,
      Title: title,
      Description: description,
      CodeType: codeType,
      CampaignCategory: campaignCategory,
      CampaignName: campaignName,
      ...(batchId ? { BatchId: batchId } : {}),
      IsActive: isActive,
      IsPublicDisplay: isPublicDisplay,
      MaxRedemptions: maxRedemptions,
      CurrentRedemptions: currentRedemptions,
      MaxPerUser: maxPerUser,
      AllowedServers: allowedServers,
      StartsAt: startsAt,
      ExpiresAt: expiresAt,
      Rewards: rewards,
      CreatedAt: createdAt,
      UpdatedAt: updatedAt,
      CreatedBy: createdBy,
      UpdatedBy: updatedBy,
    };
  }

  private validateAndBuildPayload(
    code: string,
    rawBody: Record<string, unknown>,
    operator: AuthenticatedOperator,
    existing?: GiftcodeDocument,
  ): GiftcodeDocument {
    const title =
      typeof rawBody.Title === 'string' ? rawBody.Title.trim() : '';
    if (!title || title.length > 150) {
      throw new BadRequestException(
        'Tên gói quà tặng không được để trống và tối đa 150 ký tự.',
      );
    }

    const description =
      typeof rawBody.Description === 'string'
        ? rawBody.Description.trim().slice(0, 1000)
        : '';

    const codeType: GiftcodeType =
      rawBody.CodeType === 'SINGLE_USE' ? 'SINGLE_USE' : 'COMMON';

    const campaignCategory = parseCampaignCategory(
      rawBody.CampaignCategory ?? existing?.CampaignCategory,
    );
    const campaignName =
      typeof rawBody.CampaignName === 'string'
        ? rawBody.CampaignName.trim().slice(0, 120)
        : (existing?.CampaignName ?? '');

    const batchId =
      typeof rawBody.BatchId === 'string' && rawBody.BatchId.trim()
        ? rawBody.BatchId.trim().slice(0, 80)
        : existing?.BatchId;

    const isActive =
      typeof rawBody.IsActive === 'boolean'
        ? rawBody.IsActive
        : (existing?.IsActive ?? true);

    // Mã đơn lẻ (SINGLE_USE) không bao giờ hiển thị công khai trên trang chủ
    const isPublicDisplay =
      codeType === 'COMMON' && rawBody.IsPublicDisplay === true;

    const maxRedemptions =
      codeType === 'SINGLE_USE'
        ? 1
        : clampInt(rawBody.MaxRedemptions, 0, 10000000, 0);

    const maxPerUser =
      codeType === 'SINGLE_USE'
        ? 1
        : clampInt(rawBody.MaxPerUser, 1, 100, 1);

    const rawServers = Array.isArray(rawBody.AllowedServers)
      ? rawBody.AllowedServers
          .map((s) => (typeof s === 'string' ? s.trim().slice(0, 64) : ''))
          .filter(Boolean)
      : [];
    const dedupServers = Array.from(new Set(rawServers)).slice(0, 50);
    const allowedServers =
      dedupServers.length === 0 || dedupServers.includes('ALL')
        ? ['ALL']
        : dedupServers;

    const startsAt = parseIsoOrEmpty(rawBody.StartsAt, 'Thời gian bắt đầu');
    const expiresAt = parseIsoOrEmpty(rawBody.ExpiresAt, 'Thời gian hết hạn');
    if (startsAt && expiresAt) {
      if (new Date(expiresAt).getTime() <= new Date(startsAt).getTime()) {
        throw new BadRequestException(
          'Thời gian hết hạn phải lớn hơn thời gian bắt đầu hiệu lực.',
        );
      }
    }

    const rawRewards =
      rawBody.Rewards && typeof rawBody.Rewards === 'object'
        ? (rawBody.Rewards as Record<string, unknown>)
        : {};
    const gold = clampInt(rawRewards.Gold, 0, 1000000000, 0);
    const gems = clampInt(rawRewards.Gems, 0, 10000000, 0);
    const energy = clampInt(rawRewards.Energy, 0, 100000, 0);

    const rawItems = Array.isArray(rawRewards.Items) ? rawRewards.Items : [];
    if (rawItems.length > 30) {
      throw new BadRequestException(
        'Mỗi mã quà tặng chỉ hỗ trợ tối đa 30 loại vật phẩm.',
      );
    }

    const itemMap = new Map<string, GiftcodeRewardItem>();
    for (const entry of rawItems) {
      if (!entry || typeof entry !== 'object') continue;
      const rec = entry as Record<string, unknown>;
      const itemId = typeof rec.ItemId === 'string' ? rec.ItemId.trim() : '';
      if (!itemId) continue;
      if (!VALID_ITEM_ID_REGEX.test(itemId)) {
        throw new BadRequestException(
          `Mã vật phẩm "${itemId}" không đúng định dạng hợp lệ.`,
        );
      }
      const quantity = clampInt(rec.Quantity, 1, 999999, 0);
      if (quantity <= 0) {
        throw new BadRequestException(
          `Số lượng của vật phẩm "${itemId}" phải lớn hơn 0.`,
        );
      }
      const itemName =
        typeof rec.ItemName === 'string' && rec.ItemName.trim()
          ? rec.ItemName.trim().slice(0, 120)
          : itemId;
      const rarity = clampInt(rec.Rarity, 0, 4, 0);

      const prev = itemMap.get(itemId);
      if (prev) {
        prev.Quantity = Math.min(999999, prev.Quantity + quantity);
      } else {
        itemMap.set(itemId, {
          ItemId: itemId,
          ItemName: itemName,
          Quantity: quantity,
          Rarity: rarity,
        });
      }
    }

    const items = Array.from(itemMap.values());
    if (gold === 0 && gems === 0 && energy === 0 && items.length === 0) {
      throw new BadRequestException(
        'Vui lòng thiết lập ít nhất 1 phần thưởng (Vàng, Ngọc, Thể Lực hoặc Vật Phẩm).',
      );
    }

    const nowIso = new Date().toISOString();
    const creatorLabel = formatSafeCreatorLabel(operator);

    return {
      Code: code,
      Title: title,
      Description: description,
      CodeType: codeType,
      CampaignCategory: campaignCategory,
      CampaignName: campaignName,
      ...(batchId ? { BatchId: batchId } : {}),
      IsActive: isActive,
      IsPublicDisplay: isPublicDisplay,
      MaxRedemptions: maxRedemptions,
      CurrentRedemptions: existing ? existing.CurrentRedemptions : 0,
      MaxPerUser: maxPerUser,
      AllowedServers: allowedServers,
      StartsAt: startsAt,
      ExpiresAt: expiresAt,
      Rewards: {
        Gold: gold,
        Gems: gems,
        Energy: energy,
        Items: items,
      },
      CreatedAt: existing ? existing.CreatedAt : nowIso,
      UpdatedAt: nowIso,
      CreatedBy: existing ? existing.CreatedBy : creatorLabel,
      UpdatedBy: creatorLabel,
    };
  }

  private async logGiftcodeActivity(
    operator: AuthenticatedOperator,
    payload: {
      action: GiftcodeLogAction;
      actionTitle: string;
      code: string;
      title: string;
      codeType: GiftcodeType;
      campaignCategory?: GiftcodeCampaignCategory;
      campaignName?: string;
      batchId?: string;
      details: string;
    },
  ): Promise<void> {
    const now = Date.now();
    const record: Record<string, unknown> = {
      action: payload.action,
      actionTitle: payload.actionTitle,
      code: payload.code,
      title: payload.title,
      codeType: payload.codeType,
      ...(payload.campaignCategory
        ? { campaignCategory: payload.campaignCategory }
        : {}),
      ...(payload.campaignName ? { campaignName: payload.campaignName } : {}),
      ...(payload.batchId ? { batchId: payload.batchId } : {}),
      details: payload.details,
      performedBy: formatOperatorLabel(operator),
      performedByRole: operator.role,
      timestamp: now,
      createdAt: new Date(now).toISOString(),
    };

    try {
      await this.firebase.createDocument(
        GIFTCODE_LOGS_COLLECTION_PATH,
        null,
        record,
        operator.authTokenForFirestore,
      );
    } catch (err) {
      this.logger.warn(
        `Không thể ghi nhật ký Giftcode (${payload.action}): ${err instanceof Error ? err.message : 'unknown'}`,
      );
    }
  }

  // ==================== PUBLIC ENDPOINT ====================

  async getPublicGiftcodes(): Promise<PublicGiftcodeItem[]> {
    try {
      const docs = await this.firebase.runQuery(
        '',
        {
          from: [{ collectionId: GIFTCODES_COLLECTION }],
          where: {
            compositeFilter: {
              op: 'AND',
              filters: [
                {
                  fieldFilter: {
                    field: { fieldPath: 'IsActive' },
                    op: 'EQUAL',
                    value: { booleanValue: true },
                  },
                },
                {
                  fieldFilter: {
                    field: { fieldPath: 'IsPublicDisplay' },
                    op: 'EQUAL',
                    value: { booleanValue: true },
                  },
                },
                {
                  fieldFilter: {
                    field: { fieldPath: 'CodeType' },
                    op: 'EQUAL',
                    value: { stringValue: 'COMMON' },
                  },
                },
              ],
            },
          },
          limit: 20,
        },
        '',
      );

      const nowMs = Date.now();
      return docs
        .map((doc) =>
          this.normalizeGiftcodeDocument(
            this.firebase.extractDocId(doc.name),
            this.firebase.docToObject(doc),
          ),
        )
        .filter((g) => {
          if (g.StartsAt && new Date(g.StartsAt).getTime() > nowMs) return false;
          if (g.ExpiresAt && new Date(g.ExpiresAt).getTime() < nowMs) return false;
          if (g.MaxRedemptions > 0 && g.CurrentRedemptions >= g.MaxRedemptions) {
            return false;
          }
          return true;
        })
        .map((g) => ({
          Code: g.Code,
          Title: g.Title,
          Description: g.Description,
          CampaignCategory: g.CampaignCategory,
          CampaignName: g.CampaignName,
          ExpiresAt: g.ExpiresAt,
          AllowedServers: g.AllowedServers,
          Rewards: g.Rewards,
        }));
    } catch (err) {
      this.logger.warn(
        `Không thể tải danh sách Giftcode công khai: ${err instanceof Error ? err.message : 'unknown'}`,
      );
      return [];
    }
  }

  // ==================== MANAGER / ADMIN CRUD ====================

  async getAllGiftcodes(
    operator: AuthenticatedOperator,
  ): Promise<GiftcodeDocument[]> {
    const docs = await this.firebase.listDocuments(
      GIFTCODES_COLLECTION,
      operator.authTokenForFirestore,
    );

    const list = docs.map((doc) =>
      this.normalizeGiftcodeDocument(
        this.firebase.extractDocId(doc.name),
        this.firebase.docToObject(doc),
      ),
    );

    return list.sort((a, b) => {
      const tA = new Date(a.CreatedAt).getTime() || 0;
      const tB = new Date(b.CreatedAt).getTime() || 0;
      return tB - tA;
    });
  }

  async getGiftcodeByCode(
    operator: AuthenticatedOperator,
    rawCode: string,
  ): Promise<GiftcodeDocument> {
    const code = this.assertValidCode(rawCode);
    const doc = await this.firebase.getDocument(
      `${GIFTCODES_COLLECTION}/${code}`,
      operator.authTokenForFirestore,
    );
    if (!doc) {
      throw new NotFoundException(`Không tìm thấy mã quà tặng "${code}".`);
    }
    return this.normalizeGiftcodeDocument(code, this.firebase.docToObject(doc));
  }

  async getReferences(
    operator: AuthenticatedOperator,
  ): Promise<GiftcodeReferencesResponse> {
    const [itemDocs, serverDoc] = await Promise.all([
      this.firebase
        .listDocuments(ITEM_CONFIGS_COLLECTION, operator.authTokenForFirestore)
        .catch(() => []),
      this.firebase
        .getDocument(SERVER_LIST_DOC_PATH, operator.authTokenForFirestore)
        .catch(() => null),
    ]);

    const items: GiftcodeReferenceItem[] = itemDocs
      .map((doc) => {
        const id = this.firebase.extractDocId(doc.name);
        const obj = this.firebase.docToObject(doc);
        const itemId =
          (typeof obj.ItemId === 'string' && obj.ItemId.trim()) || id;
        const itemName =
          (typeof obj.ItemName === 'string' && obj.ItemName.trim()) ||
          (typeof obj.Name === 'string' && obj.Name.trim()) ||
          itemId;
        const type = clampInt(obj.Type ?? obj.ItemType, 0, 4, 1);
        const rarity = clampInt(obj.Rarity, 0, 4, 0);
        return {
          ItemId: itemId,
          ItemName: itemName,
          Type: type,
          Rarity: rarity,
        };
      })
      .sort((a, b) => {
        if (b.Rarity !== a.Rarity) return b.Rarity - a.Rarity;
        if (a.Type !== b.Type) return a.Type - b.Type;
        return a.ItemName.localeCompare(b.ItemName, 'vi');
      });

    const servers: GiftcodeReferenceServer[] = [];
    if (serverDoc) {
      const obj = this.firebase.docToObject(serverDoc);
      for (const [serverId, value] of Object.entries(obj)) {
        if (!value || typeof value !== 'object') continue;
        const rec = value as Record<string, unknown>;
        const name =
          typeof rec.Name === 'string' && rec.Name.trim()
            ? rec.Name.trim()
            : serverId;
        const status =
          typeof rec.Status === 'string' && rec.Status.trim()
            ? rec.Status.trim()
            : 'Normal';
        servers.push({
          ServerId: serverId,
          Name: name,
          Status: status,
        });
      }
      servers.sort((a, b) => a.ServerId.localeCompare(b.ServerId));
    }

    return { items, servers };
  }

  async createGiftcode(
    operator: AuthenticatedOperator,
    rawBody: Record<string, unknown>,
  ): Promise<GiftcodeDocument> {
    const code = this.assertValidCode(rawBody.Code);
    const existing = await this.firebase.getDocument(
      `${GIFTCODES_COLLECTION}/${code}`,
      operator.authTokenForFirestore,
    );
    if (existing) {
      throw new ConflictException(
        `Mã quà tặng "${code}" đã tồn tại trên hệ thống.`,
      );
    }

    const giftDoc = this.validateAndBuildPayload(code, rawBody, operator);

    await this.firebase.createDocument(
      GIFTCODES_COLLECTION,
      code,
      giftDoc as unknown as Record<string, unknown>,
      operator.authTokenForFirestore,
    );

    await this.logGiftcodeActivity(operator, {
      action: 'CREATE_GIFTCODE',
      actionTitle: 'Khởi tạo mã quà tặng mới',
      code: giftDoc.Code,
      title: giftDoc.Title,
      codeType: giftDoc.CodeType,
      campaignCategory: giftDoc.CampaignCategory,
      campaignName: giftDoc.CampaignName,
      batchId: giftDoc.BatchId,
      details: `Tạo mã "${giftDoc.Code}"${giftDoc.CampaignName ? ` · Chiến dịch: ${giftDoc.CampaignName}` : ''} (${giftDoc.CodeType === 'SINGLE_USE' ? 'Đơn lẻ 1 lần' : `Dùng chung · giới hạn ${giftDoc.MaxRedemptions || 'Không giới hạn'}`}) — Quà: ${summarizeRewards(giftDoc.Rewards)}.`,
    });

    return giftDoc;
  }

  async createBatchGiftcodes(
    operator: AuthenticatedOperator,
    rawBody: Record<string, unknown>,
  ): Promise<{ batchId: string; count: number; codes: GiftcodeDocument[] }> {
    const count = clampInt(rawBody.Count, 1, 50, 10);
    const randomLength = clampInt(rawBody.RandomLength, 6, 14, 8);
    const rawPrefix =
      typeof rawBody.Prefix === 'string'
        ? rawBody.Prefix
            .trim()
            .toUpperCase()
            .replace(/[^A-Z0-9_-]/g, '')
            .slice(0, 12)
        : '';

    if (rawPrefix.length + randomLength > 32) {
      throw new BadRequestException(
        'Tổng độ dài tiền tố và phần ngẫu nhiên tối đa 32 ký tự.',
      );
    }

    const batchId = `BATCH_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${generateRandomSuffix(4)}`;

    // Lấy danh sách mã hiện có để chống trùng tuyệt đối
    const existingDocs = await this.firebase.listDocuments(
      GIFTCODES_COLLECTION,
      operator.authTokenForFirestore,
    );
    const existingSet = new Set(
      existingDocs.map((d) =>
        this.firebase.extractDocId(d.name).toUpperCase(),
      ),
    );

    const generatedCodes: string[] = [];
    const batchSet = new Set<string>();
    let attempts = 0;
    const maxAttempts = count * 15;

    while (generatedCodes.length < count && attempts < maxAttempts) {
      attempts++;
      const candidate = `${rawPrefix}${generateRandomSuffix(randomLength)}`;
      if (
        VALID_CODE_REGEX.test(candidate) &&
        !existingSet.has(candidate) &&
        !batchSet.has(candidate)
      ) {
        batchSet.add(candidate);
        generatedCodes.push(candidate);
      }
    }

    if (generatedCodes.length < count) {
      throw new ConflictException(
        'Không thể sinh đủ số lượng mã duy nhất. Vui lòng tăng độ dài mã hoặc đổi tiền tố.',
      );
    }

    const docsToCreate: GiftcodeDocument[] = generatedCodes.map((code) =>
      this.validateAndBuildPayload(
        code,
        {
          ...rawBody,
          CodeType: 'SINGLE_USE',
          BatchId: batchId,
          IsPublicDisplay: false,
          MaxRedemptions: 1,
          MaxPerUser: 1,
        },
        operator,
      ),
    );

    const writes: FirestoreBatchWrite[] = docsToCreate.map((giftDoc) => ({
      update: {
        name: this.firebase.fullDocumentName(
          `${GIFTCODES_COLLECTION}/${giftDoc.Code}`,
        ),
        fields: this.firebase.objectToFields(
          giftDoc as unknown as Record<string, unknown>,
        ),
      },
    }));

    await this.firebase.commitWrites(writes, operator.authTokenForFirestore);

    const first = docsToCreate[0];
    await this.logGiftcodeActivity(operator, {
      action: 'CREATE_BATCH_GIFTCODES',
      actionTitle: 'Sinh hàng loạt mã quà tặng đơn lẻ',
      code: batchId,
      title: first.Title,
      codeType: 'SINGLE_USE',
      campaignCategory: first.CampaignCategory,
      campaignName: first.CampaignName,
      batchId,
      details: `Sinh lô ${docsToCreate.length} mã đơn lẻ${first.CampaignName ? ` · Chiến dịch: ${first.CampaignName}` : ''} (${rawPrefix ? `tiền tố "${rawPrefix}"` : 'ngẫu nhiên'}) — Quà mỗi mã: ${summarizeRewards(first.Rewards)}.`,
    });

    return {
      batchId,
      count: docsToCreate.length,
      codes: docsToCreate,
    };
  }

  async updateGiftcode(
    operator: AuthenticatedOperator,
    rawCode: string,
    rawBody: Record<string, unknown>,
  ): Promise<GiftcodeDocument> {
    const code = this.assertValidCode(rawCode);
    const existingRaw = await this.firebase.getDocument(
      `${GIFTCODES_COLLECTION}/${code}`,
      operator.authTokenForFirestore,
    );
    if (!existingRaw) {
      throw new NotFoundException(
        `Không tìm thấy mã quà tặng "${code}" để cập nhật.`,
      );
    }

    const existing = this.normalizeGiftcodeDocument(
      code,
      this.firebase.docToObject(existingRaw),
    );
    const updated = this.validateAndBuildPayload(
      code,
      rawBody,
      operator,
      existing,
    );

    await this.firebase.commitWrites(
      [
        {
          update: {
            name: this.firebase.fullDocumentName(
              `${GIFTCODES_COLLECTION}/${code}`,
            ),
            fields: this.firebase.objectToFields(
              updated as unknown as Record<string, unknown>,
            ),
          },
        },
      ],
      operator.authTokenForFirestore,
    );

    await this.logGiftcodeActivity(operator, {
      action: 'UPDATE_GIFTCODE',
      actionTitle: 'Cập nhật cấu hình mã quà tặng',
      code: updated.Code,
      title: updated.Title,
      codeType: updated.CodeType,
      campaignCategory: updated.CampaignCategory,
      campaignName: updated.CampaignName,
      batchId: updated.BatchId,
      details: `Cập nhật mã "${updated.Code}"${updated.CampaignName ? ` · Chiến dịch: ${updated.CampaignName}` : ''} — Quà: ${summarizeRewards(updated.Rewards)}, Giới hạn lượt: ${updated.MaxRedemptions || 'Không giới hạn'}.`,
    });

    return updated;
  }

  async toggleGiftcodeActive(
    operator: AuthenticatedOperator,
    rawCode: string,
    isActive: boolean,
  ): Promise<GiftcodeDocument> {
    const code = this.assertValidCode(rawCode);
    const existingRaw = await this.firebase.getDocument(
      `${GIFTCODES_COLLECTION}/${code}`,
      operator.authTokenForFirestore,
    );
    if (!existingRaw) {
      throw new NotFoundException(
        `Không tìm thấy mã quà tặng "${code}" để đổi trạng thái.`,
      );
    }

    const existing = this.normalizeGiftcodeDocument(
      code,
      this.firebase.docToObject(existingRaw),
    );
    const nowIso = new Date().toISOString();
    const updated: GiftcodeDocument = {
      ...existing,
      IsActive: Boolean(isActive),
      UpdatedAt: nowIso,
      UpdatedBy: formatSafeCreatorLabel(operator),
    };

    await this.firebase.commitWrites(
      [
        {
          update: {
            name: this.firebase.fullDocumentName(
              `${GIFTCODES_COLLECTION}/${code}`,
            ),
            fields: this.firebase.objectToFields(
              updated as unknown as Record<string, unknown>,
            ),
          },
        },
      ],
      operator.authTokenForFirestore,
    );

    await this.logGiftcodeActivity(operator, {
      action: updated.IsActive ? 'ACTIVATE_GIFTCODE' : 'DEACTIVATE_GIFTCODE',
      actionTitle: updated.IsActive
        ? 'Kích hoạt mã quà tặng'
        : 'Tạm khóa mã quà tặng',
      code: updated.Code,
      title: updated.Title,
      codeType: updated.CodeType,
      campaignCategory: updated.CampaignCategory,
      campaignName: updated.CampaignName,
      batchId: updated.BatchId,
      details: updated.IsActive
        ? `Mở kích hoạt mã quà tặng "${updated.Code}" (${updated.Title}).`
        : `Tạm khóa khẩn cấp mã quà tặng "${updated.Code}" (${updated.Title}).`,
    });

    return updated;
  }

  async deleteGiftcode(
    operator: AuthenticatedOperator,
    rawCode: string,
  ): Promise<{ success: boolean; deletedCode: string }> {
    const code = this.assertValidCode(rawCode);
    const existingRaw = await this.firebase.getDocument(
      `${GIFTCODES_COLLECTION}/${code}`,
      operator.authTokenForFirestore,
    );
    if (!existingRaw) {
      throw new NotFoundException(
        `Không tìm thấy mã quà tặng "${code}" để xóa.`,
      );
    }

    const existing = this.normalizeGiftcodeDocument(
      code,
      this.firebase.docToObject(existingRaw),
    );

    await this.firebase.deleteDocument(
      `${GIFTCODES_COLLECTION}/${code}`,
      operator.authTokenForFirestore,
    );

    await this.logGiftcodeActivity(operator, {
      action: 'DELETE_GIFTCODE',
      actionTitle: 'Xóa mã quà tặng khỏi hệ thống',
      code: existing.Code,
      title: existing.Title,
      codeType: existing.CodeType,
      campaignCategory: existing.CampaignCategory,
      campaignName: existing.CampaignName,
      batchId: existing.BatchId,
      details: `Xóa vĩnh viễn mã "${existing.Code}" (${existing.Title}) — đã đổi ${existing.CurrentRedemptions} lượt.`,
    });

    return {
      success: true,
      deletedCode: code,
    };
  }

  // ==================== AUDIT LOGS (ADMIN ONLY) ====================

  async getGiftcodeLogs(
    operator: AuthenticatedOperator,
    limitCount = 100,
  ): Promise<GiftcodeActivityLog[]> {
    const safeLimit = Math.min(Math.max(1, Math.trunc(limitCount) || 100), 200);
    let docs = [];
    try {
      docs = await this.firebase.runQuery(
        GIFTCODE_LOGS_PARENT_PATH,
        {
          from: [{ collectionId: 'Activities' }],
          orderBy: [
            { field: { fieldPath: 'timestamp' }, direction: 'DESCENDING' },
          ],
          limit: safeLimit,
        },
        operator.authTokenForFirestore,
      );
    } catch {
      docs = await this.firebase.listDocuments(
        GIFTCODE_LOGS_COLLECTION_PATH,
        operator.authTokenForFirestore,
      );
    }

    const list: GiftcodeActivityLog[] = docs.map((doc) => {
      const obj = this.firebase.docToObject(doc);
      const id = this.firebase.extractDocId(doc.name);
      const action =
        typeof obj.action === 'string'
          ? (obj.action as GiftcodeLogAction)
          : 'UPDATE_GIFTCODE';
      const actionTitle =
        typeof obj.actionTitle === 'string'
          ? obj.actionTitle
          : 'Thao tác mã quà tặng';
      const code = typeof obj.code === 'string' ? obj.code : '';
      const title = typeof obj.title === 'string' ? obj.title : code;
      const codeType: GiftcodeType =
        obj.codeType === 'SINGLE_USE' ? 'SINGLE_USE' : 'COMMON';
      const campaignCategory =
        typeof obj.campaignCategory === 'string'
          ? parseCampaignCategory(obj.campaignCategory)
          : undefined;
      const campaignName =
        typeof obj.campaignName === 'string' && obj.campaignName.trim()
          ? obj.campaignName.trim()
          : undefined;
      const batchId =
        typeof obj.batchId === 'string' && obj.batchId.trim()
          ? obj.batchId.trim()
          : undefined;
      const details = typeof obj.details === 'string' ? obj.details : '';
      const performedBy =
        typeof obj.performedBy === 'string' ? obj.performedBy : 'system';
      const performedByRole =
        typeof obj.performedByRole === 'string'
          ? obj.performedByRole
          : undefined;
      const timestamp = Number(obj.timestamp) || 0;
      const createdAt =
        typeof obj.createdAt === 'string' ? obj.createdAt : '';

      return {
        id,
        action,
        actionTitle,
        code,
        title,
        codeType,
        ...(campaignCategory ? { campaignCategory } : {}),
        ...(campaignName ? { campaignName } : {}),
        ...(batchId ? { batchId } : {}),
        details,
        performedBy,
        ...(performedByRole ? { performedByRole } : {}),
        timestamp,
        createdAt,
      };
    });

    return list
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, safeLimit);
  }
}
