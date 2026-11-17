import { UnityWebGlBuildInfo } from './events.types.js';

export function generateDefaultEventHtmlLayout(
  title: string,
  _subtitle: string,
): string {
  const safeTitle = escapeHtml(title || 'Sự Kiện Veyra');
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>${safeTitle}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      width: 100%;
      height: 100%;
      background: #050712;
      color: #eef2ff;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
      user-select: none;
      -webkit-user-select: none;
      touch-action: none;
    }
    #vov-unity-container {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      background: radial-gradient(circle at 50% 45%, #111635 0%, #060816 68%, #04050d 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .veyra-astrolabe-bg {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 1;
      background-image:
        linear-gradient(to right, rgba(245, 199, 103, 0.035) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(245, 199, 103, 0.035) 1px, transparent 1px);
      background-size: 48px 48px;
      mask-image: radial-gradient(circle at 50% 50%, rgba(0,0,0,0.9) 20%, transparent 82%);
      -webkit-mask-image: radial-gradient(circle at 50% 50%, rgba(0,0,0,0.9) 20%, transparent 82%);
    }
    .veyra-standby-plate {
      position: absolute;
      inset: 0;
      z-index: 3;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      gap: 8px;
      padding: 24px;
    }
    .veyra-standby-kicker {
      font-size: 11px;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: #f5c767;
    }
    .veyra-standby-title {
      font-size: 22px;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #ffffff;
    }
    #unity-canvas {
      position: relative;
      z-index: 5;
      width: 100% !important;
      height: 100% !important;
      display: block;
      background: transparent;
      outline: none;
      touch-action: none;
    }
  </style>
</head>
<body>
  <div id="vov-unity-container">
    <div class="veyra-astrolabe-bg"></div>
    <div class="veyra-standby-plate" id="veyra-standby-plate">
      <div class="veyra-standby-kicker">VALKYRIA OF VEYRA // CAMPAIGN STAGE</div>
      <div class="veyra-standby-title">${safeTitle}</div>
    </div>
    <canvas id="unity-canvas" width="960" height="600" tabindex="-1"></canvas>
  </div>
</body>
</html>`;
}

function escapeHtml(raw: string): string {
  return String(raw || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Hợp nhất file .html (Layout giao diện) với bản build Unity WebGL (.zip đã giải nén lên R2)
 * Tự động gắn trình khởi tạo createUnityInstance qua cổng giải nén Brotli/Gzip + Cầu nối đồng bộ (window.VoVSDK)
 */
export function mergeHtmlWithUnityBuild(options: {
  eventId: string;
  eventTitle: string;
  unityTargetObject: string;
  rawHtml: string;
  unityBuild: UnityWebGlBuildInfo | null;
  defaultApiUrl?: string;
}): string {
  const baseHtml = (options.rawHtml || '').trim()
    ? options.rawHtml
    : generateDefaultEventHtmlLayout(
        options.eventTitle || 'Sự Kiện Minigame Veyra',
        'Tham gia làm nhiệm vụ và nhận thưởng đồng bộ trực tiếp',
      );

  // Xóa script bridge cũ nếu HTML đã từng được merge trước đó
  let cleanedHtml = baseHtml.replace(
    /<!-- VOV_UNITY_BRIDGE_START -->[\s\S]*?<!-- VOV_UNITY_BRIDGE_END -->/g,
    '',
  );

  // Nếu người vận hành chọn file index.html mặc định do Unity sinh ra (gọi Build/*.loader.js & createUnityInstance),
  // tự động gỡ các thẻ script mặc định đó để tránh 404 và khởi tạo trùng lặp trên cùng #unity-canvas
  if (options.unityBuild) {
    cleanedHtml = cleanedHtml
      .replace(/<script\b[^>]*src=["'][^"']*Build\/[^"']*\.loader\.js["'][^>]*>\s*<\/script>/gi, '')
      .replace(/<script\b[^>]*>[\s\S]*?createUnityInstance\s*\([\s\S]*?<\/script>/gi, '');
  }

  // Kiểm tra xem trong HTML đã có thẻ <canvas> chưa; nếu chưa thì tự chèn vào vị trí khung game
  const hasCanvas = /<canvas\b[^>]*>/i.test(cleanedHtml);
  let htmlWithCanvas = cleanedHtml;

  if (!hasCanvas) {
    const autoCanvasMarkup = `
