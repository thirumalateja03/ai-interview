import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export function useCredits(userId?: string) {
  const [credits, setCredits] = useState<number>(0);

  useEffect(() => {
    if (!userId) return;

    const loadCredits = async () => {
      const { data } = await supabase
        .from("user_credits")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!data) return;

      const today = new Date().toISOString().slice(0, 10);

      // reset if needed
      if (data.last_reset !== today) {
        await supabase
          .from("user_credits")
          .update({ credits: 5, last_reset: today })
          .eq("user_id", userId);

        setCredits(5);
      } else {
        setCredits(data.credits);
      }
    };

    loadCredits();
  }, [userId]);

  const useCredit = async () => {
    if (credits <= 0) return false;

    await supabase
      .from("user_credits")
      .update({ credits: credits - 1 })
      .eq("user_id", userId);

    setCredits(c => c - 1);
    return true;
  };

  return { credits, useCredit };
}
