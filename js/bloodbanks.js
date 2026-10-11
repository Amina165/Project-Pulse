// Blood banks directory (admin.html)
import { auth, db } from "./firebase-config.js";
import { collection, onSnapshot, addDoc, query, orderBy, serverTimestamp } from "firebase/firestore";
import { escapeHtml, safePhone } from "./utils.js";

const tbody = document.getElementById("bloodBankTableBody");
const addBtn = document.getElementById("btnAddBloodBank");
const panel = document.getElementById("bankFormPanel");
const form = document.getElementById("bankForm");
const msg = document.getElementById("bankMessage");

onSnapshot(
  query(collection(db, "bloodBanks"), orderBy("name")),
  (snap) => {
    if (snap.empty) {
      tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-gray-400">No blood banks listed yet. Use "Add Hospital / Bank" to add the first one.</td></tr>`;
      return;
    }
    tbody.innerHTML = snap.docs
      .map((d) => {
        const b = d.data();
        const phone = safePhone(b.contact);
        return `
        <tr>
          <td class="p-4 font-bold text-gray-900">${escapeHtml(b.name)}</td>
          <td class="p-4">${escapeHtml(b.location)}</td>
          <td class="p-4">${escapeHtml(b.contact)}</td>
          <td class="p-4">${escapeHtml(b.units || "—")}</td>
          <td class="p-4">${phone ? `<a href="tel:${phone}" class="text-red-600 font-bold hover:underline">Call</a>` : ""}</td>
        </tr>`;
      })
      .join("");
  },
  (error) => {
    console.error(error);
    tbody.innerHTML = `<tr><td colspan="5" class="p-8 text-center text-red-600 font-bold">Could not load blood banks: ${escapeHtml(error.message)}</td></tr>`;
  }
);

addBtn.addEventListener("click", async () => {
  await auth.authStateReady();
  if (!auth.currentUser) {
    location.href = "login.html?next=admin.html";
    return;
  }
  panel.classList.toggle("hidden");
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await addDoc(collection(db, "bloodBanks"), {
      name: document.getElementById("bankName").value.trim(),
      location: document.getElementById("bankLocation").value.trim(),
      contact: document.getElementById("bankContact").value.trim(),
      units: document.getElementById("bankUnits").value.trim(),
      addedBy: auth.currentUser.uid,
      createdAt: serverTimestamp(),
    });
    form.reset();
    panel.classList.add("hidden");
    msg.textContent = "";
  } catch (error) {
    msg.textContent = "Could not save: " + error.message;
  }
});
