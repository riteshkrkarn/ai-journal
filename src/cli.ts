import { journalAgent } from "./agents/assistant/journalAgent";
import * as readline from "readline";

async function startCLI() {
  console.log("\n📔 AI Journal - Interactive Mode");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("💡 What you can do:");
  console.log(
    "   📝 Save: 'Save my journal for 2024-10-10: Learned about AI agents'"
  );
  console.log("   🔍 Fetch: 'Show my journal for 2024-10-10'");
  console.log(
    "   🏷️  Search: 'Show me entries about coding' (semantic search)"
  );
  console.log("   📊 Summary: 'Summarize my coding progress this week'");
  console.log("   🎯 Goals: 'Add goal: Learn TypeScript' or 'Show my goals'");
  console.log("   📈 Progress: 'Update my TypeScript goal to in-progress'");
  console.log("   🚪 Exit: Type 'exit' or 'quit'\n");
  console.log("✨ Features: Cloud storage, semantic search, goal tracking\n");

  const { runner } = await journalAgent();
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const askQuestion = () => {
    rl.question("You: ", async (input) => {
      const trimmed = input.trim();

      if (!trimmed) {
        askQuestion();
        return;
      }

      if (
        trimmed.toLowerCase() === "exit" ||
        trimmed.toLowerCase() === "quit"
      ) {
        console.log(
          "\n👋 Goodbye! Your journal entries are safely stored in the cloud\n"
        );
        rl.close();
        process.exit(0);
      }

      try {
        const response = await runner.ask(trimmed);
        console.log("\n📝 Journal Agent:", response, "\n");
      } catch (error) {
        console.error("❌ Error:", error);
      }

      askQuestion();
    });
  };

  askQuestion();
}

startCLI().catch(console.error);
