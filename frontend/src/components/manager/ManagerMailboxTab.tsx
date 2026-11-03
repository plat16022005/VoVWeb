"use client";

import { useState } from "react";
import { ManagerServerMail, MOCK_SERVER_MAILS } from "@/data/mockManagerData";
import { soundEngine } from "@/services/audio.service";
import { formatNumber } from "@/utils/format";

interface ManagerMailboxTabProps {
  onOpenSendMail: () => void;
}

export default function ManagerMailboxTab({
  onOpenSendMail,
}: ManagerMailboxTabProps) {
  const [mails, setMails] = useState<ManagerServerMail[]>(MOCK_SERVER_MAILS);
  const [searchTerm, setSearchTerm] = useState("");
  const [targetFilter, setTargetFilter] = useState<string>("ALL");
  const [selectedMail, setSelectedMail] = useState<ManagerServerMail | null>(null);

  const handleRevokeMail = (id: string) => {
    soundEngine.playClick();
    if (confirm("Bạn có chắc chắn muốn thu hồi đợt phát thư này khỏi hộp thư của người chơi?")) {
      setMails((prev) =>
        prev.map((m) => (m.id === id ? { ...m, status: "REVOKED" } : m))
      );
    }
  };

  const filteredMails = mails.filter((m) => {
    const matchSearch =
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.targetPlayerName && m.targetPlayerName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchTarget =
      targetFilter === "ALL" ||
      (targetFilter === "ALL_SERVERS" && m.targetType === "ALL_SERVERS") ||
      (targetFilter === "SPECIFIC_SERVER" && m.targetType === "SPECIFIC_SERVER") ||
      (targetFilter === "SINGLE_PLAYER" && m.targetType === "SINGLE_PLAYER");
    return matchSearch && matchTarget;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#090d24]/90 border border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <div className="relative flex-1 min-w-[240px]">
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tiêu đề thư, nội dung hoặc tên người nhận..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#070919] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-400 transition-colors"
          />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={targetFilter}
            onChange={(e) => {
              soundEngine.playClick();
              setTargetFilter(e.target.value);
            }}
            className="px-3 py-2.5 rounded-xl bg-[#070919] border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-purple-400"
          >
            <option value="ALL">Mọi phạm vi gửi</option>
            <option value="ALL_SERVERS">Toàn bộ cụm máy chủ</option>
            <option value="SPECIFIC_SERVER">Máy chủ cụ thể (S1, S2...)</option>
            <option value="SINGLE_PLAYER">Chỉ định cá nhân người chơi</option>
          </select>

          <button
            onClick={() => {
              soundEngine.playClick();
              onOpenSendMail();
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:brightness-110 shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Soạn Thư Server Mới</span>
          </button>
        </div>
      </div>

      {/* Mail List Table */}
      <div className="rounded-2xl bg-[#090d24]/90 border border-white/10 overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-[#070919]/70 text-[11px] font-mono uppercase text-slate-400">
                <th className="py-3.5 px-4">Tiêu Đề Thư</th>
                <th className="py-3.5 px-4">Đối Tượng Nhận</th>
                <th className="py-3.5 px-4">Vật Phẩm Đính Kèm</th>
                <th className="py-3.5 px-4">Lượt Đã Nhận</th>
                <th className="py-3.5 px-4">Thời Gian Gửi</th>
                <th className="py-3.5 px-4">Hạn Thư</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredMails.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Không tìm thấy đợt phát thư nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredMails.map((mail) => (
                  <tr
                    key={mail.id}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    {/* Title & Preview */}
                    <td className="py-3.5 px-4 max-w-[240px]">
                      <div className="font-semibold text-white truncate">
                        {mail.title}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        {mail.content}
                      </div>
                      <div className="text-[10px] text-purple-300 font-mono mt-0.5">
                        Gửi bởi: {mail.sender}
                      </div>
                    </td>

                    {/* Target */}
                    <td className="py-3.5 px-4">
                      {mail.targetType === "ALL_SERVERS" ? (
                        <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          TOÀN BỘ CỤM
                        </span>
                      ) : mail.targetType === "SPECIFIC_SERVER" ? (
                        <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {mail.targetServer}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          {mail.targetPlayerName || mail.targetPlayerUid}
                        </span>
                      )}
                    </td>

                    {/* Attachments */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1.5 max-w-[240px]">
                        {mail.rewards.map((r, i) => (
                          <span
                            key={i}
                            title={`${r.name} x${r.amount}`}
                            className={`px-2 py-0.5 rounded font-mono text-[11px] border ${
                              r.rarity === "LEGENDARY"
                                ? "bg-[#f5c767]/15 border-[#f5c767]/30 text-[#f5c767]"
                                : r.rarity === "EPIC"
                                ? "bg-purple-500/15 border-purple-500/30 text-purple-300"
                                : "bg-white/5 border-white/10 text-slate-300"
                            }`}
                          >
                            {r.icon} x{r.amount}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Received count */}
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {formatNumber(mail.receivedCount)} Chỉ Huy
                    </td>

                    {/* Sent Date */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {mail.sentAt}
                    </td>

                    {/* Expire Date */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {mail.expiresAt}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      {mail.status === "DELIVERED" ? (
                        <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          ĐÃ PHÁT
                        </span>
                      ) : mail.status === "SCHEDULED" ? (
                        <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          LÊN LỊCH
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full font-mono text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/40">
                          ĐÃ THU HỒI
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            soundEngine.playClick();
                            setSelectedMail(mail);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10 text-[11px]"
                        >
                          Chi tiết
                        </button>
                        {mail.status === "DELIVERED" && (
                          <button
                            onClick={() => handleRevokeMail(mail.id)}
                            title="Thu hồi thư"
                            className="p-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mail Detail Modal Preview */}
      {selectedMail && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#090d24] border border-[#f5c767]/30 rounded-2xl w-full max-w-lg p-6 shadow-[0_10px_40px_rgba(0,0,0,0.8)] relative">
            <button
              onClick={() => setSelectedMail(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>
            <div className="text-xs font-mono text-[#f5c767] uppercase mb-1">
              Chi Tiết Thư Hệ Thống #{selectedMail.id}
            </div>
            <h3 className="text-lg font-bold text-white mb-2">
              {selectedMail.title}
            </h3>
            <div className="text-xs font-mono text-slate-400 mb-4 pb-3 border-b border-white/10 flex justify-between">
              <span>Người gửi: {selectedMail.sender}</span>
              <span>Gửi lúc: {selectedMail.sentAt}</span>
            </div>

            <div className="text-xs text-slate-300 leading-relaxed mb-4 bg-[#060814] p-3.5 rounded-xl border border-white/5">
              {selectedMail.content}
            </div>

            <div className="mb-4">
              <div className="text-xs font-semibold text-white mb-2">
                Phần Thưởng Đính Kèm ({selectedMail.rewards.length} món):
              </div>
              <div className="space-y-2">
                {selectedMail.rewards.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#0c1026] border border-white/5 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{r.icon}</span>
                      <span className="text-white font-medium">{r.name}</span>
                    </div>
                    <span className="font-mono font-bold text-[#f5c767]">
                      x{formatNumber(r.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setSelectedMail(null)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors"
            >
              Đóng Cửa Sổ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

