// Donor search page: lists registered donors (signed-in users only) with filters.
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot } from "firebase/firestore";
import { escapeHtml, safePhone } from "./utils.js";

const container = document.getElementById("donorsContainer");
const filterForm = document.getElementById("filterForm");
const filterGroup = document.getElementById("filterGroup");
const filterLocation = document.getElementById("filterLocation");

let allDonors = [];

const params = new URLSearchParams(location.search);
if (params.get("group")) filterGroup.value = params.get("group");
if (params.get("location")) filterLocation.value = params.get("location");

function message(html) {
  container.innerHTML = `<div class="col-span-full py-16 text-center text-gray-400 bg-white border border-gray-100 rounded-3xl">${html}</div>`;
}

function render() {
  const group = filterGroup.value;
  const place = filterLocation.value.trim().toLowerCase();

  const list = allDonors
    .filter((d) => (!group || d.bloodGroup === group))
    .filter((d) => (!place || String(d.location || "").toLowerCase().includes(place)))
    .sort((a, b) => {
      const av = (a.availabilityStatus || "Available") === "Available" ? 0 : 1;
      const bv = (b.availabilityStatus || "Available") === "Available" ? 0 : 1;
      return av - bv || String(a.fullName).localeCompare(String(b.fullName));
    });

  if (list.length === 0) {
    message(`<i class="fa-solid fa-user-slash text-2xl mb-3"></i><p class="text-xs font-bold text-gray-600">No donors match your search yet.</p>`);
    return;
  }

  container.innerHTML = "";
  list.forEach((d) => {
    const available = (d.availabilityStatus || "Available") === "Available";
    const phone = safePhone(d.contactNumber || d.contact);
    const card = document.createElement("div");
    card.className = "bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col gap-4";
    card.innerHTML = `
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-2xl bg-red-600 text-white font-extrabold text-xl flex items-center justify-center shrink-0">${escapeHtml(d.bloodGroup || "?")}</div>
        <div class="min-w-0">
          <h3 class="font-extrabold text-gray-900 truncate">${escapeHtml(d.fullName || "Donor")}</h3>
          <p class="text-xs text-gray-500"><i class="fa-solid fa-location-dot text-red-500 mr-1"></i>${escapeHtml(d.location || "Location not set")}</p>
          ${d.lastDonationDate ? `<p class="text-[11px] text-gray-400 mt-0.5">Last donated: ${escapeHtml(d.lastDonationDate)}</p>` : ""}
        </div>
      </div>
      <div class="flex items-center justify-between gap-3">
        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${available ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}">${available ? "Available" : "Not available"}</span>
        ${phone ? `<a href="tel:${phone}" class="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl">Call</a>` : ""}
      </div>`;
    container.appendChild(card);
  });
}

filterForm.addEventListener("submit", (e) => {
  e.preventDefault();
  render();
});
filterGroup.addEventListener("change", render);
filterLocation.addEventListener("input", render);

onAuthStateChanged(auth, (user) => {
  if (!user) {
    
    message(`
      <i class="fa-solid fa-lock text-2xl text-red-600 mb-3"></i>
      <p class="text-sm font-bold text-gray-700">Please sign in to search donors</p>
      <p class="text-xs mt-1 mb-4">Donor contact details are only shown to registered members.</p>
      <a href="login.html?next=donors.html" class="inline-block bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl">Login / Sign Up</a>`);
    return;
  }

  onSnapshot(
    collection(db, "donors"),
    (snap) => {
      allDonors = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      render();
    },
    (error) => {
      console.error(error);
      message(`<p class="text-xs font-bold text-red-600">Could not load donors: ${escapeHtml(error.message)}</p>`);
    }
  );
});
