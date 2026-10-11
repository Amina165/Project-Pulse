import { auth, db } from "./firebase-config.js";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  getCountFromServer,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { escapeHtml, safePhone } from "./utils.js";

function setStat(id, value, note) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value;
  const noteEl = el.parentElement?.lastElementChild;
  if (note && noteEl && noteEl !== el) noteEl.textContent = note;
}

// Hero search -> donors page with filters in the URL
document.getElementById("heroSearchForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const group = document.getElementById("heroBloodGroup").value;
  const place = document.getElementById("heroLocation").value.trim();
  const p = new URLSearchParams();
  if (group) p.set("group", group);
  if (place) p.set("location", place);
  location.href = "donors.html" + (p.toString() ? "?" + p : "");
});

// Public live stats
onSnapshot(
  collection(db, "emergencyRequests"),
  (snap) => setStat("statEmergencyRequests", snap.size, "Live from Firebase"),
  () => setStat("statEmergencyRequests", "--", "Unavailable right now")
);

onSnapshot(
  collection(db, "bloodBanks"),
  (snap) => setStat("statBloodBanks", snap.size, "Live from Firebase"),
  () => setStat("statBloodBanks", "--", "Unavailable right now")
);

// The donor list is private (signed-in only), so the count is too.
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    setStat("statRegisteredDonors", "--", "Sign in to see live count");
    return;
  }
  try {
    const snap = await getCountFromServer(collection(db, "donors"));
    setStat("statRegisteredDonors", snap.data().count, "Live from Firebase");
  } catch (error) {
    console.error(error);
    setStat("statRegisteredDonors", "--", "Unavailable right now");
  }
});

// Latest emergency requests
const homeRecentRequests = document.getElementById("homeRecentRequests");
if (homeRecentRequests) {
  const q = query(collection(db, "emergencyRequests"), orderBy("createdAt", "desc"), limit(2));
  onSnapshot(
    q,
    (snapshot) => {
      homeRecentRequests.innerHTML = "";
      if (snapshot.empty) {
        homeRecentRequests.innerHTML = `<div class="p-6 text-center text-gray-400 bg-white border border-gray-100 rounded-2xl col-span-full">No active emergency alerts right now.</div>`;
        return;
      }

      snapshot.forEach((docSnap) => {
        const req = docSnap.data();
        const phone = safePhone(req.contact);
        const card = document.createElement("div");
        card.className = "bg-white p-5 rounded-2xl border border-red-100 shadow-sm flex items-center justify-between";
        card.innerHTML = `
          <div>
            <span class="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">URGENT: ${escapeHtml(req.bloodGroup)} Needed</span>
            <h4 class="font-extrabold text-gray-900 text-sm mt-1">${escapeHtml(req.hospital)}</h4>
            <p class="text-xs text-gray-500">Contact: ${escapeHtml(req.contact)}</p>
          </div>
          <a href="tel:${phone}" class="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 rounded-xl">Call</a>`;
        homeRecentRequests.appendChild(card);
      });
    },
    (error) => {
      console.error(error);
      homeRecentRequests.innerHTML = `<div class="p-6 text-center text-gray-400 bg-white border border-gray-100 rounded-2xl col-span-full">Could not load emergency alerts.</div>`;
    }
  );
}
