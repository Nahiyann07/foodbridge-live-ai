import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// If Supabase environment variables are not set, we provide a mock client for local testing.
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      auth: {
        async signInWithPassword({ email, password }: any) {
          if (email && password) {
            const mockSession = { user: { email } };
            localStorage.setItem("mock_session", JSON.stringify(mockSession));
            // Trigger listeners (mocked below)
            window.dispatchEvent(new Event("mock_auth_change"));
            return { data: { user: mockSession.user, session: mockSession }, error: null };
          }
          return { data: null, error: new Error("Invalid credentials") };
        },
        async signUp({ email, password }: any) {
          return { data: { user: { email } }, error: null };
        },
        async signOut() {
          localStorage.removeItem("mock_session");
          window.dispatchEvent(new Event("mock_auth_change"));
          return { error: null };
        },
        async getSession() {
          const sessionData = localStorage.getItem("mock_session");
          return { data: { session: sessionData ? JSON.parse(sessionData) : null }, error: null };
        },
        onAuthStateChange(callback: any) {
          const listener = () => {
            const sessionData = localStorage.getItem("mock_session");
            callback("SIGNED_IN", sessionData ? JSON.parse(sessionData) : null);
          };
          window.addEventListener("mock_auth_change", listener);
          return {
            data: {
              subscription: {
                unsubscribe: () => window.removeEventListener("mock_auth_change", listener)
              }
            }
          };
        }
      }
    } as any;
