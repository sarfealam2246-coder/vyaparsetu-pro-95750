// Sarfealam Enterprise Hybrid Cloud DB + Offline Auto-Sync (db.js)
(function() {
  const SUPA_URL = "https://saexbzapfzfkzqkunsom.supabase.co";
  const SUPA_KEY = "sb_publishable_3YZ2OA5MiOoVoLqFCXcsxw_JIjNlEjY";
  const APP_ID = "vyaparsetu-pro";
  const LOCAL_USER_KEY = "sf_user_" + APP_ID;
  const LOCAL_TX_KEY = "sf_tx_" + APP_ID;
  const LOCAL_QUEUE_KEY = "sf_queue_" + APP_ID;

  function headers(extra) {
    return Object.assign({
      "apikey": SUPA_KEY,
      "Authorization": "Bearer " + SUPA_KEY,
      "Content-Type": "application/json"
    }, extra || {});
  }

  function getLocalUser() {
    try { const r = localStorage.getItem(LOCAL_USER_KEY); return r ? JSON.parse(r) : null; } catch (e) { return null; }
  }
  function setLocalUser(u) {
    try { localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(u)); } catch (e) {}
  }
  function getLocalTx() {
    try { const r = localStorage.getItem(LOCAL_TX_KEY); return r ? JSON.parse(r) : []; } catch (e) { return []; }
  }
  function pushLocalTx(tx) {
    const list = getLocalTx();
    list.unshift(tx);
    try { localStorage.setItem(LOCAL_TX_KEY, JSON.stringify(list.slice(0, 60))); } catch (e) {}
  }
  function enqueueOffline(item) {
    try {
      const q = JSON.parse(localStorage.getItem(LOCAL_QUEUE_KEY) || "[]");
      q.push(item);
      localStorage.setItem(LOCAL_QUEUE_KEY, JSON.stringify(q));
    } catch (e) {}
  }
  async function flushOfflineQueue() {
    if (!navigator.onLine) return;
    try {
      const q = JSON.parse(localStorage.getItem(LOCAL_QUEUE_KEY) || "[]");
      if (!q.length) return;
      const remaining = [];
      for (const item of q) {
        try {
          const res = await fetch(SUPA_URL + "/rest/v1/" + item.table, {
            method: item.method || "POST",
            headers: headers(),
            body: JSON.stringify(item.body)
          });
          if (!res.ok) remaining.push(item);
        } catch (e) { remaining.push(item); }
      }
      localStorage.setItem(LOCAL_QUEUE_KEY, JSON.stringify(remaining));
    } catch (e) {}
  }
  window.addEventListener("online", flushOfflineQueue);

  window.FactoryDB = {
    appId: APP_ID,
    getUserSync: function() { return getLocalUser(); },
    login: async function(fullName, phone) {
      const cleanName = (fullName || "User").trim();
      const cleanPhone = (phone || "0000000000").trim();
      let user = {
        app_id: APP_ID, phone: cleanPhone, full_name: cleanName,
        cash_balance: 25000, gold_grams: 0, points: 100, kyc_verified: true,
        created_at: new Date().toISOString()
      };
      try {
        const checkRes = await fetch(
          SUPA_URL + "/rest/v1/factory_users?app_id=eq." + encodeURIComponent(APP_ID) + "&phone=eq." + encodeURIComponent(cleanPhone) + "&select=*",
          { headers: headers() }
        );
        if (checkRes.ok) {
          const rows = await checkRes.json();
          if (rows && rows.length > 0) {
            user = rows[0];
            if (cleanName && user.full_name !== cleanName) {
              user.full_name = cleanName;
              await fetch(SUPA_URL + "/rest/v1/factory_users?id=eq." + user.id, {
                method: "PATCH", headers: headers({ "Prefer": "return=representation" }),
                body: JSON.stringify({ full_name: cleanName })
              });
            }
          } else {
            const insRes = await fetch(SUPA_URL + "/rest/v1/factory_users", {
              method: "POST", headers: headers({ "Prefer": "return=representation" }),
              body: JSON.stringify({
                app_id: APP_ID, phone: cleanPhone, full_name: cleanName,
                cash_balance: 25000, gold_grams: 0, points: 100, kyc_verified: true
              })
            });
            if (insRes.ok) {
              const inserted = await insRes.json();
              if (inserted && inserted.length > 0) user = inserted[0];
            }
          }
        }
      } catch (e) {}
      setLocalUser(user);
      flushOfflineQueue();
      return user;
    },
    getUser: async function() {
      const local = getLocalUser();
      if (!local) return null;
      await flushOfflineQueue();
      try {
        const res = await fetch(
          SUPA_URL + "/rest/v1/factory_users?app_id=eq." + encodeURIComponent(APP_ID) + "&phone=eq." + encodeURIComponent(local.phone) + "&select=*",
          { headers: headers() }
        );
        if (res.ok) {
          const rows = await res.json();
          if (rows && rows.length > 0) { setLocalUser(rows[0]); return rows[0]; }
        }
      } catch (e) {}
      return local;
    },
    recordTx: async function(title, txType, amount, deltaCash, deltaGold, deltaPoints) {
      let user = getLocalUser();
      if (!user) return null;
      user.cash_balance = Math.max(0, Number(user.cash_balance || 0) + Number(deltaCash || 0));
      user.gold_grams = Math.max(0, Number((Number(user.gold_grams || 0) + Number(deltaGold || 0)).toFixed(4)));
      user.points = Math.max(0, Math.round(Number(user.points || 0) + Number(deltaPoints || 0)));
      setLocalUser(user);

      const txObj = {
        app_id: APP_ID, user_phone: user.phone, title: title || "Transaction",
        tx_type: txType || "info", amount: Number(amount || 0), created_at: new Date().toISOString()
      };
      pushLocalTx(txObj);

      try {
        const uRes = await fetch(
          SUPA_URL + "/rest/v1/factory_users?app_id=eq." + encodeURIComponent(APP_ID) + "&phone=eq." + encodeURIComponent(user.phone),
          {
            method: "PATCH", headers: headers(),
            body: JSON.stringify({ cash_balance: user.cash_balance, gold_grams: user.gold_grams, points: user.points })
          }
        );
        const tRes = await fetch(SUPA_URL + "/rest/v1/factory_transactions", {
          method: "POST", headers: headers(), body: JSON.stringify(txObj)
        });
        if (!uRes.ok || !tRes.ok) enqueueOffline({ table: "factory_transactions", method: "POST", body: txObj });
      } catch (e) {
        enqueueOffline({ table: "factory_transactions", method: "POST", body: txObj });
      }
      return user;
    },
    getTransactions: async function() {
      const local = getLocalUser();
      if (!local) return [];
      try {
        const res = await fetch(
          SUPA_URL + "/rest/v1/factory_transactions?app_id=eq." + encodeURIComponent(APP_ID) + "&user_phone=eq." + encodeURIComponent(local.phone) + "&order=created_at.desc&limit=30",
          { headers: headers() }
        );
        if (res.ok) { const rows = await res.json(); if (Array.isArray(rows) && rows.length > 0) return rows; }
      } catch (e) {}
      return getLocalTx();
    },
    getLeaderboard: async function() {
      try {
        const res = await fetch(
          SUPA_URL + "/rest/v1/factory_users?app_id=eq." + encodeURIComponent(APP_ID) + "&order=points.desc&limit=15&select=full_name,points,cash_balance",
          { headers: headers() }
        );
        if (res.ok) return await res.json();
      } catch (e) {}
      return [];
    },
    getConfig: async function() {
      try {
        const res = await fetch(
          SUPA_URL + "/rest/v1/factory_app_config?app_id=eq." + encodeURIComponent(APP_ID) + "&select=*",
          { headers: headers() }
        );
        if (res.ok) { const rows = await res.json(); if (rows && rows.length > 0) return rows[0]; }
      } catch (e) {}
      return null;
    },
    logout: function() {
      try { localStorage.removeItem(LOCAL_USER_KEY); } catch (e) {}
    }
  };
})();
