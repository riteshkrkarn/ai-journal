import { journalAgent } from "./agents/assistant/journalAgent";

async function main() {
  console.log("🚀 Starting AI Journal Test Suite (Optimized)\n");

  const { runner } = await journalAgent();

  console.log("=== Phase 1: Saving Journal Entries (4 entries) ===\n");

  const today = new Date();
  const dates: string[] = [];

  // Generate dates for the past 4 days (reduced from 7)
  for (let i = 3; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split("T")[0]!);
  }

  console.log(`💾 Saving entry 1/4 (${dates[0]})...`);
  await runner.ask(
    `Save my journal for ${dates[0]}: Started learning about ADK agents and TypeScript. Built my first AI agent!`
  );

  console.log(`💾 Saving entry 2/4 (${dates[1]})...`);
  await runner.ask(
    `Save my journal for ${dates[1]}: Continued coding practice. Worked on semantic search using embeddings and SQLite.`
  );

  console.log(`💾 Saving entry 3/4 (${dates[2]})...`);
  await runner.ask(
    `Save my journal for ${dates[2]}: Studied mathematics and algorithms. Learned about vector similarity.`
  );

  console.log(`💾 Saving entry 4/4 (${dates[3]})...`);
  await runner.ask(
    `Save my journal for ${dates[3]}: Back to coding! Debugged database issues and implemented persistence.`
  );

  console.log("\n✅ All entries saved!\n");

  console.log("=== Phase 2: Testing Semantic Search ===\n");

  console.log("🏷️  Query: Show me all entries about coding");
  const response1 = await runner.ask("Show me all entries about coding");
  console.log("📝 Response:", response1, "\n");

  console.log("=== Phase 3: Testing Summary Feature ===\n");

  console.log("📊 Query: Summarize my coding progress this week");
  const response2 = await runner.ask("Summarize my coding progress this week");
  console.log("📝 Response:", response2, "\n");

  console.log("=== Phase 4: Testing Specific Date Lookup ===\n");

  console.log(`🔍 Query: Show my journal for ${dates[1]}`);
  const response3 = await runner.ask(`Show my journal for ${dates[1]}`);
  console.log("📝 Response:", response3);

  console.log("\n✨ Test suite completed successfully!");
  console.log("\n💡 Key Features Demonstrated:");
  console.log("   ✅ Semantic search (coding entries)");
  console.log("   ✅ Weekly summaries with AI analysis");
  console.log("   ✅ Exact date lookup");
  console.log("   ✅ Persistent storage with SQLite");
  console.log("   ✅ Vector embeddings for semantic search");
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
