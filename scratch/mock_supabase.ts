import { createClient } from "@supabase/supabase-js";

// Mock fetch to see the generated URL
globalThis.fetch = async (url, options) => {
  console.log("GENERATED URL:", url.toString());
  return {
    ok: true,
    status: 200,
    json: async () => ([]),
    text: async () => "[]",
    headers: new Headers()
  } as any;
};

const supabase = createClient("https://mock.supabase.co", "mock-key");

async function test() {
  await supabase
    .from("publications")
    .select("*")
    .filter("hive_id::text", "eq", "quebec");
}

test();
