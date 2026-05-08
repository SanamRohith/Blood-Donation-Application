async function fetchJSON(url) {

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json'
    }
  });

  if (!res.ok) {
    throw new Error('Request failed');
  }

  return res.json();
}


function el(id) {
  return document.getElementById(id);
}


function escapeHtml(str) {

  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


/* =========================
   DONOR CARD
========================= */

function donorCardHTML(d) {

  const status = d.available
    ? '<span class="donor-badge">Available</span>'
    : '<span class="donor-badge">Not Available</span>';

  return `
    <div class="donor-card">

      <div class="donor-top">

        <div class="donor-name">
          ${escapeHtml(d.name || 'Unknown')}
        </div>

        ${status}

      </div>

      <div class="donor-meta">

        <p>
          Blood:
          <b>${escapeHtml(d.blood_group || '-')}</b>
        </p>

        <p>
          City:
          <b>${escapeHtml(d.city || '-')}</b>
        </p>

        <p>
          Pincode:
          <b>${escapeHtml(d.pincode || '-')}</b>
        </p>

      </div>

      <button
        class="chat-btn"
        type="button"
        onclick="openPrivateChat('${d.id}')"
      >
        Private Chat
      </button>

    </div>
  `;
}


/* =========================
   RENDER DONOR CARDS
========================= */

async function renderCards(targetId, items) {

  const wrap = el(targetId);

  if (!wrap) return;

  wrap.innerHTML = '';

  (items || []).forEach((d) => {

    wrap.insertAdjacentHTML(
      'beforeend',
      donorCardHTML(d)
    );

  });

}


/* =========================
   LOAD RECENT + AVAILABLE
========================= */

async function loadRecentAndAvailable() {

  try {

    const recent = await fetchJSON(
      '/api/recent_donors?limit=6'
    );

    await renderCards(
      'recent-donors',
      recent.donors || []
    );

    const available = await fetchJSON(
      '/api/search_donors'
    );

    await renderCards(
      'available-donors',
      (available.donors || []).slice(0, 6)
    );

  } catch (e) {

    console.error(e);

  }

}


/* =========================
   SEARCH DONORS
========================= */

async function searchDonors() {

  const blood_group = (
    el('filter-blood')?.value || ''
  ).trim();

  const city = (
    el('filter-city')?.value || ''
  ).trim();

  const pincode = (
    el('filter-pincode')?.value || ''
  ).trim();

  const params = new URLSearchParams();

  if (blood_group) {
    params.set('blood_group', blood_group);
  }

  if (city) {
    params.set('city', city);
  }

  if (pincode) {
    params.set('pincode', pincode);
  }

  const wrap = el('search-results');
  const empty = el('search-empty');

  if (wrap) {
    wrap.innerHTML = '';
  }

  if (empty) {
    empty.style.display = 'none';
  }

  try {

    const data = await fetchJSON(
      '/api/search_donors?' + params.toString()
    );

    const donors = data.donors || [];

    if (!donors.length) {

      if (empty) {
        empty.style.display = 'block';
      }

      return;
    }

    donors.forEach((d) => {

      wrap.insertAdjacentHTML(
        'beforeend',
        donorCardHTML(d)
      );

    });

  } catch (e) {

    console.error(e);

  }

}


/* =========================
   OPEN PRIVATE CHAT
========================= */

window.openPrivateChat = async function (receiverId) {

  try {

    const res = await fetch('/api/create_chat', {

      method: 'POST',

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({
        receiver_id: receiverId
      })

    });

    const data = await res.json();

    if (!data.chat_id) {
      throw new Error(
        data.error || 'chat_id missing'
      );
    }

    window.location.href =
      '/chat/' + data.chat_id;

  } catch (e) {

    console.error(e);

    alert('Unable to start chat.');
  }
};


/* =========================
   LOAD CHAT MESSAGES
========================= */

async function loadMessages(chatId) {

  const wrap = el('chat-bubbles');

  if (!wrap) return;

  const res = await fetch(
    '/get_messages?chat_id=' +
      encodeURIComponent(chatId),
    {
      headers: {
        Accept: 'application/json'
      },
    }
  );

  const data = await res.json();

  wrap.innerHTML = '';

  const currentUser =
    window.BLOOD_CHAT?.currentUser;

  (data.messages || []).forEach((m) => {

    const mine =
      currentUser &&
      m.sender_phone === currentUser;

    const align =
      mine ? 'me' : 'other';

    wrap.insertAdjacentHTML(

      'beforeend',

      `
      <div class="message-row ${align}">

        <div class="message-bubble">

          <div class="meta">
            ${escapeHtml(m.sender || '')}
          </div>

          <div class="text">
            ${escapeHtml(m.message || '')}
          </div>

        </div>

      </div>
      `
    );

  });

  wrap.scrollTop =
    wrap.scrollHeight;
}


/* =========================
   SEND MESSAGE
========================= */

async function sendMessage() {

  const chatId =
    window.BLOOD_CHAT?.chatId;

  if (!chatId) return;

  const input = el('message-input');

  const text = (
    input?.value || ''
  ).trim();

  if (!text) return;

  await fetch('/send_message', {

    method: 'POST',

    headers: {
      'Content-Type': 'application/json'
    },

    body: JSON.stringify({
      chat_id: chatId,
      message: text,
    }),

  });

  if (input) {
    input.value = '';
  }

  await loadMessages(chatId);

}


/* =========================
   INIT CHAT
========================= */

async function initChat() {

  if (!window.BLOOD_CHAT?.chatId) {
    return;
  }

  const chatId =
    window.BLOOD_CHAT.chatId;

  const sendBtn = el('send-btn');

  const input = el('message-input');

  if (sendBtn) {

    sendBtn.addEventListener(
      'click',
      sendMessage
    );

  }

  if (input) {

    input.addEventListener(
      'keydown',
      (e) => {

        if (e.key === 'Enter') {
          sendMessage();
        }

      }
    );

  }

  await loadMessages(chatId);

  setInterval(() => {

    loadMessages(chatId);

  }, 2000);

}


/* =========================
   LOAD MY CHATS
========================= */

async function loadMyChats() {

  const wrap =
    document.getElementById(
      'my-chats-list'
    );

  if (!wrap) return;

  try {

    const res = await fetch(
      '/api/my_chats',
      {
        headers: {
          Accept: 'application/json'
        }
      }
    );

    const data = await res.json();

    wrap.innerHTML = '';

    if (!data.chats.length) {

      wrap.innerHTML = `
        <div class="muted">
          No chats yet
        </div>
      `;

      return;
    }

    data.chats.forEach((c) => {

      wrap.insertAdjacentHTML(
        'beforeend',
        `
        <div class="donor-card">

          <div class="donor-top">

            <div class="donor-name">
              ${escapeHtml(c.name)}
            </div>

            <span class="donor-badge">
              New Message
            </span>

          </div>

          <div class="donor-meta">

            <p>
              ${escapeHtml(
                c.last_message || ''
              )}
            </p>

          </div>

          <button
            class="chat-btn"
            onclick="
              window.location.href=
              '/chat/${c.chat_id}'
            "
          >
            Open Chat
          </button>

        </div>
        `
      );

    });

  } catch (e) {

    console.error(e);

  }

}


/* =========================
   DASHBOARD
========================= */

async function initDashboard() {

  const btn = el('btn-search');

  if (!btn) return;

  btn.addEventListener(
    'click',
    searchDonors
  );

  await loadRecentAndAvailable();

  await loadMyChats();

}


/* =========================
   DOM READY
========================= */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    initDashboard();

    initChat();

    initRegisterForm();

  }
);