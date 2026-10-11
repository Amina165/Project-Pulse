// Shared header / footer + login state for every page.
// Pages just include <div id="siteHeader"></div> (and optionally <div id="siteFooter"></div>)
// and load this file. Fix the menu here once and it changes everywhere.
import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "firebase/auth";

const NAV = [
  { href: "index.html", label: "Home" },
  { href: "donors.html", label: "Find Blood" },
  { href: "donate.html", label: "Donate Blood" },
  { href: "admin.html", label: "Blood Banks" },
  { href: "history.html", label: "Blood Groups" },
  { href: "profile.html", label: "Profile" },
];

const current = location.pathname.split("/").pop() || "index.html";

function buildHeader() {
  const desktop = NAV.map((l) =>
    l.href === current
      ? `<a href="${l.href}" class="text-red-600 font-bold border-b-2 border-red-600 pb-1">${l.label}</a>`
      : `<a href="${l.href}" class="hover:text-red-600 transition-colors">${l.label}</a>`
  ).join("");

  const mobile = NAV.map(
    (l) =>
      `<a href="${l.href}" class="block px-4 py-3 rounded-lg ${
        l.href === current ? "bg-red-50 text-red-600 font-bold" : "hover:bg-gray-50"
      }">${l.label}</a>`
  ).join("");

  return `
  <header class="bg-white border-b border-gray-100 shadow-sm">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-3">
      <a href="index.html" class="flex items-center gap-3">
        <div class="p-2 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
          <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
        </div>
        <div>
          <span class="text-2xl font-extrabold text-gray-900 tracking-tight">Pulse</span>
          <p class="text-[10px] font-semibold text-gray-400 tracking-wider uppercase -mt-1 hidden sm:block">Donate • Find • Save Lives</p>
        </div>
      </a>

      <nav class="hidden lg:flex items-center gap-7 text-sm font-semibold text-gray-600">${desktop}</nav>

      <div class="flex items-center gap-2 sm:gap-3">
        <div id="navAuthArea"></div>
        <a href="urgent.html" class="hidden sm:flex bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold px-4 py-2.5 rounded-xl shadow-md shadow-red-600/20 transition-all items-center gap-2">
          <i class="fa-solid fa-triangle-exclamation"></i> Emergency Request
        </a>
        <button id="navMenuBtn" type="button" aria-label="Open menu" class="lg:hidden w-10 h-10 rounded-xl border border-gray-200 text-gray-700 flex items-center justify-center">
          <i class="fa-solid fa-bars"></i>
        </button>
      </div>
    </div>

    <div id="navMobileMenu" class="hidden lg:hidden border-t border-gray-100 bg-white px-4 py-3 text-sm font-semibold text-gray-700">
      ${mobile}
      <a href="urgent.html" class="block px-4 py-3 rounded-lg text-red-600 font-bold sm:hidden">
        <i class="fa-solid fa-triangle-exclamation mr-1"></i> Emergency Request
      </a>
    </div>
  </header>`;
}

function renderAuth(user) {
  const area = document.getElementById("navAuthArea");
  if (!area) return;

  if (user) {
    area.innerHTML = `
      <button id="navLogoutBtn" type="button" class="text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 px-4 py-2.5 rounded-xl transition-all flex items-center gap-2">
        <i class="fa-solid fa-right-from-bracket"></i> Sign Out
      </button>`;
    document.getElementById("navLogoutBtn").addEventListener("click", async () => {
      try {
        await signOut(auth);
      } finally {
        location.href = "index.html";
      }
    });
  } else {
    area.innerHTML = `
      <a href="login.html" class="text-xs font-bold text-gray-700 hover:text-red-600 border border-gray-200 hover:border-red-600 px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap">
        <i class="fa-solid fa-right-to-bracket text-red-600"></i> Login / Sign Up
      </a>`;
  }
}

const headerEl = document.getElementById("siteHeader");
if (headerEl) {
  // Sticky must be on the container, otherwise it only sticks inside its own wrapper.
  headerEl.className = "sticky top-0 z-50";
  headerEl.innerHTML = buildHeader();
  document.getElementById("navMenuBtn")?.addEventListener("click", () => {
    document.getElementById("navMobileMenu").classList.toggle("hidden");
  });
}

const footerEl = document.getElementById("siteFooter");
if (footerEl) {
  footerEl.innerHTML = `
  <footer class="bg-slate-900 text-gray-400 py-6 border-t border-slate-800 text-xs text-center">
    <p>© 2026 Pulse Blood Network. All rights reserved.</p>
  </footer>`;
}

onAuthStateChanged(auth, renderAuth);
