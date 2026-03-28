async function checkProfile() {
  const username = document.getElementById("username").value.trim();
  const resultElement = document.getElementById("result");
  const loadingElement = document.getElementById("loading");
  const statusElement = document.getElementById("status");
  if (!username) {
    resultElement.innerHTML = `<pre class="error">Username tidak boleh kosong!</pre>`;
    statusElement.innerText = "Error: Empty username";
    statusElement.classList.add("error");
    return;
  }
  // Reset
  resultElement.classList.remove("error");
  statusElement.classList.remove("error");
  resultElement.innerHTML = "";
  loadingElement.classList.add("active");
  statusElement.innerText = `Scanning @${username}...`;
  try {
    const response = await fetch(`/api/profile?username=${username}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Format dan tampilkan profil dengan gambar
    displayProfile(data, username);
    statusElement.innerText = `✓ Profile loaded successfully`;
  } catch (error) {
    resultElement.innerHTML = `<pre class="error">Gagal mengambil data profil. Periksa koneksi atau username Anda.</pre>`;
    statusElement.innerText = "Error: Failed to fetch data";
    statusElement.classList.add("error");
  } finally {
    loadingElement.classList.remove("active");
  }
}
function displayProfile(data, username) {
  const resultElement = document.getElementById("result");
  let output = "";

  // Header
  output += `<pre>[PROFILE DATA RETRIEVED]
${"=".repeat(50)}

`;

  // Ekstrak informasi profil
  const profile = extractProfileInfo(data);

  // Buat HTML dengan gambar avatar jika ada
  let htmlContent = "";
  let textContent = "";
  let avatarUrl = null;

  // Buat URL profil TikTok
  const profileUrl = `https://www.tiktok.com/@${username}`;

  // Tambahkan profile_url di awal
  textContent += `├─ profile_url: <a href="${profileUrl}" target="_blank" class="profile-link">${profileUrl}</a>\n`;

  for (const [key, value] of Object.entries(profile)) {
    if (key === "avatar_url" || key === "avatar" || key === "profile_pic_url") {
      avatarUrl = value;
      textContent += `├─ ${key}: [IMAGE]\n`;
    } else if (key === "is_verified" && value === true) {
      textContent += `├─ <span class="verified-badge">${key}: ✓ VERIFIED</span>\n`;
    } else if (key === "followers" || key === "followings" || key === "likes") {
      textContent += `├─ ${key}: <span class="stat-value">${formatNumber(value)}</span>\n`;
    } else if (key === "external_url" && (value === null || value === "")) {
      // Jangan tampilkan external_url jika null atau kosong
      continue;
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      textContent += `├─ ${key}:\n`;
      textContent += formatObjectToText(value, 1);
    } else {
      textContent += `├─ ${key}: ${value}\n`;
    }
  }

  output += textContent;

  // Tambahkan gambar avatar jika ada
  if (avatarUrl) {
    output += `\n`;
    htmlContent += `<img src="${avatarUrl}" alt="Avatar" class="avatar-image" onerror="this.style.display='none'">`;
  }

  // Tambahkan grid video jika ada
  if (data.videos && Array.isArray(data.videos) && data.videos.length > 0) {
    htmlContent += `<div class="videos-heading"><h3>=== Videos (${data.videos.length}) ===</h3></div>`;
    htmlContent += `<div class="videos-grid">`;
    data.videos.forEach((video) => {
      if (video.pic_url || video.link) {
        const views = video.views_count ? video.views_count : "";
        const pic =
          video.pic_url ||
          "https://via.placeholder.com/110x150/000000/00ff00.png?text=No+Thumb";
        htmlContent += `
                <a href="${video.link || "#"}" target="_blank" class="video-item">
                  <img src="${pic}" alt="Thumbnail" class="video-thumbnail" onerror="this.style.display='none'">
                  ${views ? `<span class="video-views">👁 ${views}</span>` : ""}
                </a>
              `;
      }
    });
    htmlContent += `</div>`;
  }

  output += `
${"=".repeat(50)}
[END OF DATA]</pre>`;

  resultElement.innerHTML = output + htmlContent;
}
function extractProfileInfo(data) {
  const profileInfo = {};

  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value)) {
      profileInfo[key] = `${value.length} items`;
    } else if (value && typeof value === "object") {
      if (isProfileRelated(key)) {
        profileInfo[key] = extractProfileInfo(value);
      }
    } else {
      profileInfo[key] = value;
    }
  }

  return profileInfo;
}
function isProfileRelated(key) {
  const profileKeys = [
    "user",
    "profile",
    "account",
    "stats",
    "statistics",
    "info",
    "data",
    "userInfo",
    "accountInfo",
    "detail",
    "followers",
    "following",
    "likes",
    "verified",
    "videos",
  ];

  return profileKeys.some((pk) => key.toLowerCase().includes(pk.toLowerCase()));
}
function formatObjectToText(obj, indent = 0) {
  const spaces = "  ".repeat(indent);
  let result = "";
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      result += `${spaces}├─ ${key}:\n`;
      result += formatObjectToText(value, indent + 1);
    } else {
      result += `${spaces}├─ ${key}: ${value}\n`;
    }
  }
  return result;
}
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}
