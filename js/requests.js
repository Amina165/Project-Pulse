import { auth, db } from "./firebase-config.js";
import { collection, addDoc, onSnapshot, serverTimestamp, query, orderBy } from "firebase/firestore";
import { escapeHtml, safePhone } from "./utils.js";

const emergencyForm = document.getElementById("emergencyRequestForm");
const feed = document.getElementById("requestsFeed");
const alertBox = document.getElementById("requestAlert");

function flash(text, ok) {
  alertBox.textContent = text;
  alertBox.className =
    "mb-4 p-3 rounded-xl text-xs font-bold text-center " +
    (ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700");
}

if (feed) {
  const q = query(collection(db, "emergencyRequests"), orderBy("createdAt", "desc"));
  onSnapshot(
    q,
    (snapshot) => {
      feed.innerHTML = "";
      if (snapshot.empty) {
        feed.innerHTML = `<div class="p-6 text-center text-gray-400 bg-white border border-gray-100 rounded-2xl">No active emergency requests right now.</div>`;
        return;
      }

      snapshot.forEach((docSnap) => {
        const req = docSnap.data();
        const phone = safePhone(req.contact);
        const card = document.createElement("div");
        card.className = "bg-white p-6 rounded-2xl border border-red-100 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4";
        card.innerHTML = `
          <div class="flex items-center gap-4">
            <div class="w-14 h-14 rounded-2xl bg-red-600 text-white font-extrabold text-2xl flex items-center justify-center shrink-0">${escapeHtml(req.bloodGroup)}</div>
            <div>
              <span class="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Urgent • ${escapeHtml(req.units || 2)} Bags</span>
              <h3 class="font-extrabold text-gray-900 mt-1">${escapeHtml(req.hospital)}</h3>
              <p class="text-xs text-gray-500"><i class="fa-solid fa-user text-red-600 mr-1"></i> Patient: ${escapeHtml(req.patientName || "Emergency Patient")} | Contact: ${escapeHtml(req.contact)}</p>
            </div>
          </div>
          <a href="tel:${phone}" class="bg-red-600 hover:bg-red-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all w-full sm:w-auto text-center shrink-0">Respond Now</a>`;
        feed.appendChild(card);
      });
    },
    (error) => {
      console.error(error);
      feed.innerHTML = `<div class="p-6 text-center text-red-600 bg-white border border-red-100 rounded-2xl text-xs font-bold">Could not load requests: ${escapeHtml(error.message)}</div>`;
    }
  );
}

if (emergencyForm) {
  emergencyForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    await auth.authStateReady();
    const user = auth.currentUser;
    if (!user) {
      flash("Please log in to post an emergency request.", false);
      setTimeout(() => (location.href = "login.html?next=urgent.html"), 1200);
      return;
    }

    const button = emergencyForm.querySelector("button[type=submit]");
    button.disabled = true;

    try {
      await addDoc(collection(db, "emergencyRequests"), {
        uid: user.uid,
        patientName: document.getElementById("patientName").value.trim() || "Emergency Patient",
        bloodGroup: document.getElementById("requiredBloodGroup").value,
        hospital: document.getElementById("hospitalLocation").value.trim(),
        contact: document.getElementById("contactPhone").value.trim(),
        units: Number(document.getElementById("unitsInput").value) || 2,
        createdAt: serverTimestamp(),
      });
      flash("Emergency alert published successfully!", true);
      emergencyForm.reset();
    } catch (error) {
      flash("Failed to publish alert: " + error.message, false);
    } finally {
      button.disabled = false;
    }
  });
}
