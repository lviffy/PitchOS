import { loadModel, LLAMA_3_2_1B_INST_Q4_0, completion, unloadModel } from "@qvac/sdk";

async function run() {
  console.log("Loading local Llama model (this may download weights on first run)...");
  const modelId = await loadModel({ modelSrc: LLAMA_3_2_1B_INST_Q4_0 });
  
  console.log("\nRunning inference...");
  const result = completion({ 
    modelId, 
    history: [{ role: "user", content: "Suggest a 5-minute training drill for a striker." }] 
  });
  
  for await (const token of result.tokenStream) {
    process.stdout.write(token);
  }
  console.log("\n");
  await unloadModel({ modelId });
}

run().catch(console.error);
