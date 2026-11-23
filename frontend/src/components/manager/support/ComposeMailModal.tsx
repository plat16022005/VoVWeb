"use client";

import { useState, useMemo } from "react";
import {
  MAIL_CATEGORY_OPTIONS,
  MAIL_QUICK_TEMPLATES,
  MailPlayerSearchItem,
  MailReferenceItem,
  MailReferenceServer,
  SystemMailCategory,
  SystemMailDocument,
  SystemMailRewardItem,
  SystemMailType,
  mailService,
} from "@/services/mail.service";
import { getItemRarityMeta, getItemTypeMeta } from "@/services/itemConfig.service";
import { soundEngine } from "@/services/audio.service";

interface ComposeMailModalProps {
  isOpen: boolean;
  initialServerId?: string;
  canSendNotice: boolean;
  canSendPersonalReward: boolean;
  canSendGlobalReward: boolean;
  referenceItems: MailReferenceItem[];
  referenceServers: MailReferenceServer[];
  onClose: () => void;
  onSent: (mails: SystemMailDocument[], message: string) => void;
}

function getDefaultExpiryLocal(daysFromNow = 30): string {
  const d = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function ComposeMailModal(props: ComposeMailModalProps) {
  if (!props.isOpen) return null;
  return (
    <ComposeMailModalContent
      key={props.initialServerId || "default"}
      initialServerId={props.initialServerId}
      canSendNotice={props.canSendNotice}
      canSendPersonalReward={props.canSendPersonalReward}
      canSendGlobalReward={props.canSendGlobalReward}
      referenceItems={props.referenceItems}
      referenceServers={props.referenceServers}
      onClose={props.onClose}
      onSent={props.onSent}
    />
  );
}

function ComposeMailModalContent({
  initialServerId,
  canSendNotice,
  canSendPersonalReward,
  canSendGlobalReward,
  referenceItems,
  referenceServers,
  onClose,
  onSent,
}: Omit<ComposeMailModalProps, "isOpen">) {
  const defaultPersonalServer =
    (initialServerId && initialServerId !== "ALL" ? initialServerId : "") ||
    referenceServers[0]?.ServerId ||
    "";

  const [mailType, setMailType] = useState<SystemMailType>("global");
  const [category, setCategory] = useState<SystemMailCategory>("NOTICE");
  const [senderName, setSenderName] = useState("Hội Đồng Veyra");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [referenceTicketId, setReferenceTicketId] = useState("");
  const [expiresAt, setExpiresAt] = useState(() => getDefaultExpiryLocal(30));

  // Global target servers (ALL or multi-select)
  const [globalTargetServers, setGlobalTargetServers] = useState<string[]>(() =>
    initialServerId && initialServerId !== "ALL" ? [initialServerId] : ["ALL"]
  );
  // Personal target server (STRICTLY 1 specific server!)
  const [personalServerId, setPersonalServerId] = useState<string>(
    defaultPersonalServer
  );
  const [includeAllAccounts, setIncludeAllAccounts] = useState(false);

  // Personal recipients state
  const [playerQuery, setPlayerQuery] = useState("");
  const [searchingPlayers, setSearchingPlayers] = useState(false);
  const [searchResults, setSearchResults] = useState<MailPlayerSearchItem[]>(
    []
  );
  const [hasSearchedPlayers, setHasSearchedPlayers] = useState(false);
  const [selectedRecipients, setSelectedRecipients] = useState<
    Array<{ uid: string; username: string; playerCode: string }>
  >([]);

  // Rewards state
  const [gold, setGold] = useState(0);
  const [gems, setGems] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [rewardItems, setRewardItems] = useState<SystemMailRewardItem[]>([]);
  const [itemSearch, setItemSearch] = useState("");
  const [selectedRefItemId, setSelectedRefItemId] = useState(
    () => referenceItems[0]?.ItemId || ""
  );
  const [selectedItemQty, setSelectedItemQty] = useState(1);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canAttachRewardsForCurrentScope =
    mailType === "global" ? canSendGlobalReward : canSendPersonalReward;

  const canSendCurrentNotice =
    canSendNotice || canSendPersonalReward || canSendGlobalReward;

  const filteredRefItems = useMemo(() => {
    const q = itemSearch.trim().toLowerCase();
    if (!q) return referenceItems;
    return referenceItems.filter(
      (it) =>
        it.ItemId.toLowerCase().includes(q) ||
        it.ItemName.toLowerCase().includes(q)
    );
  }, [referenceItems, itemSearch]);

  const effectiveSelectedItemId = useMemo(() => {
    if (
      selectedRefItemId &&
      filteredRefItems.some((it) => it.ItemId === selectedRefItemId)
    ) {
      return selectedRefItemId;
    }
    return filteredRefItems[0]?.ItemId || "";
  }, [selectedRefItemId, filteredRefItems]);

  const isAllServers = globalTargetServers.includes("ALL");

  const handleApplyTemplate = (templateId: string) => {
    const tpl = MAIL_QUICK_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    soundEngine.playClick();
    setMailType(tpl.type);
    setCategory(tpl.category);
    setSenderName(tpl.senderName);
    setTitle(tpl.title);
    setContent(tpl.content);
  };

  const handleResetBlankForm = () => {
    soundEngine.playClick();
    setTitle("");
    setContent("");
    setReferenceTicketId("");
  };

  const handleToggleGlobalServer = (serverId: string) => {
    soundEngine.playClick();
    if (serverId === "ALL") {
      setGlobalTargetServers(["ALL"]);
      return;
    }
    setGlobalTargetServers((prev) => {
      const withoutAll = prev.filter((s) => s !== "ALL");
      if (withoutAll.includes(serverId)) {
        const next = withoutAll.filter((s) => s !== serverId);
        return next.length > 0 ? next : ["ALL"];
      }
      return [...withoutAll, serverId];
    });
  };

  const handleSelectPersonalServer = (nextServerId: string) => {
    soundEngine.playClick();
    setPersonalServerId(nextServerId);
    setSelectedRecipients([]);
    setSearchResults([]);
    setHasSearchedPlayers(false);
  };

  const handleSearchPlayers = async () => {
    if (!personalServerId) {
      setErrorMsg(
        "Vui lòng chọn cụm máy chủ cụ thể trước khi tra cứu người chơi."
      );
      return;
    }
    soundEngine.playClick();
    setSearchingPlayers(true);
    setErrorMsg(null);
    try {
      const results = await mailService.searchPlayers(
        playerQuery.trim(),
        personalServerId,
        includeAllAccounts
      );
      setSearchResults(results);
      setHasSearchedPlayers(true);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Không thể tra cứu danh sách tài khoản người chơi."
      );
    } finally {
      setSearchingPlayers(false);
    }
  };

  const handleAddRecipient = (player: MailPlayerSearchItem) => {
    soundEngine.playClick();
    setSelectedRecipients((prev) => {
      if (prev.some((r) => r.uid === player.uid)) return prev;
      if (prev.length >= 20) return prev;
      return [
        ...prev,
        {
          uid: player.uid,
          username: player.inGameName || player.username,
          playerCode: player.playerCode,
        },
      ];
    });
  };

  const handleRemoveRecipient = (uid: string) => {
    soundEngine.playClick();
    setSelectedRecipients((prev) => prev.filter((r) => r.uid !== uid));
  };

  const handleAddRewardItem = () => {
    soundEngine.playClick();
    const target = referenceItems.find(
      (it) => it.ItemId === effectiveSelectedItemId
    );
    if (!target) return;
    const qty = Math.max(1, Math.trunc(Number(selectedItemQty) || 1));
    setRewardItems((prev) => {
      const idx = prev.findIndex((r) => r.ItemId === target.ItemId);
      if (idx >= 0) {
        return prev.map((r, i) =>
          i === idx ? { ...r, Quantity: r.Quantity + qty } : r
        );
      }
      return [
        ...prev,
        {
          ItemId: target.ItemId,
          ItemName: target.ItemName,
          Quantity: qty,
          Rarity: target.Rarity,
        },
      ];
    });
    setSelectedItemQty(1);
  };

  const handleUpdateRewardQty = (itemId: string, nextQty: number) => {
    const qty = Math.max(1, Math.trunc(nextQty) || 1);
    setRewardItems((prev) =>
      prev.map((r) => (r.ItemId === itemId ? { ...r, Quantity: qty } : r))
    );
  };

  const handleRemoveRewardItem = (itemId: string) => {
    soundEngine.playClick();
    setRewardItems((prev) => prev.filter((r) => r.ItemId !== itemId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (mailType === "personal") {
      if (!personalServerId.trim()) {
        setErrorMsg(
          "Vui lòng chọn đúng 1 cụm máy chủ cụ thể để xử lý thư cá nhân / đền bù người chơi."
        );
        return;
      }
      if (selectedRecipients.length === 0) {
        setErrorMsg(
          "Vui lòng tìm kiếm và chọn ít nhất 1 người chơi thuộc máy chủ đã chọn."
        );
        return;
      }
    }

    const effectiveRewards = canAttachRewardsForCurrentScope
      ? {
          Gold: Math.max(0, Math.trunc(Number(gold) || 0)),
          Gems: Math.max(0, Math.trunc(Number(gems) || 0)),
          Energy: Math.max(0, Math.trunc(Number(energy) || 0)),
          Items: rewardItems,
        }
      : { Gold: 0, Gems: 0, Energy: 0, Items: [] };

    const expiresIso = expiresAt.trim()
      ? new Date(expiresAt).toISOString()
      : "";

    const effectiveTargetServers =
      mailType === "personal"
        ? [personalServerId.trim()]
        : globalTargetServers;

    setSubmitting(true);
    try {
      const res = await mailService.sendMail({
        Type: mailType,
        Category: category,
        Title: title.trim(),
        Content: content.trim(),
        SenderName: senderName.trim() || "Hội Đồng Veyra",
        ...(mailType === "personal"
          ? { ServerId: personalServerId.trim() }
          : {}),
        TargetServers: effectiveTargetServers,
        ...(mailType === "personal" ? { Recipients: selectedRecipients } : {}),
        ReferenceTicketId: referenceTicketId.trim(),
        ExpiresAt: expiresIso,
        Rewards: effectiveRewards,
      });

      soundEngine.playCelestialChime();
      onSent(
        res.mails,
        mailType === "global"
          ? res.sentCount > 1
            ? `Đã phát thư toàn server "${title.trim()}" trực tiếp tới ${res.sentCount} cụm máy chủ thành công.`
            : `Đã phát thư toàn server "${title.trim()}" tại máy chủ ${res.mails[0]?.ServerId || ""} thành công.`
          : `Đã gửi thành công ${res.sentCount} thư cá nhân trực tiếp vào máy chủ ${personalServerId}.`
      );
      onClose();
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Không thể gửi thư hệ thống. Vui lòng kiểm tra lại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-[#090d24] border border-emerald-400/35 shadow-[0_0_60px_rgba(52,211,153,0.18)] overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d1435] shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white font-[family-name:var(--font-rajdhani)] tracking-wide uppercase">
              Soạn &amp; Gửi Thư Hệ Thống Trong Game
            </h2>
            <p className="text-xs text-slate-400">
              Gửi thông báo toàn server, hỗ trợ xử lý lỗi cá nhân hoặc đính kèm quà tặng trực tiếp vào hòm thư người chơi.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer text-xs font-mono"
          >
            Đóng
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-5"
        >
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs font-mono">
              {errorMsg}
            </div>
          )}

          {/* Quick Templates (Optional — Free-form writing always enabled) */}
          <div className="p-3.5 rounded-2xl bg-[#060919]/80 border border-white/10 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[11px] font-mono text-slate-300">
                <span className="uppercase text-[#3fe9d6] font-bold">
                  Gợi Ý Mẫu Nhanh (Tùy Chọn)
                </span>
                <span className="text-slate-400">
                  {" "}
                  — Bạn có thể tự nhập tiêu đề &amp; nội dung hoàn toàn tự do bên dưới
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetBlankForm}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-[11px] font-mono text-slate-200 cursor-pointer"
              >
                Tự Soạn Trống
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {MAIL_QUICK_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl.id)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-400/40 text-xs text-slate-200 transition-all cursor-pointer"
                >
                  {tpl.name}
                </button>
              ))}
            </div>
          </div>

          {/* 1. Scope & Target */}
          <div className="p-5 rounded-2xl bg-[#060919] border border-white/10 space-y-4">
            <div className="text-xs font-mono uppercase text-emerald-300 font-bold">
              1. Phạm Vi &amp; Cụm Máy Chủ Nhận Thư
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setMailType("global");
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  mailType === "global"
                    ? "bg-[#3fe9d6]/15 border-[#3fe9d6] text-white"
                    : "bg-[#090d24] border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                <div className="text-xs font-mono font-bold uppercase text-[#3fe9d6]">
                  Thư Toàn Máy Chủ (Global)
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Phát tới toàn bộ người chơi trên tất cả hoặc các cụm server đã chọn.
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playClick();
                  setMailType("personal");
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  mailType === "personal"
                    ? "bg-[#f5c767]/15 border-[#f5c767] text-white"
                    : "bg-[#090d24] border-white/10 text-slate-400 hover:text-white"
                }`}
              >
                <div className="text-xs font-mono font-bold uppercase text-[#f5c767]">
                  Thư Cá Nhân Theo Từng Server (Personal)
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Chọn đúng 1 cụm server cụ thể rồi tra cứu người chơi thuộc server đó để đền bù / xử lý lỗi.
                </div>
              </button>
            </div>

            {mailType === "personal" ? (
              <div className="p-4 rounded-xl bg-[#090d24] border border-[#f5c767]/30 space-y-4">
                {/* Step 1A: Mandatory Single Server Selector for Personal Mail */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                    <span className="text-[#f5c767] font-bold">
                      Bước 1: Chọn Cụm Máy Chủ Xử Lý (Bắt Buộc — Không Gửi Chung) *
                    </span>
                    <span className="text-slate-400">
                      Mỗi server có dữ liệu nhân vật độc lập
                    </span>
                  </div>

                  {referenceServers.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {referenceServers.map((srv) => {
                        const selected = personalServerId === srv.ServerId;
                        return (
                          <button
                            key={srv.ServerId}
                            type="button"
                            onClick={() =>
                              handleSelectPersonalServer(srv.ServerId)
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-mono border cursor-pointer transition-all ${
                              selected
                                ? "bg-[#f5c767]/20 border-[#f5c767] text-[#f5c767] font-bold"
                                : "bg-[#060919] border-white/15 text-slate-400 hover:text-white"
                            }`}
                          >
                            {srv.Name} ({srv.ServerId})
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={personalServerId}
                      onChange={(e) => setPersonalServerId(e.target.value)}
                      placeholder="Nhập mã cụm server (VD: server-01)"
                      className="w-full sm:w-72 px-3.5 py-2 rounded-xl bg-[#060919] border border-white/15 text-xs font-mono text-[#f5c767]"
                      required
                    />
                  )}
                </div>

                {/* Step 1B: Player Lookup strictly scoped to selected server */}
                <div className="pt-3 border-t border-white/10 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                    <span className="text-[#3fe9d6] font-bold">
                      Bước 2: Tra Cứu Người Chơi Tại Server{" "}
                      {personalServerId || "(Chưa chọn)"} *
                    </span>
                    <span className="text-slate-400">
                      Đã chọn: {selectedRecipients.length} / 20
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={playerQuery}
                      onChange={(e) => setPlayerQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void handleSearchPlayers();
                        }
                      }}
                      placeholder="Tìm theo tên nhân vật trong server, tên tài khoản, PlayerCode hoặc email..."
                      className="flex-1 px-3.5 py-2 rounded-xl bg-[#060919] border border-white/15 text-xs text-white focus:outline-none focus:border-[#f5c767]"
                    />
                    <button
                      type="button"
                      onClick={() => void handleSearchPlayers()}
                      disabled={searchingPlayers || !personalServerId}
                      className="px-4 py-2 rounded-xl bg-[#f5c767]/20 hover:bg-[#f5c767]/30 border border-[#f5c767]/40 text-[#f5c767] text-xs font-mono font-bold cursor-pointer disabled:opacity-50"
                    >
                      {searchingPlayers ? "Đang tìm..." : "Tra Cứu"}
                    </button>
                  </div>

                  <label className="inline-flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeAllAccounts}
                      onChange={(e) => setIncludeAllAccounts(e.target.checked)}
                      className="accent-[#f5c767]"
                    />
                    <span>
                      Mở rộng tìm cả tài khoản chưa đồng bộ danh sách nhân vật của server này
                    </span>
                  </label>

                  {selectedRecipients.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedRecipients.map((r) => (
                        <span
                          key={r.uid}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-xs font-mono text-emerald-200"
                        >
                          <span>
                            {r.username}
                            {r.playerCode ? ` (#${r.playerCode})` : ""}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveRecipient(r.uid)}
                            className="text-rose-300 hover:text-rose-100 cursor-pointer font-bold"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {hasSearchedPlayers && (
                    <div className="max-h-44 overflow-y-auto rounded-xl border border-white/10 divide-y divide-white/5 bg-[#060919]">
                      {searchResults.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-400">
                          Không tìm thấy nhân vật/tài khoản nào thuộc máy chủ{" "}
                          <strong className="text-[#f5c767]">
                            {personalServerId}
                          </strong>
                          .
                        </div>
                      ) : (
                        searchResults.map((p) => {
                          const chosen = selectedRecipients.some(
                            (r) => r.uid === p.uid
                          );
                          return (
                            <div
                              key={p.uid}
                              className="px-3 py-2 flex items-center justify-between gap-2 text-xs hover:bg-white/[0.03]"
                            >
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="font-semibold text-white truncate">
                                    {p.inGameName || p.username}
                                  </span>
                                  {p.characterLevel !== undefined && (
                                    <span className="px-1.5 py-0.2 rounded bg-[#3fe9d6]/15 text-[#3fe9d6] text-[10px] font-mono">
                                      Lv.{p.characterLevel}
                                    </span>
                                  )}
                                  {p.playerCode && (
                                    <span className="text-[11px] font-mono text-[#f5c767]">
                                      #{p.playerCode}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] font-mono text-slate-400">
                                  Tài khoản: {p.username}
                                  {p.hasCharacterInServer
                                    ? ` · Có nhân vật tại ${personalServerId}`
                                    : p.servers.length > 0
                                      ? ` · Server khác: ${p.servers.join(", ")}`
                                      : " · Chưa ghi nhận nhân vật"}
                                </div>
                              </div>
                              <button
                                type="button"
                                disabled={chosen}
                                onClick={() => handleAddRecipient(p)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border cursor-pointer shrink-0 ${
                                  chosen
                                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300 opacity-70"
                                    : "bg-[#3fe9d6]/15 hover:bg-[#3fe9d6]/25 border-[#3fe9d6]/40 text-[#3fe9d6]"
                                }`}
                              >
                                {chosen ? "Đã chọn" : "+ Chọn"}
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Global Mail: Multi-server or ALL */
              <div className="space-y-2">
                <label className="block text-[11px] font-mono text-slate-300">
                  Cụm Máy Chủ Áp Dụng (Thư Toàn Server)
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleGlobalServer("ALL")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono border cursor-pointer transition-all ${
                      isAllServers
                        ? "bg-[#3fe9d6]/20 border-[#3fe9d6] text-[#3fe9d6] font-bold"
                        : "bg-[#090d24] border-white/15 text-slate-400 hover:text-white"
                    }`}
                  >
                    Tất Cả Cụm Máy Chủ (ALL)
                  </button>
                  {referenceServers.map((srv) => {
                    const checked =
                      !isAllServers &&
                      globalTargetServers.includes(srv.ServerId);
                    return (
                      <button
                        key={srv.ServerId}
                        type="button"
                        onClick={() => handleToggleGlobalServer(srv.ServerId)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono border cursor-pointer transition-all ${
                          checked
                            ? "bg-[#f5c767]/20 border-[#f5c767] text-[#f5c767] font-bold"
                            : "bg-[#090d24] border-white/15 text-slate-400 hover:text-white"
                        }`}
                      >
                        {srv.Name} ({srv.ServerId})
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2. Content & Metadata */}
          <div className="p-5 rounded-2xl bg-[#060919] border border-white/10 space-y-4">
            <div className="text-xs font-mono uppercase text-[#3fe9d6] font-bold">
              2. Nội Dung Thư &amp; Phân Loại
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
              <div className="sm:col-span-4">
                <label className="block text-[11px] font-mono text-slate-300 mb-1">
                  Phân Loại Thư
                </label>
                <select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as SystemMailCategory)
                  }
                  className="w-full px-3 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs text-white focus:outline-none focus:border-[#3fe9d6]"
                >
                  {MAIL_CATEGORY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[11px] font-mono text-slate-300 mb-1">
                  Tên Người Gửi Hiển Thị
                </label>
                <input
                  type="text"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                  maxLength={80}
                  placeholder="VD: Hội Đồng Veyra, Đội Hỗ Trợ"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs text-white focus:outline-none focus:border-[#3fe9d6]"
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[11px] font-mono text-slate-300 mb-1">
                  Mã Phiếu Báo Lỗi (Tùy chọn)
                </label>
                <input
                  type="text"
                  value={referenceTicketId}
                  onChange={(e) => setReferenceTicketId(e.target.value)}
                  maxLength={64}
                  placeholder="VD: BUG-2026-112"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono text-[#f5c767] focus:outline-none focus:border-[#3fe9d6]"
                />
              </div>

              <div className="sm:col-span-8">
                <label className="block text-[11px] font-mono text-slate-300 mb-1">
                  Tiêu Đề Thư *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={150}
                  placeholder="VD: Quà Đền Bù Bảo Trì Máy Chủ S1"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs text-white focus:outline-none focus:border-[#3fe9d6]"
                  required
                />
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[11px] font-mono text-slate-300 mb-1">
                  Thời Hạn Hết Hiệu Lực Thư
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono text-slate-200 focus:outline-none focus:border-[#3fe9d6]"
                />
              </div>

              <div className="sm:col-span-12">
                <label className="block text-[11px] font-mono text-slate-300 mb-1">
                  Nội Dung Chi Tiết Thư *
                </label>
                <textarea
                  rows={5}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={4000}
                  placeholder="Nhập nội dung thông báo, giải trình xử lý lỗi hoặc lời cảm ơn gửi tới Chỉ Huy..."
                  className="w-full p-3.5 rounded-xl bg-[#090d24] border border-white/15 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-[#3fe9d6]"
                  required
                />
              </div>
            </div>
          </div>

          {/* 3. Optional Rewards Attachment */}
          <div className="p-5 rounded-2xl bg-[#060919] border border-[#f5c767]/30 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-mono uppercase text-[#f5c767] font-bold">
                3. Đính Kèm Quà Tặng / Bồi Hoàn (Tùy Chọn)
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Để bằng 0 và trống vật phẩm nếu chỉ gửi thư thông báo thuần
              </span>
            </div>

            {!canAttachRewardsForCurrentScope ? (
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/35 text-xs text-amber-200 font-mono">
                {mailType === "global"
                  ? 'Tài khoản của bạn chưa có quyền "Gửi Thư Toàn Server Kèm Quà Tặng". Bạn vẫn có thể gửi thư thông báo thuần (không đính kèm quà).'
                  : 'Tài khoản của bạn chưa có quyền "Gửi Thư Cá Nhân Kèm Quà / Đền Bù Lỗi". Bạn vẫn có thể gửi thư thông báo thuần (không đính kèm quà).'}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono text-[#f5c767] mb-1">
                      Vàng (Gold)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={1000000000}
                      value={gold}
                      onChange={(e) =>
                        setGold(Math.max(0, Number(e.target.value) || 0))
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono font-bold text-[#f5c767]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#3fe9d6] mb-1">
                      Ngọc / Pha Lê (Gems)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={10000000}
                      value={gems}
                      onChange={(e) =>
                        setGems(Math.max(0, Number(e.target.value) || 0))
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono font-bold text-[#3fe9d6]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-emerald-300 mb-1">
                      Thể Lực (Energy)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100000}
                      value={energy}
                      onChange={(e) =>
                        setEnergy(Math.max(0, Number(e.target.value) || 0))
                      }
                      className="w-full px-3.5 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono font-bold text-emerald-300"
                    />
                  </div>
                </div>

                {referenceItems.length > 0 && (
                  <div className="pt-3 border-t border-white/10 space-y-3">
                    <div className="text-[11px] font-mono uppercase text-slate-300 font-semibold">
                      Vật Phẩm Đính Kèm (Đồng Bộ Kho Vật Phẩm Game)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                      <div className="sm:col-span-4">
                        <input
                          type="text"
                          value={itemSearch}
                          onChange={(e) => setItemSearch(e.target.value)}
                          placeholder="Lọc nhanh vật phẩm..."
                          className="w-full px-3 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs text-slate-200"
                        />
                      </div>
                      <div className="sm:col-span-5">
                        <select
                          value={effectiveSelectedItemId}
                          onChange={(e) => setSelectedRefItemId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs text-white"
                        >
                          {filteredRefItems.length === 0 ? (
                            <option value="">Không có vật phẩm khớp</option>
                          ) : (
                            filteredRefItems.map((it) => {
                              const r = getItemRarityMeta(it.Rarity);
                              const t = getItemTypeMeta(it.Type);
                              return (
                                <option key={it.ItemId} value={it.ItemId}>
                                  [{r.tier}] {it.ItemName} ({t.shortLabel} ·{" "}
                                  {it.ItemId})
                                </option>
                              );
                            })
                          )}
                        </select>
                      </div>
                      <div className="sm:col-span-1">
                        <input
                          type="number"
                          min={1}
                          max={999999}
                          value={selectedItemQty}
                          onChange={(e) =>
                            setSelectedItemQty(
                              Math.max(1, Number(e.target.value) || 1)
                            )
                          }
                          className="w-full px-2 py-2 rounded-xl bg-[#090d24] border border-white/15 text-xs font-mono text-center text-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <button
                          type="button"
                          disabled={!effectiveSelectedItemId}
                          onClick={handleAddRewardItem}
                          className="w-full py-2 rounded-xl bg-[#3fe9d6]/15 hover:bg-[#3fe9d6]/25 border border-[#3fe9d6]/40 text-[#3fe9d6] text-xs font-mono font-bold cursor-pointer disabled:opacity-40"
                        >
                          + Thêm
                        </button>
                      </div>
                    </div>

                    {rewardItems.length > 0 && (
                      <div className="space-y-2">
                        {rewardItems.map((it) => {
                          const r = getItemRarityMeta(it.Rarity);
                          return (
                            <div
                              key={it.ItemId}
                              className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-[#090d24] border border-white/10 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${r.badgeClass}`}
                                >
                                  {r.tier}
                                </span>
                                <span className="font-semibold text-white truncate">
                                  {it.ItemName}
                                </span>
                                <span className="text-[11px] font-mono text-slate-400">
                                  ({it.ItemId})
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] font-mono text-slate-400">
                                  SL:
                                </span>
                                <input
                                  type="number"
                                  min={1}
                                  max={999999}
                                  value={it.Quantity}
                                  onChange={(e) =>
                                    handleUpdateRewardQty(
                                      it.ItemId,
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-20 px-2 py-1 rounded-lg bg-[#060919] border border-white/15 text-xs font-mono text-[#f5c767] text-center"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleRemoveRewardItem(it.ItemId)
                                  }
                                  className="px-2.5 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-300 text-[11px] font-mono cursor-pointer"
                                >
                                  Gỡ
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-xs font-mono cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={submitting || !canSendCurrentNotice}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-[#3fe9d6] hover:brightness-110 text-[#050814] font-bold text-xs font-mono uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
            >
              {submitting
                ? "Đang Gửi Thư..."
                : mailType === "global"
                  ? "Phát Thư Toàn Server"
                  : `Gửi Thư (${selectedRecipients.length} Người Nhận)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