<div id="vov-unity-container" style="position:fixed;inset:0;width:100vw;height:100vh;background:#060814;overflow:hidden;">
  <canvas id="unity-canvas" width="960" height="600" tabindex="-1" style="width:100%;height:100%;display:block;touch-action:none;"></canvas>
</div>`;
    if (/<\/main>/i.test(htmlWithCanvas)) {
      htmlWithCanvas = htmlWithCanvas.replace(
        /<\/main>/i,
        `${autoCanvasMarkup}\n</main>`,
      );
    } else if (/<\/body>/i.test(htmlWithCanvas)) {
      htmlWithCanvas = htmlWithCanvas.replace(
        /<\/body>/i,
        `${autoCanvasMarkup}\n</body>`,
      );
    } else {
      htmlWithCanvas += autoCanvasMarkup;
    }
  }

  const bridgeConfigJson = JSON.stringify({
    eventId: options.eventId,
    eventTitle: options.eventTitle,
    unityTargetObject: options.unityTargetObject || 'LuckyWheelManager',
    defaultApiUrl: options.defaultApiUrl || 'http://localhost:3001/api',
    unityBuild: options.unityBuild,
  });

  const bridgeScript = `
<!-- VOV_UNITY_BRIDGE_START -->
<style id="vov-unity-stage-style">
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    height: 100% !important;
    overflow: hidden !important;
    touch-action: none !important;
  }
  #vov-unity-container {
    position: fixed !important;
    inset: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    max-width: none !important;
    max-height: none !important;
    margin: 0 !important;
    border-radius: 0 !important;
    z-index: 5 !important;
  }
  #unity-canvas {
    width: 100% !important;
    height: 100% !important;
    display: block !important;
    outline: none !important;
    touch-action: none !important;
  }
  .vov-hud-top, .vov-hud-bottom {
    position: fixed !important;
    left: 10px !important;
    right: 10px !important;
    z-index: 15 !important;
    pointer-events: auto;
    transition: opacity 0.25s ease, transform 0.25s ease;
  }
  .vov-hud-top { top: 8px !important; }
  .vov-hud-bottom { bottom: 8px !important; }
  body.vov-fullscreen-active .vov-hud-top,
  body.vov-fullscreen-active .vov-hud-bottom,
  body.vov-fullscreen-active .vov-floating-hud,
  body.vov-fullscreen-active .vov-title-badge,
  body.vov-fullscreen-active .vov-corner {
    opacity: 0 !important;
    pointer-events: none !important;
  }
  body.is-fullscreen .vov-corner,
  body.is-fullscreen .vov-title-badge,
  body.is-fullscreen .vov-ticket-box,
  body.is-fullscreen .vov-ticket-pill {
    opacity: 0 !important;
    pointer-events: none !important;
  }
