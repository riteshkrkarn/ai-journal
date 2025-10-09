import { journalAgent } from "./agents/assistant/journalAgent";
import * as readline from "readline";

async function startCLI() {
  console.log("\n📔 AI Journal - Interactive Mode");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("💡 What you can do:");
  console.log("   📝 Save: 'Save my journal for today: I built a CLI'");
  console.log("   🔍 Search: 'What did I work on today?'");
  console.log("   🏷️  Topics: 'Show entries about coding' (semantic search)");
  console.log(
    "   📊 Summary: 'Summarize this week' or 'My study progress this week'"
  );
  console.log("   🚪 Exit: Type 'exit' or 'quit'\n");
  console.log("✨ Tip: Your data persists across sessions in journal.db\n");

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
          "\n👋 Goodbye! Your journal entries are saved in journal.db\n"
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
