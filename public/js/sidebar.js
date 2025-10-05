(async function() {
  const url = "https://script.google.com/macros/s/AKfycbyvaD63Zj2HtiGco4vSOhbUCbpjLn_clCZgeBLFlHavhhPoaS1JP8uVT0j50X2wJ7V7/exec?action=sidebar&limit=5";

  try {
    const res = await fetch(url);
    const payload = await res.json();
   
    // --- Recommended ---
    const recommended = payload.recommended || [];
    const recContainer = document.getElementById("recommended-list");
 
    if (recContainer) {
     recContainer.innerHTML = recommended.map((row, index) => {
  const img = row.ImageURL
    ? `<img loading="lazy" decoding="async" src="${row.ImageURL}" alt="${row.Title}" class="w-100">`
    : `<span class="image-fallback image-fallback-xs">No Image</span>`;

  // ✅ Define slug safely
  const slug = row.Slug || row.Title?.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]+/g, "");

  return `
    <article class="card mb-4">
      <div class="card-image">
        <div class="post-info">
          <span class="text-uppercase">${row.ReadTime || "Few minutes"} read</span>
        </div>
        ${img}
      </div>
      <div class="card-body px-0 pb-1">
        <h3><a class="post-title post-title-sm" href="articles/${slug}.html">
          ${row.Title}
        </a></h3>
        <p class="card-text">${row.Excerpt || ""}</p>
        <div class="content">
          <a class="read-more-btn" href="articles/${slug}.html">Read Full Article</a>
        </div>
      </div>
    </article>
  `;
}).join("");

    }

    // --- Categories ---
    const categories = payload.categories || {};
    const categoryList = document.getElementById("category-list");

    if (categoryList) {
      if (Object.keys(categories).length === 0) {
        categoryList.innerHTML = "<li>No categories found</li>";
      } else {
        categoryList.innerHTML = Object.entries(categories)
          .map(([cat, count]) => `
            <li>
              <a href="category.html?cat=${encodeURIComponent(cat)}">
                ${cat} <span class="ml-auto">(${count})</span>
              </a>
            </li>
          `)
          .join("");
      }
    }
  } catch (err) {
    console.error("Sidebar fetch error:", err);
    const rc = document.getElementById("recommended-list");
    const cl = document.getElementById("category-list");
    if (rc) rc.innerHTML = "<p>Error loading recommended posts.</p>";
    if (cl) cl.innerHTML = "<li>Error loading categories</li>";
  }
})();
