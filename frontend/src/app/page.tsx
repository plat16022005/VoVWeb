"use client";

import { useEffect, useState } from "react";

interface ApiStatus {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
}

function useApiHealth() {
  const [data, setData] = useState<ApiStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/health`
        );
        if (!res.ok) throw new Error();
        const json = await res.json();
        setData(json);
        setError(false);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  return { data, loading, error };
}

const features = [
  {
    icon: "⚡",
    title: "Next.js 15",
    description: "App Router, Server Components, streaming, and full TypeScript support out of the box.",
    tag: "Frontend",
    color: "from-violet-500/20 to-purple-500/20",
  },
  {
    icon: "🦅",
    title: "NestJS",
    description: "Scalable, modular Node.js backend with dependency injection, guards, and interceptors.",
    tag: "Backend",
    color: "from-emerald-500/20 to-teal-500/20",
  },
  {
    icon: "🔷",
    title: "TypeScript",
    description: "End-to-end type safety across both frontend and backend for confident development.",
    tag: "Language",
    color: "from-blue-500/20 to-cyan-500/20",
  },
  {
    icon: "🔗",
    title: "REST API",
    description: "Clean RESTful API design with CORS enabled, validation pipes, and global prefix.",
    tag: "API",
    color: "from-orange-500/20 to-amber-500/20",
  },
  {
    icon: "🛡️",
    title: "Validation",
    description: "Global validation pipes with class-validator for safe and predictable data handling.",
    tag: "Security",
    color: "from-rose-500/20 to-pink-500/20",
  },
  {
    icon: "🚀",
    title: "Dev Ready",
    description: "Hot reload on both layers, .env config, and structured for instant feature development.",
    tag: "DX",
    color: "from-indigo-500/20 to-violet-500/20",
  },
];

const stack = [
  { name: "Next.js 15", role: "Frontend Framework", port: 3000, color: "#e8e8f0" },
  { name: "NestJS 11", role: "Backend Framework", port: 3001, color: "#ea2845" },
  { name: "TypeScript 5", role: "Type Safety", port: null, color: "#3178c6" },
  { name: "Tailwind CSS", role: "Styling", port: null, color: "#38bdf8" },
];

export default function Home() {
  const { data, loading, error } = useApiHealth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatUptime = (seconds: number) => {
    if (seconds < 60) return `${Math.floor(seconds)}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ fontFamily: "var(--font-inter)" }}>
      {/* ───── NAVBAR ───── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          backdropFilter: "blur(20px)",
          background: "rgba(6,6,18,0.8)",
          padding: "0 24px",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 16,
              }}
            >
              ✦
            </div>
            <span style={{ fontFamily: "var(--font-space-grotesk)", fontWeight: 700, fontSize: 18, color: "#e8e8f0" }}>
              VoV<span style={{ color: "#a855f7" }}>Web</span>
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div className={`status-dot ${error ? "offline" : ""}`} style={{ display: loading ? "none" : "block" }} />
            <span style={{ fontSize: 13, color: error ? "#ef4444" : "#22c55e", fontWeight: 500 }}>
              {loading ? "Checking..." : error ? "API Offline" : "API Online"}
            </span>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <a
              href="http://localhost:3001/api"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ padding: "8px 18px", fontSize: 13, textDecoration: "none", display: "inline-block" }}
            >
              API Docs
            </a>
            <a
              href="http://localhost:3001/api/health"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ padding: "8px 18px", fontSize: 13, textDecoration: "none", display: "inline-block" }}
            >
              Health Check
            </a>
          </div>
        </div>
      </nav>

      <main style={{ flex: 1 }}>
        {/* ───── HERO ───── */}
        <section
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "100px 24px 80px",
            textAlign: "center",
          }}
        >
          <div
            className={mounted ? "animate-fade-in-up" : ""}
            style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 28 }}
          >
            <span
              style={{
                padding: "6px 16px",
                borderRadius: 999,
                border: "1px solid rgba(124,58,237,0.4)",
                background: "rgba(124,58,237,0.1)",
                fontSize: 13,
                color: "#a855f7",
                fontWeight: 500,
              }}
            >
              🎉 Full-Stack Platform v1.0
            </span>
          </div>

          <h1
            className={`text-glow ${mounted ? "animate-fade-in-up" : ""}`}
            style={{
              fontFamily: "var(--font-space-grotesk)",
              fontSize: "clamp(42px, 7vw, 88px)",
              fontWeight: 800,
              lineHeight: 1.1,
              marginBottom: 24,
              animationDelay: "0.1s",
              animationFillMode: "both",
            }}
          >
            Build Faster.<br />Ship Smarter.
          </h1>

          <p
            className={mounted ? "animate-fade-in-up" : ""}
            style={{
              fontSize: "clamp(16px, 2.5vw, 20px)",
              color: "rgba(232,232,240,0.6)",
              maxWidth: 560,
              margin: "0 auto 48px",
              lineHeight: 1.7,
              animationDelay: "0.2s",
              animationFillMode: "both",
            }}
          >
            A modern full-stack platform built with Next.js and NestJS — ready to scale from prototype to production.
          </p>

          <div
            className={mounted ? "animate-fade-in-up" : ""}
            style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", animationDelay: "0.3s", animationFillMode: "both" }}
          >
            <a
              href="http://localhost:3001/api/health"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary animate-pulse-glow"
              style={{ textDecoration: "none", display: "inline-block", fontSize: 15 }}
            >
              🔍 View API Status
            </a>
            <a
              href="https://nextjs.org/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
              style={{ textDecoration: "none", display: "inline-block", fontSize: 15 }}
            >
              📚 Documentation
            </a>
          </div>
        </section>

        {/* ───── API STATUS CARD ───── */}
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
          <div
            className="glass-card"
            style={{ padding: 32, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 32 }}
          >
            <div>
              <p style={{ fontSize: 12, color: "rgba(232,232,240,0.4)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                Backend Status
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {!loading && !error && <div className="status-dot" />}
                {!loading && error && <div className="status-dot offline" />}
                <span style={{ fontSize: 22, fontWeight: 700, color: error ? "#ef4444" : "#22c55e" }}>
                  {loading ? "—" : error ? "Offline" : "Online"}
                </span>
              </div>
            </div>

            <div>
              <p style={{ fontSize: 12, color: "rgba(232,232,240,0.4)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                Server Uptime
              </p>
              <span style={{ fontSize: 22, fontWeight: 700, color: "#e8e8f0" }}>
                {loading ? "—" : error ? "N/A" : formatUptime(data!.uptime)}
              </span>
            </div>

            <div>
              <p style={{ fontSize: 12, color: "rgba(232,232,240,0.4)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                Environment
              </p>
              <span style={{ fontSize: 22, fontWeight: 700, color: "#a855f7" }}>
                {loading ? "—" : error ? "N/A" : data?.environment ?? "development"}
              </span>
            </div>

            <div>
              <p style={{ fontSize: 12, color: "rgba(232,232,240,0.4)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                Last Checked
              </p>
              <span style={{ fontSize: 22, fontWeight: 700, color: "#e8e8f0" }}>
                {loading ? "—" : error ? "N/A" : new Date(data!.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </section>

        {/* ───── TECH STACK ───── */}
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
          <p style={{ textAlign: "center", fontSize: 12, color: "rgba(232,232,240,0.35)", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600, marginBottom: 24 }}>
            Powered by
          </p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            {stack.map((s) => (
              <div
                key={s.name}
                className="glass-card"
                style={{ padding: "14px 22px", display: "flex", alignItems: "center", gap: 12 }}
              >
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color, boxShadow: `0 0 10px ${s.color}` }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#e8e8f0" }}>{s.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(232,232,240,0.45)" }}>
                    {s.role}{s.port ? ` · :${s.port}` : ""}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ───── FEATURES GRID ───── */}
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 100px" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2
              style={{
                fontFamily: "var(--font-space-grotesk)",
                fontSize: "clamp(28px, 4vw, 48px)",
                fontWeight: 700,
                color: "#e8e8f0",
                marginBottom: 12,
              }}
            >
              Everything You Need
            </h2>
            <p style={{ fontSize: 16, color: "rgba(232,232,240,0.5)", maxWidth: 480, margin: "0 auto" }}>
              A carefully crafted stack to accelerate development from day one.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 20,
            }}
          >
            {features.map((f) => (
              <div key={f.title} className="glass-card" style={{ padding: 28, position: "relative", overflow: "hidden" }}>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: `linear-gradient(135deg, ${f.color.replace("from-", "").replace("to-", "")})`,
                    opacity: 0.5,
                    borderRadius: 16,
                  }}
                />
                <div style={{ position: "relative" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <span style={{ fontSize: 36 }}>{f.icon}</span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        padding: "4px 10px",
                        borderRadius: 999,
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "rgba(232,232,240,0.6)",
                        background: "rgba(255,255,255,0.06)",
                      }}
                    >
                      {f.tag}
                    </span>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#e8e8f0", marginBottom: 10, fontFamily: "var(--font-space-grotesk)" }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: 14, color: "rgba(232,232,240,0.55)", lineHeight: 1.7 }}>
                    {f.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ───── QUICK START ───── */}
        <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 100px" }}>
          <div className="glass-card" style={{ padding: 48, textAlign: "center" }}>
            <h2
              style={{
                fontFamily: "var(--font-space-grotesk)",
                fontSize: "clamp(24px, 3vw, 40px)",
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              <span className="text-glow">Quick Start</span>
            </h2>
            <p style={{ fontSize: 15, color: "rgba(232,232,240,0.5)", marginBottom: 40 }}>
              Get both servers running in seconds
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 800, margin: "0 auto", textAlign: "left" }}>
              {[
                {
                  label: "🖥️ Frontend",
                  port: ":3000",
                  code: "cd frontend\nnpm run dev",
                  color: "#7c3aed",
                },
                {
                  label: "⚙️ Backend",
                  port: ":3001",
                  code: "cd backend\nnpm run start:dev",
                  color: "#ea2845",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    background: "rgba(0,0,0,0.3)",
                    borderRadius: 12,
                    padding: 24,
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#e8e8f0" }}>{item.label}</span>
                    <span style={{ fontSize: 12, color: item.color, fontWeight: 600, fontFamily: "monospace" }}>
                      localhost{item.port}
                    </span>
                  </div>
                  <pre
                    style={{
                      fontFamily: "monospace",
                      fontSize: 13,
                      color: "rgba(232,232,240,0.7)",
                      lineHeight: 1.8,
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {item.code}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ───── FOOTER ───── */}
      <footer
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          padding: "28px 24px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: 13, color: "rgba(232,232,240,0.3)" }}>
          Built with ⚡ Next.js · NestJS · TypeScript — VoVWeb &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
