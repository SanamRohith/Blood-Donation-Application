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
        <p>
  Phone:
  <b>${escapeHtml(d.phone || '-')}</b>
</p>

      </div>

      <div class="donor-actions">

  <a
    href="tel:${d.phone}"
    class="btn btn-secondary"
  >
    📞 Call
  </a>

  <a
    href="https://wa.me/91${d.phone}?text=Hi%20I%20need%20blood%20donation%20help"
    target="_blank"
    class="btn btn-primary"
  >
    💬 WhatsApp
  </a>

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


}

const availabilityToggle =
  document.getElementById(
    "availability-toggle"
  );

if(availabilityToggle){

  availabilityToggle.addEventListener(

    "change",

    async function(){

      try{

        const res = await fetch(
          "/api/update_availability",
          {

            method:"POST",

            headers:{
              "Content-Type":
                "application/json"
            },

            body:JSON.stringify({

              available:
                availabilityToggle.checked

            })
          }
        );

        const data =
          await res.json();

        if(data.success){

          console.log(
            t("availability_updated")
          );

        }else{

          alert(
            t("availability_failed")
          );
        }

      }catch(err){

        console.error(err);

        alert(
          t("something_wrong")
        );
      }

    }
  );
}

async function loadRecentActivities(){

  const container =
    document.getElementById(
      "recent-activities"
    );

  if(!container){
    return;
  }

  const res = await fetch(
    "/api/recent_activities"
  );

  const data = await res.json();

  if(
    !data.activities ||
    data.activities.length === 0
  ){

    container.innerHTML = `

      <div class="empty-state">
        ${t("no_recent_activity")}
      </div>

    `;

    return;
  }

  container.innerHTML = "";

  data.activities.forEach(a => {

    const time =
      a.resolved_at
      ? new Date(
          a.resolved_at
        ).toLocaleString()
      : "Recently";

    container.innerHTML += `

  <div class="activity-item">

    <div class="activity-icon">
      🩸
    </div>

    <div class="activity-content">

      <div>

        <strong>
          ${a.resolved_by}
        </strong>

        helped resolve an emergency

        <strong>
          ${a.blood_group}
        </strong>

        request

      </div>

      <div class="activity-time">

        📍 ${a.city}
        • ${time}

      </div>

    </div>

  </div>

`;
  });
}

loadRecentActivities();

document.querySelectorAll(".chip")
.forEach(chip => {

    chip.addEventListener(
        "click",
        () => {

            const blood =
                chip.innerText.trim();

            document.getElementById(
                "filter-blood"
            ).value = blood;

            document.getElementById(
                "btn-search"
            ).click();
        }
    );

});

/* Location ========== */

function getLocation() {

    if (!navigator.geolocation) {

        alert("Geolocation not supported");

        return;
    }

    navigator.geolocation.getCurrentPosition(

        async(position) => {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;

            try {

                const response = await fetch(

                    "/api/update_location",

                    {

                        method: "POST",

                        headers: {

                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            latitude,
                            longitude
                        })
                    }
                );

                const data =
                    await response.json();

                if(data.success){

                    const locationBox =
                        document.querySelector(
                            ".nav-location-box"
                        );

                    if(locationBox){

                        locationBox.innerHTML =

                        `<span class="location-status">
                            📍 ${data.city}
                        </span>`;
                    }

                    console.log(
                        "Location updated"
                    );

                }else{

                    alert(
                        "Failed to update location"
                    );
                }

            } catch(err){

                console.log(err);

                alert(
                    "Server error"
                );
            }
        },

        (error) => {

            alert(
                "Location permission denied"
            );

            console.log(error);
        }
    );
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