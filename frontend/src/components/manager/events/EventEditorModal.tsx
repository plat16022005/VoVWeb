"use client";

import { useState } from "react";
import {
  EventMissionConfig,
  EventRewardItemConfig,
  EventRewardRarity,
  UnityZipInspectionResult,
  WebEventDocument,
  eventsService,
  inspectUnityZipFile,
} from "@/services/events.service";
import { soundEngine } from "@/services/audio.service";

interface EventEditorModalProps {
  isOpen: boolean;
  editingEvent: WebEventDocument | null;
  onClose: () => void;
  onSaved: (saved: WebEventDocument, message: string) => void;
}

const DEFAULT_REWARD_PRESET: EventRewardItemConfig[] = [
  {
    ItemId: "item_01",
    ItemName: "Chip cải tiến sơ cấp",
    Rarity: "R",
    Quantity: 5,
    Probability: 22,
  },
  {
    ItemId: "item_02",
    ItemName: "Chip cải tiến trung cấp",
    Rarity: "SR",
    Quantity: 3,
    Probability: 15,
  },
  {
    ItemId: "item_03",
    ItemName: "Chip cải tiến cao cấp",
    Rarity: "SSR",
    Quantity: 1,
    Probability: 8,
  },
  {
    ItemId: "item_04",
    ItemName: "Lõi cộng hưởng sơ cấp",
    Rarity: "SR",
    Quantity: 2,
    Probability: 13,
  },
  {
    ItemId: "item_05",
    ItemName: "Lõi cộng hưởng cao cấp",
    Rarity: "UR",
    Quantity: 1,
    Probability: 4,
  },
  {
    ItemId: "item_06",
    ItemName: "Năng lượng tia sét",
    Rarity: "R",
    Quantity: 20,
    Probability: 16,
  },
  {
    ItemId: "item_07",
    ItemName: "Xu vàng Veyra",
    Rarity: "R",
    Quantity: 500,
    Probability: 15,
  },
  {
    ItemId: "item_08",
    ItemName: "Pha lê Veyra",
    Rarity: "SSR",
    Quantity: 100,
    Probability: 7,
  },
];

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function EventEditorModal(props: EventEditorModalProps) {
  if (!props.isOpen) return null;
  return (
    <EventEditorModalContent
      key={props.editingEvent?.EventId || "new"}
      editingEvent={props.editingEvent}
      onClose={props.onClose}
      onSaved={props.onSaved}
    />
  );
}

