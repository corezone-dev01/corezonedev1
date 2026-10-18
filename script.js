/* ===== Central configuration — fill these in; nothing is invented ===== */
const CONFIG = {
  googleScriptUrl: "PASTE_WEB_APP_URL",
  businessWhatsApp: "PASTE_BUSINESS_NUMBER", // digits only, with country code, e.g. 919XXXXXXXXX
  bookingUrl: "PASTE_BOOKING_URL",
  businessEmail: "PASTE_BUSINESS_EMAIL"
};
const isSet = v => v && !/^PASTE_/.test(v);
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
document.documentElement.classList.add("js");
$("#yr").textContent = new Date().getFullYear();

/* Nav: glass on scroll + mobile menu */
const nav = $("#nav"), burger = $("#burger"), menu = $("#menu");
const setMenu = open => { menu.classList.toggle("open", open); burger.setAttribute("aria-expanded", open); burger.setAttribute("aria-label", open ? "Close menu" : "Open menu"); };
burger.onclick = () => setMenu(burger.getAttribute("aria-expanded") !== "true");
menu.addEventListener("click", e => e.target.closest("a") && setMenu(false));
addEventListener("keydown", e => e.key === "Escape" && setMenu(false));

/* Scroll reveal (IntersectionObserver) */
const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 });
$$(".rv").forEach(el => io.observe(el));

/* Parallax + nav state, one rAF-throttled scroll handler */
const px = $$("[data-speed]"); let tick = false;
function frame() {
  const y = scrollY; nav.classList.toggle("on", y > 40);
  if (!reduced && y < innerHeight * 2.5) px.forEach(el => {
    const r = el.parentElement.getBoundingClientRect();
    if (r.bottom > 0 && r.top < innerHeight) el.style.transform = `translate3d(0,${(-r.top * el.dataset.speed).toFixed(1)}px,0)`;
  });
  tick = false;
}
addEventListener("scroll", () => { if (!tick) { tick = true; requestAnimationFrame(frame); } }, { passive: true });
frame();

/* Hero video: remove it if the file is missing so the CSS fallback shows; skip on reduced motion / data saver */
const vid = $("#heroVideo");
const saver = navigator.connection && navigator.connection.saveData;
vid.querySelector("source").addEventListener("error", () => vid.remove());
vid.addEventListener("playing", () => vid.classList.add("ready"));
vid.play && vid.play().catch(() => {});
if (reduced || saver) vid.remove();

