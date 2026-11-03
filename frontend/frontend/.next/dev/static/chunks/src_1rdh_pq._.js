(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/components/auth/LoginForm.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>LoginForm
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$audio$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/audio.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/auth.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modals$2f$TermsModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/modals/TermsModal.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
function LoginForm() {
    _s();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const isMounted = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useIsMounted"])();
    const currentUser = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const [tab, setTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("login");
    const [showPassword, setShowPassword] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isTermsModalOpen, setIsTermsModalOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Popup Toast Notification (slide down from top, auto-closes)
    const [toast, setToast] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    // Form states
    const [formData, setFormData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        email: "",
        username: "",
        password: "",
        confirmPassword: "",
        rememberMe: true,
        agreeTerms: true
    });
    // Auto-dismiss popup toast after 3.2s
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "LoginForm.useEffect": ()=>{
            if (!toast) return;
            const timer = setTimeout({
                "LoginForm.useEffect.timer": ()=>{
                    setToast(null);
                }
            }["LoginForm.useEffect.timer"], 3200);
            return ({
                "LoginForm.useEffect": ()=>clearTimeout(timer)
            })["LoginForm.useEffect"];
        }
    }["LoginForm.useEffect"], [
        toast
    ]);
    const showToast = (type, text, title)=>{
        setToast({
            type,
            text,
            title
        });
    };
    const handleInputChange = (e)=>{
        const { name, value, type, checked } = e.target;
        setFormData((prev)=>({
                ...prev,
                [name]: type === "checkbox" ? checked : value
            }));
    };
    const handleSubmit = async (e)=>{
        e.preventDefault();
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$audio$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["soundEngine"].playClick();
        setToast(null);
        // Basic Validation
        if (tab === "login") {
            if (!formData.email.trim() || !formData.password.trim()) {
                showToast("error", "Vui lòng nhập đầy đủ Email và Mật khẩu.", "Thiếu Thông Tin");
                return;
            }
        } else {
            if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
                showToast("error", "Vui lòng điền đầy đủ các thông tin đăng ký.", "Thiếu Thông Tin");
                return;
            }
            if (formData.password !== formData.confirmPassword) {
                showToast("error", "Mật khẩu xác nhận không khớp. Vui lòng kiểm tra lại.", "Lỗi Xác Nhận");
                return;
            }
            if (formData.password.length < 6) {
                showToast("error", "Mật khẩu phải có tối thiểu 6 ký tự (theo tiêu chuẩn Firebase).", "Mật Khẩu Ngắn");
                return;
            }
            if (!formData.agreeTerms) {
                showToast("error", "Bạn cần đồng ý với Điều khoản Dịch vụ để tạo tài khoản.", "Điều Khoản");
                return;
            }
        }
        setLoading(true);
        try {
            if (tab === "login") {
                const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authService"].login({
                    email: formData.email.trim(),
                    password: formData.password
                });
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$audio$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["soundEngine"].playCelestialChime();
                showToast("success", `Đăng nhập thành công! Chào mừng Chỉ Huy "${user.username}" trở lại Veyra.`, "Đăng Nhập Thành Công");
                // Tự động chuyển hướng về Trang Chủ sau 1.5 giây
                setTimeout(()=>{
                    router.push("/");
                }, 1500);
            } else {
                const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authService"].register({
                    username: formData.username.trim(),
                    email: formData.email.trim(),
                    password: formData.password
                });
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$audio$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["soundEngine"].playCelestialChime();
                showToast("success", `Tạo tài khoản thành công trên Firebase! Chào mừng Chỉ Huy "${user.username}" (${user.email}).`, "Đăng Ký Thành Công");
                // Tự động chuyển hướng về Trang Chủ sau 1.5 giây
                setTimeout(()=>{
                    router.push("/");
                }, 1500);
            }
        } catch (err) {
            const error = err;
            showToast("error", error.message || "Không thể xác thực với Firebase.", "Lỗi Xác Thực");
        } finally{
            setLoading(false);
        }
    };
    const handleForgotPassword = async ()=>{
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$audio$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["soundEngine"].playClick();
        if (!formData.email.trim()) {
            showToast("error", "Vui lòng nhập địa chỉ Email vào ô Email bên dưới trước khi bấm Quên mật khẩu.", "Yêu Cầu Email");
            return;
        }
        setLoading(true);
        setToast(null);
        try {
            const message = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authService"].forgotPassword(formData.email.trim());
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$audio$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["soundEngine"].playCelestialChime();
            showToast("success", message, "Khôi Phục Mật Khẩu");
        } catch (err) {
            const error = err;
            showToast("error", error.message || "Không thể gửi email khôi phục mật khẩu.", "Lỗi Khôi Phục");
        } finally{
            setLoading(false);
        }
    };
    const handleGoogleSignIn = async ()=>{
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$audio$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["soundEngine"].playClick();
        setLoading(true);
        setToast(null);
        try {
            const user = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authService"].loginWithGoogle();
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$audio$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["soundEngine"].playCelestialChime();
            showToast("success", `Đăng nhập Google thành công! Chào mừng Chỉ Huy "${user.username}".`, "Đăng Nhập Thành Công");
            // Tự động chuyển hướng về Trang Chủ sau 1.5 giây
            setTimeout(()=>{
                router.push("/");
            }, 1500);
        } catch (err) {
            const error = err;
            showToast("error", error.message || "Đăng nhập Google thất bại.", "Lỗi Đăng Nhập");
        } finally{
            setLoading(false);
        }
    };
    const handleSignOut = async ()=>{
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$audio$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["soundEngine"].playClick();
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["authService"].logout();
        showToast("success", "Đã đăng xuất thành công khỏi Vùng đất Veyra.", "Đăng Xuất");
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "w-full max-w-md mx-auto relative z-10",
        children: [
            toast && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                role: "status",
                "aria-live": "polite",
                className: "fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-md animate-slide-down-toast pointer-events-auto",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: `relative overflow-hidden rounded-xl backdrop-blur-2xl bg-[#080a1c]/95 border shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-4 sm:p-4.5 ${toast.type === "success" ? "border-[#3fe9d6]/60 shadow-[0_10px_35px_rgba(63,233,214,0.25)]" : "border-red-500/60 shadow-[0_10px_35px_rgba(239,68,68,0.25)]"}`,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: `absolute top-0 left-0 right-0 h-[2px] ${toast.type === "success" ? "bg-gradient-to-r from-transparent via-[#3fe9d6] to-transparent shadow-[0_0_12px_#3fe9d6]" : "bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_12px_#ef4444]"}`
                        }, void 0, false, {
                            fileName: "[project]/src/components/auth/LoginForm.tsx",
                            lineNumber: 225,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-start gap-3.5",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: `w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-lg ${toast.type === "success" ? "bg-[#3fe9d6]/15 text-[#3fe9d6] border border-[#3fe9d6]/40 shadow-[0_0_12px_rgba(63,233,214,0.3)]" : "bg-red-500/15 text-red-400 border border-red-500/40 shadow-[0_0_12px_rgba(239,68,68,0.3)]"}`,
                                    children: toast.type === "success" ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        className: "w-5 h-5",
                                        fill: "none",
                                        viewBox: "0 0 24 24",
                                        stroke: "currentColor",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            strokeLinecap: "round",
                                            strokeLinejoin: "round",
                                            strokeWidth: 2.5,
                                            d: "M5 13l4 4L19 7"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/auth/LoginForm.tsx",
                                            lineNumber: 242,
                                            columnNumber: 21
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                        lineNumber: 241,
                                        columnNumber: 19
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        className: "w-5 h-5",
                                        fill: "none",
                                        viewBox: "0 0 24 24",
                                        stroke: "currentColor",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            strokeLinecap: "round",
                                            strokeLinejoin: "round",
                                            strokeWidth: 2.5,
                                            d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/auth/LoginForm.tsx",
                                            lineNumber: 246,
                                            columnNumber: 21
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                        lineNumber: 245,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/auth/LoginForm.tsx",
                                    lineNumber: 234,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex-1 pr-2 min-w-0",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-2 mb-0.5",
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: `text-xs font-bold uppercase tracking-wider font-mono ${toast.type === "success" ? "text-[#3fe9d6]" : "text-red-400"}`,
                                                children: toast.title || (toast.type === "success" ? "Thông Báo Veyra" : "Lỗi Xác Thực")
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                lineNumber: 254,
                                                columnNumber: 19
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/auth/LoginForm.tsx",
                                            lineNumber: 253,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-xs sm:text-sm text-slate-200 leading-relaxed font-sans",
                                            children: toast.text
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/auth/LoginForm.tsx",
                                            lineNumber: 261,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/auth/LoginForm.tsx",
                                    lineNumber: 252,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: ()=>setToast(null),
                                    "aria-label": "Đóng thông báo",
                                    className: "text-slate-400 hover:text-white hover:bg-white/10 rounded-md p-1 transition-colors cursor-pointer shrink-0",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                        className: "w-4 h-4",
                                        fill: "none",
                                        viewBox: "0 0 24 24",
                                        stroke: "currentColor",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                            strokeLinecap: "round",
                                            strokeLinejoin: "round",
                                            strokeWidth: 2,
                                            d: "M6 18L18 6M6 6l12 12"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/auth/LoginForm.tsx",
                                            lineNumber: 274,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                        lineNumber: 273,
                                        columnNumber: 17
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/auth/LoginForm.tsx",
                                    lineNumber: 267,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/auth/LoginForm.tsx",
                            lineNumber: 232,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute bottom-0 left-0 right-0 h-[2px] bg-white/5 overflow-hidden",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `h-full animate-progress-shrink ${toast.type === "success" ? "bg-[#3fe9d6]" : "bg-red-500"}`
                            }, void 0, false, {
                                fileName: "[project]/src/components/auth/LoginForm.tsx",
                                lineNumber: 281,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/auth/LoginForm.tsx",
                            lineNumber: 280,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/auth/LoginForm.tsx",
                    lineNumber: 218,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/components/auth/LoginForm.tsx",
                lineNumber: 213,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "absolute -inset-1.5 bg-gradient-to-r from-[#f5c767]/30 via-[#3fe9d6]/20 to-[#9b51e0]/30 rounded-2xl blur-xl opacity-70 group-hover:opacity-100 transition duration-1000 -z-10"
            }, void 0, false, {
                fileName: "[project]/src/components/auth/LoginForm.tsx",
                lineNumber: 291,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "hsr-card p-6 sm:p-8 rounded-xl backdrop-blur-2xl bg-[#090b1c]/90 border border-[#f5c767]/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col items-center text-center mb-6",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: "/",
                                onClick: ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$audio$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["soundEngine"].playClick(),
                                className: "flex items-center gap-3 group mb-2",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "relative w-40 h-40 group-hover:scale-105 transition-transform drop-shadow-[0_0_15px_rgba(245,199,103,0.45)]",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        src: "/images/logo_vov.png",
                                        alt: "VoV Logo",
                                        fill: true,
                                        className: "object-contain",
                                        priority: true
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                        lineNumber: 303,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/auth/LoginForm.tsx",
                                    lineNumber: 302,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/auth/LoginForm.tsx",
                                lineNumber: 297,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                className: "text-xl sm:text-2xl font-extrabold text-white tracking-wider font-[family-name:var(--font-rajdhani)] uppercase",
                                children: [
                                    "VALKYRIA o",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-gold-gradient",
                                        children: "f VEYRA"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                        lineNumber: 313,
                                        columnNumber: 23
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/auth/LoginForm.tsx",
                                lineNumber: 312,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-slate-400 mt-1 uppercase tracking-widest font-mono",
                                children: currentUser ? "Trạng Thái Chỉ Huy" : tab === "login" ? "Cổng Chỉ Huy Veyra" : "Gia Nhập Lục Địa Veyra"
                            }, void 0, false, {
                                fileName: "[project]/src/components/auth/LoginForm.tsx",
                                lineNumber: 315,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                        lineNumber: 296,
                        columnNumber: 9
                    }, this),
                    isMounted && currentUser ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-5 animate-fadeIn",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-4 rounded-xl bg-white/5 border border-[#f5c767]/30 text-center space-y-2",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "w-16 h-16 rounded-full bg-gradient-to-tr from-[#f5c767] to-[#3fe9d6] mx-auto flex items-center justify-center text-2xl font-bold text-[#060814] shadow-[0_0_15px_rgba(245,199,103,0.5)]",
                                        children: currentUser.username ? currentUser.username[0].toUpperCase() : "★"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                        lineNumber: 328,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-base font-bold text-white font-mono",
                                                children: currentUser.username
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                lineNumber: 332,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs text-slate-400 font-mono",
                                                children: currentUser.email
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                lineNumber: 335,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "mt-1 flex items-center justify-center gap-2 text-[11px] font-mono text-[#f5c767]",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: [
                                                        "Cấp Chỉ Huy: ",
                                                        currentUser.level || 1
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                    lineNumber: 337,
                                                    columnNumber: 19
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                lineNumber: 336,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                        lineNumber: 331,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "inline-block px-2.5 py-0.5 text-[10px] uppercase font-mono tracking-wider rounded-full bg-[#3fe9d6]/20 text-[#3fe9d6] border border-[#3fe9d6]/40",
                                        children: "Đã Đăng Nhập · Veyra"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                        lineNumber: 340,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/auth/LoginForm.tsx",
                                lineNumber: 327,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-center text-slate-400 font-sans px-2",
                                children: "Chỉ Huy đang truy cập với tài khoản này. Bạn có thể quay về Trang Chủ để tiếp tục hoặc Đăng xuất để đổi tài khoản khác."
                            }, void 0, false, {
                                fileName: "[project]/src/components/auth/LoginForm.tsx",
                                lineNumber: 345,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "space-y-2.5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/",
                                        onClick: ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$audio$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["soundEngine"].playClick(),
                                        className: "w-full py-3 rounded font-bold uppercase tracking-wider font-[family-name:var(--font-rajdhani)] text-sm flex items-center justify-center gap-2 hsr-btn-gold",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: "VÀO HÀNH TRÌNH (TRANG CHỦ)"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/auth/LoginForm.tsx",
                                            lineNumber: 355,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                        lineNumber: 350,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        href: "/profile",
                                        onClick: ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$audio$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["soundEngine"].playClick(),
                                        className: "w-full py-2.5 rounded font-semibold uppercase tracking-wider font-mono text-xs border border-white/15 bg-white/5 text-slate-200 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-2",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: "XEM HỒ SƠ CHỈ HUY"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/auth/LoginForm.tsx",
                                            lineNumber: 362,
                                            columnNumber: 17
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                        lineNumber: 357,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: handleSignOut,
                                        className: "w-full py-2 rounded font-semibold uppercase tracking-wider font-mono text-xs border border-red-500/30 text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer",
                                        children: "Đăng Xuất (Đổi Tài Khoản Khác)"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                        lineNumber: 364,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/auth/LoginForm.tsx",
                                lineNumber: 349,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                        lineNumber: 326,
                        columnNumber: 11
                    }, this) : /* NOT LOGGED IN VIEW */ /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex rounded-lg bg-[#04050d]/80 p-1 border border-white/10 mb-6",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>{
                                            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$audio$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["soundEngine"].playClick();
                                            setTab("login");
                                            setToast(null);
                                        },
                                        className: `flex-1 py-2 text-xs sm:text-sm font-semibold tracking-wider uppercase rounded transition-all cursor-pointer ${tab === "login" ? "bg-gradient-to-r from-[#ecd178]/20 to-[#d8a83a]/20 text-[#f5c767] border border-[#f5c767]/40 shadow-[0_0_10px_rgba(245,199,103,0.2)]" : "text-slate-400 hover:text-white"}`,
                                        children: "Đăng Nhập"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                        lineNumber: 378,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>{
                                            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$audio$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["soundEngine"].playClick();
                                            setTab("register");
                                            setToast(null);
                                        },
                                        className: `flex-1 py-2 text-xs sm:text-sm font-semibold tracking-wider uppercase rounded transition-all cursor-pointer ${tab === "register" ? "bg-gradient-to-r from-[#3fe9d6]/20 to-[#3b82f6]/20 text-[#3fe9d6] border border-[#3fe9d6]/40 shadow-[0_0_10px_rgba(63,233,214,0.2)]" : "text-slate-400 hover:text-white"}`,
                                        children: "Đăng Ký"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                        lineNumber: 392,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/auth/LoginForm.tsx",
                                lineNumber: 377,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                onSubmit: handleSubmit,
                                className: "space-y-4",
                                children: [
                                    tab === "register" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono",
                                                children: "Tên Chỉ Huy (Nickname)"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                lineNumber: 412,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "relative",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                            className: "w-4 h-4",
                                                            fill: "none",
                                                            viewBox: "0 0 24 24",
                                                            stroke: "currentColor",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                strokeLinecap: "round",
                                                                strokeLinejoin: "round",
                                                                strokeWidth: 1.8,
                                                                d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                                lineNumber: 418,
                                                                columnNumber: 25
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                            lineNumber: 417,
                                                            columnNumber: 23
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                        lineNumber: 416,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "text",
                                                        name: "username",
                                                        value: formData.username,
                                                        onChange: handleInputChange,
                                                        placeholder: "Hitomi_Valkyrie",
                                                        className: "w-full pl-10 pr-4 py-2.5 bg-[#050714]/80 border border-white/15 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#3fe9d6] focus:ring-1 focus:ring-[#3fe9d6] transition-all",
                                                        required: true
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                        lineNumber: 421,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                lineNumber: 415,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                        lineNumber: 411,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono",
                                                children: "Địa chỉ Email"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                lineNumber: 436,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "relative",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                            className: "w-4 h-4",
                                                            fill: "none",
                                                            viewBox: "0 0 24 24",
                                                            stroke: "currentColor",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                strokeLinecap: "round",
                                                                strokeLinejoin: "round",
                                                                strokeWidth: 1.8,
                                                                d: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                                lineNumber: 442,
                                                                columnNumber: 23
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                            lineNumber: 441,
                                                            columnNumber: 21
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                        lineNumber: 440,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "email",
                                                        name: "email",
                                                        value: formData.email,
                                                        onChange: handleInputChange,
                                                        placeholder: "commander@veyra.game",
                                                        className: "w-full pl-10 pr-4 py-2.5 bg-[#050714]/80 border border-white/15 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#f5c767] focus:ring-1 focus:ring-[#f5c767] transition-all",
                                                        required: true
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                        lineNumber: 445,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                lineNumber: 439,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                        lineNumber: 435,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono",
                                                children: "Mật khẩu"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                lineNumber: 459,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "relative",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                            className: "w-4 h-4",
                                                            fill: "none",
                                                            viewBox: "0 0 24 24",
                                                            stroke: "currentColor",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                strokeLinecap: "round",
                                                                strokeLinejoin: "round",
                                                                strokeWidth: 1.8,
                                                                d: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                                lineNumber: 465,
                                                                columnNumber: 23
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                            lineNumber: 464,
                                                            columnNumber: 21
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                        lineNumber: 463,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: showPassword ? "text" : "password",
                                                        name: "password",
                                                        value: formData.password,
                                                        onChange: handleInputChange,
                                                        placeholder: tab === "login" ? "••••••••" : "Tối thiểu 6 ký tự",
                                                        className: "w-full pl-10 pr-10 py-2.5 bg-[#050714]/80 border border-white/15 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#f5c767] focus:ring-1 focus:ring-[#f5c767] transition-all",
                                                        required: true
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                        lineNumber: 468,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        onClick: ()=>setShowPassword(!showPassword),
                                                        className: "absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white cursor-pointer",
                                                        children: showPassword ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                            className: "w-4 h-4",
                                                            fill: "none",
                                                            viewBox: "0 0 24 24",
                                                            stroke: "currentColor",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                strokeLinecap: "round",
                                                                strokeLinejoin: "round",
                                                                strokeWidth: 1.8,
                                                                d: "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                                lineNumber: 484,
                                                                columnNumber: 25
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                            lineNumber: 483,
                                                            columnNumber: 23
                                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                            className: "w-4 h-4",
                                                            fill: "none",
                                                            viewBox: "0 0 24 24",
                                                            stroke: "currentColor",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                    strokeLinecap: "round",
                                                                    strokeLinejoin: "round",
                                                                    strokeWidth: 1.8,
                                                                    d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                                    lineNumber: 488,
                                                                    columnNumber: 25
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                    strokeLinecap: "round",
                                                                    strokeLinejoin: "round",
                                                                    strokeWidth: 1.8,
                                                                    d: "M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                                    lineNumber: 489,
                                                                    columnNumber: 25
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                            lineNumber: 487,
                                                            columnNumber: 23
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                        lineNumber: 477,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                lineNumber: 462,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                        lineNumber: 458,
                                        columnNumber: 15
                                    }, this),
                                    tab === "login" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center justify-between text-xs pt-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "flex items-center gap-2 cursor-pointer text-slate-300 hover:text-white",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "checkbox",
                                                        name: "rememberMe",
                                                        checked: formData.rememberMe,
                                                        onChange: handleInputChange,
                                                        className: "w-3.5 h-3.5 rounded border-white/20 bg-[#050714] text-[#f5c767] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#f5c767]"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                        lineNumber: 500,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "Ghi nhớ đăng nhập"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                        lineNumber: 507,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                lineNumber: 499,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: handleForgotPassword,
                                                className: "text-[#f5c767] hover:underline cursor-pointer",
                                                children: "Quên mật khẩu?"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                lineNumber: 509,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                        lineNumber: 498,
                                        columnNumber: 17
                                    }, this),
                                    tab === "register" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                className: "block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 font-mono",
                                                children: "Xác nhận Mật khẩu"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                lineNumber: 522,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "relative",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                            className: "w-4 h-4",
                                                            fill: "none",
                                                            viewBox: "0 0 24 24",
                                                            stroke: "currentColor",
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                                strokeLinecap: "round",
                                                                strokeLinejoin: "round",
                                                                strokeWidth: 1.8,
                                                                d: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                                lineNumber: 528,
                                                                columnNumber: 25
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                            lineNumber: 527,
                                                            columnNumber: 23
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                        lineNumber: 526,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: showPassword ? "text" : "password",
                                                        name: "confirmPassword",
                                                        value: formData.confirmPassword,
                                                        onChange: handleInputChange,
                                                        placeholder: "Nhập lại mật khẩu",
                                                        className: "w-full pl-10 pr-10 py-2.5 bg-[#050714]/80 border border-white/15 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#3fe9d6] focus:ring-1 focus:ring-[#3fe9d6] transition-all",
                                                        required: true
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                        lineNumber: 531,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                lineNumber: 525,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                        lineNumber: 521,
                                        columnNumber: 17
                                    }, this),
                                    tab === "register" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "pt-1",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "flex items-start gap-2 cursor-pointer text-xs text-slate-300 hover:text-white",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "checkbox",
                                                    name: "agreeTerms",
                                                    checked: formData.agreeTerms,
                                                    onChange: handleInputChange,
                                                    className: "mt-0.5 w-3.5 h-3.5 rounded border-white/20 bg-[#050714] text-[#3fe9d6] focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#3fe9d6]"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                    lineNumber: 548,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: [
                                                        "Tôi đồng ý với",
                                                        " ",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            type: "button",
                                                            onClick: (e)=>{
                                                                e.preventDefault();
                                                                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$audio$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["soundEngine"].playClick();
                                                                setIsTermsModalOpen(true);
                                                            },
                                                            className: "text-[#3fe9d6] underline hover:text-[#5ef0e0] font-semibold cursor-pointer inline transition-colors",
                                                            children: "Điều khoản dịch vụ"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                            lineNumber: 557,
                                                            columnNumber: 23
                                                        }, this),
                                                        " ",
                                                        "của Valkyria of Veyra."
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                    lineNumber: 555,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/auth/LoginForm.tsx",
                                            lineNumber: 547,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                        lineNumber: 546,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "submit",
                                        disabled: loading,
                                        className: `w-full py-3.5 mt-2 rounded font-bold uppercase tracking-wider font-[family-name:var(--font-rajdhani)] text-sm sm:text-base flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 ${tab === "login" ? "hsr-btn-gold" : "bg-gradient-to-r from-[#3fe9d6] to-[#3b82f6] text-[#060814] hover:shadow-[0_0_25px_rgba(63,233,214,0.6)]"} ${loading ? "opacity-75 cursor-wait" : ""}`,
                                        children: loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                    className: "animate-spin -ml-1 mr-2 h-4 w-4 text-current",
                                                    fill: "none",
                                                    viewBox: "0 0 24 24",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                                                            className: "opacity-25",
                                                            cx: "12",
                                                            cy: "12",
                                                            r: "10",
                                                            stroke: "currentColor",
                                                            strokeWidth: "4"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                            lineNumber: 586,
                                                            columnNumber: 23
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                            className: "opacity-75",
                                                            fill: "currentColor",
                                                            d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                            lineNumber: 587,
                                                            columnNumber: 23
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                    lineNumber: 585,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: "Đang kết nối đến Veyra..."
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                    lineNumber: 589,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/auth/LoginForm.tsx",
                                            lineNumber: 584,
                                            columnNumber: 19
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: tab === "login" ? "BƯỚC VÀO VEYRA (ĐĂNG NHẬP)" : "ĐĂNG KÝ CHỈ HUY"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/auth/LoginForm.tsx",
                                            lineNumber: 592,
                                            columnNumber: 19
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                        lineNumber: 575,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "relative my-3 flex items-center justify-center",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "border-t border-white/10 w-full"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                lineNumber: 598,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "bg-[#090b1c] px-3 text-[11px] font-mono text-slate-400 uppercase tracking-widest relative z-10",
                                                children: "Hoặc"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                lineNumber: 599,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                        lineNumber: 597,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: handleGoogleSignIn,
                                        disabled: loading,
                                        className: "w-full py-2.5 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 hover:border-white/30 text-white text-xs sm:text-sm font-semibold flex items-center justify-center gap-2.5 transition-all cursor-pointer",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                                className: "w-4 h-4",
                                                viewBox: "0 0 24 24",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        fill: "#4285F4",
                                                        d: "M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                        lineNumber: 612,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        fill: "#34A853",
                                                        d: "M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                        lineNumber: 616,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        fill: "#FBBC05",
                                                        d: "M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                        lineNumber: 620,
                                                        columnNumber: 19
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                                        fill: "#EA4335",
                                                        d: "M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                        lineNumber: 624,
                                                        columnNumber: 19
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                lineNumber: 611,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: "Đăng nhập nhanh với Google"
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/auth/LoginForm.tsx",
                                                lineNumber: 629,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                        lineNumber: 605,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/src/components/auth/LoginForm.tsx",
                                lineNumber: 409,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                        lineNumber: 375,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "mt-6 text-center",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                            href: "/",
                            onClick: ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$audio$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["soundEngine"].playClick(),
                            className: "inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-[#f5c767] transition-colors py-1 px-3 rounded-full hover:bg-white/5",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                    className: "w-3.5 h-3.5",
                                    fill: "none",
                                    viewBox: "0 0 24 24",
                                    stroke: "currentColor",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                        strokeLinecap: "round",
                                        strokeLinejoin: "round",
                                        strokeWidth: 2,
                                        d: "M10 19l-7-7m0 0l7-7m-7 7h18"
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                                        lineNumber: 643,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/src/components/auth/LoginForm.tsx",
                                    lineNumber: 642,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    children: "Trở về Trang Chủ"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/auth/LoginForm.tsx",
                                    lineNumber: 645,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/auth/LoginForm.tsx",
                            lineNumber: 637,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/components/auth/LoginForm.tsx",
                        lineNumber: 636,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/components/auth/LoginForm.tsx",
                lineNumber: 294,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$modals$2f$TermsModal$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                isOpen: isTermsModalOpen,
                onClose: ()=>setIsTermsModalOpen(false)
            }, void 0, false, {
                fileName: "[project]/src/components/auth/LoginForm.tsx",
                lineNumber: 651,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/auth/LoginForm.tsx",
        lineNumber: 210,
        columnNumber: 5
    }, this);
}
_s(LoginForm, "kvKtUJdpzLAvr5NKRtMkCANYv2w=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useIsMounted"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$auth$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"]
    ];
});
_c = LoginForm;
var _c;
__turbopack_context__.k.register(_c, "LoginForm");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/common/StarCanvas.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>StarCanvas
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
function StarCanvas() {
    _s();
    const canvasRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "StarCanvas.useEffect": ()=>{
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            let animationId;
            let width = canvas.width = window.innerWidth;
            let height = canvas.height = window.innerHeight;
            const handleResize = {
                "StarCanvas.useEffect.handleResize": ()=>{
                    if (!canvas) return;
                    width = canvas.width = window.innerWidth;
                    height = canvas.height = window.innerHeight;
                }
            }["StarCanvas.useEffect.handleResize"];
            window.addEventListener("resize", handleResize);
            // Generate stars
            const starCount = 80;
            const stars = Array.from({
                length: starCount
            }, {
                "StarCanvas.useEffect.stars": ()=>({
                        x: Math.random() * width,
                        y: Math.random() * height,
                        size: Math.random() * 2 + 0.5,
                        alpha: Math.random() * 0.8 + 0.2,
                        speed: Math.random() * 0.2 + 0.05,
                        sparkleSpeed: Math.random() * 0.02 + 0.005
                    })
            }["StarCanvas.useEffect.stars"]);
            const render = {
                "StarCanvas.useEffect.render": ()=>{
                    ctx.clearRect(0, 0, width, height);
                    stars.forEach({
                        "StarCanvas.useEffect.render": (star)=>{
                            star.y -= star.speed;
                            if (star.y < 0) {
                                star.y = height;
                                star.x = Math.random() * width;
                            }
                            star.alpha += star.sparkleSpeed;
                            if (star.alpha > 0.95 || star.alpha < 0.2) {
                                star.sparkleSpeed = -star.sparkleSpeed;
                            }
                            ctx.beginPath();
                            ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                            ctx.fillStyle = `rgba(245, 199, 103, ${Math.max(0.1, star.alpha)})`;
                            ctx.shadowBlur = 6;
                            ctx.shadowColor = "rgba(245, 199, 103, 0.8)";
                            ctx.fill();
                        }
                    }["StarCanvas.useEffect.render"]);
                    animationId = requestAnimationFrame(render);
                }
            }["StarCanvas.useEffect.render"];
            render();
            return ({
                "StarCanvas.useEffect": ()=>{
                    window.removeEventListener("resize", handleResize);
                    cancelAnimationFrame(animationId);
                }
            })["StarCanvas.useEffect"];
        }
    }["StarCanvas.useEffect"], []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("canvas", {
                ref: canvasRef,
                className: "fixed inset-0 pointer-events-none z-0 opacity-70"
            }, void 0, false, {
                fileName: "[project]/src/components/common/StarCanvas.tsx",
                lineNumber: 72,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "shooting-star-1"
            }, void 0, false, {
                fileName: "[project]/src/components/common/StarCanvas.tsx",
                lineNumber: 77,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "shooting-star-2"
            }, void 0, false, {
                fileName: "[project]/src/components/common/StarCanvas.tsx",
                lineNumber: 78,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/common/StarCanvas.tsx",
        lineNumber: 71,
        columnNumber: 5
    }, this);
}
_s(StarCanvas, "UJgi7ynoup7eqypjnwyX/s32POg=");
_c = StarCanvas;
var _c;
__turbopack_context__.k.register(_c, "StarCanvas");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/modals/TermsModal.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TermsModal
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$audio$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/audio.service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$settings$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/settings.service.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
function TermsModal({ isOpen, onClose }) {
    _s();
    const [items, setItems] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$settings$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_TERMS_LIST"]);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [search, setSearch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TermsModal.useEffect": ()=>{
            if (isOpen) {
                setLoading(true);
                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$settings$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["settingsService"].getTermsList().then({
                    "TermsModal.useEffect": (data)=>setItems(data)
                }["TermsModal.useEffect"]).catch({
                    "TermsModal.useEffect": ()=>setItems(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$settings$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["DEFAULT_TERMS_LIST"])
                }["TermsModal.useEffect"]).finally({
                    "TermsModal.useEffect": ()=>setLoading(false)
                }["TermsModal.useEffect"]);
            }
        }
    }["TermsModal.useEffect"], [
        isOpen
    ]);
    if (!isOpen) return null;
    const filteredItems = items.filter((item)=>item.Title.toLowerCase().includes(search.toLowerCase()) || item.Content.toLowerCase().includes(search.toLowerCase()));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "relative w-full max-w-3xl max-h-[85vh] rounded-2xl bg-[#090c21] border border-[#3fe9d6]/40 shadow-[0_0_50px_rgba(63,233,214,0.3)] flex flex-col overflow-hidden",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#0e1330] shrink-0",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "w-2.5 h-2.5 rounded-full bg-[#3fe9d6] animate-pulse"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/modals/TermsModal.tsx",
                                            lineNumber: 43,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                            className: "text-base sm:text-lg font-bold font-[family-name:var(--font-rajdhani)] text-white uppercase tracking-wider",
                                            children: "ĐIỀU KHOẢN DỊCH VỤ & HIỆP ƯỚC CHỈ HUY"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/modals/TermsModal.tsx",
                                            lineNumber: 44,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/modals/TermsModal.tsx",
                                    lineNumber: 42,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-3 text-xs font-mono text-slate-400 mt-0.5",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: "Đại Lục Veyra"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/modals/TermsModal.tsx",
                                            lineNumber: 49,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: "•"
                                        }, void 0, false, {
                                            fileName: "[project]/src/components/modals/TermsModal.tsx",
                                            lineNumber: 50,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: [
                                                "Tổng cộng: ",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                    className: "text-[#3fe9d6]",
                                                    children: items.length
                                                }, void 0, false, {
                                                    fileName: "[project]/src/components/modals/TermsModal.tsx",
                                                    lineNumber: 52,
                                                    columnNumber: 28
                                                }, this),
                                                " điều khoản"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/components/modals/TermsModal.tsx",
                                            lineNumber: 51,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/components/modals/TermsModal.tsx",
                                    lineNumber: 48,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/modals/TermsModal.tsx",
                            lineNumber: 41,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>{
                                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$audio$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["soundEngine"].playClick();
                                onClose();
                            },
                            className: "p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer transition-colors",
                            title: "Đóng điều khoản",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
                                className: "w-5 h-5",
                                fill: "none",
                                viewBox: "0 0 24 24",
                                stroke: "currentColor",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                                    strokeLinecap: "round",
                                    strokeLinejoin: "round",
                                    strokeWidth: 2,
                                    d: "M6 18L18 6M6 6l12 12"
                                }, void 0, false, {
                                    fileName: "[project]/src/components/modals/TermsModal.tsx",
                                    lineNumber: 66,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/src/components/modals/TermsModal.tsx",
                                lineNumber: 65,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/src/components/modals/TermsModal.tsx",
                            lineNumber: 57,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/modals/TermsModal.tsx",
                    lineNumber: 40,
                    columnNumber: 9
                }, this),
                items.length > 3 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "px-6 py-2.5 bg-[#0a0d24] border-b border-white/5 shrink-0",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "text",
                        value: search,
                        onChange: (e)=>setSearch(e.target.value),
                        placeholder: "🔍 Tra cứu nội dung điều khoản...",
                        className: "w-full px-3.5 py-1.5 rounded-xl bg-[#0e122b] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#3fe9d6] placeholder:text-slate-500"
                    }, void 0, false, {
                        fileName: "[project]/src/components/modals/TermsModal.tsx",
                        lineNumber: 74,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/modals/TermsModal.tsx",
                    lineNumber: 73,
                    columnNumber: 11
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex-1 overflow-y-auto p-6 space-y-4 font-sans text-xs sm:text-sm text-slate-200 leading-relaxed",
                    children: loading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "py-16 flex flex-col items-center justify-center space-y-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "w-8 h-8 border-2 border-[#3fe9d6] border-t-transparent rounded-full animate-spin"
                            }, void 0, false, {
                                fileName: "[project]/src/components/modals/TermsModal.tsx",
                                lineNumber: 88,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-xs font-mono text-slate-400",
                                children: "Đang tải điều khoản từ máy chủ Veyra..."
                            }, void 0, false, {
                                fileName: "[project]/src/components/modals/TermsModal.tsx",
                                lineNumber: 89,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/components/modals/TermsModal.tsx",
                        lineNumber: 87,
                        columnNumber: 13
                    }, this) : filteredItems.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "py-12 text-center text-slate-400 font-mono text-xs",
                        children: "Không tìm thấy điều khoản nào khớp với từ khóa."
                    }, void 0, false, {
                        fileName: "[project]/src/components/modals/TermsModal.tsx",
                        lineNumber: 92,
                        columnNumber: 13
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "p-6 rounded-xl bg-[#0b0f29]/90 border border-white/10 space-y-6",
                        children: filteredItems.map((item, idx)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: `space-y-2.5 ${idx !== filteredItems.length - 1 ? "border-b border-white/10 pb-6" : ""}`,
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        className: "text-sm sm:text-base font-bold text-white uppercase font-[family-name:var(--font-rajdhani)] tracking-wide flex items-baseline gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-[#3fe9d6] font-mono font-bold text-base",
                                                children: [
                                                    idx + 1,
                                                    "."
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/src/components/modals/TermsModal.tsx",
                                                lineNumber: 105,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: item.Title
                                            }, void 0, false, {
                                                fileName: "[project]/src/components/modals/TermsModal.tsx",
                                                lineNumber: 106,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/src/components/modals/TermsModal.tsx",
                                        lineNumber: 104,
                                        columnNumber: 19
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-xs sm:text-sm text-slate-300 font-sans leading-relaxed whitespace-pre-wrap pl-5 font-light",
                                        children: item.Content
                                    }, void 0, false, {
                                        fileName: "[project]/src/components/modals/TermsModal.tsx",
                                        lineNumber: 108,
                                        columnNumber: 19
                                    }, this)
                                ]
                            }, item.id + idx, true, {
                                fileName: "[project]/src/components/modals/TermsModal.tsx",
                                lineNumber: 98,
                                columnNumber: 17
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/src/components/modals/TermsModal.tsx",
                        lineNumber: 96,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/components/modals/TermsModal.tsx",
                    lineNumber: 85,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "px-6 py-4 border-t border-white/10 bg-[#080b1d] flex items-center justify-between shrink-0",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-xs font-mono text-slate-400",
                            children: "© 2026 Valkyria of Veyra · Unity Engine RPG"
                        }, void 0, false, {
                            fileName: "[project]/src/components/modals/TermsModal.tsx",
                            lineNumber: 119,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            onClick: ()=>{
                                __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$audio$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["soundEngine"].playClick();
                                onClose();
                            },
                            className: "px-5 py-2 rounded-xl bg-gradient-to-r from-[#3fe9d6] to-[#0ea5e9] text-[#060814] font-bold font-mono text-xs uppercase tracking-wider hover:shadow-[0_0_15px_rgba(63,233,214,0.4)] transition-all cursor-pointer",
                            children: "Đã Hiểu & Đóng"
                        }, void 0, false, {
                            fileName: "[project]/src/components/modals/TermsModal.tsx",
                            lineNumber: 122,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/src/components/modals/TermsModal.tsx",
                    lineNumber: 118,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/src/components/modals/TermsModal.tsx",
            lineNumber: 38,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/components/modals/TermsModal.tsx",
        lineNumber: 37,
        columnNumber: 5
    }, this);
}
_s(TermsModal, "sPFiugXFqDwqP65G/Q0f/RPUaPU=");
_c = TermsModal;
var _c;
__turbopack_context__.k.register(_c, "TermsModal");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/firebase.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "app",
    ()=>app,
    "auth",
    ()=>auth,
    "db",
    ()=>db,
    "firebaseConfig",
    ()=>firebaseConfig,
    "googleProvider",
    ()=>googleProvider,
    "isFirebaseConfigured",
    ()=>isFirebaseConfigured
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/app/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@firebase/app/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/auth/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2d$4NFEPWkC$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__D__as__getAuth$3e$__ = __turbopack_context__.i("[project]/node_modules/@firebase/auth/dist/esm/index-4NFEPWkC.js [app-client] (ecmascript) <export D as getAuth>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2d$4NFEPWkC$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__f__as__GoogleAuthProvider$3e$__ = __turbopack_context__.i("[project]/node_modules/@firebase/auth/dist/esm/index-4NFEPWkC.js [app-client] (ecmascript) <export f as GoogleAuthProvider>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$firestore$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/firestore/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$CLMydGSF$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__aV__as__getFirestore$3e$__ = __turbopack_context__.i("[project]/node_modules/@firebase/firestore/dist/common-CLMydGSF.esm.js [app-client] (ecmascript) <export aV as getFirestore>");
;
;
;
const firebaseConfig = {
    apiKey: ("TURBOPACK compile-time value", "AIzaSyCQdTkWkpM33rylHlBRa6_AnGFM3dt-PEM") || "AIzaSyCQdTkWkpM33rylHlBRa6_AnGFM3dt-PEM",
    authDomain: ("TURBOPACK compile-time value", "valkyria-of-verya.firebaseapp.com") || "valkyria-of-verya.firebaseapp.com",
    databaseURL: ("TURBOPACK compile-time value", "https://valkyria-of-verya-default-rtdb.asia-southeast1.firebasedatabase.app") || "https://valkyria-of-verya-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: ("TURBOPACK compile-time value", "valkyria-of-verya") || "valkyria-of-verya",
    storageBucket: ("TURBOPACK compile-time value", "valkyria-of-verya.firebasestorage.app") || "valkyria-of-verya.firebasestorage.app",
    messagingSenderId: ("TURBOPACK compile-time value", "1095233330488") || "1095233330488",
    appId: ("TURBOPACK compile-time value", "1:1095233330488:web:bb59fb772a02ae20e6b5cd") || "1:1095233330488:web:bb59fb772a02ae20e6b5cd",
    measurementId: ("TURBOPACK compile-time value", "G-NFDW2HSQ55") || "G-NFDW2HSQ55"
};
const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
let app = null;
let auth = null;
let db = null;
const googleProvider = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2d$4NFEPWkC$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__f__as__GoogleAuthProvider$3e$__["GoogleAuthProvider"]();
googleProvider.setCustomParameters({
    prompt: "select_account"
});
if (isFirebaseConfigured) {
    app = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getApps"])().length > 0 ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getApp"])() : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$app$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["initializeApp"])(firebaseConfig);
    auth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2d$4NFEPWkC$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__D__as__getAuth$3e$__["getAuth"])(app);
    db = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$CLMydGSF$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__aV__as__getFirestore$3e$__["getFirestore"])(app);
}
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/services/audio.service.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "soundEngine",
    ()=>soundEngine
]);
// Web Audio API ambient synth & sound effects
class SoundEngine {
    ctx = null;
    isPlayingBgm = false;
    bgmInterval = null;
    initContext() {
        if (!this.ctx && ("TURBOPACK compile-time value", "object") !== "undefined") {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === "suspended") {
            this.ctx.resume();
        }
    }
    // Play subtle UI button click chime
    playClick() {
        try {
            this.initContext();
            if (!this.ctx) return;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(880, this.ctx.currentTime); // A5
            osc.frequency.exponentialRampToValueAtTime(1320, this.ctx.currentTime + 0.08);
            gain.gain.setValueAtTime(0.04, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.12);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + 0.12);
        } catch  {
        // Audio context might be restricted before user interaction
        }
    }
    // Play character switch celestial chime
    playCelestialChime() {
        try {
            this.initContext();
            if (!this.ctx) return;
            const notes = [
                523.25,
                659.25,
                783.99,
                1046.5
            ]; // C5, E5, G5, C6
            notes.forEach((freq, i)=>{
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.06);
                gain.gain.setValueAtTime(0.03, this.ctx.currentTime + i * 0.06);
                gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + i * 0.06 + 0.4);
                osc.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start(this.ctx.currentTime + i * 0.06);
                osc.stop(this.ctx.currentTime + i * 0.06 + 0.45);
            });
        } catch  {
        // Ignore audio failure
        }
    }
    // Toggle ambient BGM chord progression (ethereal space pad)
    toggleBgm(onStateChange) {
        this.initContext();
        if (this.isPlayingBgm) {
            this.stopBgm();
            if (onStateChange) onStateChange(false);
            return false;
        } else {
            this.startBgm();
            if (onStateChange) onStateChange(true);
            return true;
        }
    }
    startBgm() {
        if (this.isPlayingBgm || !this.ctx) return;
        this.isPlayingBgm = true;
        // Cosmic chord progressions: D minor, Bb major, F major, C major (epic sci-fi feel)
        const chords = [
            [
                293.66,
                349.23,
                440.0,
                587.33
            ],
            [
                233.08,
                293.66,
                349.23,
                466.16
            ],
            [
                174.61,
                261.63,
                349.23,
                523.25
            ],
            [
                261.63,
                329.63,
                392.0,
                523.25
            ]
        ];
        let chordIdx = 0;
        const playChord = ()=>{
            if (!this.isPlayingBgm || !this.ctx) return;
            const currentChord = chords[chordIdx % chords.length];
            chordIdx++;
            currentChord.forEach((freq)=>{
                if (!this.ctx) return;
                const osc = this.ctx.createOscillator();
                const filter = this.ctx.createBiquadFilter();
                const gain = this.ctx.createGain();
                osc.type = "triangle";
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
                filter.type = "lowpass";
                filter.frequency.setValueAtTime(800, this.ctx.currentTime);
                filter.frequency.exponentialRampToValueAtTime(1400, this.ctx.currentTime + 2);
                filter.frequency.exponentialRampToValueAtTime(700, this.ctx.currentTime + 3.8);
                gain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.015, this.ctx.currentTime + 1.2);
                gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 3.9);
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.ctx.destination);
                osc.start();
                osc.stop(this.ctx.currentTime + 4.0);
            });
        };
        playChord();
        this.bgmInterval = setInterval(playChord, 3800);
    }
    stopBgm() {
        this.isPlayingBgm = false;
        if (this.bgmInterval) {
            clearInterval(this.bgmInterval);
            this.bgmInterval = null;
        }
    }
    isBgmPlaying() {
        return this.isPlayingBgm;
    }
}
const soundEngine = new SoundEngine();
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/services/auth.service.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BannedAccountError",
    ()=>BannedAccountError,
    "authService",
    ()=>authService,
    "normalizeRole",
    ()=>normalizeRole,
    "useAuth",
    ()=>useAuth,
    "useIsMounted",
    ()=>useIsMounted
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$auth$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/auth/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2d$4NFEPWkC$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__af__as__signInWithEmailAndPassword$3e$__ = __turbopack_context__.i("[project]/node_modules/@firebase/auth/dist/esm/index-4NFEPWkC.js [app-client] (ecmascript) <export af as signInWithEmailAndPassword>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2d$4NFEPWkC$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__x__as__createUserWithEmailAndPassword$3e$__ = __turbopack_context__.i("[project]/node_modules/@firebase/auth/dist/esm/index-4NFEPWkC.js [app-client] (ecmascript) <export x as createUserWithEmailAndPassword>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2d$4NFEPWkC$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__aq__as__updateProfile$3e$__ = __turbopack_context__.i("[project]/node_modules/@firebase/auth/dist/esm/index-4NFEPWkC.js [app-client] (ecmascript) <export aq as updateProfile>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2d$4NFEPWkC$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__ai__as__signInWithPopup$3e$__ = __turbopack_context__.i("[project]/node_modules/@firebase/auth/dist/esm/index-4NFEPWkC.js [app-client] (ecmascript) <export ai as signInWithPopup>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2d$4NFEPWkC$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__ak__as__signOut$3e$__ = __turbopack_context__.i("[project]/node_modules/@firebase/auth/dist/esm/index-4NFEPWkC.js [app-client] (ecmascript) <export ak as signOut>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2d$4NFEPWkC$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__a9__as__sendPasswordResetEmail$3e$__ = __turbopack_context__.i("[project]/node_modules/@firebase/auth/dist/esm/index-4NFEPWkC.js [app-client] (ecmascript) <export a9 as sendPasswordResetEmail>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2d$4NFEPWkC$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$5f$__as__onAuthStateChanged$3e$__ = __turbopack_context__.i("[project]/node_modules/@firebase/auth/dist/esm/index-4NFEPWkC.js [app-client] (ecmascript) <export _ as onAuthStateChanged>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$firestore$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/firestore/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$CLMydGSF$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__v__as__doc$3e$__ = __turbopack_context__.i("[project]/node_modules/@firebase/firestore/dist/common-CLMydGSF.esm.js [app-client] (ecmascript) <export v as doc>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@firebase/firestore/dist/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/firebase.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$players$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/services/players.service.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
;
;
;
;
;
function normalizeRole(roleStr) {
    if (!roleStr) return "Player";
    const trimmed = roleStr.trim().toLowerCase();
    if (trimmed === "admin") return "Admin";
    if (trimmed === "manager") return "Manager";
    return "Player";
}
class BannedAccountError extends Error {
    violation;
    constructor(violation){
        super("Tài khoản của bạn đã bị khóa do vi phạm Điều khoản Dịch vụ Veyra.");
        this.name = "BannedAccountError";
        this.violation = violation;
    }
}
const AUTH_CACHE_KEY = "vov_auth_commander";
// Store bộ nhớ đệm cho React useSyncExternalStore
let inMemoryUser = null;
if ("TURBOPACK compile-time truthy", 1) {
    try {
        const raw = localStorage.getItem(AUTH_CACHE_KEY);
        if (raw) inMemoryUser = JSON.parse(raw);
    } catch  {}
}
const authListeners = new Set();
function notifyAuthListeners() {
    authListeners.forEach((fn)=>fn());
}
let isGlobalAuthInit = false;
function ensureGlobalAuthInit() {
    if (isGlobalAuthInit || ("TURBOPACK compile-time value", "object") === "undefined" || !__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"]) return;
    isGlobalAuthInit = true;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2d$4NFEPWkC$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__$5f$__as__onAuthStateChanged$3e$__["onAuthStateChanged"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"], async (firebaseUser)=>{
        if (firebaseUser) {
            let username = firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Chỉ Huy";
            let role = "Player";
            let createdAt = undefined;
            let lastLogin = undefined;
            inMemoryUser = {
                id: firebaseUser.uid,
                username,
                email: firebaseUser.email || "",
                level: 1,
                role,
                createdAt,
                lastLogin
            };
            try {
                localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(inMemoryUser));
            } catch  {}
            notifyAuthListeners();
            // Đồng bộ thông tin chi tiết từ Firestore Users document
            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"]) {
                try {
                    const snap = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$CLMydGSF$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__v__as__doc$3e$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"], "Users", firebaseUser.uid));
                    if (snap.exists()) {
                        const data = snap.data();
                        if (data.Username) username = data.Username;
                        if (data.Role) role = normalizeRole(data.Role);
                        if (data.CreatedAt) createdAt = data.CreatedAt;
                        if (data.LastLogin) lastLogin = data.LastLogin;
                        const isBanned = data.IsBanned === true || data.Status === "banned";
                        const status = isBanned ? "banned" : data.Status === "pending" ? "pending" : "active";
                        if (isBanned) {
                            if (__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"]) await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2d$4NFEPWkC$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__ak__as__signOut$3e$__["signOut"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"]);
                            inMemoryUser = null;
                            try {
                                localStorage.removeItem(AUTH_CACHE_KEY);
                            } catch  {}
                            notifyAuthListeners();
                            return;
                        }
                        inMemoryUser = {
                            id: firebaseUser.uid,
                            username,
                            email: firebaseUser.email || "",
                            level: 1,
                            role,
                            status,
                            isBanned,
                            createdAt,
                            lastLogin
                        };
                        try {
                            localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(inMemoryUser));
                        } catch  {}
                        notifyAuthListeners();
                    }
                } catch  {
                // Bỏ qua nếu offline hoặc chưa phân quyền
                }
            }
        } else {
            inMemoryUser = null;
            try {
                localStorage.removeItem(AUTH_CACHE_KEY);
            } catch  {}
            notifyAuthListeners();
        }
    });
}
const authService = {
    // Lấy lỗi tiếng Việt thân thiện từ Firebase Auth
    getErrorMessage (errCode, defaultMsg) {
        switch(errCode){
            case "auth/operation-not-allowed":
                return "Phương thức Email/Password chưa được Bật trên Firebase Console! Vui lòng vào Firebase Console > Build > Authentication > Sign-in method và Bật (Enable) Email/Password.";
            case "auth/email-already-in-use":
                return "Email này đã được đăng ký tài khoản trên hệ thống Firebase.";
            case "auth/invalid-email":
                return "Địa chỉ email không đúng định dạng.";
            case "auth/weak-password":
                return "Mật khẩu quá ngắn (Firebase yêu cầu tối thiểu 6 ký tự).";
            case "auth/user-not-found":
                return "Không tìm thấy tài khoản với email này trên Firebase.";
            case "auth/wrong-password":
            case "auth/invalid-credential":
                return "Email hoặc mật khẩu không chính xác.";
            case "auth/too-many-requests":
                return "Thao tác quá nhiều lần liên tiếp. Vui lòng chờ ít phút rồi thử lại.";
            case "auth/popup-closed-by-user":
                return "Cửa sổ đăng nhập Google đã bị đóng trước khi xác thực.";
            default:
                return defaultMsg || "Có lỗi xảy ra trong quá trình xác thực.";
        }
    },
    // Helper: Tạo hoặc Cập nhật document trong Firestore collection "Users" theo đúng motip chuẩn
    async saveUserToFirestore (userData) {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"]) return null;
        try {
            const userDocRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$CLMydGSF$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__v__as__doc$3e$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"], "Users", userData.uid);
            const now = new Date().toISOString();
            if (userData.isNewUser) {
                const docData = {
                    UserId: userData.uid,
                    Username: userData.username,
                    Email: userData.email,
                    Role: "Player",
                    Status: "active",
                    IsBanned: false,
                    CreatedAt: now,
                    LastLogin: now
                };
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["setDoc"])(userDocRef, docData);
                return docData;
            } else {
                const userDocSnap = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getDoc"])(userDocRef);
                if (!userDocSnap.exists()) {
                    const docData = {
                        UserId: userData.uid,
                        Username: userData.username,
                        Email: userData.email,
                        Role: "Player",
                        Status: "active",
                        IsBanned: false,
                        CreatedAt: now,
                        LastLogin: now
                    };
                    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["setDoc"])(userDocRef, docData);
                    return docData;
                } else {
                    const existingData = userDocSnap.data();
                    const updates = {
                        LastLogin: now
                    };
                    if (!existingData.Status) {
                        updates.Status = existingData.IsBanned ? "banned" : "active";
                    }
                    if (existingData.IsBanned === undefined) {
                        updates.IsBanned = false;
                    }
                    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["setDoc"])(userDocRef, updates, {
                        merge: true
                    });
                    const isBanned = existingData.IsBanned === true || existingData.Status === "banned";
                    const status = existingData.Status || (isBanned ? "banned" : "active");
                    return {
                        UserId: userData.uid,
                        Username: existingData.Username || userData.username,
                        Email: existingData.Email || userData.email,
                        Role: normalizeRole(existingData.Role),
                        Status: status,
                        IsBanned: isBanned,
                        CreatedAt: existingData.CreatedAt || now,
                        LastLogin: now,
                        BanDetails: existingData.BanDetails || existingData?.banDetails
                    };
                }
            }
        } catch (err) {
            console.warn("Lỗi lưu document vào Firestore collection Users:", err);
            return null;
        }
    },
    // 1. Đăng ký tài khoản THẬT trên Firebase + Tạo document trong Firestore Users
    async register (data) {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"] || !__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isFirebaseConfigured"]) {
            throw new Error("Cấu hình Firebase chưa được khởi tạo. Vui lòng kiểm tra .env.local");
        }
        try {
            // Tạo User trên Firebase Authentication
            const credential = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2d$4NFEPWkC$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__x__as__createUserWithEmailAndPassword$3e$__["createUserWithEmailAndPassword"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"], data.email.trim(), data.password);
            const username = data.username.trim() || credential.user.email?.split("@")[0] || "Chỉ Huy";
            // Cập nhật Tên hiển thị (DisplayName) trên Firebase Auth
            if (data.username.trim()) {
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2d$4NFEPWkC$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__aq__as__updateProfile$3e$__["updateProfile"])(credential.user, {
                    displayName: username
                });
            }
            // Tạo Document trong Firestore Users theo motip chuẩn:
            // UserId, Username, Email, Role, Status, IsBanned, CreatedAt, LastLogin
            const firestoreUser = await this.saveUserToFirestore({
                uid: credential.user.uid,
                email: credential.user.email || data.email.trim(),
                username,
                isNewUser: true
            });
            // Đồng bộ sang NestJS Backend (/api/players) nếu Backend đang chạy
            try {
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$players$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["playersService"].create({
                    username,
                    email: data.email.trim()
                });
            } catch  {
            // Nếu Backend chưa có DB thì vẫn tiếp tục, không chặn luồng đăng ký của Firebase
            }
            return {
                id: credential.user.uid,
                username,
                email: credential.user.email || data.email,
                level: 1,
                role: normalizeRole(firestoreUser?.Role),
                status: firestoreUser?.Status || "active",
                isBanned: firestoreUser?.IsBanned || false,
                createdAt: firestoreUser?.CreatedAt,
                lastLogin: firestoreUser?.LastLogin
            };
        } catch (err) {
            const error = err;
            throw new Error(this.getErrorMessage(error.code || "", error.message || "Đăng ký thất bại"));
        }
    },
    // 2. Đăng nhập tài khoản THẬT từ Firebase Authentication + Cập nhật LastLogin trên Firestore Users
    async login (data) {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"] || !__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isFirebaseConfigured"]) {
            throw new Error("Cấu hình Firebase chưa được khởi tạo. Vui lòng kiểm tra .env.local");
        }
        try {
            const credential = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2d$4NFEPWkC$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__af__as__signInWithEmailAndPassword$3e$__["signInWithEmailAndPassword"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"], data.email.trim(), data.password);
            const username = credential.user.displayName || credential.user.email?.split("@")[0] || "Chỉ Huy";
            // Cập nhật LastLogin trên Firestore Users
            const firestoreUser = await this.saveUserToFirestore({
                uid: credential.user.uid,
                email: credential.user.email || data.email.trim(),
                username,
                isNewUser: false
            });
            // Kiểm tra tài khoản bị khóa
            if (firestoreUser?.IsBanned || firestoreUser?.Status === "banned") {
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2d$4NFEPWkC$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__ak__as__signOut$3e$__["signOut"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"]);
                const rawBan = firestoreUser?.BanDetails || {};
                throw new BannedAccountError({
                    termId: rawBan.termId || "term01",
                    termTitle: rawBan.termTitle || "Vi phạm Điều khoản Dịch vụ Veyra",
                    termContent: rawBan.termContent || "",
                    note: rawBan.note || "Tài khoản bị phong ấn bởi Ban Quản Trị",
                    bannedAt: rawBan.bannedAt || "",
                    bannedBy: rawBan.bannedBy || "Ban Quản Trị",
                    username: firestoreUser?.Username || username,
                    email: credential.user.email || data.email
                });
            }
            return {
                id: credential.user.uid,
                username: firestoreUser?.Username || username,
                email: credential.user.email || data.email,
                level: 1,
                role: normalizeRole(firestoreUser?.Role),
                status: firestoreUser?.Status || "active",
                isBanned: firestoreUser?.IsBanned || false,
                createdAt: firestoreUser?.CreatedAt,
                lastLogin: firestoreUser?.LastLogin
            };
        } catch (err) {
            if (err instanceof BannedAccountError || err?.name === "BannedAccountError") {
                throw err;
            }
            const error = err;
            throw new Error(this.getErrorMessage(error.code || "", error.message || "Đăng nhập thất bại"));
        }
    },
    // 3. Đăng nhập một chạm bằng Google + Đồng bộ Firestore Users
    async loginWithGoogle () {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"] || !__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isFirebaseConfigured"]) {
            throw new Error("Cấu hình Firebase chưa được khởi tạo.");
        }
        try {
            const credential = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2d$4NFEPWkC$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__ai__as__signInWithPopup$3e$__["signInWithPopup"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"], __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["googleProvider"]);
            const username = credential.user.displayName || credential.user.email?.split("@")[0] || "Chỉ Huy";
            // Lưu hoặc cập nhật LastLogin trên Firestore Users
            const firestoreUser = await this.saveUserToFirestore({
                uid: credential.user.uid,
                email: credential.user.email || "",
                username,
                isNewUser: false
            });
            // Kiểm tra tài khoản bị khóa
            if (firestoreUser?.IsBanned || firestoreUser?.Status === "banned") {
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2d$4NFEPWkC$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__ak__as__signOut$3e$__["signOut"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"]);
                const rawBan = firestoreUser?.BanDetails || {};
                throw new BannedAccountError({
                    termId: rawBan.termId || "term01",
                    termTitle: rawBan.termTitle || "Vi phạm Điều khoản Dịch vụ Veyra",
                    termContent: rawBan.termContent || "",
                    note: rawBan.note || "Tài khoản bị phong ấn bởi Ban Quản Trị",
                    bannedAt: rawBan.bannedAt || "",
                    bannedBy: rawBan.bannedBy || "Ban Quản Trị",
                    username: firestoreUser?.Username || username,
                    email: credential.user.email || ""
                });
            }
            // Đồng bộ thông tin người chơi sang NestJS
            try {
                await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$services$2f$players$2e$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["playersService"].create({
                    username: firestoreUser?.Username || username,
                    email: credential.user.email || ""
                });
            } catch  {
            // Backend optional
            }
            return {
                id: credential.user.uid,
                username: firestoreUser?.Username || username,
                email: credential.user.email || "",
                level: 1,
                role: normalizeRole(firestoreUser?.Role),
                status: firestoreUser?.Status || "active",
                isBanned: firestoreUser?.IsBanned || false,
                createdAt: firestoreUser?.CreatedAt,
                lastLogin: firestoreUser?.LastLogin
            };
        } catch (err) {
            if (err instanceof BannedAccountError || err?.name === "BannedAccountError") {
                throw err;
            }
            const error = err;
            throw new Error(this.getErrorMessage(error.code || "", error.message || "Đăng nhập Google thất bại"));
        }
    },
    // 4. Quên mật khẩu THẬT - Firebase gửi email khôi phục mật khẩu trực tiếp đến Gmail
    async forgotPassword (email) {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"] || !__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isFirebaseConfigured"]) {
            throw new Error("Cấu hình Firebase chưa được khởi tạo.");
        }
        if (!email.trim()) {
            throw new Error("Vui lòng nhập địa chỉ Email vào ô bên trên để nhận hướng dẫn khôi phục mật khẩu.");
        }
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2d$4NFEPWkC$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__a9__as__sendPasswordResetEmail$3e$__["sendPasswordResetEmail"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"], email.trim());
            return `Email khôi phục mật khẩu đã được gửi đến "${email.trim()}". Vui lòng kiểm tra hộp thư (kể cả mục Spam) để đặt lại mật khẩu!`;
        } catch (err) {
            const error = err;
            throw new Error(this.getErrorMessage(error.code || "", error.message || "Không thể gửi email khôi phục."));
        }
    },
    // Lấy tài khoản lưu nhanh trong cache (localStorage)
    getCachedUser () {
        return inMemoryUser;
    },
    setCachedUser (user) {
        inMemoryUser = user;
        if ("TURBOPACK compile-time truthy", 1) {
            try {
                if (user) {
                    localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(user));
                } else {
                    localStorage.removeItem(AUTH_CACHE_KEY);
                }
            } catch  {}
        }
        notifyAuthListeners();
    },
    // Cho React useSyncExternalStore
    subscribe (callback) {
        ensureGlobalAuthInit();
        authListeners.add(callback);
        return ()=>{
            authListeners.delete(callback);
        };
    },
    getSnapshot () {
        return inMemoryUser;
    },
    getServerSnapshot () {
        return null;
    },
    // 5. Đăng xuất Firebase
    async logout () {
        this.setCachedUser(null);
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"]) return;
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$auth$2f$dist$2f$esm$2f$index$2d$4NFEPWkC$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__ak__as__signOut$3e$__["signOut"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"]);
    },
    // 6. Lắng nghe trạng thái đăng nhập Firebase trong thời gian thực
    onAuthStateChanged (callback) {
        ensureGlobalAuthInit();
        const listener = ()=>callback(inMemoryUser);
        authListeners.add(listener);
        callback(inMemoryUser);
        return ()=>{
            authListeners.delete(listener);
        };
    }
};
const emptySubscribe = ()=>()=>{};
function useIsMounted() {
    _s();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSyncExternalStore"])(emptySubscribe, {
        "useIsMounted.useSyncExternalStore": ()=>true
    }["useIsMounted.useSyncExternalStore"], {
        "useIsMounted.useSyncExternalStore": ()=>false
    }["useIsMounted.useSyncExternalStore"]);
}
_s(useIsMounted, "FpwL93IKMLJZuQQXefVtWynbBPQ=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSyncExternalStore"]
    ];
});
function useAuth() {
    _s1();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSyncExternalStore"])(authService.subscribe, authService.getSnapshot, authService.getServerSnapshot);
}
_s1(useAuth, "FpwL93IKMLJZuQQXefVtWynbBPQ=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSyncExternalStore"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/services/players.service.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "playersService",
    ()=>playersService
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
// services/players.service.ts
// Layer gọi API từ Frontend → NestJS Backend
const API_URL = ("TURBOPACK compile-time value", "http://localhost:3001/api");
const playersService = {
    // GET /api/players
    async getAll () {
        const res = await fetch(`${API_URL}/players`);
        if (!res.ok) throw new Error('Failed to fetch players');
        return res.json();
    },
    // GET /api/players/:id
    async getById (id) {
        const res = await fetch(`${API_URL}/players/${id}`);
        if (!res.ok) throw new Error(`Player ${id} not found`);
        return res.json();
    },
    // POST /api/players
    async create (data) {
        const res = await fetch(`${API_URL}/players`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error('Failed to create player');
        return res.json();
    },
    // DELETE /api/players/:id
    async remove (id) {
        const res = await fetch(`${API_URL}/players/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error('Failed to delete player');
        return res.json();
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/services/settings.service.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_BANNER",
    ()=>DEFAULT_BANNER,
    "DEFAULT_GAME_INFO",
    ()=>DEFAULT_GAME_INFO,
    "DEFAULT_POLICY_LIST",
    ()=>DEFAULT_POLICY_LIST,
    "DEFAULT_SECURITY",
    ()=>DEFAULT_SECURITY,
    "DEFAULT_TERMS",
    ()=>DEFAULT_TERMS,
    "DEFAULT_TERMS_LIST",
    ()=>DEFAULT_TERMS_LIST,
    "settingsService",
    ()=>settingsService
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$firebase$2f$firestore$2f$dist$2f$esm$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/firebase/firestore/dist/esm/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$CLMydGSF$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__v__as__doc$3e$__ = __turbopack_context__.i("[project]/node_modules/@firebase/firestore/dist/common-CLMydGSF.esm.js [app-client] (ecmascript) <export v as doc>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@firebase/firestore/dist/index.esm.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$CLMydGSF$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__aL__as__collection$3e$__ = __turbopack_context__.i("[project]/node_modules/@firebase/firestore/dist/common-CLMydGSF.esm.js [app-client] (ecmascript) <export aL as collection>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/firebase.ts [app-client] (ecmascript)");
;
;
const DEFAULT_TERMS = {
    version: "1.0.0",
    effectiveDate: "2026-10-30",
    lastUpdated: "30/10/2026",
    title: "Điều Khoản Dịch Vụ & Hiệp Ước Đại Lục Veyra",
    summary: "Vui lòng đọc kỹ các điều khoản trước khi gia nhập đại lục Veyra và đồng hành cùng các Valkyria. Việc đăng ký tài khoản đồng nghĩa với việc bạn chấp thuận toàn bộ quy ước này.",
    content: `# ĐIỀU KHOẢN DỊCH VỤ VÀ HIỆP ƯỚC CHỈ HUY - VALKYRIA OF VEYRA

Chào mừng bạn đến với **Valkyria of Veyra** (sau đây gọi tắt là "Trò Chơi" hoặc "Hệ Thống"), tựa game Nhập Vai Chiến Thuật Theo Lượt (Turn-Based RPG) phát triển trên nền tảng **Unity Engine**.

Khi bạn tạo tài khoản, đăng nhập hoặc tham gia bất kỳ hoạt động nào trong trò chơi, bạn chính thức trở thành một **Chỉ Huy** và đồng ý chịu ràng buộc bởi các điều khoản dưới đây.

---

### 1. QUYỀN SỞ HỮU & TÀI KHOẢN CHỈ HUY
1.1. Mỗi Chỉ Huy chịu trách nhiệm hoàn toàn về việc bảo mật thông tin đăng nhập, mật khẩu và hòm thư liên kết.
1.2. Mọi tài khoản, nhân vật Valkyria, trang bị và vật phẩm ảo trong game đều thuộc quyền sở hữu trí tuệ của nhà phát hành Valkyria of Veyra. Người chơi được cấp quyền sử dụng dịch vụ phi thương mại.
1.3. Nghiêm cấm hành vi mua bán, trao đổi tài khoản bằng tiền mặt ngoài hệ thống chính thức. Mọi tranh chấp phát sinh từ việc chia sẻ hoặc mua bán tài khoản sẽ không được hỗ trợ giải quyết.

---

### 2. QUY TẮC ỨNG XỬ & CHỐNG GIAN LẬN (ANTI-CHEAT)
2.1. **Nghiêm cấm can thiệp**: Mọi hành vi sử dụng phần mềm thứ ba, can thiệp bộ nhớ, chỉnh sửa file cài đặt Unity, sử dụng auto/bot/macro không được cấp phép đều bị coi là vi phạm nghiêm trọng.
2.2. **Lợi dụng lỗi (Bug Abuse)**: Chỉ Huy phát hiện lỗ hổng hệ thống có nghĩa vụ thông báo cho Ban Quản Trị. Việc cố tình trục lợi từ lỗi game sẽ dẫn đến việc thu hồi vật phẩm hoặc khóa tài khoản vĩnh viễn (Perma-ban).
2.3. **Văn hóa cộng đồng**: Tôn trọng các Chỉ Huy khác. Nghiêm cấm phát ngôn thù địch, xúc phạm danh dự, truyền bá văn hóa phẩm đồi trụy hoặc lừa đảo trong các kênh chat thế giới và diễn đàn.

---

### 3. HỆ THỐNG TIỀN TỆ & TÍNH NĂNG TRIỆU HỒI (GACHA)
3.1. Các đơn vị tiền tệ ảo (như Tinh Thể Veyra, Vé Triệu Hồi Valkyria) được cung cấp thông qua nhiệm vụ hoặc nạp thẻ.
3.2. Tính năng Triệu Hồi Valkyria tuân thủ tỷ lệ xuất hiện ngẫu nhiên công khai. Mọi lượt triệu hồi khi đã thực hiện thành công sẽ không thể hoàn tác hoặc hoàn tiền.
3.3. Các trường hợp nạp tiền qua cổng thanh toán không chính thống hoặc nạp lậu / refund gian lận sẽ bị phong ấn tài khoản ngay lập tức cho đến khi bồi hoàn đầy đủ.

---

### 4. BẢO TRÌ & CẬP NHẬT MÁY CHỦ
4.1. Hệ thống có quyền tạm ngưng cung cấp dịch vụ định kỳ để bảo trì, cập nhật tính năng mới hoặc vá lỗi kỹ thuật. Lịch bảo trì sẽ được thông báo trước trên Trang Chủ và các kênh truyền thông chính thức.
4.2. Ban Quản Trị sẽ gửi thư đền bù tương ứng (Veyra Crystals, Năng Lượng) đến hòm thư của toàn thể Chỉ Huy sau mỗi đợt bảo trì.

---

### 5. SỬA ĐỔI ĐIỀU KHOẢN
5.1. Ban Quản Trị có quyền điều chỉnh nội dung Hiệp ước này để phù hợp với quy định pháp luật và định hướng phát triển của trò chơi.
5.2. Mọi thay đổi sẽ có hiệu lực kể từ ngày được công bố trên trang Cấu hình chính thức. Việc bạn tiếp tục tham gia trò chơi đồng nghĩa với việc chấp thuận các điều khoản sửa đổi.

*Ban Quản Trị Valkyria of Veyra trân trọng cảm ơn sự đồng hành của bạn trên hành trình thám hiểm đại lục Veyra!*`
};
const DEFAULT_GAME_INFO = {
    gameTitle: "Valkyria of Veyra",
    slogan: "Khám phá đại lục Veyra huyền bí, sát cánh chiến đấu cùng các Valkyria kiêu hùng.",
    currentVersion: "v1.0.4",
    unityBuild: "Unity 2026.1 LTS - Build #142",
    forceUpdate: false,
    downloadPcUrl: "https://vov.gg/download/client-pc-v1.0.4.exe",
    downloadAndroidUrl: "https://play.google.com/store/apps/details?id=com.vov.game",
    downloadIosUrl: "https://testflight.apple.com/join/vov2026",
    discordUrl: "https://discord.gg/valkyria-veyra",
    facebookUrl: "https://facebook.com/valkyriaofveyra",
    youtubeUrl: "https://youtube.com/@valkyriaofveyra"
};
const DEFAULT_SECURITY = {
    allowRegistration: true,
    registrationMode: "open",
    supportEmail: "support@veyra.game",
    minPasswordLength: 6
};
const DEFAULT_BANNER = {
    enabled: true,
    message: "Chiến dịch Thử Nghiệm Alpha Test đã chính thức khai mở trên đại lục Veyra! Đăng ký ngay để nhận 50 lượt Triệu Hồi Valkyria miễn phí.",
    type: "celebrate",
    actionText: "Khám Phá Ngay",
    actionUrl: "/login"
};
const DEFAULT_TERMS_LIST = [
    {
        id: "term01",
        Title: "Quyền Sở Hữu & Tài Khoản Chỉ Huy",
        Content: "Mỗi Chỉ Huy chịu trách nhiệm hoàn toàn về việc bảo mật thông tin đăng nhập, mật khẩu và hòm thư liên kết. Mọi tài khoản, nhân vật Valkyria, trang bị và vật phẩm ảo trong game đều thuộc quyền sở hữu trí tuệ của nhà phát hành Valkyria of Veyra (Unity Engine RPG). Nghiêm cấm hành vi mua bán, trao đổi tài khoản bằng tiền mặt ngoài hệ thống chính thức."
    },
    {
        id: "term02",
        Title: "Quy Tắc Ứng Xử & Chống Gian Lận (Anti-Cheat)",
        Content: "Nghiêm cấm can thiệp bộ nhớ, chỉnh sửa file cài đặt Unity, sử dụng phần mềm thứ ba hoặc macro/bot không được cấp phép. Chỉ Huy phát hiện lỗi game có nghĩa vụ thông báo cho Ban Quản Trị, việc cố tình trục lợi từ lỗi game sẽ dẫn đến việc thu hồi vật phẩm hoặc khóa tài khoản vĩnh viễn."
    },
    {
        id: "term03",
        Title: "Hệ Thống Tiền Tệ & Tính Năng Triệu Hồi (Gacha)",
        Content: "Các đơn vị tiền tệ ảo (Tinh Thể Veyra, Vé Triệu Hồi Valkyria) được cung cấp thông qua nhiệm vụ hoặc nạp thẻ. Tính năng Triệu Hồi Valkyria tuân thủ tỷ lệ xuất hiện ngẫu nhiên công khai. Mọi lượt triệu hồi khi đã thực hiện thành công sẽ không thể hoàn tác hoặc hoàn tiền."
    },
    {
        id: "term04",
        Title: "Bảo Trì Máy Chủ & Sửa Đổi Điều Khoản",
        Content: "Hệ thống có quyền tạm ngưng cung cấp dịch vụ định kỳ để bảo trì, cập nhật tính năng mới hoặc vá lỗi kỹ thuật. Ban Quản Trị có quyền điều chỉnh nội dung các điều khoản này để phù hợp với quy định và định hướng phát triển của trò chơi."
    }
];
const DEFAULT_POLICY_LIST = [
    {
        id: "policy01",
        Title: "Thu Thập & Sử Dụng Dữ Liệu Chỉ Huy",
        Content: "Chúng tôi chỉ thu thập thông tin tối thiểu cần thiết để vận hành tài khoản Chỉ Huy và lưu trữ tiến trình game (bao gồm Email, Tên nhân vật, Dữ liệu chiến dịch thám hiểm Veyra). Mọi dữ liệu không bao giờ được cung cấp cho bên thứ ba cho mục đích thương mại trái phép."
    },
    {
        id: "policy02",
        Title: "Bảo Mật Thông Tin & Mã Hóa Dữ Liệu",
        Content: "Toàn bộ mật khẩu và phiên đăng nhập được mã hóa theo tiêu chuẩn quốc tế an toàn cao. Hệ thống giám sát tự động 24/7 nhằm phát hiện và ngăn chặn các hành vi tấn công mạng hoặc đánh cắp tài khoản."
    },
    {
        id: "policy03",
        Title: "Chính Sách Hoàn Tiền & Giao Dịch Nạp Thẻ",
        Content: "Mọi giao dịch mua Tinh Thể Veyra hoặc vật phẩm ảo khi đã chuyển giao thành công vào hòm thư tài khoản game sẽ không áp dụng chính sách hoàn trả, ngoại trừ các lỗi kỹ thuật phát sinh từ cổng thanh toán chính thống."
    },
    {
        id: "policy04",
        Title: "Quyền Riêng Tư Của Trẻ Em & Vị Thành Niên",
        Content: "Người chơi dưới độ tuổi quy định theo pháp luật địa phương cần có sự đồng ý của phụ huynh hoặc người giám hộ hợp pháp trước khi đăng ký tài khoản hoặc thực hiện giao dịch thanh toán trong trò chơi."
    }
];
const SYSTEM_CONFIG_COL = "SystemConfig";
const settingsService = {
    // ==========================================
    // 1. Quản lý Điều khoản dịch vụ (GameConfig / Terms)
    // ==========================================
    async getTermsList () {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"]) return DEFAULT_TERMS_LIST;
        try {
            const snap = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$CLMydGSF$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__v__as__doc$3e$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"], "GameConfig", "Terms"));
            if (snap.exists()) {
                const data = snap.data();
                const items = [];
                Object.keys(data).forEach((key)=>{
                    const val = data[key];
                    if (val && typeof val === "object" && ("Title" in val || "Content" in val)) {
                        items.push({
                            id: key,
                            Title: typeof val.Title === "string" ? val.Title : "",
                            Content: typeof val.Content === "string" ? val.Content : ""
                        });
                    }
                });
                // Sắp xếp tự nhiên theo id: term01, term02, term03...
                items.sort((a, b)=>a.id.localeCompare(b.id, undefined, {
                        numeric: true,
                        sensitivity: "base"
                    }));
                if (items.length > 0) return items;
            }
            return DEFAULT_TERMS_LIST;
        } catch (err) {
            console.warn("Lỗi đọc cấu hình Terms từ GameConfig/Terms, dùng mặc định:", err);
            return DEFAULT_TERMS_LIST;
        }
    },
    async getTermsHistory () {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"]) return [];
        try {
            const q = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["query"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$CLMydGSF$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__aL__as__collection$3e$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"], "Logs", "Term&Policy", "Term"), (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["orderBy"])("timestamp", "desc"), (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["limit"])(30));
            const snap = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getDocs"])(q);
            const list = [];
            snap.forEach((d)=>{
                const data = d.data();
                list.push({
                    id: d.id,
                    version: data.version || "1.0",
                    note: data.note || "",
                    updatedBy: data.updatedBy || "Admin",
                    updatedAt: data.updatedAt || "",
                    timestamp: data.timestamp || 0,
                    termCount: data.termCount || 0
                });
            });
            return list;
        } catch (err) {
            console.warn("Lỗi đọc nhật ký từ Logs/Term&Policy/Term:", err);
            return [];
        }
    },
    async saveTermsList (items, meta) {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"]) throw new Error("Chưa kết nối được Firebase Firestore.");
        const docRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$CLMydGSF$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__v__as__doc$3e$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"], "GameConfig", "Terms");
        const payload = {};
        items.forEach((item, index)=>{
            // Tự động chuẩn hóa mã theo đúng thứ tự mảng: term01, term02... để bảo toàn 100% thứ tự
            const cleanId = `term${String(index + 1).padStart(2, "0")}`;
            payload[cleanId] = {
                Title: item.Title || "",
                Content: item.Content || ""
            };
        });
        // 1. Ghi đè toàn bộ tài liệu Terms
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["setDoc"])(docRef, payload);
        // 2. Ghi nhật ký vào Logs/Term&Policy/Term
        if (meta) {
            try {
                const logId = `term_${Date.now()}`;
                const logDocRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$CLMydGSF$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__v__as__doc$3e$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"], "Logs", "Term&Policy", "Term", logId);
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["setDoc"])(logDocRef, {
                    action: "UPDATE_TERMS",
                    title: "Cập nhật Điều Khoản Dịch Vụ",
                    version: meta.version || "v1.0",
                    note: meta.note || "Cập nhật điều khoản dịch vụ",
                    updatedBy: meta.updatedBy || __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"]?.currentUser?.email || "Admin",
                    updatedAt: new Date().toLocaleString("vi-VN"),
                    timestamp: Date.now(),
                    termCount: items.length
                });
            } catch (hErr) {
                console.warn("Lưu nhật ký vào Logs/Term&Policy/Term không thành công:", hErr);
            }
        }
    },
    // ==========================================
    // 2. Quản lý Chính Sách & Quyền Riêng Tư (GameConfig / Policy)
    // ==========================================
    async getPolicyList () {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"]) return DEFAULT_POLICY_LIST;
        try {
            const snap = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$CLMydGSF$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__v__as__doc$3e$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"], "GameConfig", "Policy"));
            if (snap.exists()) {
                const data = snap.data();
                const items = [];
                Object.keys(data).forEach((key)=>{
                    const val = data[key];
                    if (val && typeof val === "object" && ("Title" in val || "Content" in val)) {
                        items.push({
                            id: key,
                            Title: typeof val.Title === "string" ? val.Title : "",
                            Content: typeof val.Content === "string" ? val.Content : ""
                        });
                    }
                });
                // Sắp xếp tự nhiên theo id: policy01, policy02...
                items.sort((a, b)=>a.id.localeCompare(b.id, undefined, {
                        numeric: true,
                        sensitivity: "base"
                    }));
                if (items.length > 0) return items;
            }
            return DEFAULT_POLICY_LIST;
        } catch (err) {
            console.warn("Lỗi đọc cấu hình Policy từ GameConfig/Policy, dùng mặc định:", err);
            return DEFAULT_POLICY_LIST;
        }
    },
    async getPolicyHistory () {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"]) return [];
        try {
            const q = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["query"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$CLMydGSF$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__aL__as__collection$3e$__["collection"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"], "Logs", "Term&Policy", "Policy"), (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["orderBy"])("timestamp", "desc"), (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["limit"])(30));
            const snap = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getDocs"])(q);
            const list = [];
            snap.forEach((d)=>{
                const data = d.data();
                list.push({
                    id: d.id,
                    version: data.version || "1.0",
                    note: data.note || "",
                    updatedBy: data.updatedBy || "Admin",
                    updatedAt: data.updatedAt || "",
                    timestamp: data.timestamp || 0,
                    termCount: data.termCount || 0
                });
            });
            return list;
        } catch (err) {
            console.warn("Lỗi đọc nhật ký từ Logs/Term&Policy/Policy:", err);
            return [];
        }
    },
    async savePolicyList (items, meta) {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"]) throw new Error("Chưa kết nối được Firebase Firestore.");
        const docRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$CLMydGSF$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__v__as__doc$3e$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"], "GameConfig", "Policy");
        const payload = {};
        items.forEach((item, index)=>{
            // Tự động chuẩn hóa mã theo đúng thứ tự mảng: policy01, policy02... để bảo toàn 100% thứ tự
            const cleanId = `policy${String(index + 1).padStart(2, "0")}`;
            payload[cleanId] = {
                Title: item.Title || "",
                Content: item.Content || ""
            };
        });
        // 1. Ghi đè toàn bộ tài liệu Policy
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["setDoc"])(docRef, payload);
        // 2. Ghi nhật ký vào Logs/Term&Policy/Policy
        if (meta) {
            try {
                const logId = `policy_${Date.now()}`;
                const logDocRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$CLMydGSF$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__v__as__doc$3e$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"], "Logs", "Term&Policy", "Policy", logId);
                await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["setDoc"])(logDocRef, {
                    action: "UPDATE_POLICY",
                    title: "Cập nhật Chính Sách & Quyền Riêng Tư",
                    version: meta.version || "v1.0",
                    note: meta.note || "Cập nhật chính sách dịch vụ",
                    updatedBy: meta.updatedBy || __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["auth"]?.currentUser?.email || "Admin",
                    updatedAt: new Date().toLocaleString("vi-VN"),
                    timestamp: Date.now(),
                    termCount: items.length
                });
            } catch (hErr) {
                console.warn("Lưu nhật ký vào Logs/Term&Policy/Policy không thành công:", hErr);
            }
        }
    },
    // Phương thức tương thích ngược getTerms
    async getTerms () {
        const list = await this.getTermsList();
        const formattedContent = list.map((item, idx)=>`### ${idx + 1}. ${item.Title.toUpperCase()}\n${item.Content}`).join("\n\n---\n\n");
        return {
            ...DEFAULT_TERMS,
            content: formattedContent
        };
    },
    // 2. Thông tin Game & Link Tải
    async getGameInfo () {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"]) return DEFAULT_GAME_INFO;
        try {
            const snap = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$CLMydGSF$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__v__as__doc$3e$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"], SYSTEM_CONFIG_COL, "gameInfo"));
            if (snap.exists()) {
                return {
                    ...DEFAULT_GAME_INFO,
                    ...snap.data()
                };
            }
            return DEFAULT_GAME_INFO;
        } catch  {
            return DEFAULT_GAME_INFO;
        }
    },
    async updateGameInfo (data) {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"]) throw new Error("Chưa kết nối được Firebase Firestore.");
        const docRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$CLMydGSF$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__v__as__doc$3e$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"], SYSTEM_CONFIG_COL, "gameInfo");
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["setDoc"])(docRef, data, {
            merge: true
        });
    },
    // 3. Cổng Đăng Ký & Bảo Mật
    async getSecurity () {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"]) return DEFAULT_SECURITY;
        try {
            const snap = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$CLMydGSF$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__v__as__doc$3e$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"], SYSTEM_CONFIG_COL, "security"));
            if (snap.exists()) {
                return {
                    ...DEFAULT_SECURITY,
                    ...snap.data()
                };
            }
            return DEFAULT_SECURITY;
        } catch  {
            return DEFAULT_SECURITY;
        }
    },
    async updateSecurity (data) {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"]) throw new Error("Chưa kết nối được Firebase Firestore.");
        const docRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$CLMydGSF$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__v__as__doc$3e$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"], SYSTEM_CONFIG_COL, "security");
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["setDoc"])(docRef, data, {
            merge: true
        });
    },
    // 4. Biểu ngữ Thông Báo Website
    async getBanner () {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"]) return DEFAULT_BANNER;
        try {
            const snap = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getDoc"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$CLMydGSF$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__v__as__doc$3e$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"], SYSTEM_CONFIG_COL, "banner"));
            if (snap.exists()) {
                return {
                    ...DEFAULT_BANNER,
                    ...snap.data()
                };
            }
            return DEFAULT_BANNER;
        } catch  {
            return DEFAULT_BANNER;
        }
    },
    async updateBanner (data) {
        if (!__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"]) throw new Error("Chưa kết nối được Firebase Firestore.");
        const docRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$common$2d$CLMydGSF$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__v__as__doc$3e$__["doc"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$firebase$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["db"], SYSTEM_CONFIG_COL, "banner");
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$firebase$2f$firestore$2f$dist$2f$index$2e$esm$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["setDoc"])(docRef, data, {
            merge: true
        });
    }
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_1rdh_pq._.js.map