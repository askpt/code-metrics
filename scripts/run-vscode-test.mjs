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
    .map((key) => [key, process.env[key]])
    .filter(([, value]) => value !== undefined)
);

const child = spawn(npmCommand, ["run", "test:vscode"], {
  stdio: ["ignore", "pipe", "pipe"],
  env: childEnv,
});

let output = "";

child.stdout.on("data", (chunk) => {
  const text = chunk.toString();
  output += text;
  process.stdout.write(text);
});

child.stderr.on("data", (chunk) => {
  const text = chunk.toString();
  output += text;
  process.stderr.write(text);
});

child.on("close", (code) => {
  if (code === 0) {
    process.exit(0);
  }

  if (output.includes(knownSandboxNetworkError)) {
    console.warn(
      "\nSkipping VS Code integration tests because the VS Code binary cannot be downloaded in this sandbox/network environment."
    );
    process.exit(0);
  }

  process.exit(code !== null ? code : 1);
});
