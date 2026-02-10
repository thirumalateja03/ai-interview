import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AuthContext } from "./auth-context";
import { supabase } from "../lib/supabase";
import GoogleSignIn from "../components/GoogleSignIn";

type Props = {
  children: React.ReactNode;
};

export default function AuthGate({ children }: Props) {
  const [session, setSession] = useState<Session | null>(null);

  /* ---------- session handling ---------- */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      }
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  /* ---------- email OTP login ---------- */
  // const signIn = async () => {
  //   if (!email || loading || cooldown > 0) return;

  //   setLoading(true);
  //   setErrorMsg(null);

  //   const { error } = await supabase.auth.signInWithOtp({
  //     email,
  //     options: {
  //       emailRedirectTo: window.location.origin,
  //     },
  //   });

  //   setLoading(false);

  //   if (error) {
  //     if (error.status === 429) {
  //       setErrorMsg("Too many login attempts. Please wait 30 seconds.");
  //       setCooldown(30);

  //       const interval = setInterval(() => {
  //         setCooldown((c) => {
  //           if (c <= 1) {
  //             clearInterval(interval);
  //             return 0;
  //           }
  //           return c - 1;
  //         });
  //       }, 1000);

  //       return;
  //     }

  //     setErrorMsg(error.message);
  //     return;
  //   }

  //   alert("Check your email for login link");
  // };

  /* ---------- logout ---------- */
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  /* ---------- NOT LOGGED IN UI ---------- */
  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-2xl shadow w-full max-w-md flex flex-col gap-4">

          <h2 className="text-xl font-semibold text-center">
            Sign in
          </h2>

          {/* Google login */}
          <GoogleSignIn />
        </div>
      </div>
    );
  }

  /* ---------- LOGGED IN ---------- */
  return (
    <AuthContext.Provider value={{ user: session.user }}>
      <>
        <div className="flex justify-between p-4">
          <div className="flex px-5 justify-center items-center gap-3">
            <h2 className="text-xl font-bold">Inveo :)</h2>
          </div>
          <button
            onClick={signOut}
            className="px-4 py-2 rounded-xl border text-sm"
          >
            Logout
          </button>
        </div>

        {children}
      </>
    </AuthContext.Provider>
  );
}
