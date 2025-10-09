import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

async function debugDatabase() {
  console.log("🔍 Checking database entries...\n");

  const userId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

  // Get all entries for the user
  const { data, error } = await supabase
    .from("entries")
    .select("date, content, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error:", error.message);
    return;
  }

  console.log(`Found ${data?.length || 0} entries:\n`);

  data?.forEach((entry, i) => {
    console.log(`${i + 1}. Date: ${entry.date}`);
    console.log(`   Content: ${entry.content}`);
    console.log(`   Created: ${entry.created_at}\n`);
  });

  // Check for 2025-10-10 specifically
  console.log("\n🔍 Looking for 2025-10-10 entry...");
  const { data: specificEntry } = await supabase
    .from("entries")
    .select("*")
    .eq("user_id", userId)
    .eq("date", "2025-10-10")
    .single();

  if (specificEntry) {
    console.log("✅ Found it!");
    console.log(specificEntry);
  } else {
    console.log("❌ Not found");
  }
}

debugDatabase();
