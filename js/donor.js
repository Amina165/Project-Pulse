import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

// DOM Elements
const donorForm = document.getElementById("donorForm");
const fullNameInput = document.getElementById("fullName");
const contactNumberInput = document.getElementById("contactNumber");
const locationInput = document.getElementById("location");
const bloodGroupSelect = document.getElementById("bloodGroup");
const lastDonationDateInput = document.getElementById("lastDonationDate");
const availabilitySelect = document.getElementById("availabilityStatus");
const submitBtn = document.getElementById("submitDonorBtn");
const statusMessage = document.getElementById("statusMessage");

let currentUser = null;

if (lastDonationDateInput) {
  lastDonationDateInput.max = new Date().toISOString().slice(0, 10);
}

// 1. Listen for authentication state
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    await loadUserProfileAndDonorData(user.uid);
  } else {
    // Donating needs an account: send them to login, then bring them back here.
    location.replace("login.html?next=donate.html");
  }
});

// 2. Fetch existing donor data (or fall back to the basic profile)
async function loadUserProfileAndDonorData(uid) {
  try {
    const donorSnap = await getDoc(doc(db, "donors", uid));

    if (donorSnap.exists()) {
      populateForm(donorSnap.data());
      if (submitBtn) submitBtn.textContent = "Update Donor Profile";
    } else {
      const userSnap = await getDoc(doc(db, "users", uid));
      if (userSnap.exists()) populateForm(userSnap.data());
    }
  } catch (error) {
    console.error("Error fetching user data:", error);
    showStatus("Error loading profile data.", "red");
  }
}

function populateForm(data) {
  const phone = data.contactNumber || data.contact; // older accounts used "contact"
  if (fullNameInput && data.fullName) fullNameInput.value = data.fullName;
  if (contactNumberInput && phone) contactNumberInput.value = phone;
  if (locationInput && data.location) locationInput.value = data.location;
  if (bloodGroupSelect && data.bloodGroup) bloodGroupSelect.value = data.bloodGroup;
  if (lastDonationDateInput && data.lastDonationDate) lastDonationDateInput.value = data.lastDonationDate;
  if (availabilitySelect && data.availabilityStatus) availabilitySelect.value = data.availabilityStatus;
}

// 3. Handle donor registration
if (donorForm) {
  donorForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentUser) {
      showStatus("You must be logged in to register.", "red");
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    showStatus("Saving registration details...", "blue");

    const location_ = locationInput.value.trim();
    const donorData = {
      uid: currentUser.uid,
      email: currentUser.email,
      fullName: fullNameInput.value.trim(),
      contactNumber: contactNumberInput.value.trim(),
      location: location_,
      locationLower: location_.toLowerCase(),
      bloodGroup: bloodGroupSelect.value,
      lastDonationDate: lastDonationDateInput.value,
      availabilityStatus: availabilitySelect.value || "Available",
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, "donors", currentUser.uid), donorData, { merge: true });

      // Keep the main user record in sync
      await setDoc(
        doc(db, "users", currentUser.uid),
        {
          fullName: donorData.fullName,
          contactNumber: donorData.contactNumber,
          location: donorData.location,
          bloodGroup: donorData.bloodGroup,
          isDonor: true,
        },
        { merge: true }
      );

      showStatus("Successfully registered as a blood donor!", "green");
      setTimeout(() => {
        window.location.href = "profile.html";
      }, 1500);
    } catch (error) {
      console.error("Error saving donor profile:", error);
      showStatus(`Failed to register: ${error.message}`, "red");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

function showStatus(message, color) {
  if (!statusMessage) return;
  statusMessage.textContent = message;
  const colors = { red: "text-red-600", green: "text-green-600", blue: "text-blue-600" };
  statusMessage.className = `text-sm ${colors[color] || colors.blue} font-medium mt-2`;
}