</style>
<script id="vov-unity-bridge">
(function() {
  var CONFIG = ${bridgeConfigJson};
  var resolvedApiUrl = CONFIG.defaultApiUrl;
  try {
    if (window.location && window.location.protocol.indexOf("http") === 0 && window.location.pathname.indexOf("/api/events/") !== -1) {
      resolvedApiUrl = window.location.origin + "/api";
    }
  } catch (e) {}

  var state = {
    eventId: CONFIG.eventId,
    eventTitle: CONFIG.eventTitle || "Sự Kiện Minigame Veyra",
    apiUrl: resolvedApiUrl,
    authToken: "",
    uid: "",
    username: "Chỉ Huy",
    spinTickets: 0,
    totalSpins: 0,
    claimedMissions: {},
    recentRewards: [],
    unityInstance: null,
    unityReady: false,
    registeredTargets: []
  };

  function notifyParent(type, payload) {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage({ source: "VOV_EVENT_IFRAME", type: type, eventId: state.eventId, payload: payload }, "*");
      }
    } catch (e) {}
  }

  function getActiveTargets() {
    if (state.registeredTargets && state.registeredTargets.length > 0) {
      return state.registeredTargets;
    }
    return [CONFIG.unityTargetObject || "LuckyWheelManager"];
  }

  function sendToTargets(methodName, value) {
    if (!state.unityInstance || typeof state.unityInstance.SendMessage !== "function") return;
    var targets = getActiveTargets();
    for (var i = 0; i < targets.length; i++) {
      try {
        state.unityInstance.SendMessage(targets[i], methodName, value);
      } catch (e) {}
    }
  }

  function updateDomMeta() {
    if (state.eventTitle) {
      var titleEls = document.querySelectorAll("[data-vov-title]");
      for (var i = 0; i < titleEls.length; i++) {
        titleEls[i].textContent = state.eventTitle;
      }
    }
  }

  function updateDomTickets(count) {
    state.spinTickets = Math.max(0, Number(count) || 0);
    var els = document.querySelectorAll("[data-vov-tickets], #vov-ticket-count, #spin-count, .spin-ticket-count");
    for (var i = 0; i < els.length; i++) {
      els[i].textContent = String(state.spinTickets);
    }
    updateDomMeta();
    window.dispatchEvent(new CustomEvent("vov:state-updated", { detail: state }));
  }

  function syncTicketsToUnity(count) {
    var safeCount = Math.max(0, Number(count) || 0);
    sendToTargets("SetSpinCount", safeCount);
  }

  function syncAuthMetaToUnity() {
    sendToTargets("SetAuthToken", state.authToken || "");
    sendToTargets("SetApiUrl", state.apiUrl || "");
  }

  async function apiRequest(path, method, body) {
    var headers = { "Content-Type": "application/json" };
    if (state.authToken) {
      headers["Authorization"] = "Bearer " + state.authToken;
    }
    var res = await fetch(state.apiUrl + "/events/" + encodeURIComponent(state.eventId) + path, {
      method: method || "GET",
      headers: headers,
      body: body ? JSON.stringify(body) : undefined
    });
    var data = await res.json().catch(function() { return {}; });
    if (!res.ok) {
      throw new Error(data.message || ("Lỗi kết nối máy chủ (" + res.status + ")"));
    }
    return data;
  }

  var VoVSDK = {
    getConfig: function() { return CONFIG; },
    getState: function() { return state; },
    registerUnityTarget: function(targetName) {
      var clean = typeof targetName === "string" ? targetName.trim() : "";
      if (!clean) return;
      if (state.registeredTargets.indexOf(clean) === -1) {
        state.registeredTargets.push(clean);
      }
      if (state.unityInstance) {
        try {
          state.unityInstance.SendMessage(clean, "SetAuthToken", state.authToken || "");
          state.unityInstance.SendMessage(clean, "SetApiUrl", state.apiUrl || "");
          state.unityInstance.SendMessage(clean, "SetSpinCount", Math.max(0, Number(state.spinTickets) || 0));
        } catch (e) {}
      }
    },
    setAuth: function(token, apiUrl, uid, username) {
      state.authToken = typeof token === "string" ? token : "";
      if (apiUrl) state.apiUrl = String(apiUrl).replace(/\\/+$/, "");
      state.uid = typeof uid === "string" ? uid : "";
      state.username = typeof username === "string" && username ? username : "Chỉ Huy";
      updateDomMeta();
      window.dispatchEvent(new CustomEvent("vov:state-updated", { detail: state }));
      syncAuthMetaToUnity();
      if (!state.authToken) {
        state.totalSpins = 0;
        state.claimedMissions = {};
        state.recentRewards = [];
        updateDomTickets(0);
        syncTicketsToUnity(0);
        return Promise.resolve(state);
      }
      return VoVSDK.refreshPlayerState();
    },
    refreshPlayerState: async function() {
      if (!state.authToken) {
        updateDomTickets(0);
        syncTicketsToUnity(0);
        return state;
      }
      try {
        var playerState = await apiRequest("/player-state", "GET");
        state.spinTickets = playerState.SpinTickets || 0;
        state.totalSpins = playerState.TotalSpins || 0;
        state.claimedMissions = playerState.ClaimedMissions || {};
        state.recentRewards = playerState.RecentRewards || [];
        updateDomTickets(state.spinTickets);
        syncTicketsToUnity(state.spinTickets);
        notifyParent("PLAYER_STATE_SYNCED", playerState);
        return playerState;
      } catch (err) {
        console.warn("[VoVSDK] Không thể đồng bộ trạng thái người chơi:", err);
        return state;
      }
    },
    claimMission: async function(missionId) {
      var result = await apiRequest("/missions/" + encodeURIComponent(missionId) + "/claim", "POST", {});
      if (result && result.playerState) {
        state.spinTickets = result.playerState.SpinTickets;
        state.claimedMissions = result.playerState.ClaimedMissions || {};
        updateDomTickets(state.spinTickets);
        syncTicketsToUnity(state.spinTickets);
        notifyParent("MISSION_CLAIMED", result);
      }
      return result;
    },
    recordSpinReward: async function(itemIdOrPayload, itemName, quantity, rarity) {
      var payload = typeof itemIdOrPayload === "object" && itemIdOrPayload !== null
        ? itemIdOrPayload
        : { itemId: String(itemIdOrPayload || ""), itemName: String(itemName || ""), quantity: Number(quantity) || 1, rarity: String(rarity || "SSR") };
      try {
        var result = await apiRequest("/spin", "POST", payload);
        if (result && result.playerState) {
          state.spinTickets = result.playerState.SpinTickets;
          state.totalSpins = result.playerState.TotalSpins;
          state.recentRewards = result.playerState.RecentRewards || [];
          updateDomTickets(state.spinTickets);
          syncTicketsToUnity(state.spinTickets);
          notifyParent("SPIN_COMPLETED", result);
        }
        return result;
      } catch (err) {
        var errMsg = err && err.message ? err.message : "Không thể ghi nhận phần thưởng lượt chơi.";
        notifyParent("SPIN_ERROR", { message: errMsg });
        sendToTargets("OnWebSpinError", errMsg);
        await VoVSDK.refreshPlayerState();
        throw err;
      }
    },
    rollServerSpin: async function() {
      var result = await VoVSDK.recordSpinReward({ mode: "server_random" });
      if (result && result.reward) {
        sendToTargets("OnServerSpinResult", JSON.stringify(result.reward));
      }
      return result;
    },
    notifyUnitySceneReady: function() {
      state.unityReady = true;
      syncAuthMetaToUnity();
      syncTicketsToUnity(state.spinTickets);
      notifyParent("UNITY_READY", { eventId: state.eventId });
    },
    sendToUnity: function(objectName, methodName, value) {
      if (!state.unityInstance || typeof state.unityInstance.SendMessage !== "function") return;
      if (objectName && (!state.registeredTargets.length || objectName !== CONFIG.unityTargetObject)) {
        try {
          state.unityInstance.SendMessage(objectName, methodName, value);
          return;
        } catch (e) {}
      }
      sendToTargets(methodName, value);
    }
  };

  window.VoVSDK = VoVSDK;
  window.VoVBridge = VoVSDK;
  window.onUnitySpinReward = function(itemId, itemName, quantity, rarity) {
    return VoVSDK.recordSpinReward(itemId, itemName, quantity, rarity).catch(function(err) {
      console.warn("[VoVSDK] Lỗi ghi nhận phần thưởng từ Unity:", err);
      return null;
    });
  };
  window.SendRewardToWeb = window.onUnitySpinReward;
  window.claimEventMission = function(missionId) {
    return VoVSDK.claimMission(missionId);
  };

  window.addEventListener("message", function(event) {
    var msg = event.data;
    if (!msg || typeof msg !== "object") return;
    if (msg.type === "VOV_AUTH_INIT") {
      VoVSDK.setAuth(msg.token, msg.apiUrl, msg.uid, msg.username);
    } else if (msg.type === "VOV_TICKETS_UPDATED") {
      updateDomTickets(msg.spinTickets);
      syncTicketsToUnity(msg.spinTickets);
    } else if (msg.type === "VOV_FULLSCREEN_STATE") {
      document.body.classList.toggle("vov-fullscreen-active", Boolean(msg.isFullscreen));
    } else if (msg.type === "VOV_SEND_TO_UNITY" && msg.methodName) {
      VoVSDK.sendToUnity(msg.objectName, msg.methodName, msg.value);
    }
  });

  document.addEventListener("fullscreenchange", function() {
    document.body.classList.toggle("is-fullscreen", Boolean(document.fullscreenElement));
  });

  function unlockAudio() {
    try {
      var inst = window.unityInstance;
      var ctx = inst && inst.Module && inst.Module.WEBAudio && inst.Module.WEBAudio.audioContext;
      if (ctx && ctx.state === "suspended" && typeof ctx.resume === "function") {
        ctx.resume().catch(function() {});
      }
    } catch (e) {}
  }
  window.addEventListener("pointerdown", unlockAudio, { passive: true });
  window.addEventListener("keydown", unlockAudio, { passive: true });

  function bootUnityWebGl() {
    if (!CONFIG.unityBuild || !CONFIG.unityBuild.LoaderUrl) return;
    var canvas = document.querySelector("#unity-canvas") || document.querySelector("canvas");
    if (!canvas) return;
    if (!canvas.id) canvas.id = "unity-canvas";
    if (!canvas.getAttribute("width")) canvas.setAttribute("width", "960");
    if (!canvas.getAttribute("height")) canvas.setAttribute("height", "600");
    if (!canvas.hasAttribute("tabindex")) canvas.setAttribute("tabindex", "-1");

    var standbyPlate = document.getElementById("veyra-standby-plate");
    if (standbyPlate) {
      standbyPlate.style.display = "none";
    }

    var overlayStyle = document.createElement("style");
    overlayStyle.textContent = "@keyframes vovAstroSpin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes vovAstroSpinRev{from{transform:rotate(360deg)}to{transform:rotate(0deg)}}";
    document.head.appendChild(overlayStyle);

    var overlay = document.createElement("div");
    overlay.id = "vov-unity-loading-overlay";
    overlay.style.cssText = "position:fixed;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 45%,#111635 0%,#060816 68%,#04050d 100%);z-index:30;color:#eef2ff;font-family:'Inter',system-ui,sans-serif;transition:opacity 0.35s ease;";
    overlay.innerHTML =
      '<div style="position:relative;width:190px;height:190px;display:flex;align-items:center;justify-content:center;margin-bottom:22px;">' +
        '<div style="position:absolute;inset:0;border-radius:50%;border:1px dashed rgba(245,199,103,0.32);animation:vovAstroSpin 36s linear infinite;"></div>' +
        '<div style="position:absolute;inset:16px;border-radius:50%;border:1px solid rgba(63,233,214,0.22);animation:vovAstroSpinRev 22s linear infinite;"></div>' +
        '<div style="position:absolute;inset:32px;border-radius:50%;border:1px solid rgba(245,199,103,0.45);"></div>' +
        '<div style="text-align:center;">' +
          '<div id="vov-unity-progress-text" style="font-size:30px;font-weight:700;letter-spacing:0.06em;color:#f5c767;font-variant-numeric:tabular-nums;">00%</div>' +
          '<div style="font-size:9px;letter-spacing:0.28em;text-transform:uppercase;color:#7e8aa6;margin-top:2px;">CALIBRATING</div>' +
        '</div>' +
      '</div>' +
      '<div style="font-size:12px;font-weight:600;letter-spacing:0.22em;text-transform:uppercase;color:#ffffff;margin-bottom:12px;">' + escapeHtmlForJs(state.eventTitle) + '</div>' +
      '<div style="width:260px;height:2px;background:rgba(255,255,255,0.12);position:relative;overflow:hidden;">' +
        '<div id="vov-unity-progress-bar" style="width:4%;height:100%;background:linear-gradient(90deg,#f5c767,#3fe9d6);transition:width 0.18s ease;"></div>' +
      '</div>' +
      '<div id="vov-unity-loading-sub" style="margin-top:10px;font-size:11px;letter-spacing:0.08em;color:#94a3b8;">Đang tải tài nguyên sự kiện...</div>';

    document.body.appendChild(overlay);

    var buildVer = encodeURIComponent(CONFIG.unityBuild.UploadedAt || "1");
    var baseProxy = state.apiUrl + "/events/public/" + encodeURIComponent(state.eventId) + "/build";
    var loaderSrc = baseProxy + "/loader?v=" + buildVer;
    var dataSrc = baseProxy + "/data?v=" + buildVer;
    var frameworkSrc = baseProxy + "/framework?v=" + buildVer;
    var wasmSrc = baseProxy + "/wasm?v=" + buildVer;
    var streamingUrl = state.apiUrl + "/events/public/" + encodeURIComponent(state.eventId) + "/StreamingAssets";

    var script = document.createElement("script");
    script.src = loaderSrc;
    script.onload = function() {
      if (typeof createUnityInstance !== "function") {
        overlay.innerHTML = '<div style="color:#f43f5e;font-size:12px;">Không tìm thấy hàm createUnityInstance trong tệp loader.js</div>';
        return;
      }
      createUnityInstance(canvas, {
        dataUrl: dataSrc,
        frameworkUrl: frameworkSrc,
        codeUrl: wasmSrc,
        streamingAssetsUrl: streamingUrl,
        companyName: "Valkyria of Veyra",
        productName: CONFIG.eventTitle || "Veyra Event",
        productVersion: "1.0"
      }, function(progress) {
        var pct = Math.round(progress * 100);
        var bar = document.getElementById("vov-unity-progress-bar");
        var txt = document.getElementById("vov-unity-progress-text");
        var sub = document.getElementById("vov-unity-loading-sub");
        if (bar) bar.style.width = Math.max(4, pct) + "%";
        if (txt) txt.textContent = (pct < 10 ? "0" + pct : String(pct)) + "%";
        if (sub) {
          sub.textContent = pct >= 90 ? "Đang đồng bộ tài khoản Chỉ Huy..." : "Đang tải tài nguyên sự kiện...";
        }
        window.dispatchEvent(new CustomEvent("vov:unity-progress", { detail: { progress: pct } }));
        notifyParent("UNITY_PROGRESS", { progress: pct });
      }).then(function(instance) {
        state.unityInstance = instance;
        state.unityReady = true;
        window.unityInstance = instance;
        if (overlay && overlay.parentElement) {
          overlay.style.opacity = "0";
          setTimeout(function() { if (overlay.parentElement) overlay.parentElement.removeChild(overlay); }, 300);
        }
        syncAuthMetaToUnity();
        syncTicketsToUnity(state.spinTickets);
        window.dispatchEvent(new CustomEvent("vov:unity-ready", { detail: state }));
        notifyParent("UNITY_READY", { buildName: CONFIG.unityBuild.BuildName });
      }).catch(function(err) {
        overlay.innerHTML = '<div style="color:#fb7185;font-size:12px;padding:16px;text-align:center;">Không thể nạp bản build Unity WebGL: ' + String(err) + '</div>';
        notifyParent("UNITY_ERROR", { error: String(err) });
      });
    };
    script.onerror = function() {
      overlay.innerHTML = '<div style="color:#fb7185;font-size:12px;padding:16px;text-align:center;">Không thể tải tệp Unity Loader từ máy chủ.</div>';
    };
    document.body.appendChild(script);
  }

  function escapeHtmlForJs(str) {
    return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function() {
      updateDomMeta();
      bootUnityWebGl();
      notifyParent("IFRAME_READY", { eventId: state.eventId });
    });
  } else {
    updateDomMeta();
    bootUnityWebGl();
    notifyParent("IFRAME_READY", { eventId: state.eventId });
  }
})();
</script>
<!-- VOV_UNITY_BRIDGE_END -->`;

  if (/<\/body>/i.test(htmlWithCanvas)) {
    return htmlWithCanvas.replace(/<\/body>/i, `${bridgeScript}\n</body>`);
  }
  return `${htmlWithCanvas}\n${bridgeScript}`;
}
