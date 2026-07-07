import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function createNoopBuilder() {
  const builder: any = {
    select: () => builder,
    order: () => builder,
    eq: () => builder,
    maybeSingle: () => ({ data: null, error: null }),
    single: () => ({ data: null, error: null }),
    insert: () => builder,
    update: () => builder,
    delete: () => builder
  };

  return builder;
}

function createNoopSupabaseClient() {
  const channel = {
    on: () => channel,
    subscribe: () => channel
  };

  return {
    auth: {
      getSession: async () => ({ data: { session: null } }),
      getUser: async () => ({ data: { user: null } }),
      signInWithPassword: async () => ({ data: null, error: { message: "Supabase is not configured." } }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } })
    },
    from: () => createNoopBuilder(),
    channel: () => channel,
    removeChannel: () => channel
  } as any;
}

export const sb: SupabaseClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createNoopSupabaseClient();