import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from "firebase/auth";
import { auth } from "./config";
import { createUserDoc, getUserDoc } from "./db";
import { sendWelcomeEmail } from "../services/emailService";

export const register = async (email, password, displayName) => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName });
  await sendEmailVerification(user);
  await createUserDoc(user.uid, {
    uid: user.uid,
    email,
    displayName,
    photoURL: "",
    phone: "",
    bio: "",
    location: ""
  });
  try { await sendWelcomeEmail(email, displayName); } catch (e) { console.warn("Email error:", e); }
  return user;
};

export const login = async (email, password) => {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user;
};

export const logout = () => signOut(auth);

export const resetPassword = async (email) => {
  await sendPasswordResetEmail(auth, email);
};

export const resendVerification = async () => {
  if (auth.currentUser) await sendEmailVerification(auth.currentUser);
};

export const listenToAuthState = (cb) => onAuthStateChanged(auth, cb);
