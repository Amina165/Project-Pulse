import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, query, where, onSnapshot } from "firebase/firestore";
import { escapeHtml } from "./utils.js";

const feed = document.getElementById("userHistoryFeed");
let donations = [];
let requests = [];

function renderFeed() {
  const items = [
    ...donations.map((d) => ({
      time: new Date(d.date + "T00:00:00").getTime() || 0,
      icon: "fa-droplet",
      text: `Donated blood at ${escapeHtml(d.center || "Community Blood Center")}`,
      when: escapeHtml(d.date),
    })),
    ...requests.map((r) => ({
      time: r.createdAt?.toMillis?.() || Date.now(),
      icon: "fa-triangle-exclamation",
      text: `Posted emergency request: ${escapeHtml(r.bloodGroup)} at ${escapeHtml(r.hospital)}`,
      when: r.createdAt?.toDate?.().toISOString().slice(0, 10) || "just now",
    })),
  ].sort((a, b) => b.time - a.time);

  if (!items.length) {
    feed.innerHTML = `
      <div class="p-6 text-center text-gray-400 bg-gray-50 rounded-2xl">
        <p class="text-xs">Nothing here yet.</p>
        <a href="donate.html" class="inline-block mt-3 text-xs font-bold text-red-600 hover:underline">Register as a donor or log a donation →</a>
      </div>`;
    return;
  }

  feed.innerHTML = items
    .map(
      (i) => `
      <div class="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
        <div class="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center text-sm shrink-0"><i class="fa-solid ${i.icon}"></i></div>
        <div class="flex-grow text-xs font-semibold text-gray-800">${i.text}</div>
        <div class="text-[11px] text-gray-400 shrink-0">${i.when}</div>
      </div>`
    )
    .join("");
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    location.replace("login.html?next=profile.html");
    return;
  }

  document.getElementById("userEmail").textContent = user.email || "";

  try {
    const snap = await getDoc(doc(db, "users", user.uid));
    const data = snap.exists() ? snap.data() : {};
    document.getElementById("userName").textContent = data.fullName || "Pulse Member";
    document.getElementById("userBloodGroup").textContent = `Blood Group: ${data.bloodGroup || "--"}`;
    document.getElementById("userLocation").textContent = `Location: ${data.location || "--"}`;
  } catch (error) {
    console.error(error);
    document.getElementById("userName").textContent = "Pulse Member";
  }

  onSnapshot(
    query(collection(db, "donations"), where("uid", "==", user.uid)),
    (s) => {
      donations = s.docs.map((d) => d.data());
      renderFeed();
    },
    (e) => console.error(e)
  );

  onSnapshot(
    query(collection(db, "emergencyRequests"), where("uid", "==", user.uid)),
    (s) => {
      requests = s.docs.map((d) => d.data());
      renderFeed();
    },
    (e) => console.error(e)
  );
});
