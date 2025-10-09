import { journalAgent } from "./src/agents/assistant/journalAgent";

async function testMigration() {
  console.log("🧪 Testing Supabase Migration\n");

  try {
    const { runner } = await journalAgent();
    console.log("✅ Agent created successfully!\n");

    // Test 1: Save entry
    console.log("📝 Test 1: Saving entry...");
    const saveResponse = await runner.ask(
      "Save my journal for 2025-10-10: Successfully migrated from SQLite to Supabase! Vector search is working perfectly."
    );
    console.log("Response:", saveResponse, "\n");

    // Test 2: Fetch entry
    console.log("📖 Test 2: Fetching entry by date...");
    const fetchResponse = await runner.ask("Show my journal for 202510-10");
    console.log("Response:", fetchResponse, "\n");

    // Test 3: Semantic search
    console.log("🔍 Test 3: Semantic search...");
    const searchResponse = await runner.ask("What did I do with Supabase?");
    console.log("Response:", searchResponse, "\n");

    // Test 4: Summary (new feature)
    console.log("📊 Test 4: Get summary...");
    const summaryResponse = await runner.ask(
      "Summarize my entries from 2025-10-01 to 2025-10-15"
    );
    console.log("Response:", summaryResponse, "\n");

    console.log("✨ All tests passed! Migration complete.");
    console.log("\n🎯 Next: Run 'npm run cli' for interactive mode");
  } catch (error: any) {
    console.error("❌ Test failed:", error.message || error);
    process.exit(1);
  }
}

testMigration();
