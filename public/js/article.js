// article.js

// --- Include header, sidebar, footer ---
async function includeHTML() {
  const load = async (id, file) => {
    const res = await fetch(file);
    const text = await res.text();
    document.getElementById(id).innerHTML = text;
  };

  // Load header, sidebar HTML, footer first
  await load("header", "header.html");
  await load("sidebar", "sidebar.html");
  await load("footer", "footer.html");

  // --- Call article first ---
  await loadArticle(); // wait for article fetch

  // --- Load sidebar script asynchronously ---
  const sidebarScript = document.createElement("script");
  sidebarScript.src = "js/sidebar.js";
  sidebarScript.defer = true;
  document.body.appendChild(sidebarScript);
}

document.addEventListener("DOMContentLoaded", includeHTML);


// --- Fetch and display single article by slug ---
async function loadArticle() {
  const container = document.getElementById("article-container");
  if (!container) return;

  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");

  if (!slug) {
    container.innerHTML = "<p>Article not found.</p>";
    return;
  }

  container.innerHTML = "<p>Loading article...</p>";

  try {
    const res = await fetch(`https://script.google.com/macros/s/AKfycbxI9pqGtlQFtd0e6CM3IDsfn3eyz2yOx35FgnTzaOMa-fHvcao8ScZoSXuDtnccV8_Y/exec?action=article&slug=${encodeURIComponent(slug)}`);
    const post = await res.json();

    if (post.error) {
      container.innerHTML = `<p>${post.error}</p>`;
      return;
    }

    const title = post.Title || "";
    const date = post.DateTime || "";
    const readTime = post.ReadTime || "";
    const categories = post.Category || "";
    const image = post.ImageURL || "images/default.jpg";
    const author = post.Author || "Admin";
    const content = post.Content || "";
    const pageViews= post.Views || 112
    const tags= post.Keywords || "";

    // --- Update SEO meta tags ---
    document.title = post.MetaTitle || title || "Smart Finance 360";

    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', post.MetaDescription || "");

    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.setAttribute('content', post.Keywords || "");

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.href);

    // Open Graph tags
    const ogTags = [
      { prop: 'og:title', content: post.MetaTitle || title },
      { prop: 'og:description', content: post.MetaDescription || "" },
      { prop: 'og:image', content: image },
      { prop: 'og:url', content: window.location.href },
    ];
    ogTags.forEach(tag => {
      let el = document.querySelector(`meta[property="${tag.prop}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', tag.prop);
        document.head.appendChild(el);
      }
      el.setAttribute('content', tag.content);
    });

    // --- Render Article ---
    container.innerHTML = `
      <header class="mb-4">
        <h1 class="mb-2">${title}</h1>
        <div class="text-muted small">
          <span>${timeAgo(date)}</span> · <span>${readTime} min read</span> · <span>By ${author}</span> -   <span>
    <img src="images/view.svg" alt="Views" style="width:16px; height:16px; vertical-align:middle; margin-right:4px;">
    ${pageViews} Views
  </span>
        </div>
        
        <ul class="post-meta mt-2">
          ${categories.split(",").map(c => `<li style="display:inline; margin-right:5px;"><a href="#!">${c.trim()}</a></li>`).join("")}
        </ul>

         
      </header>
  
<!-- Social Share Buttons -->
<div class="social-share mt-4">
  <h5>Share this article:</h5>
  <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}" target="_blank" class="social-icon fb">
    <i class="fab fa-facebook-f"></i>
  </a>
  <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(window.location.href)}" target="_blank" class="social-icon tw">
    <i class="fab fa-twitter"></i>
  </a>
  <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}" target="_blank" class="social-icon li">
    <i class="fab fa-linkedin-in"></i>
  </a>
  <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + window.location.href)}" target="_blank" class="social-icon wa">
    <i class="fab fa-whatsapp"></i>
  </a>
</div>

      <figure class="mb-4">
        <img src="${image}" alt="${title}" class="w-100 rounded">
      </figure>
      <section class="article-content">
        ${content}
      </section>
        <!-- Keywords -->
        <div class="article-keywords mt-2">
  <strong>Keywords:</strong> 
  ${tags?.split(",").map(k => `
    <a href="search.html?keyword=${encodeURIComponent(k.trim())}" 
       class="badge bg-light text-dark" 
       style="margin-right:5px; text-decoration:none;">
       ${k.trim()}
    </a>`).join("")}
</div>

       <!-- Social Share Buttons -->
<div class="social-share mt-4">
  <h5>Share this article:</h5>
  <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}" target="_blank" class="social-icon fb">
    <i class="fab fa-facebook-f"></i>
  </a>
  <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(window.location.href)}" target="_blank" class="social-icon tw">
    <i class="fab fa-twitter"></i>
  </a>
  <a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}" target="_blank" class="social-icon li">
    <i class="fab fa-linkedin-in"></i>
  </a>
  <a href="https://api.whatsapp.com/send?text=${encodeURIComponent(title + ' ' + window.location.href)}" target="_blank" class="social-icon wa">
    <i class="fab fa-whatsapp"></i>
  </a>
</div>


      <div class="article-views text-muted small mt-3" id="viewCounter">Loading views...</div>
    `;

    // --- Track Page View + Update Counter ---
    trackPageView(slug);

  } catch (err) {
    console.error("Error fetching article:", err);
    container.innerHTML = "<p>Error loading article.</p>";
  }
}

// --- Helper: Format date as "time ago" ---
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


// --- Track page view ---
async function trackPageView(slug) {
  try {
    const res = await fetch(
      `https://script.google.com/macros/s/AKfycbxWKE0dvNKnqimQn9JioWSFb9I5GvBcjHCqWUvMn8ng4GGpNv4gBGIjGsXITD7jl-Tl-Q/exec?action=trackView&slug=${encodeURIComponent(slug)}`
    );
    const data = await res.json();
    console.log("Page view tracked:", data);
    
    // Optional: display view count in article
    const metaDiv = document.querySelector(".text-muted.small");
    if (metaDiv && data.views !== undefined) {
      metaDiv.innerHTML += ` · <span>${data.views} views</span>`;
    }
  } catch (err) {
    console.error("Error tracking view:", err);
  }
}

