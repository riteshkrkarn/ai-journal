import { createClient } from "@supabase/supabase-js";
import { generateEmbedding } from "./src/services/embeddings";
import * as dotenv from "dotenv";

// Load environment variables FIRST
dotenv.config();

async function testConnection() {
  console.log("🧪 Testing Supabase Connection\n");

  // Debug: Check if env vars are loaded
  console.log("🔍 Debug: Checking environment variables...");
  console.log(`SUPABASE_URL exists: ${!!process.env.SUPABASE_URL}`);
  console.log(`SUPABASE_ANON_KEY exists: ${!!process.env.SUPABASE_ANON_KEY}`);
  console.log(`GOOGLE_API_KEY exists: ${!!process.env.GOOGLE_API_KEY}`);

  if (process.env.SUPABASE_URL) {
    console.log(
      `SUPABASE_URL value: ${process.env.SUPABASE_URL.substring(0, 30)}...`
    );
  }
  console.log("");

  try {
    // Validate env vars exist
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      throw new Error(
        "Missing Supabase credentials in .env file!\n" +
          "Required variables:\n" +
          "- SUPABASE_URL\n" +
          "- SUPABASE_ANON_KEY\n\n" +
          "Make sure your .env file is in the root directory."
      );
    }

    // Test 1: Connect to Supabase
    console.log("📡 Test 1: Connecting to Supabase...");
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    console.log("✅ Connected!\n");

    // Test 2: Generate embedding
    console.log("🔢 Test 2: Generating 768-dimensional embedding...");
    const embedding = await generateEmbedding("Test entry");
    console.log(`✅ Generated embedding with ${embedding.length} dimensions\n`);

    // Test 3: Save entry to Supabase
    console.log("💾 Test 3: Saving entry to Supabase...");
    const userId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"; // Test user ID

    const { error: insertError } = await supabase.from("entries").insert({
      user_id: userId,
      date: "2024-10-10",
      content: "Test entry from migration",
      embedding: JSON.stringify(embedding),
    });

    if (insertError) {
      throw new Error(`Insert failed: ${insertError.message}`);
    }
    console.log("✅ Entry saved!\n");

    // Test 4: Retrieve entry
    console.log("📖 Test 4: Retrieving entries...");
    const { data, error: selectError } = await supabase
      .from("entries")
      .select("date, content")
      .eq("user_id", userId);

    if (selectError) {
      throw new Error(`Select failed: ${selectError.message}`);
    }

    console.log(`✅ Found ${data?.length || 0} entries:`);
    data?.forEach((entry) => {
      console.log(`   - ${entry.date}: ${entry.content}`);
    });

    console.log("\n✨ All tests passed! Supabase is ready.");
    console.log("\n📝 Next steps:");
    console.log("   1. Update src/services/database.ts to use Supabase");
    console.log(
      "   2. Update src/agents/assistant/journalAgent.ts with userId"
    );
    console.log("   3. Test with npm run cli");
  } catch (error: any) {
    console.error("\n❌ Test failed!");
    console.error(error.message || error);

    if (error.message?.includes("Missing Supabase")) {
      console.error("\n💡 Tip: Make sure your .env file looks like:");
      console.error("   SUPABASE_URL=https://xxxxx.supabase.co");
      console.error("   SUPABASE_ANON_KEY=eyJhbGc...");
      console.error("   GOOGLE_API_KEY=AIzaSyC...");
    }

    process.exit(1);
  }
}

testConnection();
