import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { GachaFirebaseService } from '../gacha/gacha-firebase.service.js';
import { AuthenticatedOperator } from '../gacha/gacha.types.js';
import {
  generateDefaultEventHtmlLayout,
  mergeHtmlWithUnityBuild,
} from './events-html-merger.js';
import { EventsR2Service } from './events-r2.service.js';
import { EventsService } from './events.service.js';

describe('Events HTML Merger & EventsService', () => {
  let service: EventsService;
  let firebaseMock: Record<string, ReturnType<typeof vi.fn>>;
  let r2Mock: Record<string, ReturnType<typeof vi.fn>>;

  const operator: AuthenticatedOperator = {
    uid: 'admin_1',
    email: 'admin@veyra.game',
    username: 'AdminVeyra',
    role: 'Admin',
    permissionGroups: ['event_management'],
    permissions: [],
    authTokenForFirestore: 'token_admin',
  };

  beforeEach(() => {
    firebaseMock = {
      listDocuments: vi.fn().mockResolvedValue([]),
      getDocument: vi.fn().mockResolvedValue(null),
      createDocument: vi.fn().mockResolvedValue({}),
      commitWrites: vi.fn().mockResolvedValue(undefined),
      deleteDocument: vi.fn().mockResolvedValue(undefined),
      extractDocId: vi.fn((name: string) => name.split('/').pop() || ''),
      docToObject: vi.fn((doc: { data?: Record<string, unknown> }) => doc.data || {}),
      fullDocumentName: vi.fn((path: string) => `projects/test/databases/(default)/documents/${path}`),
      objectToFields: vi.fn((obj: Record<string, unknown>) => obj),
    };
    r2Mock = {
      putObjectToR2: vi.fn().mockResolvedValue({
        key: 'events/ev_1/index.html',
        publicUrl: 'https://cdn.example.com/events/ev_1/index.html',
      }),
      deleteEventObjects: vi.fn().mockResolvedValue({ deletedKeys: ['k1'] }),
    };
    service = new EventsService(
      firebaseMock as unknown as GachaFirebaseService,
      r2Mock as unknown as EventsR2Service,
    );
  });

  describe('generateDefaultEventHtmlLayout & mergeHtmlWithUnityBuild', () => {
    it('thoát ký tự HTML đặc biệt trong tiêu đề sự kiện và nhúng #unity-canvas', () => {
      const html = generateDefaultEventHtmlLayout('Vòng Quay <Veyra> & "SSR"', '');
      expect(html).toContain('Vòng Quay &lt;Veyra&gt; &amp; &quot;SSR&quot;');
      expect(html).toContain('id="unity-canvas"');
    });

    it('tự động chèn #unity-canvas nếu HTML tùy chỉnh chưa có thẻ canvas và gắn cầu nối VOV_UNITY_BRIDGE', () => {
      const merged = mergeHtmlWithUnityBuild({
        eventId: 'ev_wheel_01',
        eventTitle: 'Vòng Quay Tinh Tú',
        unityTargetObject: 'LuckyWheelManager',
        rawHtml: '<html><body><main><h1>Sự Kiện</h1></main></body></html>',
        unityBuild: null,
      });

      expect(merged).toContain('id="unity-canvas"');
      expect(merged).toContain('<!-- VOV_UNITY_BRIDGE_START -->');
      expect(merged).toContain('"eventId":"ev_wheel_01"');
    });
  });

  describe('EventsService CRUD', () => {
    it('createEvent kiểm tra định dạng EventId, trùng lặp và tạo sự kiện hợp lệ', async () => {
      await expect(
        service.createEvent(operator, {
          EventId: 'INVALID-EVENT!',
          Title: 'Sự kiện lỗi',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      const created = await service.createEvent(operator, {
        EventId: 'ev_lucky_wheel',
        Title: 'Vòng Quay Valkyria',
        InitialTickets: 3,
        IsActive: false,
      });

      expect(created.EventId).toBe('ev_lucky_wheel');
      expect(created.InitialTickets).toBe(3);
      expect(created.MergedHtmlContent).toContain('VOV_UNITY_BRIDGE_START');

      firebaseMock.getDocument.mockResolvedValueOnce({ name: 'dup', data: {} });
      await expect(
        service.createEvent(operator, {
          EventId: 'ev_lucky_wheel',
          Title: 'Trùng mã',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('deleteEvent chặn xóa sự kiện đang mở công khai (IsActive = true) và cho phép xóa bản nháp', async () => {
      firebaseMock.getDocument.mockResolvedValueOnce({
        name: 'WebEvents/ev_active',
        data: {
          EventId: 'ev_active',
          Title: 'Sự Kiện Đang Mở',
          IsActive: true,
          Version: 1,
        },
      });

      await expect(
        service.deleteEvent(operator, 'ev_active'),
      ).rejects.toBeInstanceOf(BadRequestException);

      firebaseMock.getDocument.mockResolvedValueOnce({
        name: 'WebEvents/ev_draft',
        data: {
          EventId: 'ev_draft',
          Title: 'Sự Kiện Nháp',
          IsActive: false,
          HtmlLayoutKey: 'events/ev_draft/index.html',
          Version: 1,
        },
      });

      const res = await service.deleteEvent(operator, 'ev_draft');
      expect(res.success).toBe(true);
      expect(r2Mock.deleteEventObjects).toHaveBeenCalled();
    });
  });

  describe('Player Web Event Arena (Điểm danh, Mã mời, Vòng quay & Nhận quà về Thư)', () => {
    it('claimMission cộng lượt quay khi điểm danh hằng ngày và chặn điểm danh lần 2 trong ngày', async () => {
      vi.spyOn(service, 'getPublicEventById').mockResolvedValue({
        EventId: 'ev_1',
        Title: 'Vòng Quay Veyra',
        IsActive: true,
        InitialTickets: 2,
        Missions: [
          {
            MissionId: 'daily_checkin',
            Title: 'Điểm danh hằng ngày',
            Description: 'Nhận 1 lượt',
            TicketReward: 1,
            MissionType: 'daily',
          },
        ],
        Rewards: [],
      } as Awaited<ReturnType<typeof service.getPublicEventById>>);

      const loadSpy = vi
        .spyOn(service as unknown as { loadStoredPlayerState: () => Promise<unknown> }, 'loadStoredPlayerState')
        .mockResolvedValueOnce({
          user: {
            uid: 'player_1',
            username: 'CommanderOne',
            authTokenForFirestore: 'tok',
          },
          state: {
            Uid: 'player_1',
            Username: 'CommanderOne',
            EventId: 'ev_1',
            SpinTickets: 2,
            TotalSpins: 0,
            InviteCode: 'Ab12Cd34',
            ClaimedMissions: {},
            Inventory: {},
            RecentRewards: [],
            ClaimedHistory: [],
            HelpGivenCount: 0,
            HelpReceivedCount: 0,
            UsedHelps: [],
            ReceivedHelps: [],
            LastUpdated: '',
          },
          helpedTargetUids: [],
          claimedHelperUids: [],
        });

      const claimed = await service.claimMissionReward(
        'Bearer tok',
        'ev_1',
        'daily_checkin',
      );
      expect(claimed.addedTickets).toBe(1);
      expect(claimed.playerState.SpinTickets).toBe(3);

      // Lần 2 trong cùng ngày sẽ bị chặn
      loadSpy.mockResolvedValueOnce({
        user: {
          uid: 'player_1',
          username: 'CommanderOne',
          authTokenForFirestore: 'tok',
        },
        state: claimed.playerState,
        helpedTargetUids: [],
        claimedHelperUids: [],
      });

      await expect(
        service.claimMissionReward('Bearer tok', 'ev_1', 'daily_checkin'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('recordSpinAndSaveReward trừ 1 lượt quay, lưu vật phẩm vào Kho Đồ sự kiện và chặn khi hết lượt', async () => {
      vi.spyOn(service, 'getPublicEventById').mockResolvedValue({
        EventId: 'ev_1',
        Title: 'Vòng Quay Veyra',
        IsActive: true,
        InitialTickets: 1,
        Missions: [],
        Rewards: [
          {
            ItemId: 'item_01',
            ItemName: 'Chip Cải Tiến',
            Rarity: 'SR',
            Quantity: 5,
            Probability: 100,
          },
        ],
      } as Awaited<ReturnType<typeof service.getPublicEventById>>);

      const loadSpy = vi
        .spyOn(service as unknown as { loadStoredPlayerState: () => Promise<unknown> }, 'loadStoredPlayerState')
        .mockResolvedValueOnce({
          user: {
            uid: 'player_1',
            username: 'CommanderOne',
            authTokenForFirestore: 'tok',
          },
          state: {
            Uid: 'player_1',
            Username: 'CommanderOne',
            EventId: 'ev_1',
            SpinTickets: 1,
            TotalSpins: 0,
            InviteCode: 'Ab12Cd34',
            ClaimedMissions: {},
            Inventory: {},
            RecentRewards: [],
            ClaimedHistory: [],
            HelpGivenCount: 0,
            HelpReceivedCount: 0,
            UsedHelps: [],
            ReceivedHelps: [],
            LastUpdated: '',
          },
          helpedTargetUids: [],
          claimedHelperUids: [],
        });

      const spinRes = await service.recordSpinAndSaveReward(
        'Bearer tok',
        'ev_1',
        { itemId: 'item_01' },
      );

      expect(spinRes.playerState.SpinTickets).toBe(0);
      expect(spinRes.playerState.TotalSpins).toBe(1);
      expect(spinRes.playerState.Inventory.item_01.Quantity).toBe(5);

      // Khi SpinTickets === 0 thì lượt quay tiếp theo bị chặn
      loadSpy.mockResolvedValueOnce({
        user: {
          uid: 'player_1',
          username: 'CommanderOne',
          authTokenForFirestore: 'tok',
        },
        state: spinRes.playerState,
        helpedTargetUids: [],
        claimedHelperUids: [],
      });

      await expect(
        service.recordSpinAndSaveReward('Bearer tok', 'ev_1', {}),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});
