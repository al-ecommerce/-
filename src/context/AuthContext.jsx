import { createContext, useContext, useState, useEffect } from "react";
import { listenToAuthState } from "../firebase/auth";
import { listenToUser } from "../firebase/db";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(undefined); // undefined = not yet known
  const [userDoc,     setUserDoc]     = useState(null);
  const [loading,     setLoading]     = useState(true);      // true until Firebase resolves

  useEffect(() => {
    let unsubUser = null;
    const unsubAuth = listenToAuthState((user) => {
      setCurrentUser(user);          // null = guest, object = logged in
      if (user) {
        unsubUser = listenToUser(user.uid, (doc) => {
          setUserDoc(doc);
          setLoading(false);
        });
      } else {
        setUserDoc(null);
        setLoading(false);           // guest confirmed — stop loading
        if (unsubUser) { unsubUser(); unsubUser = null; }
      }
    });
    return () => {
      unsubAuth();
      if (unsubUser) unsubUser();
    };
  }, []);

  const isAdmin         = userDoc?.role === "admin" || userDoc?.role === "superadmin";
  const isSuperAdmin    = userDoc?.role === "superadmin";
  const isSeller        = userDoc?.isSeller;
  const isVerifiedSeller= userDoc?.isSellerVerified;
  const isEmailVerified = currentUser?.emailVerified;
  const isSuspended     = userDoc?.isSuspended;
  const isBanned        = userDoc?.isBanned;

  return (
    <AuthContext.Provider value={{
      currentUser: currentUser === undefined ? null : currentUser, // never expose undefined
      userDoc, loading,
      isAdmin, isSuperAdmin, isSeller, isVerifiedSeller,
      isEmailVerified, isSuspended, isBanned,
      authReady: !loading,  // true once Firebase has resolved
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