/* WhatsApp, booking, email links */
const waLink = text => `https://wa.me/${CONFIG.businessWhatsApp.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
const note = $("#altNote");
function unconfigured(e, msg) { e.preventDefault(); note.textContent = msg; }
$("#waBtn").href = isSet(CONFIG.businessWhatsApp) ? waLink("Hi COREZONEDEV, I'd like to discuss a project.") : "#contact";
$("#waFoot").href = $("#waBtn").href;
$("#waBtn").addEventListener("click", e => !isSet(CONFIG.businessWhatsApp) && unconfigured(e, "WhatsApp isn't set up yet — please use the form."));
$("#bookBtn").href = isSet(CONFIG.bookingUrl) ? CONFIG.bookingUrl : "#contact";
$("#bookBtn").addEventListener("click", e => !isSet(CONFIG.bookingUrl) && unconfigured(e, "Online booking isn't available yet — send an inquiry and we'll arrange a call."));
$("#mailLink").href = isSet(CONFIG.businessEmail) ? "mailto:" + CONFIG.businessEmail : "#contact";

/* Service rows preselect the form */
$$(".svc").forEach(a => a.addEventListener("click", () => { $("#service").value = a.dataset.service; }));

/* Inquiry form */
const form = $("#form"), btn = $("#submit"), status = $("#status");
const rules = {
  name: v => v.trim().length >= 2 || "Enter your full name.",
  email: v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) || "Enter a valid email address.",
  whatsapp: v => !v.trim() || /^\+?[\d\s()-]{7,20}$/.test(v) || "Use digits, with country code if possible.",
  service: v => !!v || "Choose a service.",
  details: v => v.trim().length >= 10 || "Describe your project in at least 10 characters.",
  consent: (v, f) => f.consent.checked || "Please agree so we can reply to you."
};
function validate() {
  let first = null;
  for (const [k, fn] of Object.entries(rules)) {
    const el = form.elements[k], res = fn(el.value, form), ok = res === true;
    $("#e-" + k).textContent = ok ? "" : res;
    el.setAttribute("aria-invalid", !ok); el.setAttribute("aria-describedby", "e-" + k);
    if (!ok && !first) first = el;
  }
  first && first.focus(); return !first;
}
form.addEventListener("submit", async e => {
  e.preventDefault();
  if (btn.disabled) return;
  status.textContent = "";
  if (!validate()) return;
  if (!isSet(CONFIG.googleScriptUrl)) { status.textContent = "The inquiry form isn't connected yet, so nothing was sent." + (isSet(CONFIG.businessEmail) ? " Please email us directly." : ""); return; }
  btn.disabled = true; btn.textContent = "Sending…";
  const fd = Object.fromEntries(new FormData(form)); fd.consent = form.consent.checked; fd.source = "corezonedev.com";
  try {
    // text/plain avoids a CORS preflight, which Apps Script can't answer; the JSON reply is still readable.
    const res = await fetch(CONFIG.googleScriptUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(fd) });
    const out = await res.json();
    if (!out.ok) throw new Error(out.error || "Rejected");
    const msg = `Hi COREZONEDEV, I'm ${fd.name.trim()}. I just sent an inquiry about ${fd.service}.`;
    status.innerHTML = `Thanks — your inquiry was received (ref ${out.leadId}). ` + (isSet(CONFIG.businessWhatsApp) ? `<a href="${waLink(msg)}" target="_blank" rel="noopener noreferrer">Continue on WhatsApp ↗</a>` : "");
    form.reset();
  } catch (err) {
    status.textContent = "We couldn't send your inquiry, and your details are still here. Try again" + (isSet(CONFIG.businessEmail) ? ` or email ${CONFIG.businessEmail}.` : ".");
  } finally { btn.disabled = false; btn.textContent = "Send inquiry ↗"; }
});

/* Highlight the current section in the nav */
const links = $$(".menu a[href^='#']:not(.cta)");
const spy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id)); }), { rootMargin: "-45% 0px -50% 0px" });
$$("main section[id]").forEach(s => spy.observe(s));

/* Dialogs: project details + privacy open over the page, so the form and scroll position are never lost */
let lastY = 0;
function openDlg(d) { lastY = scrollY; document.body.classList.add("lock"); d.showModal(); d.querySelector(".dl-body").scrollTop = 0; }
$$("dialog").forEach(d => d.addEventListener("close", () => { document.body.classList.remove("lock"); scrollTo({ top: lastY, behavior: "instant" }); }));
document.addEventListener("click", e => {
  const t = e.target;
  if (t.matches("dialog")) return t.close();
  if (t.closest("[data-close]")) return t.closest("dialog").close();
  if (t.closest("[data-privacy]")) { e.preventDefault(); return openDlg($("#privDlg")); }
  const p = t.closest("a.proj");
  if (p) {
    e.preventDefault();
    $("#pdC").textContent = p.dataset.cat; $("#pdT").textContent = p.dataset.title; $("#pdD").textContent = p.dataset.desc;
    $("#pdI").src = p.getAttribute("href"); $("#pdI").alt = p.dataset.alt; openDlg($("#projDlg"));
  }
});
if (isSet(CONFIG.businessEmail)) $$("[data-mail]").forEach(m => m.innerHTML = `<a href="mailto:${CONFIG.businessEmail}">${CONFIG.businessEmail}</a>`);
