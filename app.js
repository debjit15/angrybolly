/* app.js - interaction and leaderboard handling for AngryBolly
   Notes:
   - For production, use a secure server endpoint to fetch leaderboard (recommended).
   - A PlayFab client fallback is included, but client-side secrets are not safe.
*/

/* ---------- UI interactions ---------- */
document.addEventListener('DOMContentLoaded', () => {
  // Thumbnail click behavior
  document.querySelectorAll('.thumb').forEach(t => {
    t.addEventListener('click', e => {
      document.querySelectorAll('.thumb').forEach(x => x.classList.remove('active'));
      e.currentTarget.classList.add('active');
      const src = e.currentTarget.getAttribute('data-src');
      document.getElementById('mainShot').src = src;
      // If user clicked a thumb, don't autoplay video
    });
  });

  // Read more toggle
  const readToggle = document.getElementById('readMoreToggle');
  if (readToggle) {
    readToggle.addEventListener('click', () => {
      const longDesc = document.getElementById('longDesc');
      if (longDesc.hidden) {
        longDesc.hidden = false;
        readToggle.innerText = 'Show less ▴';
      } else {
        longDesc.hidden = true;
        readToggle.innerText = 'Read more ▾';
      }
    });
  }

  // Play button (placeholder)
  const btnPlay = document.getElementById('btnPlay');
  if (btnPlay) {
    btnPlay.addEventListener('click', () => {
      // Replace with actual instant-play action or redirect
      window.location.href = 'assets/instantplay/angrybolly.html';
    });
  }

  // Load leaderboard from secure endpoint (preferred)
  loadLeaderboardSecure().catch(err => {
    console.warn('Secure leaderboard fetch failed (or not configured). Falling back to client PlayFab fetch if available.');
    // Fallback: optional PlayFab client usage if SDK present and title id exists (not secure)
    if (window.PlayFabClientSDK) {
      loginPlayFabClient();
    }
  });
});

/* ---------- Secure leaderboard (recommended) ----------
   Production approach:
   - Host a server endpoint at /api/leaderboard that calls PlayFab with secret key.
   - The endpoint returns a lightweight JSON: { players: [{name,score}, ...] }
   - The browser calls /api/leaderboard (no secrets in client).
*/
async function loadLeaderboardSecure() {
  try {
    const res = await fetch('/api/leaderboard', { cache: 'no-cache' });
    if (!res.ok) throw new Error('Network response not ok');
    const json = await res.json();
    if (!json.players || !Array.isArray(json.players)) throw new Error('Invalid data');
    updateLeaderboardFromArray(json.players);
  } catch (err) {
    // Re-throw to allow fallback
    throw err;
  }
}

function updateLeaderboardFromArray(arr) {
  const slots = [
    { name: 'p1name', score: 'p1score' },
    { name: 'p2name', score: 'p2score' },
    { name: 'p3name', score: 'p3score' }
  ];
  arr.slice(0, 3).forEach((p, i) => {
    const n = document.getElementById(slots[i].name);
    const s = document.getElementById(slots[i].score);
    if (n) n.innerText = p.name || n.innerText;
    if (s) s.innerText = (p.score !== undefined) ? p.score : s.innerText;
  });
}

/* ---------- PlayFab client fallback (NOT SECURE) ----------
   This code only works if you accept client-side PlayFab usage.
   It's included so you can test quickly. For production, prefer loadLeaderboardSecure().
   Replace PLAYFAB_TITLE_ID with your title id if you want to test client-side only.
*/
const PLAYFAB_TITLE_ID = "16EA52"; // Provided earlier; keep for quick tests only
const LEADERBOARD_STAT = "HighScore";

function loginPlayFabClient() {
  if (!window.PlayFabClientSDK) {
    console.warn('PlayFab SDK not loaded.');
    return;
  }

  PlayFab.settings.titleId = PLAYFAB_TITLE_ID;

  const loginRequest = {
    TitleId: PLAYFAB_TITLE_ID,
    CustomId: "WebUser_" + Math.floor(Math.random() * 999999),
    CreateAccount: true
  };

  PlayFabClientSDK.LoginWithCustomID(loginRequest, function (result, error) {
    if (result) {
      fetchPlayFabLeaderboard();
    } else {
      console.error('PlayFab login failed', error);
    }
  });
}

function fetchPlayFabLeaderboard() {
  const request = {
    StatisticName: LEADERBOARD_STAT,
    StartPosition: 0,
    MaxResultsCount: 3
  };

  PlayFabClientSDK.GetLeaderboard(request, function (result, error) {
    if (result && result.data && result.data.Leaderboard) {
      const list = result.data.Leaderboard.map(e => ({ name: e.DisplayName || e.PlayFabId, score: e.StatValue }));
      updateLeaderboardFromArray(list);
    } else {
      console.error('PlayFab leaderboard fetch failed', error);
    }
  });
}

