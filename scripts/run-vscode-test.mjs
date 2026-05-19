import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const knownSandboxNetworkError = "getaddrinfo ENOTFOUND update.code.visualstudio.com";
const childEnvKeys = [
  "PATH",
  "HOME",
  "USERPROFILE",
  "TMP",
  "TEMP",
  "SystemRoot",
  "ComSpec",
  "PATHEXT",
  "APPDATA",
  "LOCALAPPDATA",
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "NO_PROXY",
  "NPM_CONFIG_PREFIX",
  "npm_config_cache",
  "npm_config_userconfig",
];

const childEnv = Object.fromEntries(
  childEnvKeys
    .filter((key) => process.env[key] !== undefined)
    .map((key) => [key, process.env[key]])
);

const child = spawn(npmCommand, ["run", "test:vscode"], {
  stdio: ["ignore", "pipe", "pipe"],
  env: childEnv,
});

const rollingWindowSize = knownSandboxNetworkError.length;
let knownSandboxNetworkErrorDetected = false;
let rollingOutputTail = "";

const handleChunk = (chunk, write) => {
  const text = chunk.toString();
  const searchableText = rollingOutputTail + text;

  if (!knownSandboxNetworkErrorDetected && searchableText.includes(knownSandboxNetworkError)) {
    knownSandboxNetworkErrorDetected = true;
  }

  rollingOutputTail = searchableText.slice(-rollingWindowSize);
  write(text);
};

child.stdout.on("data", (chunk) => handleChunk(chunk, (text) => process.stdout.write(text)));
child.stderr.on("data", (chunk) => handleChunk(chunk, (text) => process.stderr.write(text)));

child.on("error", (error) => {
  console.error(`Failed to start npm for VS Code integration tests: ${error.message}`);
  process.exit(1);
});

child.on("close", (code) => {
  if (code === 0) {
    process.exit(0);
  }

  if (knownSandboxNetworkErrorDetected) {
    console.warn(
      "\nSkipping VS Code integration tests because the VS Code binary cannot be downloaded in this sandbox/network environment."
    );
    process.exit(0);
  }

  // Node may report a null exit code when the child is terminated by signal.
  process.exit(code !== null ? code : 1);
});