function EventEditorModalContent({
  editingEvent,
  onClose,
  onSaved,
}: Omit<EventEditorModalProps, "isOpen">) {
  const isEditing = Boolean(editingEvent);
  const [activeTab, setActiveTab] = useState<"build" | "missions" | "rewards">("build");

  // Basic Info
  const [eventId, setEventId] = useState(
    () => editingEvent?.EventId || "lucky_wheel_2026"
  );
  const [title, setTitle] = useState(
    () => editingEvent?.Title || "Vòng Quay Định Mệnh Veyra"
  );
  const [subtitle, setSubtitle] = useState(
    () =>
      editingEvent?.Subtitle ||
      "Điểm danh hằng ngày hoặc dùng mã hỗ trợ để nhận lượt quay"
  );
  const [description] = useState(
    () =>
      editingEvent?.Description ||
      "Sự kiện Vòng Quay May Mắn tích hợp trực tiếp từ Unity WebGL và đồng bộ phần thưởng thời gian thực."
  );
  const [initialTickets, setInitialTickets] = useState(
    () => editingEvent?.InitialTickets ?? 2
  );
  const [unityTargetObject, setUnityTargetObject] = useState(
    () => editingEvent?.UnityTargetObject || "LuckyWheelManager"
  );
  const [startTime] = useState(() =>
    editingEvent
      ? editingEvent.StartTime.slice(0, 16)
      : new Date().toISOString().slice(0, 16)
  );
  const [endTime] = useState(() =>
    editingEvent
      ? editingEvent.EndTime.slice(0, 16)
      : new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 16)
  );

  // HTML Layout (.html) & Unity Build (.zip)
  const [rawHtmlContent, setRawHtmlContent] = useState(
    () => editingEvent?.RawHtmlContent || ""
  );
  const [selectedHtmlFileName, setSelectedHtmlFileName] = useState("");
  const [selectedZipFile, setSelectedZipFile] = useState<File | null>(null);
  const [zipInspection, setZipInspection] = useState<UnityZipInspectionResult | null>(null);

  // Check-in & Referral & Rewards
  const [dailyMission, setDailyMission] = useState<EventMissionConfig>(() => {
    const existingDaily =
      editingEvent?.Missions?.find((m) => m.MissionId === "daily_checkin") ||
      editingEvent?.Missions?.[0];
    return {
      MissionId: "daily_checkin",
      Title: existingDaily?.Title || "Điểm Danh Hàng Ngày Tại Veyra",
      Description:
        existingDaily?.Description ||
        "Điểm danh mỗi ngày để nhận lượt quay miễn phí (Làm mới mỗi ngày).",
      TicketReward: existingDaily?.TicketReward || 1,
      MissionType: "daily",
    };
  });
  const [referralTicketReward, setReferralTicketReward] = useState(
    () => editingEvent?.ReferralTicketReward ?? 1
  );
  const [rewards, setRewards] = useState<EventRewardItemConfig[]>(
    () => editingEvent?.Rewards || DEFAULT_REWARD_PRESET
  );

  // Status
  const [submitting, setSubmitting] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSelectHtmlFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    soundEngine.playClick();
    if (!file.name.toLowerCase().endsWith(".html") && !file.name.toLowerCase().endsWith(".htm")) {
      setErrorMessage("Vui lòng chọn tệp giao diện có định dạng .html");
      return;
    }
    const text = await file.text();
    setRawHtmlContent(text);
    setSelectedHtmlFileName(file.name);
    setErrorMessage(null);
  };

  const handleLoadStandardLayout = async () => {
    soundEngine.playClick();
    try {
      const res = await fetch("/templates/vov-event-layout.html");
      if (!res.ok) throw new Error("HTTP " + res.status);
      const htmlText = await res.text();
      setRawHtmlContent(htmlText);
      setSelectedHtmlFileName("vov-event-layout.html");
      setErrorMessage(null);
    } catch {
      setErrorMessage("Không thể nạp mẫu Layout chuẩn. Bạn có thể để trống để hệ thống tự gắn Layout mặc định.");
    }
  };

  const handleSelectZipFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    soundEngine.playClick();
    if (!file.name.toLowerCase().endsWith(".zip")) {
      setErrorMessage("Vui lòng chọn tệp nén định dạng .zip xuất từ Unity WebGL.");
      return;
    }
    setSelectedZipFile(file);
    try {
      const result = await inspectUnityZipFile(file);
      setZipInspection(result);
      if (!result.isValid) {
        setErrorMessage(
          `Tệp .zip thiếu các thành phần bắt buộc của Unity WebGL: ${result.missingRoles.join(", ")}`
        );
      } else {
        setErrorMessage(null);
      }
    } catch {
      setErrorMessage("Không thể đọc cấu trúc tệp .zip đã chọn.");
    }
  };

  const handleAddReward = () => {
    soundEngine.playClick();
    setRewards((prev) => [
      ...prev,
      {
        ItemId: `item_reward_${prev.length + 1}`,
        ItemName: "Vật Phẩm Phần Thưởng Mới",
        Rarity: "SR",
        Quantity: 1,
        Probability: 10,
      },
    ]);
  };

  const handleRemoveReward = (idx: number) => {
    soundEngine.playClick();
    setRewards((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = eventId.trim().toLowerCase();
    if (!/^[a-z0-9_]+$/.test(cleanId)) {
      setErrorMessage("Mã sự kiện chỉ được chứa chữ thường không dấu, số và dấu gạch dưới (_).");
      return;
    }
    if (!title.trim()) {
      setErrorMessage("Vui lòng nhập Tên Sự Kiện.");
      return;
    }
    if (selectedZipFile && zipInspection && !zipInspection.isValid) {
      setErrorMessage(
        `Tệp .zip Unity WebGL chưa hợp lệ (thiếu: ${zipInspection.missingRoles.join(", ")}).`
      );
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      let unityBuildToSave = editingEvent?.UnityBuild || null;

      // Nếu người vận hành chọn file .zip bản build Unity mới -> Giải nén & tải lên đám mây lưu trữ
      if (selectedZipFile) {
        unityBuildToSave = await eventsService.uploadUnityZipToCloud(
          cleanId,
          selectedZipFile,
          (stepText, pct) => {
            setUploadStatusText(stepText);
            setUploadProgress(pct);
          }
        );
      }

      setUploadStatusText("Đang hợp nhất Layout .html với Unity WebGL & lưu cấu hình...");
      setUploadProgress(98);

      const payload = {
        EventId: cleanId,
        Title: title.trim(),
        Subtitle: subtitle.trim(),
        Description: description.trim(),
        InitialTickets: Number(initialTickets) || 0,
        ReferralTicketReward: Math.max(1, Math.min(10, Number(referralTicketReward) || 1)),
        UnityTargetObject: unityTargetObject.trim() || "LuckyWheelManager",
        StartTime: startTime ? new Date(startTime).toISOString() : new Date().toISOString(),
        EndTime: endTime
          ? new Date(endTime).toISOString()
          : new Date(Date.now() + 30 * 86400_000).toISOString(),
        RawHtmlContent: rawHtmlContent,
        UnityBuild: unityBuildToSave,
        Missions: [dailyMission],
        Rewards: rewards,
      };

      const saved = isEditing
        ? await eventsService.updateEvent(cleanId, payload)
        : await eventsService.createEvent(payload);

      soundEngine.playCelestialChime();
      onSaved(
        saved,
        isEditing
          ? `Đã cập nhật và hợp nhất thành công sự kiện "${saved.Title}" (v${saved.Version})!`
          : `Đã khởi tạo thành công sự kiện Minigame "${saved.Title}"!`
      );
      onClose();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Không thể lưu sự kiện. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
      setUploadStatusText("");
      setUploadProgress(0);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-[#090d24] border border-[#f5c767]/35 shadow-[0_0_60px_rgba(245,199,103,0.18)] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d1435] shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white font-[family-name:var(--font-rajdhani)] tracking-wide uppercase">
              {isEditing
                ? `Cấu Hình & Hợp Nhất Sự Kiện: ${editingEvent?.Title}`
                : "Tạo Sự Kiện Minigame Web Mới (.html + .zip Unity)"}
            </h2>
            <p className="text-xs text-slate-400">
              Truyền vào 1 tệp giao diện <code className="text-[#f5c767]">.html</code> và 1 tệp bản build Unity WebGL <code className="text-[#3fe9d6]">.zip</code> để hệ thống tự động hợp nhất.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-xs font-mono"
          >
            Đóng
          </button>
        </div>

        {/* Sub-Tabs */}
        <div className="px-6 py-3 bg-[#060919] border-b border-white/10 flex flex-wrap items-center gap-2 shrink-0">
          {[
            {
              id: "build" as const,
              label: "1. Giao Diện (.html) & Bản Build (.zip)",
            },
            {
              id: "missions" as const,
              label: "2. Cách Nhận Lượt Quay (2 Kênh)",
            },
            {
              id: "rewards" as const,
              label: `3. Phần Thưởng Sự Kiện (${rewards.length})`,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setActiveTab(tab.id);
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${activeTab === tab.id
                ? "bg-gradient-to-r from-[#f5c767] to-[#e6b143] text-[#060814]"
                : "bg-white/5 text-slate-300 hover:text-white border border-white/10"
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-mono">
              {errorMessage}
            </div>
          )}

          {uploadStatusText && (
            <div className="p-4 rounded-2xl bg-[#0d1538] border border-[#3fe9d6]/40 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono text-[#3fe9d6]">
                <span>{uploadStatusText}</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#f5c767] to-[#3fe9d6] transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {activeTab === "build" && (
            <div className="space-y-6">
              {/* Basic Event Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
                    Mã Định Danh Sự Kiện (Event ID) *
                  </label>
                  <input
                    type="text"
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                    disabled={isEditing}
                    placeholder="vd: lucky_wheel_2026"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/15 text-white text-xs font-mono focus:outline-none focus:border-[#f5c767] disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
                    Tên Sự Kiện Hiển Thị *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="VD: Vòng Quay Định Mệnh Veyra"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/15 text-white text-xs focus:outline-none focus:border-[#f5c767]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
                    Thông Điệp Phụ (Subtitle)
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/15 text-white text-xs focus:outline-none focus:border-[#f5c767]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
                      Lượt Tặng Khởi Đầu
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={50}
                      value={initialTickets}
                      onChange={(e) => setInitialTickets(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/15 text-[#f5c767] font-mono font-bold text-xs focus:outline-none focus:border-[#f5c767]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono uppercase text-slate-300 mb-1.5">
                      Unity GameObject Nhận Lệnh
                    </label>
                    <input
                      type="text"
                      value={unityTargetObject}
                      onChange={(e) => setUnityTargetObject(e.target.value)}
                      placeholder="LuckyWheelManager"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/15 text-[#3fe9d6] font-mono text-xs focus:outline-none focus:border-[#3fe9d6]"
                    />
                  </div>
                </div>
              </div>

              {/* 2-FILE UPLOAD STUDIO: 1 FILE .HTML + 1 FILE .ZIP UNITY */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Box 1: Upload Single .HTML Layout File */}
                <div className="p-5 rounded-2xl bg-[#060919] border border-[#f5c767]/35 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold uppercase text-[#f5c767]">
                        Tệp 1: Bộ Layout HTML (Tùy Chọn)
                      </span>
                      {rawHtmlContent ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          Đã nạp HTML ({formatBytes(rawHtmlContent.length)})
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#3fe9d6]/15 text-[#3fe9d6] border border-[#3fe9d6]/30">
                          Tự động dùng Layout chuẩn
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Nếu để trống, hệ thống <strong>tự động bọc Bộ Layout Chuẩn Đa Năng</strong> (chỉ cần up <code className="text-[#3fe9d6]">.zip</code> game mới là chạy ngay). Hoặc chọn 1 tệp <code className="text-slate-200">.html</code> riêng để tùy biến.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleLoadStandardLayout}
                        className="px-2.5 py-1 rounded-lg bg-[#f5c767]/15 hover:bg-[#f5c767]/25 border border-[#f5c767]/40 text-[#f5c767] text-[10px] font-mono font-bold cursor-pointer"
                      >
                        Nạp Layout Chuẩn Vào Trình Sửa
                      </button>
                      <a
                        href="/templates/vov-event-layout.html"
                        download="vov-event-layout.html"
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 text-[10px] font-mono font-semibold"
                      >
                        Tải Layout Mẫu (.html)
                      </a>
                    </div>
                  </div>

                  <label className="mt-2 flex flex-col items-center justify-center p-5 rounded-xl border border-dashed border-[#f5c767]/40 hover:border-[#f5c767] bg-[#090d24]/70 hover:bg-[#090d24] transition-all cursor-pointer text-center">
                    <span className="text-xs font-bold text-white">
                      {selectedHtmlFileName
                        ? `Đã chọn: ${selectedHtmlFileName}`
                        : "Bấm để chọn tệp giao diện .html"}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 mt-1">
                      Hỗ trợ chỉnh sửa lại .html bất cứ lúc nào mà không cần tải lại .zip game
                    </span>
                    <input
                      type="file"
                      accept=".html,.htm"
                      onChange={handleSelectHtmlFile}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Box 2: Upload Unity WebGL .ZIP File */}
                <div className="p-5 rounded-2xl bg-[#060919] border border-[#3fe9d6]/35 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold uppercase text-[#3fe9d6]">
                        Tệp 2: Bản Build Unity WebGL (.zip)
                      </span>
                      {zipInspection?.isValid ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                          Hợp lệ ({formatBytes(zipInspection.totalSizeBytes)})
                        </span>
                      ) : editingEvent?.UnityBuild ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#3fe9d6]/15 text-[#3fe9d6] border border-[#3fe9d6]/30">
                          Đang dùng: {editingEvent.UnityBuild.BuildName}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-amber-500/15 text-amber-300">
                          Chưa có bản build
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Chọn tệp <strong>.zip</strong> nén từ thư mục xuất WebGL của Unity. Hệ thống tự động giải nén và nhận diện 4 tệp cốt lõi để đẩy lên đám mây lưu trữ.
                    </p>
                  </div>

                  <label className="mt-2 flex flex-col items-center justify-center p-5 rounded-xl border border-dashed border-[#3fe9d6]/40 hover:border-[#3fe9d6] bg-[#090d24]/70 hover:bg-[#090d24] transition-all cursor-pointer text-center">
                    <span className="text-xs font-bold text-white">
                      {selectedZipFile
                        ? `Đã chọn: ${selectedZipFile.name}`
                        : "Bấm để chọn tệp bản build Unity .zip"}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 mt-1">
                      Tự động quét *.loader.js, *.data, *.framework.js, *.wasm
                    </span>
                    <input
                      type="file"
                      accept=".zip"
                      onChange={handleSelectZipFile}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Real-time 4-File Unity WebGL Inspection Status */}
              {(zipInspection || editingEvent?.UnityBuild) && (
                <div className="p-4 rounded-2xl bg-[#060814] border border-white/10 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <span className="text-slate-300 font-bold">
                      Trạng Thái Kiểm Tra 4 Tệp Cốt Lõi Unity WebGL:
                    </span>
                    <span className="text-[#f5c767]">
                      Tên Build:{" "}
                      <strong>
                        {zipInspection?.buildName || editingEvent?.UnityBuild?.BuildName}
                      </strong>{" "}
                      · Chuẩn nén:{" "}
                      <strong className="uppercase">
                        {zipInspection?.compression ||
                          editingEvent?.UnityBuild?.Compression ||
                          "none"}
                      </strong>
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
                    {(
                      [
                        { role: "loader", label: "*.loader.js" },
                        { role: "data", label: "*.data" },
                        { role: "framework", label: "*.framework.js" },
                        { role: "wasm", label: "*.wasm" },
                      ] as const
                    ).map((item) => {
                      const entry = zipInspection?.entries[item.role];
                      const hasExisting = Boolean(editingEvent?.UnityBuild);
                      const ok = Boolean(entry) || (!zipInspection && hasExisting);

                      return (
                        <div
                          key={item.role}
                          className={`p-2.5 rounded-xl border flex flex-col gap-1 ${ok
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                            : "bg-rose-500/10 border-rose-500/30 text-rose-300"
                            }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>{item.label}</span>
                            <span>{ok ? "OK" : "Thiếu"}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {entry
                              ? `${entry.fileName} (${formatBytes(entry.uncompressedSize)})`
                              : ok
                                ? "Đã lưu trữ trên đám mây"
                                : "Chưa tìm thấy trong .zip"}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Optional HTML Source Editor Preview */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono uppercase text-slate-300">
                    Mã Nguồn Giao Diện HTML (Có thể chỉnh sửa trực tiếp hoặc tải tệp .html ở trên)
                  </label>
                  <span className="text-[11px] font-mono text-[#3fe9d6]">
                    Đặt thẻ &lt;canvas id=&quot;unity-canvas&quot;&gt;&lt;/canvas&gt; tại vị trí muốn nhúng game
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={rawHtmlContent}
                  onChange={(e) => setRawHtmlContent(e.target.value)}
                  placeholder="Nếu để trống, hệ thống sẽ tự động tạo khung giao diện chuẩn Valkyria of Veyra bao quanh <canvas id='unity-canvas'>..."
                  className="w-full p-3.5 rounded-xl bg-[#050713] border border-white/15 text-slate-200 text-xs font-mono focus:outline-none focus:border-[#f5c767]"
                />
              </div>
            </div>
          )}

          {activeTab === "missions" && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-white uppercase font-[family-name:var(--font-rajdhani)]">
                  Cấu Hình 2 Kênh Nhận Lượt Quay Chính Thức
                </h3>
                <p className="text-xs text-slate-400">
                  Người chơi chỉ nhận thêm lượt qua <strong>Điểm danh hằng ngày</strong> và <strong>Mã hỗ trợ chéo</strong> (tối đa 5 lần nhập giúp người khác &amp; 5 lần được người khác nhập mã, không reset).
                </p>
              </div>

              {/* Kênh 1: Điểm Danh Hằng Ngày */}
              <div className="p-5 rounded-2xl bg-[#060919] border border-[#f5c767]/25 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#f5c767]">
                      01. Điểm Danh Hằng Ngày
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Chu kỳ làm mới mỗi ngày · Tối đa 1 lần / ngày
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-[#f5c767]/10 border border-[#f5c767]/30 text-[11px] font-mono text-[#f5c767]">
                    Làm mới mỗi ngày
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">
                      Tiêu Đề Điểm Danh
                    </label>
                    <input
                      type="text"
                      value={dailyMission.Title}
                      onChange={(e) =>
                        setDailyMission((prev) => ({ ...prev, Title: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#090d24] border border-white/10 text-xs text-white"
                    />
                  </div>
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">
                      Mô Tả Ngắn
                    </label>
                    <input
                      type="text"
                      value={dailyMission.Description}
                      onChange={(e) =>
                        setDailyMission((prev) => ({
                          ...prev,
                          Description: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#090d24] border border-white/10 text-xs text-slate-200"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">
                      Lượt / Ngày
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={dailyMission.TicketReward}
                      onChange={(e) =>
                        setDailyMission((prev) => ({
                          ...prev,
                          TicketReward: Math.max(1, Math.min(50, Number(e.target.value) || 1)),
                        }))
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#090d24] border border-white/10 text-xs font-mono font-bold text-[#f5c767]"
                    />
                  </div>
                </div>
              </div>

              {/* Kênh 2: Mã Hỗ Trợ Chỉ Huy */}
              <div className="p-5 rounded-2xl bg-[#060919] border border-[#3fe9d6]/25 space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[#3fe9d6]">
                      02. Nhập Mã Giúp Người Khác &amp; Nhận Hỗ Trợ
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Giới hạn cố định: Tối đa 5 lần nhập mã cho người khác &amp; 5 lần được người khác nhập mã (Không reset)
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-[11px] font-mono text-rose-300">
                    Không Reset
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">
                      Số Lượt Thưởng Mỗi Lần Nhập Mã Hợp Lệ
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={referralTicketReward}
                      onChange={(e) =>
                        setReferralTicketReward(
                          Math.max(1, Math.min(10, Number(e.target.value) || 1))
                        )
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#090d24] border border-white/10 text-xs font-mono font-bold text-[#3fe9d6]"
                    />
                  </div>
                  <div className="sm:col-span-8 text-xs text-slate-400 leading-relaxed pt-3 sm:pt-4">
                    Khi Người chơi A nhập mã của Người chơi B: cả A (đã giúp) và B (được giúp) đều nhận <strong className="text-[#3fe9d6]">+{referralTicketReward} lượt quay</strong>. Không cho phép tự nhập mã của bản thân hoặc nhập trùng 1 người.
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "rewards" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase font-[family-name:var(--font-rajdhani)]">
                    Danh Sách Phần Thưởng Vòng Quay (Sản Phẩm X)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Khi người chơi quay trúng <strong>Sản phẩm X</strong> trong Unity, hệ thống đối chiếu mã vật phẩm và lưu trực tiếp vào Túi Đồ.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddReward}
                  className="px-3.5 py-2 rounded-xl bg-[#f5c767]/15 hover:bg-[#f5c767]/25 text-[#f5c767] border border-[#f5c767]/40 text-xs font-mono font-bold cursor-pointer"
                >
                  + Thêm Phần Thưởng (Sản Phẩm X)
                </button>
              </div>

              <div className="space-y-3">
                {rewards.map((r, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-[#060919] border border-white/10 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                  >
                    <div className="sm:col-span-3">
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">
                        Mã Sản Phẩm X (ItemId)
                      </label>
                      <input
                        type="text"
                        value={r.ItemId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRewards((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, ItemId: val } : item
                            )
                          );
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-[#090d24] border border-white/10 text-xs font-mono text-[#f5c767]"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">
                        Tên Sản Phẩm Hiển Thị
                      </label>
                      <input
                        type="text"
                        value={r.ItemName}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRewards((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, ItemName: val } : item
                            )
                          );
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-[#090d24] border border-white/10 text-xs text-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">
                        Phẩm Chất
                      </label>
                      <select
                        value={r.Rarity}
                        onChange={(e) => {
                          const val = e.target.value as EventRewardRarity;
                          setRewards((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, Rarity: val } : item
                            )
                          );
                        }}
                        className="w-full px-2.5 py-2 rounded-lg bg-[#090d24] border border-white/10 text-xs font-mono font-bold text-white"
                      >
                        <option value="UR">UR (Tối Thượng)</option>
                        <option value="SSR">SSR (Huyền Thoại)</option>
                        <option value="SR">SR (Sử Thi)</option>
                        <option value="R">R (Thường)</option>
                      </select>
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">
                        SL
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={r.Quantity}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setRewards((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, Quantity: val } : item
                            )
                          );
                        }}
                        className="w-full px-2 py-2 rounded-lg bg-[#090d24] border border-white/10 text-xs font-mono text-white"
                      />
                    </div>
                    <div className="sm:col-span-1">
                      <label className="block text-[10px] font-mono text-slate-400 mb-1">
                        Tỷ Lệ %
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={r.Probability}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setRewards((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, Probability: val } : item
                            )
                          );
                        }}
                        className="w-full px-2 py-2 rounded-lg bg-[#090d24] border border-white/10 text-xs font-mono text-[#3fe9d6]"
                      />
                    </div>
                    <div className="sm:col-span-1 flex justify-end pt-4">
                      <button
                        type="button"
                        onClick={() => handleRemoveReward(idx)}
                        className="px-2.5 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-mono cursor-pointer"
                        title="Xóa phần thưởng"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
            <div className="text-xs font-mono text-slate-400">
              Hệ thống tự động hợp nhất <span className="text-[#f5c767]">.html</span> + <span className="text-[#3fe9d6]">.zip Unity</span> và đồng bộ lên đám mây lưu trữ.
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white text-xs font-mono cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#f5c767] to-[#e6b143] text-[#060814] font-bold text-xs font-mono hover:brightness-110 transition-all cursor-pointer disabled:opacity-50"
              >
                {submitting
                  ? "Đang giải nén & hợp nhất..."
                  : isEditing
                    ? "Lưu & Hợp Nhất Bản Build"
                    : "Khởi Tạo & Hợp Nhất Sự Kiện"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
