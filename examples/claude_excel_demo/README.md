# Excel Demo with Agentic Learning

> ⚠️ **IMPORTANT**: This is a demo application by Anthropic. It is intended for local development only and should NOT be deployed to production or used at scale.

A demonstration desktop application powered by Claude and the [Claude Agent SDK](https://docs.anthropic.com/en/docs/claude-code/sdk/sdk-overview) with **Agentic Learning SDK** integration for persistent memory. The agent remembers past spreadsheet requests and user preferences across sessions.

## What's Different with Agentic Learning

This enhanced version adds persistent memory to the original Excel demo:

- ✅ **Remembers spreadsheet patterns** - learns your preferred formatting styles and structures
- ✅ **Contextual continuity** - recalls past spreadsheet requests across sessions
- ✅ **User preference learning** - adapts to your data organization preferences
- ✅ **Automatic memory capture** - no code changes needed in your spreadsheet logic
- ✅ **Seamless integration** - works transparently with Electron desktop apps

## What This Demo Shows

This Electron-based desktop application demonstrates how to:
- Create sophisticated Excel spreadsheets with formulas, formatting, and multiple sheets
- Analyze and manipulate existing spreadsheet data
- Use Claude to assist with data organization and spreadsheet design
- Work with Python scripts to generate complex spreadsheet structures
- Integrate the Claude Agent SDK with desktop applications
- Add persistent memory to Electron apps using Agentic Learning

### Example Use Cases

The `agent/` folder contains Python examples including:
- **Workout Tracker**: A fitness log with automatic summary statistics and multiple sheets
- **Budget Tracker**: Financial tracking with formulas and data validation
- Custom spreadsheet generation with styling, borders, and conditional formatting

## Prerequisites

- [Node.js 18+](https://nodejs.org)
- An Anthropic API key ([get one here](https://console.anthropic.com))
- A Letta API key ([get one here](https://www.letta.com/))
- Python 3.9+ (for the Python agent examples)
- LibreOffice (optional, for formula recalculation)

## Installation

1. Install dependencies:
```bash
npm install
```

2. Configure your API keys:
   - Set the `ANTHROPIC_API_KEY` environment variable:
     ```bash
     export ANTHROPIC_API_KEY=your-anthropic-api-key
     ```
   - Set the `LETTA_API_KEY` environment variable:
     ```bash
     export LETTA_API_KEY=your-letta-api-key
     ```
   - Alternatively, the application will prompt you for the Anthropic API key on first run

3. Run the Electron application:
```bash
npm start
```

## Working with Python Examples

The `agent/` directory contains Python scripts demonstrating spreadsheet generation:

### Setup Python Environment

```bash
cd agent
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Run Example Scripts

```bash
# Create a workout tracker
python create_workout_tracker.py

# Create a budget tracker
python create_budget_tracker.py
```

See the [agent/README.md](./agent/README.md) for more details on the Excel agent setup and capabilities.

## Features

- **AI-Powered Spreadsheet Generation**: Let Claude create complex spreadsheets based on your requirements
- **Formula Management**: Work with Excel formulas, calculations, and automatic recalculation
- **Professional Styling**: Generate spreadsheets with headers, colors, borders, and formatting
- **Multi-Sheet Workbooks**: Create workbooks with multiple related sheets
- **Data Analysis**: Analyze existing spreadsheets and extract insights
- **Desktop Integration**: Native desktop application built with Electron

## How Agentic Learning Integration Works

The Excel agent gains persistent memory with minimal code changes. Here's what was added:

### In `src/main/main.ts`:

```typescript
import { learning } from '@letta-ai/agentic-learning';

// Inside the IPC handler for 'claude-code:query'
await learning({ agent: 'claude-excel-demo' }, async () => {
  const queryIterator = query({
    prompt,
    options: { ... }
  });

  for await (const message of queryIterator) {
    messages.push(message);
    event.reply('claude-code:response', message);
  }
});
```

**What This Does:**

1. **Automatic Capture**: All Claude Agent SDK conversations are captured automatically
2. **Memory Persistence**: Spreadsheet requests and preferences are stored in Letta's memory system
3. **Context Injection**: Relevant past interactions are automatically added to new prompts
4. **IPC Compatibility**: Works seamlessly with Electron's inter-process communication

### Benefits for Spreadsheet Generation

- Agent remembers your preferred formatting styles (colors, fonts, borders)
- Recalls data organization patterns from previous requests
- Maintains consistency in formula usage and structure
- Learns from feedback and iterates more effectively

## Project Structure

```
excel-demo/
├── agent/              # Python examples and Excel agent setup
│   ├── create_workout_tracker.py
│   ├── create_budget_tracker.py
│   └── README.md       # Excel agent documentation
├── src/
│   ├── main/          # Electron main process (learning integration here)
│   └── renderer/      # React UI components
└── package.json
```

## Resources

### Claude Agent SDK
- [Claude Agent SDK Documentation](https://docs.anthropic.com/en/api/agent-sdk/overview)
- [GitHub Repository](https://github.com/anthropics/claude-agent-sdk-typescript)
- [Get Anthropic API Key](https://console.anthropic.com)

### Agentic Learning SDK
- [Agentic Learning Documentation](https://github.com/letta-ai/agentic-learning-sdk)
- [Get Letta API Key](https://www.letta.com/)
- [More Examples](https://github.com/letta-ai/agentic-learning-sdk/tree/main/examples)

### Additional Resources
- [Electron Documentation](https://www.electronjs.org/docs/latest/)
- [openpyxl Documentation](https://openpyxl.readthedocs.io/) (Python library used)

## Support

This is a demo application provided as-is. For issues related to:
- **Claude Agent SDK**: [Anthropic Support](https://support.anthropic.com)
- **Agentic Learning SDK**: [GitHub Issues](https://github.com/letta-ai/agentic-learning-sdk/issues)

## License

MIT - This is sample code for demonstration purposes.

---

Built to demonstrate the [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk-typescript) with [Agentic Learning](https://github.com/letta-ai/agentic-learning-sdk) integration
