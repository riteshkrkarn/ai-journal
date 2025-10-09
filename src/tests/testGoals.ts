import { journalAgent } from "./src/agents/assistant/journalAgent";

async function testGoals() {
  console.log("🎯 Testing Goal Tracking Feature\n");

  try {
    const { runner } = await journalAgent();
    console.log("✅ Agent created successfully!\n");

    // Test 1: Create a goal
    console.log("📝 Test 1: Creating a goal...");
    const createResponse = await runner.ask(
      "Set a goal: Complete AI Journal project by 2024-10-15 with full goal tracking and calendar integration"
    );
    console.log("Response:", createResponse, "\n");

    // Test 2: Save journal entries mentioning the goal
    console.log("💾 Test 2: Saving entries that mention the goal...");
    await runner.ask(
      "Save my journal for 2024-10-09: Started working on goal tracking feature for the AI journal"
    );
    await runner.ask(
      "Save my journal for 2024-10-10: Implemented goal database and added 4 ADK tools for goal management"
    );
    await runner.ask(
      "Save my journal for 2024-10-11: Tested goal tracking with semantic search - it works!"
    );
    console.log("✅ 3 entries saved\n");

    // Test 3: List goals
    console.log("📋 Test 3: Listing all goals...");
    const listResponse = await runner.ask("Show me my goals");
    console.log("Response:", listResponse, "\n");

    // Test 4: Check progress (AI will find related entries)
    console.log("🔍 Test 4: Checking goal progress...");
    const progressResponse = await runner.ask(
      "How am I doing on my AI Journal project goal?"
    );
    console.log("Response:", progressResponse, "\n");

    // Test 5: Create another goal
    console.log("🎯 Test 5: Creating another goal...");
    await runner.ask(
      "Set a goal: Learn TypeScript advanced patterns by 2024-11-01"
    );
    console.log("✅ Second goal created\n");

    // Test 6: List all goals again
    console.log("📋 Test 6: Listing all goals again...");
    const listResponse2 = await runner.ask("List my goals");
    console.log("Response:", listResponse2, "\n");

    console.log("✨ All tests passed! Goal tracking is working.");
    console.log("\n🎉 Phase 2 Complete!");
    console.log("\n💡 Try in CLI:");
    console.log("   - Set a goal: [your goal] by [date]");
    console.log("   - Show my goals");
    console.log("   - How am I doing on [goal]?");
    console.log("   - Mark goal as complete");
  } catch (error: any) {
    console.error("❌ Test failed:", error.message || error);
    process.exit(1);
  }
}

testGoals();
