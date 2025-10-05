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

  const BATCH_SIZE = 10;
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby-u6qDUu2l8-4GnvzlzJuKBpZabbs9j3_3B95_BriJXLzolv5ru0HsZ1WI_qHcPAqz/exec';
  
  const container = document.getElementById("articles-container");
  const loadMoreBtn = document.getElementById("load-more-btn");
  let currentPage = 0;

  async function fetchPosts(page) {
    try {
      const res = await fetch(`${SCRIPT_URL}?action=posts&page=${page}&limit=${BATCH_SIZE}`);
      return await res.json();
    } catch (e) {
      console.error('Error fetching posts', e);
      return [];
    }
  }

  function renderPosts(posts, append = false) {
    document.getElementById('article-loader')?.remove();

    if (!posts || posts.length === 0) {
      if (!append) container.innerHTML = "<h3>No posts found.</h3>";
      loadMoreBtn.classList.add("d-none");
      return;
    }

    const html = posts.map(post => {
      const categories = post.Category
        ? post.Category.split(",").map(c => `<li><a href="category.html?cat=${encodeURIComponent(c.trim())}">${c.trim()}</a></li>`).join(" ")
        : "";

      const image = post.ImageURL && post.ImageURL.trim() !== "" ? post.ImageURL.trim() : "images/default.jpg";
      const slug = encodeURIComponent(post.Slug || "#");
      const encodedPost = encodeURIComponent(JSON.stringify(post));
      const readTime = post.ReadTime || "";

      // ✅ updated link to pretty URL
      return `
        <div class="col-md-6 mb-4">
          <article class="card article-card h-100">
            <a class="post-link" href="articles/${slug}.html" data-post="${encodedPost}">
              <div class="card-image">
                <div class="post-info">
                  <span class="text-uppercase">${timeAgo(post?.DateTime)}</span>
                  <span>${readTime} Mins Read</span>
                </div>
                <img src="${image}" alt="Post Thumbnail" class="w-100">
              </div>
            </a>
            <div class="card-body px-0 pb-0">
              <ul class="post-meta mb-2">${categories}</ul>
              <h2>
                <a class="post-title post-link" href="articles/${slug}.html" data-post="${encodedPost}">${post.Title || ""}</a>
              </h2>
              <p class="card-text">${post.Excerpt || ""}</p>
              <div class="content">
                <a class="read-more-btn post-link" href="articles/${slug}.html" data-post="${encodedPost}">Read Full Article</a>
              </div>
            </div>
          </article>
        </div>
      `;
    }).join("");

    if (!append) container.innerHTML = html;
    else container.insertAdjacentHTML("beforeend", html);
  }

  async function loadMore() {
    loadMoreBtn.disabled = true;
    const posts = await fetchPosts(currentPage);
    renderPosts(posts, true);

    if (posts.length < BATCH_SIZE) loadMoreBtn.classList.add("d-none");
    currentPage++;
    loadMoreBtn.disabled = false;
  }

  function timeAgo(dateStr) {
    if (!dateStr) return "";
    const postDate = new Date(dateStr);
    if (isNaN(postDate)) return dateStr;

    const now = new Date();
    const diffSec = Math.floor((now - postDate) / 1000);
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
      } catch (err) { console.error(err); }
    }
    window.location.href = link.href;
  });

  // --- Init ---
  (async function init() {
    try {
      const posts = await fetchPosts(currentPage);
      renderPosts(posts, false);

      if (posts.length < BATCH_SIZE) loadMoreBtn.classList.add("d-none");
      currentPage = 1;
    } catch (err) {
      console.error(err);
      container.innerHTML = "<h3>Error loading posts.</h3>";
      loadMoreBtn.classList.add("d-none");
    }
  })();

  loadMoreBtn.addEventListener("click", loadMore);
});
