import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://pniwgtspagxcxugztrwt.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBuaXdndHNwYWd4Y3h1Z3p0cnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyOTI4MTEsImV4cCI6MjA4NTg2ODgxMX0.jJN0KFxRebbmnFGaW29txBNkvcsCDwl2_h-k4Z9dxiA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});