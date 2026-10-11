// Donation log + "am I eligible to donate again?" tracker (used on donate.html)
import { db, auth } from "./firebase-config.js";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { escapeHtml } from "./utils.js";

const COOLDOWN_DAYS = 90;

const donationLogForm = document.getElementById("donationLogForm");
const historyTableBody = document.getElementById("historyTableBody");
const statusCard = document.getElementById("statusCard");
const statusTitle = document.getElementById("statusTitle");
const statusDesc = document.getElementById("statusDesc");
const logMessage = document.getElementById("logMessage");
const dateInput = document.getElementById("donationDateInput");

if (dateInput) dateInput.max = new Date().toISOString().slice(0, 10);

let latestDate = ""; 

function setCard(kind, title, desc) {
  const colors = {
    ok: "from-emerald-600 to-teal-700",
    wait: "from-amber-600 to-orange-700",
  };
  if (statusCard) statusCard.className = `p-6 rounded-3xl text-white shadow-xl bg-gradient-to-r ${colors[kind]}`;
  if (statusTitle) statusTitle.textContent = title;
  if (statusDesc) statusDesc.textContent = desc;
}

function flash(text, ok) {
  if (!logMessage) return;
  logMessage.textContent = text;
  logMessage.className = `text-xs font-bold mt-3 ${ok ? "text-emerald-600" : "text-red-600"}`;
}

onAuthStateChanged(auth, (user) => {
  if (!user) return; 
  const q = query(collection(db, "donations"), where("uid", "==", user.uid));

  onSnapshot(
    q,
    (snapshot) => {
      const records = snapshot.docs
        .map((d) => d.data())
        .sort((a, b) => String(b.date).localeCompare(String(a.date)));

      latestDate = records[0]?.date || "";

      if (historyTableBody) {
        historyTableBody.innerHTML = records.length
          ? records
              .map(
                (r) => `
          <tr class="border-b border-gray-50">
            <td class="py-3 px-4 font-semibold text-gray-900">${escapeHtml(r.date)}</td>
            <td class="py-3 px-4">${escapeHtml(r.center || "Community Blood Center")}</td>
            <td class="py-3 px-4">${escapeHtml(r.units || 1)} Bag (450ml)</td>
          </tr>`
              )
              .join("")
          : `<tr><td colspan="3" class="py-4 px-4 text-center text-gray-400">No past donations recorded yet.</td></tr>`;
      }

      if (!records.length) {
        setCard("ok", "Eligible to Donate Blood", "You have no recorded donations yet. You can save a life today!");
        return;
      }

      const last = new Date(records[0].date + "T00:00:00");
      const days = Math.max(0, Math.floor((Date.now() - last.getTime()) / 86400000));

      if (days >= COOLDOWN_DAYS) {
        setCard("ok", "Eligible to Donate Blood", `It has been ${days} days since your last donation. You are ready to save a life!`);
      } else {
        setCard("wait", "In Cooldown Period", `You donated recently. You can donate again in ${COOLDOWN_DAYS - days} days.`);
      }
    },
    (error) => {
      console.error("Donation history error:", error);
      setCard("wait", "Could not load history", error.message);
    }
  );
});

if (donationLogForm) {
  donationLogForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await auth.authStateReady();
    const user = auth.currentUser;
    if (!user) {
      location.href = "login.html?next=donate.html";
      return;
    }

    const date = dateInput.value;
    if (!date) return flash("Please choose the donation date.", false);

    try {
      await addDoc(collection(db, "donations"), {
        uid: user.uid,
        date,
        center: document.getElementById("donationCenterInput").value.trim() || "Red Crescent",
        units: 1,
        createdAt: serverTimestamp(),
      });

      
      if (!latestDate || date >= latestDate) {
        try {
          await updateDoc(doc(db, "donors", user.uid), { lastDonationDate: date });
        } catch {
          
        }
      }

      flash("Donation saved!", true);
      donationLogForm.reset();
    } catch (error) {
      flash("Error saving record: " + error.message, false);
    }
  });
}
