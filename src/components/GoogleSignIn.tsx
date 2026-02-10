import { supabase } from "../lib/supabase";

export default function GoogleSignIn() {
  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  return (
    <button
      onClick={signInWithGoogle}
      className="w-full py-2 rounded-xl bg-slate-900 text-white hover:opacity-90"
    >
      Continue with Google
    </button>
  );
}
