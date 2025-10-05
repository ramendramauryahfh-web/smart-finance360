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

  const container = document.getElementById("articles-container");
  const loader = document.getElementById("article-loader");
  const loadMoreBtn = document.getElementById("load-more-btn");
  const API_URL = "https://script.google.com/macros/s/AKfycbysmMzT8ebpbbl2LNqOX_yXbtwz-BJbqcvnT6gdmCxRoiEBEAi2QSAbgb8cyIe-wgKI/exec";
 const metaCategory = document.querySelector('meta[name="category"]');
const CATEGORY = metaCategory ? metaCategory.content : "Finance";
console.log(CATEGORY,"catgeory is here");
  // const CATEGORY = "Finance"; // Category to fetch
  const BATCH_SIZE = 10;

  let allPosts = [];
  let currentIndex = 0;

  // --- Fetch posts from API ---
  async function fetchPosts() {
    try {
      const res = await fetch(`${API_URL}?action=category&category=${encodeURIComponent(CATEGORY)}`);
      const data = await res.json();
      if (!Array.isArray(data) || data.length === 0) {
        container.innerHTML = `<h3>No ${CATEGORY} posts found.</h3>`;
        loadMoreBtn.classList.add("d-none");
        return;
      }
      allPosts = data.reverse(); // latest first
      renderPosts();
    } catch (err) {
      console.error("Error fetching posts:", err);
      container.innerHTML = "<h3>Error loading posts.</h3>";
      loadMoreBtn.classList.add("d-none");
    }
  }

  // --- Render posts with pagination ---
  function renderPosts() {
    // Remove loader spinner if present
    loader?.remove();

    const slice = allPosts.slice(currentIndex, currentIndex + BATCH_SIZE);
    const html = slice.map(obj => {
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
            <a class="post-link" href="articles/${slug}.html" data-post="${encodedPost}">
              <div class="card-image">
                <div class="post-info">
                  <span class="text-uppercase">${timeAgo(date)}</span>
                  <span>${readTime} Mins Read</span>
                </div>
                <img src="${image}" alt="Post Thumbnail" class="w-100">
              </div>
            </a>
            <div class="card-body px-0 pb-0">
              <ul class="post-meta mb-2">${catHtml}</ul>
              <h2>
                <a class="post-title post-link" href="articles/${slug}.html" data-post="${encodedPost}">${title}</a>
              </h2>
              <p class="card-text">${excerpt}</p>
              <div class="content">
                <a class="read-more-btn post-link" href="articles/${slug}.html" data-post="${encodedPost}">Read Full Article</a>
              </div>
            </div>
          </article>
        </div>
      `;
    }).join("");

    // Append posts as children of #articles-container
    container.insertAdjacentHTML("beforeend", html);

    currentIndex += BATCH_SIZE;

    if (currentIndex >= allPosts.length) loadMoreBtn.classList.add("d-none");
    else loadMoreBtn.classList.remove("d-none");
  }

  // --- Load more ---
  loadMoreBtn.addEventListener("click", renderPosts);

  // --- Time ago ---
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

    const day = postDate.getDate();
    const month = postDate.toLocaleString('en-US', { month: 'short' });
    const year = postDate.getFullYear();
    return `${day} ${month} ${year}`;
  }

  // --- Post click to save in localStorage ---
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
  fetchPosts();
});
