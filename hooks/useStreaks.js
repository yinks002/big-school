import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export const useStreaks = (session) => {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!session?.user) return;
    checkStreak();
  }, [session]);

  const checkStreak = async () => {
    const userId = session.user.id;
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    try {
      // 1. Get current stats
      const { data, error } = await supabase
        .from('profiles')
        .select('current_streak, last_active_date')
        .eq('id', userId)
        .single();

      if (error || !data) return;

      const { current_streak, last_active_date } = data;

      // 2. Logic
      let newStreak = current_streak;

      if (last_active_date === today) {
        // Already active today, do nothing
        setStreak(current_streak);
        return; 
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      if (last_active_date === yesterdayStr) {
        // Active yesterday? Increment!
        newStreak += 1;
      } else {
        // Missed a day? Reset to 1
        newStreak = 1;
      }

      // 3. Update Database
      await supabase
        .from('profiles')
        .update({ 
          current_streak: newStreak, 
          last_active_date: today 
        })
        .eq('id', userId);

      setStreak(newStreak);

    } catch (e) {
      console.log("Streak Error:", e);
    }
  };

  return streak;
};