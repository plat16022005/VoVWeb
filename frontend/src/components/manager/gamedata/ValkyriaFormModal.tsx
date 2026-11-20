"use client";

import { useState, useEffect, useRef } from "react";
import { Character, CharacterSkill } from "@/data/characters";
import {
  ROLE_OPTIONS,
  RARITY_OPTIONS,
  DEFAULT_HERO_IMAGE,
} from "@/services/character.service";
import { uploadMediaToR2 } from "@/services/r2Upload.service";
import { soundEngine } from "@/services/audio.service";

interface ValkyriaFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (character: Character) => Promise<void>;
  initialData?: Character | null;
  canEdit?: boolean;
  canEditSkills?: boolean;
}

type FormTab = "basic" | "stats" | "skills" | "lore";

export default function ValkyriaFormModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  canEdit = true,
  canEditSkills = true,
}: ValkyriaFormModalProps) {
  const isEditing = Boolean(initialData);
  const [activeTab, setActiveTab] = useState<FormTab>("basic");
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cloudflare R2 Upload states
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Form states
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [role, setRole] = useState("Archer");
  const [rarityLabel, setRarityLabel] = useState("R");
  const [rarity, setRarity] = useState<number>(3);
  const [cv, setCv] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [birthday, setBirthday] = useState("");
  const [image, setImage] = useState(DEFAULT_HERO_IMAGE);
  const [quote, setQuote] = useState("");
  const [lore, setLore] = useState("");
  const [status, setStatus] = useState<"Active" | "Testing" | "Hidden">("Active");
  const [releaseVersion, setReleaseVersion] = useState("v1.0");

  // Combat Stats (Matching Firestore HeroConfigs)
  const [baseHp, setBaseHp] = useState<number>(900);
  const [baseAtk, setBaseAtk] = useState<number>(120);
  const [baseDef, setBaseDef] = useState<number>(50);
  const [baseSpd, setBaseSpd] = useState<number>(100);
  const [critRate, setCritRate] = useState<number>(5);
  const [critDmg, setCritDmg] = useState<number>(150);
  const [baseDodgeRate, setBaseDodgeRate] = useState<number>(5);
  const [baseParryRate, setBaseParryRate] = useState<number>(5);
  const [maxRage, setMaxRage] = useState<number>(100);

  // Stat Growth per Level
  const [hpGrowthPerLevel, setHpGrowthPerLevel] = useState<number>(90);
  const [atkGrowthPerLevel, setAtkGrowthPerLevel] = useState<number>(12);
  const [defGrowthPerLevel, setDefGrowthPerLevel] = useState<number>(5);

  // Skills
  const [skills, setSkills] = useState<CharacterSkill[]>([
    { name: "", type: "Đòn Đánh Thường", desc: "" },
    { name: "", type: "Chiến Kỹ", desc: "" },
    { name: "", type: "Tuyệt Kỹ", desc: "" },
    { name: "", type: "Thiên Phú", desc: "" },
  ]);

  useEffect(() => {
    if (initialData) {
      setId(initialData.id);
      setName(initialData.name);
      setTitle(initialData.title);
      setRole(initialData.role || "Archer");
      setRarityLabel(initialData.rarityLabel || (initialData.rarity === 5 ? "SSR" : initialData.rarity === 4 ? "SR" : "R"));
      setRarity(initialData.rarity || 3);
      setCv(initialData.cv || "");
      setHeight(initialData.height || "");
      setWeight(initialData.weight || "");
      setBirthday(initialData.birthday || "");
      setImage(initialData.image || DEFAULT_HERO_IMAGE);
      setQuote(initialData.quote || "");
      setLore(initialData.lore || "");
      setStatus(initialData.status || "Active");
      setReleaseVersion(initialData.releaseVersion || "v1.0");

      setBaseHp(initialData.baseHp ?? 900);
      setBaseAtk(initialData.baseAtk ?? 120);
      setBaseDef(initialData.baseDef ?? 50);
      setBaseSpd(initialData.baseSpd ?? 100);
      setCritRate(initialData.critRate ?? 5);
      setCritDmg(initialData.critDmg ?? 150);
      setBaseDodgeRate(initialData.baseDodgeRate ?? 5);
      setBaseParryRate(initialData.baseParryRate ?? 5);
      setMaxRage(initialData.maxRage ?? 100);

      setHpGrowthPerLevel(initialData.hpGrowthPerLevel ?? 90);
      setAtkGrowthPerLevel(initialData.atkGrowthPerLevel ?? 12);
      setDefGrowthPerLevel(initialData.defGrowthPerLevel ?? 5);

      if (initialData.skills && initialData.skills.length > 0) {
        setSkills(initialData.skills);
      } else {
        setSkills([
          { name: "", type: "Đòn Đánh Thường", desc: "" },
          { name: "", type: "Chiến Kỹ", desc: "" },
          { name: "", type: "Tuyệt Kỹ", desc: "" },
          { name: "", type: "Thiên Phú", desc: "" },
        ]);
      }
    } else {
      // Default for new character
      setId("");
      setName("");
      setTitle("");
      setRole("Archer");
      setRarityLabel("R");
      setRarity(3);
      setCv("");
      setHeight("");
      setWeight("");
      setBirthday("");
      setImage(DEFAULT_HERO_IMAGE);
      setQuote("");
      setLore("");
      setStatus("Active");
      setReleaseVersion("v1.0");

      setBaseHp(900);
      setBaseAtk(120);
      setBaseDef(50);
      setBaseSpd(100);
      setCritRate(5);
      setCritDmg(150);
      setBaseDodgeRate(5);
      setBaseParryRate(5);
      setMaxRage(100);

      setHpGrowthPerLevel(90);
      setAtkGrowthPerLevel(12);
      setDefGrowthPerLevel(5);

      setSkills([
        { name: "Đòn Đánh Cơ Bản", type: "Đòn Đánh Thường", desc: "Gây sát thương tương đương 100% Tấn Công lên 1 mục tiêu." },
        { name: "Chiến Kỹ Bí Truyền", type: "Chiến Kỹ", desc: "Tăng cường năng lực hoặc gây sát thương diện rộng lên các kẻ địch." },
        { name: "Tuyệt Kỹ Veyra", type: "Tuyệt Kỹ", desc: "Khai mở toàn bộ sức mạnh Valkyria, bộc phát sát thương cực đại." },
        { name: "Thiên Phú Thần Hộ", type: "Thiên Phú", desc: "Kỹ năng bị động kích hoạt hiệu ứng bổ trợ khi bắt đầu trận chiến." },
      ]);
    }
    setActiveTab("basic");
    setErrorMsg(null);
  }, [initialData, isOpen]);

  // Handle Skill Change
  const handleSkillChange = (index: number, field: keyof CharacterSkill, val: string) => {
    setSkills((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  // Handle Uploading Image to Cloudflare R2
  const handleUploadFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMsg("Chỉ hỗ trợ file hình ảnh (PNG, JPG, WebP, GIF, SVG).");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMsg("Dung lượng file vượt quá giới hạn 20MB.");
      return;
    }

    try {
      setUploadingImage(true);
      setUploadProgress(0);
      setUploadSuccess(false);
      setErrorMsg(null);

      const result = await uploadMediaToR2(
        file,
        (percent) => setUploadProgress(percent),
        "characters"
      );

      setImage(result.publicUrl);
      setUploadSuccess(true);
      soundEngine.playCelestialChime();
      setTimeout(() => setUploadSuccess(false), 5000);
    } catch (err: any) {
      console.error("Lỗi tải ảnh lên Cloudflare R2:", err);
      setErrorMsg(err.message || "Không thể tải ảnh lên Cloudflare R2. Vui lòng kiểm tra cấu hình.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUploadFile(file);
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg("Vui lòng nhập tên Valkyria.");
      setActiveTab("basic");
      return;
    }

    if (!isEditing && !id.trim()) {
      setErrorMsg("Vui lòng nhập mã định danh ID (ví dụ: freya, valkyrie_01).");
      setActiveTab("basic");
      return;
    }

    const finalImage = image.trim() || DEFAULT_HERO_IMAGE;

    setSaving(true);
    try {
      const finalCharacter: Character = {
        id: isEditing ? initialData!.id : id.toLowerCase().trim().replace(/\s+/g, "_"),
        name: name.trim(),
        title: title.trim(),
        role,
        rarity,
        rarityLabel,
        element: "",
        elementColor: "",
        path: role,
        cv: cv.trim() || "Chưa cập nhật",
        height: height.trim(),
        weight: weight.trim(),
        birthday: birthday.trim(),
        image: finalImage,
        quote: quote.trim() || "Vì hòa bình đại lục Veyra!",
        lore: lore.trim() || "Nữ chiến binh dũng cảm của đại lục Veyra.",
        skills: skills.filter((s) => s.name.trim() !== ""),

        // Combat Stats (Firestore HeroConfigs)
        baseHp: Number(baseHp) || 900,
        baseAtk: Number(baseAtk) || 120,
        baseDef: Number(baseDef) || 50,
        baseSpd: Number(baseSpd) || 100,
        critRate: Number(critRate) || 5,
        critDmg: Number(critDmg) || 150,
        baseDodgeRate: Number(baseDodgeRate) || 5,
        baseParryRate: Number(baseParryRate) || 5,
        maxRage: Number(maxRage) || 100,

        // Stat Growth per Level
        hpGrowthPerLevel: Number(hpGrowthPerLevel) || 90,
        atkGrowthPerLevel: Number(atkGrowthPerLevel) || 12,
        defGrowthPerLevel: Number(defGrowthPerLevel) || 5,

        status,
        releaseVersion: releaseVersion.trim() || "v1.0",
      };

      await onSave(finalCharacter);
      soundEngine.playSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Lỗi khi lưu dữ liệu nhân vật.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl bg-[#080c24] border border-[#f5c767]/30 shadow-[0_0_60px_rgba(245,199,103,0.2)] overflow-hidden text-slate-100 font-[family-name:var(--font-inter)]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#060814]/90 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#f5c767]/30 to-[#3fe9d6]/30 border border-[#f5c767]/40 flex items-center justify-center text-xl shadow-inner">
              {isEditing ? "✏️" : "✨"}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white font-[family-name:var(--font-rajdhani)] tracking-wide uppercase">
                {isEditing ? `CHỈNH SỬA VALKYRIA: ${name || initialData?.name}` : "THÊM MỚI CHIẾN BINH VALKYRIA"}
              </h2>
              <p className="text-xs font-mono text-slate-400">
                {isEditing ? "Cập nhật hồ sơ, kỹ năng và chỉ số nhân vật" : "Khởi tạo nhân vật mới vào cơ sở dữ liệu Veyra"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Form Tabs Bar */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-white/10 bg-[#060814]/60">
          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab("basic");
            }}
            className={`px-4 py-2 text-xs font-mono font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer ${activeTab === "basic"
                ? "border-[#f5c767] text-[#f5c767] bg-[#f5c767]/10"
                : "border-transparent text-slate-400 hover:text-white"
              }`}
          >
            1. Thông Tin Cơ Bản
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab("stats");
            }}
            className={`px-4 py-2 text-xs font-mono font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer ${activeTab === "stats"
                ? "border-[#f5c767] text-[#f5c767] bg-[#f5c767]/10"
                : "border-transparent text-slate-400 hover:text-white"
              }`}
          >
            2. Chỉ Số Chiến Đấu
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab("skills");
            }}
            className={`px-4 py-2 text-xs font-mono font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer ${activeTab === "skills"
                ? "border-[#f5c767] text-[#f5c767] bg-[#f5c767]/10"
                : "border-transparent text-slate-400 hover:text-white"
              }`}
          >
            3. Bộ 4 Kỹ Năng
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playClick();
              setActiveTab("lore");
            }}
            className={`px-4 py-2 text-xs font-mono font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer ${activeTab === "lore"
                ? "border-[#f5c767] text-[#f5c767] bg-[#f5c767]/10"
                : "border-transparent text-slate-400 hover:text-white"
              }`}
          >
            4. Ảnh & Cốt Truyện
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Error Notification */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-mono flex items-center gap-2">
                <span>⚠️</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* TAB 1: BASIC INFO */}
            {activeTab === "basic" && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* ID / Code */}
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">
                      Mã Định Danh (Slug ID) *
                    </label>
                    <input
                      type="text"
                      disabled={isEditing}
                      value={id}
                      onChange={(e) => setId(e.target.value)}
                      placeholder="vd: freya, valkyrie_fire"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#3fe9d6] disabled:opacity-50"
                    />
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                      {isEditing ? "Mã định danh không thể thay đổi sau khi tạo." : "Dùng chữ cái không dấu, dấu gạch dưới (vd: lyra, aurelia)."}
                    </span>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">
                      Tên Chiến Binh Valkyria *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="vd: Aurelia, Freya"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/10 text-white text-xs font-sans focus:outline-none focus:border-[#3fe9d6]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Title */}
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">
                      Danh Hiệu
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="vd: Nguyệt Quang Tuyệt Kiếm"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/10 text-white text-xs font-sans focus:outline-none focus:border-[#3fe9d6]"
                    />
                  </div>

                  {/* Rarity */}
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">
                      Độ Hiếm (Rarity) *
                    </label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {RARITY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setRarity(opt.value === "SSR" || opt.value === "UR" ? 5 : opt.value === "SR" ? 4 : 3);
                            setRarityLabel(opt.value);
                          }}
                          className={`py-2 px-1 rounded-xl border text-xs font-mono font-bold flex items-center justify-center transition-all cursor-pointer ${rarityLabel === opt.value
                              ? "bg-white/10 shadow-lg"
                              : "bg-[#060814] border-white/10 text-slate-400 hover:text-white"
                            }`}
                          style={
                            rarityLabel === opt.value
                              ? { borderColor: opt.color, color: opt.color }
                              : {}
                          }
                        >
                          <span className="font-bold">{opt.value}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Role */}
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">
                      Vai Trò (Role) *
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#3fe9d6]"
                    >
                      {ROLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value} className="bg-[#080c24]">
                          {opt.icon} {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Voice Actor */}
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">
                      Lồng Tiếng (CV)
                    </label>
                    <input
                      type="text"
                      value={cv}
                      onChange={(e) => setCv(e.target.value)}
                      placeholder="vd: Hayami Saori / Laura Post"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/10 text-white text-xs font-sans focus:outline-none focus:border-[#3fe9d6]"
                    />
                  </div>
                </div>

                {/* Personal Profile: Height, Weight, Birthday */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">
                      Chiều Cao (Height)
                    </label>
                    <input
                      type="text"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="vd: 165 cm"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/10 text-white text-xs font-sans focus:outline-none focus:border-[#3fe9d6]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">
                      Cân Nặng (Weight)
                    </label>
                    <input
                      type="text"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="vd: 48 kg"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/10 text-white text-xs font-sans focus:outline-none focus:border-[#3fe9d6]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">
                      Ngày Sinh (Birthday)
                    </label>
                    <input
                      type="text"
                      value={birthday}
                      onChange={(e) => setBirthday(e.target.value)}
                      placeholder="vd: 14/02"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/10 text-white text-xs font-sans focus:outline-none focus:border-[#3fe9d6]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Status */}
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">
                      Trạng Thái Hiển Thị
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#3fe9d6]"
                    >
                      <option value="Active" className="bg-[#080c24]">🟢 Hoạt Động (Active)</option>
                      <option value="Testing" className="bg-[#080c24]">🟡 Thử Nghiệm (Testing)</option>
                      <option value="Hidden" className="bg-[#080c24]">⚪ Ẩn / Chưa Mở (Hidden)</option>
                    </select>
                  </div>

                  {/* Release Version */}
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">
                      Phiên Bản Client
                    </label>
                    <input
                      type="text"
                      value={releaseVersion}
                      onChange={(e) => setReleaseVersion(e.target.value)}
                      placeholder="vd: v1.0, v1.1"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#3fe9d6]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: COMBAT STATS */}
            {activeTab === "stats" && (
              <div className="space-y-4">
                {!canEditSkills && (
                  <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-mono text-amber-300 flex items-center gap-2">
                    <span>🔒</span>
                    <span>Chỉ Xem (Read-only): Bạn không có quyền &quot;Cân Bằng Chỉ Số &amp; Kỹ Năng&quot;. Toàn bộ chỉ số chiến đấu bị khóa chỉnh sửa.</span>
                  </div>
                )}

                <div className="p-3.5 rounded-xl bg-[#3fe9d6]/5 border border-[#3fe9d6]/20 text-xs font-mono text-slate-300">
                  💡 Các chỉ số cơ bản ở Cấp độ 1 (Level 1 Base Stats). Hệ thống Unity Engine sẽ tự động tính toán hệ số tăng trưởng theo cấp.
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1.5">
                      Sinh Lực Cơ Bản (HP)
                    </label>
                    <input
                      type="number"
                      disabled={!canEditSkills}
                      value={baseHp}
                      onChange={(e) => setBaseHp(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#3fe9d6] disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-rose-300 mb-1.5">
                      Tấn Công Cơ Bản (ATK)
                    </label>
                    <input
                      type="number"
                      disabled={!canEditSkills}
                      value={baseAtk}
                      onChange={(e) => setBaseAtk(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-rose-500/30 text-rose-300 text-xs font-mono focus:outline-none focus:border-rose-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-sky-300 mb-1.5">
                      Phòng Ngự Cơ Bản (DEF)
                    </label>
                    <input
                      type="number"
                      disabled={!canEditSkills}
                      value={baseDef}
                      onChange={(e) => setBaseDef(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-sky-500/30 text-sky-300 text-xs font-mono focus:outline-none focus:border-sky-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-emerald-300 mb-1.5">
                      Tốc Độ Đánh (SPD)
                    </label>
                    <input
                      type="number"
                      disabled={!canEditSkills}
                      value={baseSpd}
                      onChange={(e) => setBaseSpd(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-emerald-500/30 text-emerald-300 text-xs font-mono focus:outline-none focus:border-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-amber-300 mb-1.5">
                      Tỷ Lệ Bạo Kích (%)
                    </label>
                    <input
                      type="number"
                      disabled={!canEditSkills}
                      value={critRate}
                      onChange={(e) => setCritRate(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-amber-500/30 text-amber-300 text-xs font-mono focus:outline-none focus:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-purple-300 mb-1.5">
                      Sát Thương Bạo Kích (%)
                    </label>
                    <input
                      type="number"
                      disabled={!canEditSkills}
                      value={critDmg}
                      onChange={(e) => setCritDmg(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-purple-500/30 text-purple-300 text-xs font-mono focus:outline-none focus:border-purple-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-teal-300 mb-1.5">
                      Tỷ Lệ Né Tránh (%)
                    </label>
                    <input
                      type="number"
                      disabled={!canEditSkills}
                      value={baseDodgeRate}
                      onChange={(e) => setBaseDodgeRate(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-teal-500/30 text-teal-300 text-xs font-mono focus:outline-none focus:border-teal-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-indigo-300 mb-1.5">
                      Tỷ Lệ Đỡ Đòn (%)
                    </label>
                    <input
                      type="number"
                      disabled={!canEditSkills}
                      value={baseParryRate}
                      onChange={(e) => setBaseParryRate(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-indigo-500/30 text-indigo-300 text-xs font-mono focus:outline-none focus:border-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-orange-300 mb-1.5">
                      Nộ Khí Tối Đa (Max Rage)
                    </label>
                    <input
                      type="number"
                      disabled={!canEditSkills}
                      value={maxRage}
                      onChange={(e) => setMaxRage(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-orange-500/30 text-orange-300 text-xs font-mono focus:outline-none focus:border-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10">
                  <h4 className="text-xs font-mono font-bold text-[#f5c767] uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <span>📈</span>
                    <span>Hệ Số Tăng Trưởng Chỉ Số Mỗi Cấp (Growth Per Level)</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-mono text-slate-400 mb-1.5">
                        Tăng Trưởng HP / Cấp
                      </label>
                      <input
                        type="number"
                        disabled={!canEditSkills}
                        value={hpGrowthPerLevel}
                        onChange={(e) => setHpGrowthPerLevel(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#f5c767] disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-rose-300 mb-1.5">
                        Tăng Trưởng ATK / Cấp
                      </label>
                      <input
                        type="number"
                        disabled={!canEditSkills}
                        value={atkGrowthPerLevel}
                        onChange={(e) => setAtkGrowthPerLevel(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-rose-500/30 text-rose-300 text-xs font-mono focus:outline-none focus:border-rose-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-mono text-sky-300 mb-1.5">
                        Tăng Trưởng DEF / Cấp
                      </label>
                      <input
                        type="number"
                        disabled={!canEditSkills}
                        value={defGrowthPerLevel}
                        onChange={(e) => setDefGrowthPerLevel(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-sky-500/30 text-sky-300 text-xs font-mono focus:outline-none focus:border-sky-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: SKILLS */}
            {activeTab === "skills" && (
              <div className="space-y-4">
                {!canEditSkills && (
                  <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-mono text-amber-300 flex items-center gap-2">
                    <span>🔒</span>
                    <span>Chỉ Xem (Read-only): Bạn không có quyền &quot;Cân Bằng Chỉ Số &amp; Kỹ Năng&quot;. Toàn bộ kỹ năng chiến đấu bị khóa chỉnh sửa.</span>
                  </div>
                )}

                <div className="text-xs font-mono text-slate-400">
                  Bộ 4 kỹ năng chuẩn của Turn-Based RPG (Đánh Thường, Chiến Kỹ, Tuyệt Kỹ, Thiên Phú):
                </div>

                <div className="space-y-3.5">
                  {skills.map((skill, index) => (
                    <div
                      key={index}
                      className="p-4 rounded-xl bg-[#060814] border border-white/10 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-[#3fe9d6] px-2.5 py-0.5 rounded bg-[#3fe9d6]/10 border border-[#3fe9d6]/20">
                          {skill.type}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">Mục #{index + 1}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="sm:col-span-1">
                          <label className="block text-[11px] font-mono text-slate-400 mb-1">
                            Tên Kỹ Năng
                          </label>
                          <input
                            type="text"
                            disabled={!canEditSkills}
                            value={skill.name}
                            onChange={(e) => handleSkillChange(index, "name", e.target.value)}
                            placeholder="vd: Thiểm Quang Nhất Kiếm"
                            className="w-full px-3 py-2 rounded-lg bg-[#080c24] border border-white/10 text-white text-xs font-sans focus:outline-none focus:border-[#3fe9d6] disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-mono text-slate-400 mb-1">
                            Mô Tả & Hiệu Ứng Sát Thương
                          </label>
                          <textarea
                            rows={2}
                            disabled={!canEditSkills}
                            value={skill.desc}
                            onChange={(e) => handleSkillChange(index, "desc", e.target.value)}
                            placeholder="vd: Gây Sát Thương tương đương 110% Tấn Công lên 1 kẻ địch chỉ định..."
                            className="w-full px-3 py-2 rounded-lg bg-[#080c24] border border-white/10 text-white text-xs font-sans focus:outline-none focus:border-[#3fe9d6] resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: IMAGE & LORE */}
            {activeTab === "lore" && (
              <div className="space-y-5">
                {/* Image Upload to Cloudflare R2 & Preview Zone */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-mono font-semibold text-slate-300">
                      Hình Ảnh / Splash Art Nhân Vật
                    </label>
                    <span className="text-[11px] font-mono text-[#3fe9d6] flex items-center gap-1.5 bg-[#3fe9d6]/10 px-2.5 py-0.5 rounded-full border border-[#3fe9d6]/30">
                      <span>☁️</span>
                      <span>Lưu trữ Cloudflare R2</span>
                    </span>
                  </div>

                  {/* Hidden File Input */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageFileChange}
                    accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                    className="hidden"
                  />

                  {/* Upload Drag & Drop / Click Card */}
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOver(true);
                    }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        handleUploadFile(file);
                      }
                    }}
                    onClick={() => {
                      if (!uploadingImage && fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                    className={`relative p-5 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-center ${dragOver
                        ? "border-[#3fe9d6] bg-[#3fe9d6]/10 scale-[1.01]"
                        : uploadingImage
                          ? "border-[#f5c767] bg-[#f5c767]/5"
                          : "border-white/15 bg-[#060814]/70 hover:border-[#3fe9d6]/60 hover:bg-white/[0.03]"
                      }`}
                  >
                    {uploadingImage ? (
                      <div className="space-y-3 py-2">
                        <div className="text-2xl animate-bounce">☁️</div>
                        <div className="text-xs font-mono font-bold text-[#f5c767]">
                          Đang tải ảnh lên Cloudflare R2 ({uploadProgress}%)...
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full max-w-xs mx-auto h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-[#3fe9d6] to-[#f5c767] transition-all duration-200"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5 py-1">
                        <div className="text-3xl">📤</div>
                        <div className="text-xs font-mono font-bold text-white">
                          Nhấp để tải ảnh lên Cloudflare R2 hoặc kéo thả vào đây
                        </div>
                        <div className="text-[11px] font-mono text-slate-400">
                          Hỗ trợ PNG, JPG, WebP, SVG • Tối đa 20MB
                        </div>
                      </div>
                    )}

                    {uploadSuccess && (
                      <div className="mt-2 text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 py-1 px-3 rounded-lg border border-emerald-500/30 inline-block animate-fade-in">
                        ✓ Đã lưu trữ ảnh thành công trên Cloudflare R2!
                      </div>
                    )}
                  </div>

                  {/* Image Preview & URL input */}
                  <div className="p-3.5 rounded-2xl bg-[#060814] border border-white/10 flex flex-col sm:flex-row items-center gap-4">
                    {/* Preview Frame */}
                    <div className="relative w-20 h-28 rounded-xl overflow-hidden bg-black/60 border border-white/10 shrink-0 shadow-lg">
                      <img
                        src={image || DEFAULT_HERO_IMAGE}
                        alt="Preview"
                        className="w-full h-full object-cover object-top"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          if (!img.src.includes("default_hero")) {
                            img.src = DEFAULT_HERO_IMAGE;
                          }
                        }}
                      />
                      {image && (image.includes(".r2.") || image.includes("r2.dev")) && (
                        <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded bg-sky-500/80 text-[9px] font-mono font-bold text-white">
                          R2
                        </div>
                      )}
                    </div>

                    {/* URL Input & Quick Actions */}
                    <div className="flex-1 w-full space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span>Đường dẫn URL ảnh:</span>
                        <button
                          type="button"
                          onClick={() => {
                            soundEngine.playClick();
                            setImage(DEFAULT_HERO_IMAGE);
                          }}
                          className="text-[#f5c767] hover:underline cursor-pointer"
                        >
                          Dùng ảnh mặc định
                        </button>
                      </div>
                      <input
                        type="text"
                        value={image}
                        onChange={(e) => setImage(e.target.value)}
                        placeholder="Link URL ảnh trên Cloudflare R2 hoặc đường dẫn cục bộ"
                        className="w-full px-3.5 py-2 rounded-xl bg-[#080c24] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#3fe9d6]"
                      />
                      <div className="text-[10px] text-slate-500 font-mono">
                        {image && (image.startsWith("http://") || image.startsWith("https://"))
                          ? "🌐 Đường dẫn đám mây trực tuyến"
                          : "📁 Đường dẫn ảnh mẫu mặc định hệ thống"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quote */}
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5">
                    Câu Thoại Tiêu Biểu (Quote)
                  </label>
                  <input
                    type="text"
                    value={quote}
                    onChange={(e) => setQuote(e.target.value)}
                    placeholder="vd: Lưỡi kiếm của ta không bao giờ chùn bước trước bóng tối..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/10 text-white text-xs font-sans focus:outline-none focus:border-[#3fe9d6]"
                  />
                </div>

                {/* Lore */}
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1.5">
                    Tiểu Sử & Cốt Truyện Đại Lục Veyra
                  </label>
                  <textarea
                    rows={4}
                    value={lore}
                    onChange={(e) => setLore(e.target.value)}
                    placeholder="Viết câu chuyện về nguồn gốc, xuất thân và vai trò của Valkyria trong cuộc chiến bảo vệ Veyra..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#060814] border border-white/10 text-white text-xs font-sans focus:outline-none focus:border-[#3fe9d6] resize-none leading-relaxed"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer Controls */}
          <div className="px-6 py-4 border-t border-white/10 bg-[#060814]/90 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                soundEngine.playClick();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono font-semibold transition-all cursor-pointer"
            >
              Hủy Bỏ
            </button>

            {!canEdit && (
              <span className="text-xs font-mono text-amber-300 flex items-center gap-1.5">
                <span>🔒</span>
                <span>Chế độ Chỉ Xem (Không có quyền Lưu)</span>
              </span>
            )}

            <button
              type="submit"
              disabled={saving || !canEdit}
              className={`px-6 py-2.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center gap-2 ${
                !canEdit
                  ? "bg-white/5 border border-white/10 text-slate-500 cursor-not-allowed opacity-50"
                  : "bg-gradient-to-r from-[#3fe9d6] to-[#f5c767] hover:brightness-110 text-black shadow-[0_0_20px_rgba(63,233,214,0.4)] cursor-pointer"
              }`}
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Đang Lưu...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>{!canEdit ? "Khóa Lưu" : isEditing ? "Lưu Thay Đổi" : "Tạo Mới Valkyria"}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

