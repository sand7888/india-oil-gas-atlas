/* Embed mode shared by every page.
 *
 *   page.html?embed=<name>            only that chart, with a source line and a link to the full page
 *   &static=1                         fixed 1200px wide, no hover hints (used to make images)
 *   &theme=light|dark                 force a colour theme
 *   &link=0                           no link to the full page (used inside articles)
 *
 * A page lists its embeddable blocks in data-embed attributes, e.g. <section data-embed="balance">.
 * After the page has drawn, it calls EMBED.finish(sourceText, [blocks to keep]). The final height is posted to the parent
 * window (for auto-resizing iframes) and written to <body data-h> (read by build_images.py).
 */
(function () {
  const q = new URLSearchParams(location.search);
  const mode = q.get("embed");
  const isStatic = q.has("static");
  const root = document.documentElement;
  if (q.get("theme") === "light" || q.get("theme") === "dark") root.dataset.theme = q.get("theme");
  if (mode) root.classList.add("embed");
  if (isStatic) root.classList.add("static");

  // Hide every block in the page except the ones marked for this embed (and the elements that contain them).
  function keepOnly(names) {
    const page = document.querySelector(".page");
    const keep = [...document.querySelectorAll("[data-embed]")].filter((el) => names.includes(el.dataset.embed));
    if (!keep.length) return;
    const chain = new Set();
    for (const el of keep) for (let e = el; e && e !== page; e = e.parentElement) chain.add(e);
    for (const el of chain) {
      for (const sib of el.parentElement.children) {
        if (!chain.has(sib) && !sib.classList.contains("embedfoot")) sib.hidden = true;
      }
    }
  }

  function postHeight() {
    const h = Math.ceil(document.querySelector(".page").getBoundingClientRect().height);
    document.body.dataset.h = h;
    if (parent !== window) parent.postMessage({ type: "atlas-embed", h, src: location.href }, "*");
  }

  window.EMBED = {
    mode, isStatic,
    param: (k) => q.get(k),
    finish(sourceText, keep) {
      if (!mode) return;
      keepOnly(keep || mode.split(","));
      const full = location.href.split("?")[0];
      const foot = document.createElement("div");
      foot.className = "embedfoot";
      foot.innerHTML = `<span>${sourceText}</span>` +
        (isStatic || q.get("link") === "0" ? `<span class="brand-sm">India Oil &amp; Gas Atlas</span>`
                  : `<a href="${full}" target="_blank" rel="noopener">Open the interactive version ↗</a>`);
      document.querySelector(".page").append(foot);
      postHeight();
      if ("ResizeObserver" in window) new ResizeObserver(postHeight).observe(document.querySelector(".page"));
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(postHeight);
    },
  };
})();
