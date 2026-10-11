import { auth, db } from "./firebase-config.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { safeNext } from "./utils.js";

const form = document.getElementById("authForm");

if (form) {
  const params = new URLSearchParams(location.search);
  // Where to go after login (e.g. login.html?next=donate.html)
  const nextPage = safeNext(params.get("next"), "profile.html");

  const signupFields = document.getElementById("signupFields");
  const formTitle = document.getElementById("formTitle");
  const formSubtitle = document.getElementById("formSubtitle");
  const submitBtn = document.getElementById("submitBtn");
  const toggleText = document.getElementById("toggleText");
  const toggleBtn = document.getElementById("toggleModeBtn");
  const message = document.getElementById("authMessage");
  const signupName = document.getElementById("signupName");

  let isSignUp = params.get("mode") === "signup";
  let busy = false;

  function showMessage(text, ok = false) {
    message.textContent = text;
    message.className =
      "mb-4 p-3 rounded-xl text-xs font-bold text-center " +
      (ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700");
  }

  function applyMode() {
    signupFields.classList.toggle("hidden", !isSignUp);
    signupName.required = isSignUp;
    if (isSignUp) {
      formTitle.textContent = "Create Account";
      formSubtitle.textContent = "Register as a donor and emergency responder";
      submitBtn.textContent = "Create Account & Register";
      toggleText.textContent = "Already have an account?";
      toggleBtn.textContent = "Sign In";
    } else {
      formTitle.textContent = "Welcome to Pulse";
      formSubtitle.textContent = "Sign in or create an account to start saving lives";
      submitBtn.textContent = "Sign In";
      toggleText.textContent = "Don't have an account?";
      toggleBtn.textContent = "Sign Up";
    }
  }

  toggleBtn.addEventListener("click", () => {
    isSignUp = !isSignUp;
    message.className = "hidden";
    applyMode();
  });
  applyMode();

  // Already signed in? Skip the login page.
  // (Ignored while a sign-up is in progress so the profile is saved first.)
  onAuthStateChanged(auth, (user) => {
    if (user && !busy) location.replace(nextPage);
  });

  function friendlyError(error) {
    switch (error.code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Incorrect email or password.";
      case "auth/email-already-in-use":
        return "An account with this email already exists. Try signing in.";
      case "auth/weak-password":
        return "Password must be at least 6 characters.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/too-many-requests":
        return "Too many attempts. Please wait a moment and try again.";
      case "auth/network-request-failed":
        return "Network error. Check your connection and try again.";
      default:
        return error.message;
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (busy) return;

    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;

    if (!email || !password) {
      showMessage("Please enter both email and password.");
      return;
    }

    busy = true;
    submitBtn.disabled = true;
    message.className = "hidden";

    try {
      if (isSignUp) {
        const fullName = signupName.value.trim();
        if (!fullName) {
          showMessage("Please enter your full name.");
          return;
        }

        const cred = await createUserWithEmailAndPassword(auth, email, password);
        try {
          await setDoc(doc(db, "users", cred.user.uid), {
            uid: cred.user.uid,
            fullName,
            email,
            bloodGroup: document.getElementById("authBloodGroup").value,
            location: document.getElementById("signupLocation").value.trim(),
            contactNumber: document.getElementById("signupContact").value.trim(),
            createdAt: serverTimestamp(),
          });
        } catch (profileError) {
          // Account exists; the profile can be completed on the Donate page.
          console.error("Could not save profile:", profileError);
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }

      location.href = nextPage;
    } catch (error) {
      showMessage(friendlyError(error));
    } finally {
      busy = false;
      submitBtn.disabled = false;
    }
  });
}
