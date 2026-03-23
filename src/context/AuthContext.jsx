import { createContext, useContext, useState, useEffect } from "react";
import { listenToAuthState } from "../firebase/auth";
import { listenToUser } from "../firebase/db";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubUser = null;
    const unsubAuth = listenToAuthState((user) => {
      setCurrentUser(user);
      if (user) {
        unsubUser = listenToUser(user.uid, (doc) => {
          setUserDoc(doc);
          setLoading(false);
        });
      } else {
        setUserDoc(null);
        setLoading(false);
        if (unsubUser) unsubUser();
      }
    });
    return () => {
      unsubAuth();
      if (unsubUser) unsubUser();
    };
  }, []);

  const isAdmin = userDoc?.role === "admin" || userDoc?.role === "superadmin";
  const isSuperAdmin = userDoc?.role === "superadmin";
  const isSeller = userDoc?.isSeller;
  const isVerifiedSeller = userDoc?.isSellerVerified;
  const isEmailVerified = currentUser?.emailVerified;
  const isSuspended = userDoc?.isSuspended;
  const isBanned = userDoc?.isBanned;

  return (
    <AuthContext.Provider value={{
      currentUser, userDoc, loading,
      isAdmin, isSuperAdmin, isSeller, isVerifiedSeller,
      isEmailVerified, isSuspended, isBanned
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
