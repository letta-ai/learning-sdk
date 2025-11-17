# Email Agent Demo with Agentic Learning

> ⚠️ **IMPORTANT**: This is a demo application by Anthropic. It is intended for local development only and should NOT be deployed to production or used at scale.

A demonstration email client powered by Claude and the Claude Agent SDK with **Agentic Learning SDK** integration for persistent memory. The agent remembers past email interactions and context across sessions.

## Architecture

![Architecture Diagram](./architecture.png)

## 🔒 Security Warning

**This application should ONLY be run locally on your personal machine.** It:
- Stores email credentials in plain text environment variables
- Has no authentication or multi-user support
- Is not designed for production security standards

## What's Different with Agentic Learning

This enhanced version adds persistent memory to the original email agent:

- ✅ **Remembers email context** across sessions and interactions
- ✅ **Learns from past conversations** about email preferences and patterns
- ✅ **Automatic memory capture** - no code changes needed in your email handling logic
- ✅ **Semantic memory search** - agent can recall relevant past email interactions

## Prerequisites

- [Bun](https://bun.sh) runtime (or Node.js 18+)
- An Anthropic API key ([get one here](https://console.anthropic.com))
- A Letta API key ([get one here](https://www.letta.com/))
- Email account with IMAP access enabled

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.example .env
```

3. Configure your credentials in `.env`:
```env
ANTHROPIC_API_KEY=your-anthropic-api-key
LETTA_API_KEY=your-letta-api-key
# ... email configuration (see IMAP Setup below)
```

4. Run the application:
```bash
npm run dev
```

5. Open your browser to `http://localhost:3000`

## IMAP Setup Guide

### Gmail Setup

Gmail requires an **App Password** instead of your regular password:

1. **Enable 2-Factor Authentication** (required for app passwords):
   - Go to [Google Account Security](https://myaccount.google.com/security)
   - Click on "2-Step Verification" and follow the setup

2. **Generate an App Password**:
   - Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" from the dropdown
   - Select your device (or choose "Other" and name it "Email Agent")
   - Click "Generate"
   - **Copy the 16-character password** (you won't see it again!)

3. **Configure `.env`**:
```env
ANTHROPIC_API_KEY=your-anthropic-api-key
LETTA_API_KEY=your-letta-api-key
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password  # NOT your regular password!
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
```

## How Agentic Learning Integration Works

The email agent automatically gains persistent memory with minimal code changes. Here's what was added:

### In `ccsdk/ai-client.ts`:

```typescript
import { learning } from "@letta-ai/agentic-learning";

async *queryStream(prompt, options) {
  const messages: SDKMessage[] = [];

  // Wrap the query in learning context to enable persistent memory
  await learning({ agent: 'claude-email-agent-demo' }, async () => {
    for await (const message of query({ prompt, options: mergedOptions })) {
      messages.push(message);
    }
  });

  // Yield all collected messages
  for (const message of messages) {
    yield message;
  }
}
```

**What This Does:**

1. **Automatic Capture**: All Claude Agent SDK conversations are automatically captured
2. **Memory Storage**: Conversations are stored in Letta's memory system
3. **Context Injection**: Relevant past interactions are automatically added to future prompts
4. **Zero Disruption**: The streaming interface for callers remains unchanged

### Benefits for Email Management

- Agent remembers email threads and context from previous sessions
- Learns user preferences for email handling (e.g., priority sorting, response styles)
- Can reference past email conversations when handling new ones
- Maintains consistent behavior across application restarts

## Resources

### Claude Agent SDK
- [Claude Agent SDK Documentation](https://docs.anthropic.com/en/api/agent-sdk/overview)
- [GitHub Repository](https://github.com/anthropics/claude-agent-sdk-typescript)
- [Get Anthropic API Key](https://console.anthropic.com)

### Agentic Learning SDK
- [Agentic Learning Documentation](https://github.com/letta-ai/agentic-learning-sdk)
- [Get Letta API Key](https://www.letta.com/)
- [More Examples](https://github.com/letta-ai/agentic-learning-sdk/tree/main/examples)

### Support
This is a demo application provided as-is. For issues related to:
- **Claude Agent SDK**: [Anthropic Support](https://support.anthropic.com)
- **Agentic Learning SDK**: [GitHub Issues](https://github.com/letta-ai/agentic-learning-sdk/issues)

## License

MIT License - This is sample code for demonstration purposes.

---

Built to demonstrate the [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk-typescript) with [Agentic Learning](https://github.com/letta-ai/agentic-learning-sdk) integration