// Sarfealam Enterprise Core UI + 14-ID Navigation Engine (components.js)
(function() {
  let toastTimer = null;

  function ensureToastEl() {
    let el = document.getElementById("sf-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "sf-toast";
      el.style.cssText = "position:fixed;top:14px;left:50%;transform:translateX(-50%) translateY(-90px);z-index:99999;background:#0f172a;color:#f8fafc;border:1.5px solid #38bdf8;padding:10px 18px;border-radius:12px;font-size:13px;font-weight:700;box-shadow:0 8px 24px rgba(0,0,0,0.45);transition:transform 0.25s ease;max-width:90%;text-align:center;";
      document.body.appendChild(el);
    }
    return el;
  }

  window.addEventListener("popstate", function() {
    const modal = document.getElementById("app-modal");
    if (modal && modal.classList.contains("open")) { modal.classList.remove("open"); return; }
    const detail = document.getElementById("view-detail");
    if (detail && detail.style.display === "block") { window.FactoryNav.closeDetail(); return; }
    const drawer = document.getElementById("profile-drawer");
    const backdrop = document.getElementById("drawer-backdrop");
    if (drawer && drawer.classList.contains("open")) {
      drawer.classList.remove("open");
      if (backdrop) backdrop.classList.remove("open");
    }
  });

  window.FactoryUI = {
    vibrate: function(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 18); } catch (e) {} },
    beep: function(kind) {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = kind === "success" ? 740 : (kind === "error" ? 260 : 520);
        gain.gain.value = 0.05;
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(); osc.stop(ctx.currentTime + 0.09);
      } catch (e) {}
    },
    celebrate: function() {
      try { if (window.confetti) window.confetti({ particleCount: 55, spread: 65, origin: { y: 0.7 } }); } catch (e) {}
    },
    safeNum: function(val, fallback) {
      const n = Number(val);
      return Number.isFinite(n) ? n : (fallback || 0);
    },
    formatINR: function(val) {
      return "Rs. " + window.FactoryUI.safeNum(val, 0).toLocaleString("en-IN");
    },
    toast: function(msg, type) {
      window.FactoryUI.vibrate(15);
      window.FactoryUI.beep(type);
      const el = ensureToastEl();
      el.textContent = msg || "Done";
      el.style.borderColor = type === "error" ? "#ef4444" : (type === "warn" ? "#f59e0b" : "#10b981");
      el.style.transform = "translateX(-50%) translateY(0)";
      clearTimeout(toastTimer);
      toastTimer = setTimeout(function() { el.style.transform = "translateX(-50%) translateY(-90px)"; }, 2600);
    },
    modal: function(title, bodyHtml) {
      window.FactoryUI.vibrate(12);
      let modal = document.getElementById("app-modal");
      if (!modal) { modal = document.createElement("div"); modal.id = "app-modal"; document.body.appendChild(modal); }
      modal.innerHTML = '<div class="modal-card animate__animated animate__zoomIn animate__faster">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
        '<h3 style="margin:0;font-size:17px;color:#f8fafc;">' + (title || "Details") + '</h3>' +
        '<button type="button" onclick="FactoryUI.closeModal()" style="min-height:32px;padding:4px 10px;background:#334155 !important;border-radius:8px;font-size:13px;">X</button>' +
        '</div>' +
        '<div style="font-size:14px;color:#cbd5e1;line-height:1.5;">' + (bodyHtml || "") + '</div>' +
        '</div>';
      modal.classList.add("open");
      try { window.history.pushState({ sfModal: true }, ""); } catch (e) {}
    },
    closeModal: function() {
      const modal = document.getElementById("app-modal");
      if (modal) modal.classList.remove("open");
    },
    downloadPDF: function(title, rows) {
      try {
        if (!window.jspdf || !window.jspdf.jsPDF) {
          window.FactoryUI.toast("PDF engine loading, try again", "warn");
          return;
        }
        const doc = new window.jspdf.jsPDF();
        doc.setFontSize(18);
        doc.text(String(title || "Receipt"), 18, 22);
        doc.setFontSize(11);
        doc.text("Date: " + new Date().toLocaleString(), 18, 32);
        let y = 46;
        (rows || []).forEach(function(r) {
          doc.text(String(r[0]) + ": " + String(r[1]), 18, y);
          y += 10;
        });
        doc.save((String(title || "receipt").toLowerCase().replace(/[^a-z0-9]/g, "_")) + ".pdf");
        window.FactoryUI.toast("PDF Downloaded!", "success");
      } catch (e) {
        window.FactoryUI.toast("Could not save PDF on this device", "warn");
      }
    },
    receipt: function(title, rows) {
      window.FactoryUI.celebrate();
      window._lastReceipt = { title: title || "Receipt", rows: rows || [] };
      let listHtml = '<div style="background:#0f172a;border:1px solid #1e293b;border-radius:12px;padding:12px;margin:10px 0;">';
      (rows || []).forEach(function(r) {
        listHtml += '<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #1e293b;">' +
          '<span style="color:#94a3b8;">' + r[0] + '</span>' +
          '<strong style="color:#f8fafc;">' + r[1] + '</strong></div>';
      });
      listHtml += '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">' +
        '<button type="button" onclick="FactoryUI.downloadPDF(window._lastReceipt.title, window._lastReceipt.rows)" style="background:#2563eb !important;">Save PDF</button>' +
        '<button type="button" onclick="FactoryUI.closeModal()" style="background:#10b981 !important;">Done</button>' +
        '</div>';
      window.FactoryUI.modal("Confirmed: " + (title || "Success"), listHtml);
    },
    refreshIcons: function() {
      try { if (window.lucide && window.lucide.createIcons) window.lucide.createIcons(); } catch (e) {}
    }
  };

  window.FactoryNav = {
    currentTab: 1,
    switchTab: function(tabNum) {
      window.FactoryNav.currentTab = tabNum;
      window.FactoryUI.vibrate(10);
      const detail = document.getElementById("view-detail");
      if (detail) detail.style.display = "none";
      for (let i = 1; i <= 4; i++) {
        const v = document.getElementById("view-" + i);
        const b = document.getElementById("nav-" + i);
        if (v) v.style.display = (i === tabNum) ? "block" : "none";
        if (b) { if (i === tabNum) b.classList.add("active-tab"); else b.classList.remove("active-tab"); }
      }
      window.scrollTo(0, 0);
      window.FactoryUI.refreshIcons();
      if (typeof window.onTabChange === "function") { try { window.onTabChange(tabNum); } catch (e) {} }
    },
    openDetail: function(title, bodyHtml) {
      window.FactoryUI.vibrate(12);
      for (let i = 1; i <= 4; i++) {
        const v = document.getElementById("view-" + i);
        if (v) v.style.display = "none";
      }
      const d = document.getElementById("view-detail");
      if (d) {
        d.innerHTML = '<div class="animate__animated animate__fadeInRight animate__faster">' +
          '<button type="button" onclick="FactoryNav.closeDetail()" style="background:#1e293b !important;margin-bottom:12px;display:inline-flex;align-items:center;gap:6px;">&larr; Back</button>' +
          '<h2 style="margin:0 0 12px 0;font-size:20px;color:#f8fafc;">' + (title || "Details") + '</h2>' +
          '<div>' + (bodyHtml || "") + '</div></div>';
        d.style.display = "block";
        window.FactoryUI.refreshIcons();
        try { window.history.pushState({ sfDetail: true }, ""); } catch (e) {}
      }
    },
    closeDetail: function() {
      const d = document.getElementById("view-detail");
      if (d) d.style.display = "none";
      window.FactoryNav.switchTab(window.FactoryNav.currentTab || 1);
    },
    openDrawer: function() {
      const d = document.getElementById("profile-drawer");
      const bd = document.getElementById("drawer-backdrop");
      if (d) d.classList.add("open");
      if (bd) bd.classList.add("open");
      window.FactoryNav.syncDrawerProfile();
    },
    closeDrawer: function() {
      const d = document.getElementById("profile-drawer");
      const bd = document.getElementById("drawer-backdrop");
      if (d) d.classList.remove("open");
      if (bd) bd.classList.remove("open");
    },
    syncDrawerProfile: function() {
      const u = window.FactoryDB ? window.FactoryDB.getUserSync() : null;
      const nameEl = document.getElementById("drawer-user-name");
      const phoneEl = document.getElementById("drawer-user-phone");
      const badgeEl = document.getElementById("header-badge");
      if (u) {
        if (nameEl) nameEl.textContent = u.full_name || "User";
        if (phoneEl) phoneEl.textContent = u.phone || "";
        if (badgeEl) badgeEl.textContent = window.FactoryUI.formatINR(u.cash_balance || 0);
      }
    },
    loadNoticeBanner: async function() {
      if (!window.FactoryDB) return;
      const cfg = await window.FactoryDB.getConfig();
      const nb = document.getElementById("notice-banner");
      if (nb && cfg && (cfg.notice_banner || cfg.sponsor_text)) {
        nb.textContent = cfg.notice_banner || cfg.sponsor_text;
        nb.style.display = "block";
      }
    },
    showAppShell: function() {
      const loginView = document.getElementById("view-login");
      const appShell = document.getElementById("app-shell");
      if (loginView) loginView.style.display = "none";
      if (appShell) appShell.style.display = "block";
      window.FactoryNav.syncDrawerProfile();
      window.FactoryNav.loadNoticeBanner();
      window.FactoryNav.switchTab(1);
    },
    showLogin: function() {
      const loginView = document.getElementById("view-login");
      const appShell = document.getElementById("app-shell");
      if (appShell) appShell.style.display = "none";
      if (loginView) loginView.style.display = "flex";
    },
    submitLogin: async function() {
      const nameIn = document.getElementById("login-name");
      const phoneIn = document.getElementById("login-phone");
      const fullName = nameIn ? nameIn.value.trim() : "";
      const phone = phoneIn ? phoneIn.value.trim() : "";
      if (!fullName || phone.length < 10) {
        window.FactoryUI.toast("Enter full name and 10-digit mobile number", "error");
        return;
      }
      const btn = document.getElementById("login-submit-btn");
      if (btn) btn.textContent = "Connecting to Cloud...";
      if (window.FactoryDB) await window.FactoryDB.login(fullName, phone);
      if (btn) btn.textContent = "Continue";
      window.FactoryUI.toast("Welcome, " + fullName + "!", "success");
      window.FactoryNav.showAppShell();
      if (typeof window.onAppReady === "function") { try { await window.onAppReady(); } catch (e) {} }
    },
    logout: function() {
      if (window.FactoryDB) window.FactoryDB.logout();
      window.FactoryNav.closeDrawer();
      window.FactoryNav.showLogin();
      window.FactoryUI.toast("Logged out safely", "warn");
    }
  };

  document.addEventListener("DOMContentLoaded", async function() {
    setTimeout(function() {
      const sp = document.getElementById("splash-screen");
      if (sp) sp.classList.add("hide");
    }, 850);
    window.FactoryUI.refreshIcons();
    const existing = window.FactoryDB ? window.FactoryDB.getUserSync() : null;
    if (existing) {
      window.FactoryNav.showAppShell();
      if (typeof window.onAppReady === "function") { try { await window.onAppReady(); } catch (e) {} }
    } else {
      window.FactoryNav.showLogin();
    }
  });
})();
