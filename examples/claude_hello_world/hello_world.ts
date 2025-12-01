import type { HookJSONOutput } from "@anthropic-ai/claude-agent-sdk";
import * as fs from "fs";
import * as path from "path";
import { learning } from '@letta-ai/agentic-learning';

async function main() {
  // Wrap the query in learning context to enable persistent memory
  await learning({ agent: 'claude-hello-world-demo' }, async () => {
    // IMPORTANT: Use require() here (not import at top) for memory injection to work
    const { query } = require("@anthropic-ai/claude-agent-sdk");

    // Ensure the agent working directory exists
    const agentCwd = path.join(process.cwd(), 'agent');
    fs.mkdirSync(agentCwd, { recursive: true });

    const q = query({
      prompt: 'Hello, Claude! Please introduce yourself in one sentence.',
      options: {
        maxTurns: 100,
        cwd: agentCwd,
        model: "opus",
        executable: process.execPath, // Use the current node binary path
        allowedTools: [
          "Task", "Bash", "Glob", "Grep", "LS", "ExitPlanMode", "Read", "Edit", "MultiEdit", "Write", "NotebookEdit",
          "WebFetch", "TodoWrite", "WebSearch", "BashOutput", "KillBash"
        ],
        hooks: {
          PreToolUse: [
            {
              matcher: "Write|Edit|MultiEdit",
              hooks: [
                async (input: any): Promise<HookJSONOutput> => {
                  const toolName = input.tool_name;
                  const toolInput = input.tool_input;

                  if (!['Write', 'Edit', 'MultiEdit'].includes(toolName)) {
                    return { continue: true };
                  }

                  let filePath = '';
                  if (toolName === 'Write' || toolName === 'Edit') {
                    filePath = toolInput.file_path || '';
                  } else if (toolName === 'MultiEdit') {
                    filePath = toolInput.file_path || '';
                  }

                  const ext = path.extname(filePath).toLowerCase();
                  if (ext === '.js' || ext === '.ts') {
                    const customScriptsPath = path.join(process.cwd(), 'agent', 'custom_scripts');

                    if (!filePath.startsWith(customScriptsPath)) {
                      return {
                        decision: 'block',
                        stopReason: `Script files (.js and .ts) must be written to the custom_scripts directory. Please use the path: ${customScriptsPath}/${path.basename(filePath)}`,
                        continue: false
                      };
                    }
                  }

                  return { continue: true };
                }
              ]
            }
          ]
        },
      },
    });

    for await (const message of q) {
      if (message.type === 'assistant' && message.message) {
        const textContent = message.message.content.find((c: any) => c.type === 'text');
        if (textContent && 'text' in textContent) {
          console.log('Claude says:', textContent.text);
        }
      }
    }
  });
}

main().catch(console.error);
