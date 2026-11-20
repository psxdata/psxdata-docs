const DOCS = "https://psxdata.mintlify.app/mcp/setup";
const IMAGE = "mtauha/psxdata-mcp:latest";
const DOCKER_ARGS = `run -i --rm -v psxdata-cache:/home/app/.psxdata ${IMAGE}`;

const DOCKER_CHECK = [
  "1. Run `docker info` to check that Docker is installed and running. If it isn't, stop and tell me to install or start Docker Desktop.",
  `2. Run \`docker pull ${IMAGE}\`.`,
];

const TEST = 'Load the KSE-100 and show me the five biggest weights.';

const AGENTS = {
  claude: {
    name: "Claude Code",
    open: (text) => `claude-cli://open?q=${encodeURIComponent(text)}`,
    prompt: [
      `Install the psxdata MCP server (Pakistan Stock Exchange data) in Claude Code. Docs: ${DOCS}`,
      "",
      ...DOCKER_CHECK,
      "3. Run `claude plugin list`. If a `psxdata` plugin is already installed, tell me and stop.",
      "4. Install the plugin, which adds the server and its analysis skills:",
      "   `claude plugin marketplace add psxdata/psxdata-mcp`",
      "   `claude plugin install psxdata@psxdata-mcp`",
      "5. Tell me what you installed and that I need to restart Claude Code to load it. After the restart, `/mcp` should show `psxdata` as connected, and I can test it with: \"" + TEST + "\"",
    ],
  },
  codex: {
    name: "Codex",
    open: (text) => `codex://new?prompt=${encodeURIComponent(text)}`,
    prompt: [
      `Install the psxdata MCP server (Pakistan Stock Exchange data) in Codex. Docs: ${DOCS}`,
      "",
      ...DOCKER_CHECK,
      "3. Run `codex mcp list`. If `psxdata` is already there, show me its entry and ask before changing it.",
      `4. Run \`codex mcp add psxdata -- docker ${DOCKER_ARGS}\`. It writes to \`~/.codex/config.toml\`, which the Codex app, CLI and IDE extension share.`,
      "5. Tell me what you changed. The server loads in new threads, so tell me to start a new thread and test it with: \"" + TEST + "\"",
    ],
  },
  cursor: {
    name: "Cursor",
    open: (text) => `https://cursor.com/link/prompt?text=${encodeURIComponent(text)}`,
    prompt: [
      `Install the psxdata MCP server (Pakistan Stock Exchange data) in Cursor. Docs: ${DOCS}`,
      "",
      ...DOCKER_CHECK,
      "3. Open `~/.cursor/mcp.json` (on Windows, `%USERPROFILE%\\.cursor\\mcp.json`), or create it as `{ \"mcpServers\": {} }` if it doesn't exist. If `mcpServers` already has a `psxdata` entry, show it to me and ask before replacing it.",
      "4. Add this entry under `mcpServers`, keeping every existing entry:",
      `   "psxdata": { "command": "docker", "args": ${JSON.stringify(DOCKER_ARGS.split(" "))} }`,
      "5. Tell me what you changed, and to check that Cursor Settings → MCP shows `psxdata` turned on with a green dot.",
      "6. Once the psxdata tools are available, call `load_index` with `KSE100`, then `query` with `SELECT symbol, idx_weight FROM index_constituents ORDER BY idx_weight DESC LIMIT 5`, and show me the result.",
    ],
  },
  other: {
    name: null,
    open: null,
    prompt: [
      `Install the psxdata MCP server (Pakistan Stock Exchange data) for yourself, the agent I'm talking to right now. Docs: ${DOCS}`,
      "",
      ...DOCKER_CHECK,
      "3. Add a stdio MCP server named `psxdata` to your own MCP configuration, available in all my projects:",
      "   command: `docker`",
      `   args: ${JSON.stringify(DOCKER_ARGS.split(" "))}`,
      "   Use your own `mcp add` command if you have one (Gemini CLI: `gemini mcp add --scope user psxdata -- docker " + DOCKER_ARGS + "`). Otherwise edit your config file: the user `mcp.json` with key `servers` and `\"type\": \"stdio\"` for VS Code, `~/.codeium/windsurf/mcp_config.json` for Windsurf, or the `mcpServers` section of your client's config. Keep every existing entry, never add `-t` to the Docker args, and ask me before replacing an existing `psxdata` entry.",
      "4. Tell me what you changed and whether I need to restart you or reload MCP servers.",
      "5. Once the psxdata tools are available, call `load_index` with `KSE100`, then `query` with `SELECT symbol, idx_weight FROM index_constituents ORDER BY idx_weight DESC LIMIT 5`, and show me the result.",
    ],
  },
};

export const AgentPrompt = ({ agent }) => {
  const config = AGENTS[agent];
  const text = config.prompt.join("\n");
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      setOpen(true);
    }
  };

  const title = config.name
    ? `Set up psxdata in ${config.name}`
    : "Set up psxdata in your agent";

  const ghost =
    "flex items-center justify-center rounded-lg border cursor-pointer transition-colors duration-70 outline-offset-4 text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-gray-50 bg-transparent hover:bg-gray-950/5 dark:hover:bg-white/5 border-gray-950/10 dark:border-white/10";

  return (
    <div className="agent-prompt not-prose my-6 rounded-2xl border p-4 border-gray-950/10 dark:border-white/10 bg-transparent text-sm/[20px] text-gray-950 tracking-[-0.1px] dark:text-gray-50 print:print-color-exact">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <div className="flex items-center gap-2 font-medium">
          <Icon icon="clipboard" size={14} />
          <span>{title}</span>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1.5 print:hidden">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Hide prompt" : "Show prompt"}
            title={open ? "Hide prompt" : "Show prompt"}
            aria-expanded={open}
            className={`${ghost} size-7`}
          >
            <Icon icon={open ? "eye-slash" : "eye"} size={14} />
          </button>
          <button
            type="button"
            onClick={copy}
            aria-label={copied ? "Copied" : "Copy prompt"}
            title={copied ? "Copied" : "Copy prompt"}
            className={`${ghost} size-7`}
          >
            <Icon icon={copied ? "check" : "copy"} size={14} />
          </button>
          {config.open && (
            <a
              href={config.open(text)}
              className="h-7 px-2.5 flex items-center justify-center rounded-lg border cursor-pointer transition-colors duration-70 outline-offset-4 text-xs/[16px] whitespace-nowrap font-medium no-underline border-transparent bg-primary text-white hover:bg-primary-dark"
            >
              {`Open in ${config.name}`}
            </a>
          )}
        </div>
      </div>
      {open && (
        <pre className="mt-4 mb-0 whitespace-pre-wrap rounded-xl border border-gray-950/10 dark:border-white/10 bg-transparent p-3 text-gray-950 dark:text-gray-50 text-xs/[18px] font-mono">
          {text}
        </pre>
      )}
    </div>
  );
};
