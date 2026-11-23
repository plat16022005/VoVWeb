"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  MAIL_CATEGORY_OPTIONS,
  MailReferenceItem,
  MailReferenceServer,
  SystemMailCategory,
  SystemMailDocument,
  SystemMailType,
  getMailCategoryMeta,
  isMailExpired,
  mailService,
} from "@/services/mail.service";
import { soundEngine } from "@/services/audio.service";
import ComposeMailModal from "./ComposeMailModal";

interface SystemMailManagerProps {
  canSendNotice: boolean;
  canSendPersonalReward: boolean;
  canSendGlobalReward: boolean;
  canDelete: boolean;
  onNotify: (message: string) => void;
}

function formatDateTime(iso?: string): string {
  if (!iso) return "Không giới hạn";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SystemMailManager({
  canSendNotice,
  canSendPersonalReward,
  canSendGlobalReward,
  canDelete,
  onNotify,
}: SystemMailManagerProps) {
  const [mails, setMails] = useState<SystemMailDocument[]>([]);
  const [referenceItems, setReferenceItems] = useState<MailReferenceItem[]>([]);
  const [referenceServers, setReferenceServers] = useState<
    MailReferenceServer[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [filterCategory, setFilterCategory] = useState<
    "ALL" | SystemMailCategory
  >("ALL");
  const [filterServer, setFilterServer] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<"ALL" | SystemMailType>("ALL");
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "ACTIVE" | "REVOKED" | "EXPIRED"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [previewMail, setPreviewMail] = useState<SystemMailDocument | null>(
    null
  );
  const [deletingMail, setDeletingMail] = useState<SystemMailDocument | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const canComposeAny =
    canSendNotice || canSendPersonalReward || canSendGlobalReward;

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [list, refs] = await Promise.all([
        mailService.getAllMails(),
        mailService.getReferences().catch(() => ({ items: [], servers: [] })),
      ]);
      setMails(list);
      setReferenceItems(refs.items);
      setReferenceServers(refs.servers);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Không thể tải danh sách thư hệ thống từ máy chủ."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      mailService.getAllMails(),
      mailService.getReferences().catch(() => ({ items: [], servers: [] })),
    ])
      .then(([list, refs]) => {
        if (!active) return;
        setMails(list);
        setReferenceItems(refs.items);
        setReferenceServers(refs.servers);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setErrorMsg(
          err instanceof Error
            ? err.message
            : "Không thể tải danh sách thư hệ thống từ máy chủ."
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    return {
      total: mails.length,
      globalCount: mails.filter((m) => m.Type === "global").length,
      personalCount: mails.filter((m) => m.Type === "personal").length,
      rewardMailCount: mails.filter((m) => m.HasRewards).length,
    };
  }, [mails]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: mails.length };
    for (const opt of MAIL_CATEGORY_OPTIONS) counts[opt.value] = 0;
    for (const m of mails) {
      counts[m.Category] = (counts[m.Category] || 0) + 1;
    }
    return counts;
  }, [mails]);

  const serverNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const srv of referenceServers) {
      map.set(srv.ServerId, `${srv.Name} (${srv.ServerId})`);
    }
    return map;
  }, [referenceServers]);

  const getServerLabel = useCallback(
    (serverId: string) => serverNameMap.get(serverId) || serverId,
    [serverNameMap]
  );

  const filteredMails = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return mails.filter((m) => {
      if (filterCategory !== "ALL" && m.Category !== filterCategory) {
        return false;
      }
      if (filterServer !== "ALL" && m.ServerId !== filterServer) {
        return false;
      }
      if (filterType !== "ALL" && m.Type !== filterType) return false;
      const expired = isMailExpired(m);
      if (filterStatus === "ACTIVE" && (m.Status !== "SENT" || expired)) {
        return false;
      }
      if (filterStatus === "REVOKED" && m.Status !== "REVOKED") return false;
      if (filterStatus === "EXPIRED" && !expired) return false;
      if (q) {
        const matchTitle = m.Title.toLowerCase().includes(q);
        const matchContent = m.Content.toLowerCase().includes(q);
        const matchReceiver =
          m.ReceiverName.toLowerCase().includes(q) ||
          m.ReceiverPlayerCode.toLowerCase().includes(q) ||
          m.ReceiverId.toLowerCase().includes(q);
        const matchServer = m.ServerId.toLowerCase().includes(q);
        const matchTicket = m.ReferenceTicketId.toLowerCase().includes(q);
        const matchId = m.MailId.toLowerCase().includes(q);
        return (
          matchTitle ||
          matchContent ||
          matchReceiver ||
          matchServer ||
          matchTicket ||
          matchId
        );
      }
      return true;
    });
  }, [
    mails,
    filterCategory,
    filterServer,
    filterType,
    filterStatus,
    searchQuery,
  ]);

  const handleToggleRevoke = async (mail: SystemMailDocument) => {
    if (!canDelete) return;
    soundEngine.playClick();
    const nextStatus = mail.Status === "REVOKED" ? "SENT" : "REVOKED";
    try {
      const updated = await mailService.updateMailStatus(
        mail.ServerId,
        mail.MailId,
        nextStatus,
        mail.Type === "personal" ? mail.ReceiverId : undefined
      );
      setMails((prev) =>
        prev.map((m) =>
          m.ServerId === updated.ServerId && m.MailId === updated.MailId
            ? updated
            : m
        )
      );
      if (
        previewMail?.ServerId === updated.ServerId &&
        previewMail?.MailId === updated.MailId
      ) {
        setPreviewMail(updated);
      }
      onNotify(
        updated.Status === "REVOKED"
          ? `Đã thu hồi thư "${updated.Title}" trên ${updated.ServerId}.`
          : `Đã khôi phục hiển thị thư "${updated.Title}" trên ${updated.ServerId}.`
      );
    } catch (err: unknown) {
      onNotify(
        err instanceof Error
          ? err.message
          : "Không thể cập nhật trạng thái thư."
      );
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingMail || !canDelete) return;
    soundEngine.playClick();
    setIsDeleting(true);
    try {
      await mailService.deleteMail(
        deletingMail.ServerId,
        deletingMail.MailId,
        deletingMail.Type === "personal" ? deletingMail.ReceiverId : undefined
      );
      setMails((prev) =>
        prev.filter(
          (m) =>
            !(
              m.ServerId === deletingMail.ServerId &&
              m.MailId === deletingMail.MailId
            )
        )
      );
      if (
        previewMail?.ServerId === deletingMail.ServerId &&
        previewMail?.MailId === deletingMail.MailId
      ) {
        setPreviewMail(null);
      }
      soundEngine.playCelestialChime();
      onNotify(
        `Đã xóa vĩnh viễn thư "${deletingMail.Title}" trên ${deletingMail.ServerId}.`
      );
      setDeletingMail(null);
    } catch (err: unknown) {
      onNotify(err instanceof Error ? err.message : "Không thể xóa thư.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 sm:p-7 rounded-2xl bg-[#090d24]/95 border border-emerald-400/30 flex flex-col lg:flex-row lg:items-center justify-between gap-5 shadow-xl">
        <div className="space-y-1.5">
          <div className="text-xs font-mono text-emerald-300 uppercase tracking-wider">
            Trung Tâm Hòm Thư Hệ Thống &amp; Đền Bù (Mailbox)
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-[family-name:var(--font-rajdhani)] text-white uppercase tracking-wide">
            SOẠN &amp; PHÁT THƯ TOÀN SERVER / CÁ NHÂN TRONG GAME
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Gửi thông báo vận hành, phát quà tri ân toàn máy chủ hoặc đền bù xử lý báo lỗi đích danh từng tài khoản người chơi kèm Vàng, Ngọc, Thể Lực và vật phẩm.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              void loadData();
            }}
            disabled={loading}
            className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 text-xs font-mono cursor-pointer disabled:opacity-50"
          >
            {loading ? "Đang tải..." : "Làm Mới"}
          </button>

          {canComposeAny && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setIsComposeOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-[#3fe9d6] text-[#050814] font-bold text-xs font-mono hover:brightness-110 transition-all cursor-pointer"
            >
              + Soạn Thư Mới
            </button>
          )}
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-[#090d24]/90 border border-white/10">
          <div className="text-xs font-mono text-slate-400">Tổng Thư Đã Phát</div>
          <div className="text-2xl font-bold text-white font-[family-name:var(--font-rajdhani)] mt-1">
            {stats.total} Thư
          </div>
          <div className="text-[11px] font-mono text-[#3fe9d6] mt-1">
            Tách biệt theo từng cụm server
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#090d24]/90 border border-[#3fe9d6]/25">
          <div className="text-xs font-mono text-slate-400">Thư Toàn Server</div>
          <div className="text-2xl font-bold text-[#3fe9d6] font-[family-name:var(--font-rajdhani)] mt-1">
            {stats.globalCount} Thư
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            Thông báo &amp; quà diện rộng
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#090d24]/90 border border-emerald-500/25">
          <div className="text-xs font-mono text-slate-400">Thư Cá Nhân / CSKH</div>
          <div className="text-2xl font-bold text-emerald-400 font-[family-name:var(--font-rajdhani)] mt-1">
            {stats.personalCount} Thư
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            Xử lý báo lỗi &amp; hỗ trợ riêng
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-[#090d24]/90 border border-[#f5c767]/30">
          <div className="text-xs font-mono text-slate-400">Thư Kèm Quà Tặng</div>
          <div className="text-2xl font-bold text-[#f5c767] font-[family-name:var(--font-rajdhani)] mt-1">
            {stats.rewardMailCount} Thư
          </div>
          <div className="text-[11px] font-mono text-slate-400 mt-1">
            Có đính kèm tiền tệ / vật phẩm
          </div>
        </div>
      </div>

      {/* Category Filter Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <button
          type="button"
          onClick={() => {
            soundEngine.playClick();
            setFilterCategory("ALL");
          }}
          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
            filterCategory === "ALL"
              ? "bg-emerald-500/15 border-emerald-400 text-white"
              : "bg-[#090d24]/90 border-white/10 text-slate-400 hover:text-white"
          }`}
        >
          <div className="text-[10px] font-mono uppercase">Tất Cả Phân Loại</div>
          <div className="text-lg font-bold font-mono mt-0.5 text-white">
            {categoryCounts.ALL || 0}
          </div>
        </button>

        {MAIL_CATEGORY_OPTIONS.map((cat) => {
          const active = filterCategory === cat.value;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setFilterCategory(cat.value);
              }}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                active
                  ? `${cat.badgeClass} ring-1 ring-current`
                  : `bg-[#090d24]/90 ${cat.borderClass} text-slate-300 hover:bg-white/5`
              }`}
            >
              <div className="text-[10px] font-mono uppercase truncate">
                {cat.shortLabel}
              </div>
              <div className="text-lg font-bold font-mono mt-0.5">
                {categoryCounts[cat.value] || 0}
              </div>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#090d24]/90 border border-white/10 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={filterServer}
            onChange={(e) => setFilterServer(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#060814] border border-white/10 text-xs font-mono text-[#f5c767] focus:outline-none focus:border-emerald-400"
          >
            <option value="ALL">Mọi cụm máy chủ</option>
            {referenceServers.map((srv) => (
              <option key={srv.ServerId} value={srv.ServerId}>
                {srv.Name} ({srv.ServerId})
              </option>
            ))}
          </select>

          <select
            value={filterType}
            onChange={(e) =>
              setFilterType(e.target.value as "ALL" | SystemMailType)
            }
            className="px-3 py-2 rounded-xl bg-[#060814] border border-white/10 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-400"
          >
            <option value="ALL">Mọi phạm vi gửi</option>
            <option value="global">Thư toàn server</option>
            <option value="personal">Thư cá nhân (theo server)</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(
                e.target.value as "ALL" | "ACTIVE" | "REVOKED" | "EXPIRED"
              )
            }
            className="px-3 py-2 rounded-xl bg-[#060814] border border-white/10 text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-400"
          >
            <option value="ALL">Mọi trạng thái</option>
            <option value="ACTIVE">Đang hiệu lực</option>
            <option value="REVOKED">Đã thu hồi</option>
            <option value="EXPIRED">Đã hết hạn</option>
          </select>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Tìm theo tiêu đề, tên người nhận, PlayerCode, mã phiếu lỗi..."
          className="w-full lg:w-80 px-3.5 py-2 rounded-xl bg-[#060814] border border-white/10 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-400"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-14 rounded-2xl bg-[#090d24]/90 border border-white/10 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-400">
            Đang tải lịch sử thư hệ thống...
          </span>
        </div>
      ) : errorMsg ? (
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs font-mono">
          {errorMsg}
        </div>
      ) : filteredMails.length === 0 ? (
        <div className="p-14 rounded-2xl bg-[#090d24]/80 border border-dashed border-white/15 text-center space-y-4">
          <h4 className="text-base font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase">
            {mails.length === 0
              ? "Chưa Có Thư Hệ Thống Nào Được Gửi"
              : "Không Tìm Thấy Thư Khớp Bộ Lọc"}
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {mails.length === 0
              ? "Bắt đầu soạn thư đầu tiên để gửi thông báo toàn server, phát quà tri ân hoặc đền bù xử lý báo lỗi cho người chơi."
              : "Thử điều chỉnh bộ lọc phân loại, phạm vi hoặc từ khóa tìm kiếm."}
          </p>
          {mails.length === 0 && canComposeAny && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                setIsComposeOpen(true);
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-[#3fe9d6] text-[#050814] font-bold text-xs font-mono cursor-pointer"
            >
              + Soạn Thư Đầu Tiên
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl bg-[#090d24]/95 border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-[#060814] text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Tiêu Đề &amp; Phân Loại</th>
                  <th className="py-3.5 px-4">Đối Tượng &amp; Máy Chủ</th>
                  <th className="py-3.5 px-4">Quà Đính Kèm</th>
                  <th className="py-3.5 px-4">Trạng Thái &amp; Thời Hạn</th>
                  <th className="py-3.5 px-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredMails.map((mail) => {
                  const catMeta = getMailCategoryMeta(mail.Category);
                  const expired = isMailExpired(mail);
                  const isRevoked = mail.Status === "REVOKED";
                  return (
                    <tr
                      key={`${mail.ServerId}:${mail.MailId}`}
                      className="hover:bg-white/[0.025] transition-colors"
                    >
                      <td className="py-3.5 px-4 max-w-sm">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${catMeta.badgeClass}`}
                          >
                            {catMeta.shortLabel}
                          </span>
                          {mail.ReferenceTicketId && (
                            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-[#f5c767]">
                              #{mail.ReferenceTicketId}
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-white text-sm">
                          {mail.Title}
                        </div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {mail.Content}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500 mt-1">
                          Người gửi: {mail.SenderName} ·{" "}
                          {formatDateTime(mail.CreatedAt)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {mail.Type === "global" ? (
                          <div className="space-y-1">
                            <span className="px-2 py-0.5 rounded bg-[#3fe9d6]/15 border border-[#3fe9d6]/35 text-[#3fe9d6] text-[10px] font-mono font-bold">
                              TOÀN SERVER
                            </span>
                            <div className="text-[11px] font-mono text-slate-200">
                              {getServerLabel(mail.ServerId)}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="px-2 py-0.5 rounded bg-[#f5c767]/15 border border-[#f5c767]/35 text-[#f5c767] text-[10px] font-mono font-bold">
                              CÁ NHÂN
                            </span>
                            <div className="text-xs font-semibold text-white">
                              {mail.ReceiverName || "Người chơi"}
                              {mail.ReceiverPlayerCode && (
                                <span className="ml-1.5 text-[10px] font-mono text-[#f5c767]">
                                  #{mail.ReceiverPlayerCode}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] font-mono text-emerald-300">
                              {getServerLabel(mail.ServerId)}
                            </div>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        {!mail.HasRewards ? (
                          <span className="text-[11px] font-mono text-slate-500">
                            Thông báo thuần
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                            {mail.Rewards.Gold > 0 && (
                              <span className="px-2 py-0.5 rounded bg-[#f5c767]/15 text-[#f5c767] border border-[#f5c767]/30">
                                {mail.Rewards.Gold.toLocaleString("vi-VN")} Vàng
                              </span>
                            )}
                            {mail.Rewards.Gems > 0 && (
                              <span className="px-2 py-0.5 rounded bg-[#3fe9d6]/15 text-[#3fe9d6] border border-[#3fe9d6]/30">
                                {mail.Rewards.Gems.toLocaleString("vi-VN")} Ngọc
                              </span>
                            )}
                            {mail.Rewards.Energy > 0 && (
                              <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                +{mail.Rewards.Energy.toLocaleString("vi-VN")}{" "}
                                Thể Lực
                              </span>
                            )}
                            {mail.Rewards.Items.map((it) => (
                              <span
                                key={it.ItemId}
                                className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-200 border border-purple-500/30"
                              >
                                {it.ItemName} ×{it.Quantity}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {isRevoked ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/35">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              ĐÃ THU HỒI
                            </span>
                          ) : expired ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-500/15 text-slate-300 border border-slate-500/35">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              HẾT HẠN
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/35">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              ĐÃ PHÁT
                            </span>
                          )}
                          {mail.Type === "personal" && (
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-mono border ${
                                mail.IsClaimed
                                  ? "bg-[#3fe9d6]/15 text-[#3fe9d6] border-[#3fe9d6]/35"
                                  : mail.IsRead
                                    ? "bg-sky-500/15 text-sky-300 border-sky-500/35"
                                    : "bg-white/5 text-slate-400 border-white/10"
                              }`}
                            >
                              {mail.IsClaimed
                                ? "Đã nhận quà"
                                : mail.IsRead
                                  ? "Đã đọc"
                                  : "Chưa đọc"}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">
                          HSD: {formatDateTime(mail.ExpiresAt)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              soundEngine.playClick();
                              setPreviewMail(mail);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 text-xs font-mono cursor-pointer"
                          >
                            Xem
                          </button>

                          {canDelete && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleToggleRevoke(mail)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold border cursor-pointer ${
                                  isRevoked
                                    ? "bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/35 text-emerald-300"
                                    : "bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/35 text-amber-300"
                                }`}
                              >
                                {isRevoked ? "Mở Lại" : "Thu Hồi"}
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  soundEngine.playClick();
                                  setDeletingMail(mail);
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/35 text-rose-300 text-xs font-mono font-semibold cursor-pointer"
                              >
                                Xóa
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-white/10 bg-[#060814]/60 flex items-center justify-between text-xs font-mono text-slate-400">
            <span>
              Hiển thị{" "}
              <strong className="text-emerald-300">
                {filteredMails.length}
              </strong>{" "}
              / {mails.length} thư hệ thống
            </span>
            <span>Dữ liệu hòm thư được tách biệt độc lập trên từng cụm máy chủ</span>
          </div>
        </div>
      )}

      {/* Compose Mail Modal */}
      <ComposeMailModal
        isOpen={isComposeOpen}
        initialServerId={filterServer !== "ALL" ? filterServer : undefined}
        canSendNotice={canSendNotice}
        canSendPersonalReward={canSendPersonalReward}
        canSendGlobalReward={canSendGlobalReward}
        referenceItems={referenceItems}
        referenceServers={referenceServers}
        onClose={() => setIsComposeOpen(false)}
        onSent={(sentMails, message) => {
          setMails((prev) => [...sentMails, ...prev]);
          onNotify(message);
        }}
      />

      {/* Mail Preview Modal */}
      {previewMail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-3xl bg-[#090d24] border border-emerald-400/35 overflow-hidden text-slate-100 shadow-2xl">
            <div className="px-6 py-4 border-b border-white/10 bg-[#0d1435] flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono text-emerald-300 uppercase">
                  Chi Tiết Thư Hệ Thống · {getServerLabel(previewMail.ServerId)} ·{" "}
                  {previewMail.MailId}
                </div>
                <h3 className="text-lg font-bold text-white font-[family-name:var(--font-rajdhani)]">
                  {previewMail.Title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewMail(null)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-300 cursor-pointer"
              >
                Đóng
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#060919] border border-white/10 font-mono">
                <div>
                  <span className="text-slate-400">Người gửi: </span>
                  <strong className="text-white">
                    {previewMail.SenderName}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400">Phạm vi &amp; Server: </span>
                  <strong className="text-[#3fe9d6]">
                    {previewMail.Type === "global"
                      ? `Toàn server (${getServerLabel(previewMail.ServerId)})`
                      : `${previewMail.ReceiverName}${previewMail.ReceiverPlayerCode ? ` (#${previewMail.ReceiverPlayerCode})` : ""} · ${getServerLabel(previewMail.ServerId)}`}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400">Thời gian gửi: </span>
                  <span className="text-slate-200">
                    {formatDateTime(previewMail.CreatedAt)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Hết hạn: </span>
                  <span className="text-slate-200">
                    {formatDateTime(previewMail.ExpiresAt)}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#060919] border border-white/10 whitespace-pre-wrap text-slate-200 leading-relaxed text-sm">
                {previewMail.Content}
              </div>

              {previewMail.HasRewards && (
                <div className="p-4 rounded-xl bg-[#060919] border border-[#f5c767]/30 space-y-2">
                  <div className="text-[11px] font-mono uppercase text-[#f5c767] font-bold">
                    Quà Tặng Đính Kèm
                  </div>
                  <div className="flex flex-wrap gap-2 font-mono">
                    {previewMail.Rewards.Gold > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-[#f5c767]/15 text-[#f5c767] border border-[#f5c767]/30">
                        {previewMail.Rewards.Gold.toLocaleString("vi-VN")} Vàng
                      </span>
                    )}
                    {previewMail.Rewards.Gems > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-[#3fe9d6]/15 text-[#3fe9d6] border border-[#3fe9d6]/30">
                        {previewMail.Rewards.Gems.toLocaleString("vi-VN")} Ngọc
                      </span>
                    )}
                    {previewMail.Rewards.Energy > 0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        +{previewMail.Rewards.Energy.toLocaleString("vi-VN")} Thể
                        Lực
                      </span>
                    )}
                    {previewMail.Rewards.Items.map((it) => (
                      <span
                        key={it.ItemId}
                        className="px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-200 border border-purple-500/30"
                      >
                        {it.ItemName} ×{it.Quantity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingMail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-[#090d24] border border-rose-500/40 p-6 space-y-4 text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-white font-[family-name:var(--font-rajdhani)] uppercase">
              Xác Nhận Xóa Thư Hệ Thống
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Bạn có chắc chắn muốn xóa vĩnh viễn thư{" "}
              <strong className="text-white">{deletingMail.Title}</strong> (
              <code className="text-[#3fe9d6]">{deletingMail.MailId}</code>)
              trên cụm máy chủ{" "}
              <strong className="text-[#f5c767]">
                {getServerLabel(deletingMail.ServerId)}
              </strong>
              ? Thao tác này không thể hoàn tác.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingMail(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-mono font-bold cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? "Đang xóa..." : "Xác Nhận Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
