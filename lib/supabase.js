import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

// ⚠️ CONFIRM THESE KEYS ARE CORRECT
const supabaseUrl = 'https://svimwojljndssddwhihc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2aW13b2psam5kc3NkZHdoaWhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2ODY1MTksImV4cCI6MjA4MDI2MjUxOX0.9f-HEd26ngal4WwuXT_Y5rxCV6eySY6u3VGjVB3sS1I'; // <--- PASTE YOUR KEY HERE

// 🛠️ HELPER: Decide which storage to use
const getStorage = () => {
  if (Platform.OS === 'web') {
    // On Web, use the browser's built-in localStorage
    return typeof localStorage !== 'undefined' ? localStorage : null;
  }
  // On Mobile, use AsyncStorage
  return AsyncStorage;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});



//  const supabaseUrl = 'https://svimwojljndssddwhihc.supabase.co';
// const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN2aW13b2psam5kc3NkZHdoaWhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2ODY1MTksImV4cCI6MjA4MDI2MjUxOX0.9f-HEd26ngal4WwuXT_Y5rxCV6eySY6u3VGjVB3sS1I';
