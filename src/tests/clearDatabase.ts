import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!
);

async function deleteAllEntries() {
  console.log("🗑️  Deleting all entries from Supabase...\n");

  const userId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

  // First, show what will be deleted
  const { data: entries } = await supabase
    .from("entries")
    .select("date, content")
    .eq("user_id", userId);

  console.log(`Found ${entries?.length || 0} entries to delete:\n`);
  entries?.forEach((entry, i) => {
    console.log(`${i + 1}. ${entry.date}: ${entry.content}`);
  });

  console.log("\n⚠️  This will delete ALL entries!");
  console.log("Press Ctrl+C now to cancel, or wait 3 seconds...\n");

  // Wait 3 seconds
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Delete all entries for this user
  const { error } = await supabase
    .from("entries")
    .delete()
    .eq("user_id", userId);

  if (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }

  console.log("✅ All entries deleted successfully!");

  // Verify
  const { data: remaining } = await supabase
    .from("entries")
    .select("id")
    .eq("user_id", userId);

  console.log(`\n📊 Remaining entries: ${remaining?.length || 0}`);
}

deleteAllEntries();
