// --- Include header/footer ---
async function includeHTML() {
  async function load(id, file) {
    try {
      const res = await fetch(file);
      if (!res.ok) return;
      const text = await res.text();
      document.getElementById(id).innerHTML = text;
    } catch (e) {
      console.warn('Could not load', file, e);
    }
  }
  await load("header", "header.html");
  await load("sidebar", "sidebar.html");
  await load("footer", "footer.html");
  const sidebarScript = document.createElement("script");
  sidebarScript.src = "js/sidebar.js";
  sidebarScript.defer = true;
  document.body.appendChild(sidebarScript);
}

// --- Main App ---
document.addEventListener("DOMContentLoaded", () => {
  includeHTML();

  // --- Config ---
  const SHEET_ID = "1TxdvMNgP6bN-566gtVo10qkI595Q76T9_nt8-G5SwBs";
  const API_KEY = "AIzaSyC04IiyzXoZK4i4HGb-QzrseXD9eU8FxBg";
  const BATCH_SIZE = 10;

  // --- UI references ---
  const container = document.getElementById("articles-container");
  const loadMoreBtn = document.getElementById("load-more-btn");
  const recommendedContainer = document.getElementById("recommended-list");
  const categoryListEl = document.getElementById("category-list");

  let headers = [];
  let currentPage = 0;

  // --- Helpers ---
  async function fetchHeaders() {
    try {
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Sheet1!A1:Z1?key=${API_KEY}`);
      const json = await res.json();
      headers = (json.values && json.values[0]) || [];
    } catch (e) {
      console.error('Error fetching headers', e);
    }
  }

  async function fetchPosts(page) {
    const startRow = page * BATCH_SIZE + 2;
    const endRow = startRow + BATCH_SIZE - 1;
    const range = `Sheet1!A${startRow}:Z${endRow}`;
    try {
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${API_KEY}`);
      const data = await res.json();
      return data.values || [];
    } catch (e) {
      console.error('Error fetching posts', e);
      return [];
    }
  }

  async function fetchRowExists(rowNumber) {
    const range = `Sheet1!A${rowNumber}:Z${rowNumber}`;
    try {
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${range}?key=${API_KEY}`);
      const data = await res.json();
      return Array.isArray(data.values) && data.values.length > 0 && data.values[0].some(cell => (cell || "").trim() !== "");
    } catch (e) {
      console.error('Error checking row existence', e);
      return false;
    }
  }

  function makeObjFromRow(row) {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i] || "");
    return obj;
  }

  function renderPosts(rows, append = false) {
    if (!rows || rows.length === 0) {
      if (!append) container.innerHTML = "<h3>No posts found.</h3>";
      loadMoreBtn.classList.add("d-none");
      return;
    }

    const postsHtml = rows.reverse().map(row => {
      const obj = makeObjFromRow(row);
      const title = obj.Title || "";
      const slug = obj.Slug || "#";
      const date = obj.DateTime || obj.Date || "";
      const readTime = obj.ReadTime || "";
      const categories = obj.Category || "";
      const excerpt = obj.Excerpt || "";
      const image = obj.ImageURL && obj.ImageURL.trim() !== "" ? obj.ImageURL.trim() : "images/default.jpg";

      const catHtml = categories ? categories.split(",").map(c => {
        const t = c.trim();
        return `<li><a href="category.html?cat=${encodeURIComponent(t)}">${t}</a></li>`;
      }).join(" ") : "";

      const encodedPost = encodeURIComponent(JSON.stringify(obj));

      return `
        <div class="col-md-6 mb-4">
          <article class="card article-card h-100">
            <a class="post-link" href="article.html?slug=${encodeURIComponent(slug)}" data-post="${encodedPost}">
              <div class="card-image">
                <div class="post-info">
                 <span class="text-uppercase">${timeAgo(obj?.DateTime)}</span>
                  <span class="">${readTime} Mins Read</span>
                </div>
                <img src="${image}" alt="Post Thumbnail" class="w-100">
              </div>
            </a>
            <div class="card-body px-0 pb-0">
              <ul class="post-meta mb-2">${catHtml}</ul>
              <h2>
                <a class="post-title post-link" href="article.html?slug=${encodeURIComponent(slug)}" data-post="${encodedPost}">${title}</a>
              </h2>
              <p class="card-text">${excerpt}</p>
              <div class="content">
                <a class="read-more-btn post-link" href="article.html?slug=${encodeURIComponent(slug)}" data-post="${encodedPost}">Read Full Article</a>
              </div>
            </div>
          </article>
        </div>
      `;
    }).join("");

    if (!append) container.innerHTML = postsHtml;
    else container.insertAdjacentHTML("beforeend", postsHtml);
  }

  async function checkMoreExistsForPage(page) {
    const startRow = page * BATCH_SIZE + 2;
    const endRow = startRow + BATCH_SIZE - 1;
    const nextRow = endRow + 1;
    return await fetchRowExists(nextRow);
  }

  async function loadMore() {
    loadMoreBtn.disabled = true;
    currentPage++;
    const rows = await fetchPosts(currentPage);
    renderPosts(rows, true);
    if (rows.length < BATCH_SIZE) loadMoreBtn.classList.add("d-none");
    else {
      const more = await checkMoreExistsForPage(currentPage);
      if (!more) loadMoreBtn.classList.add("d-none");
      else loadMoreBtn.classList.remove("d-none");
    }
    loadMoreBtn.disabled = false;
  }

function timeAgo(dateStr) {
  if (!dateStr) return "";

  const postDate = new Date(dateStr);
  if (isNaN(postDate)) return dateStr;

  const now = new Date();
  const diffMs = now - postDate;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return diffMin + (diffMin === 1 ? " min ago" : " mins ago");
  if (diffHr < 24) return diffHr + (diffHr === 1 ? " hr ago" : " hrs ago");
  if (diffDay === 1) return "yesterday";

  // older than yesterday → show in "18 Sep 2025" format
  const day = postDate.getDate();
  const month = postDate.toLocaleString('en-US', { month: 'short' });
  const year = postDate.getFullYear();
  return `${day} ${month} ${year}`;
}


  // Post click to save in localStorage
  document.addEventListener("click", function(e) {
    const link = e.target.closest("a.post-link");
    if (!link) return;

    e.preventDefault();
    const encodedPost = link.getAttribute("data-post");
    if (encodedPost) {
      try {
        const post = JSON.parse(decodeURIComponent(encodedPost));
        // localStorage.setItem("selectedPost", JSON.stringify(post));
      } catch (err) { console.error(err); }
    }
    window.location.href = link.href;
  });

  // --- Init ---
  (async function init() {
    try {
      await fetchHeaders();
      const rows = await fetchPosts(0);
      renderPosts(rows, false);

      if (rows.length < BATCH_SIZE) loadMoreBtn.classList.add("d-none");
      else {
        const more = await checkMoreExistsForPage(0);
        if (more) loadMoreBtn.classList.remove("d-none");
      }
    } catch (err) {
      console.error(err);
      container.innerHTML = "<h3>Error loading posts.</h3>";
      loadMoreBtn.classList.add("d-none");
    }
  })();

  loadMoreBtn.addEventListener("click", loadMore);
});

