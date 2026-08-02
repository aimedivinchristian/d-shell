import {
  DirNode,
  FSNode,
  getNode,
  getParentAndName,
  makeDir,
  makeFile,
  pathToString,
  resolvePath,
} from "./filesystem";

export interface ShellState {
  root: DirNode;
  cwd: string[]; // absolute path segments
  history: string[];
  env: Record<string, string>;
}

export interface CommandResult {
  output: string; // stdout text to render (may be "")
  error?: string; // stderr text to render in a distinct style
  clear?: boolean; // instruct the UI to clear the scrollback
}

type Handler = (args: string[], state: ShellState) => CommandResult;

function fmtPerms(node: FSNode): string {
  return node.permissions;
}

function longListLine(node: FSNode): string {
  const size = node.type === "file" ? node.content.length : 0;
  const date = new Date(node.modifiedAt).toISOString().slice(0, 10);
  return `${fmtPerms(node)}  ${String(size).padStart(5)}  ${date}  ${node.name}`;
}

const handlers: Record<string, Handler> = {
  pwd: (_args, state) => ({ output: pathToString(state.cwd) }),

  ls: (args, state) => {
    const showAll = args.includes("-a") || args.includes("-la") || args.includes("-al");
    const longForm = args.includes("-l") || args.includes("-la") || args.includes("-al");
    const targetArg = args.find((a) => !a.startsWith("-"));
    const target = targetArg ? resolvePath(state.cwd, targetArg) : state.cwd;
    const node = getNode(state.root, target);

    if (!node) return { output: "", error: `ls: cannot access '${targetArg}': No such file or directory` };
    if (node.type === "file") return { output: node.name };

    const entries = Object.values(node.children)
      .filter((n) => showAll || !n.name.startsWith("."))
      .sort((a, b) => a.name.localeCompare(b.name));

    if (entries.length === 0) return { output: "" };

    if (longForm) {
      return { output: entries.map(longListLine).join("\n") };
    }
    return { output: entries.map((n) => (n.type === "dir" ? n.name + "/" : n.name)).join("  ") };
  },

  cd: (args, state) => {
    const target = args[0] ?? "/home/learner";
    const path = resolvePath(state.cwd, target);
    const node = getNode(state.root, path);
    if (!node) return { output: "", error: `cd: no such file or directory: ${target}` };
    if (node.type !== "dir") return { output: "", error: `cd: not a directory: ${target}` };
    state.cwd = path;
    return { output: "" };
  },

  cat: (args, state) => {
    if (args.length === 0) return { output: "", error: "cat: missing operand" };
    const outputs: string[] = [];
    for (const arg of args) {
      const path = resolvePath(state.cwd, arg);
      const node = getNode(state.root, path);
      if (!node) return { output: "", error: `cat: ${arg}: No such file or directory` };
      if (node.type === "dir") return { output: "", error: `cat: ${arg}: Is a directory` };
      outputs.push(node.content.replace(/\n$/, ""));
    }
    return { output: outputs.join("\n") };
  },

  echo: (args, state) => {
    // support: echo "text" > file.txt  and  echo "text" >> file.txt
    const gtIndex = args.indexOf(">");
    const appendIndex = args.indexOf(">>");
    const redirectIndex = gtIndex !== -1 ? gtIndex : appendIndex;
    const text = args.slice(0, redirectIndex === -1 ? undefined : redirectIndex).join(" ");

    if (redirectIndex !== -1) {
      const filename = args[redirectIndex + 1];
      if (!filename) return { output: "", error: "echo: missing filename after redirect" };
      const path = resolvePath(state.cwd, filename);
      const { parent, name } = getParentAndName(state.root, path);
      if (!parent) return { output: "", error: `echo: cannot create '${filename}'` };
      const existing = parent.children[name];
      if (existing && existing.type === "file" && appendIndex !== -1) {
        existing.content += text + "\n";
        existing.modifiedAt = Date.now();
      } else {
        parent.children[name] = makeFile(name, text + "\n");
      }
      return { output: "" };
    }
    return { output: text };
  },

  touch: (args, state) => {
    if (args.length === 0) return { output: "", error: "touch: missing file operand" };
    for (const arg of args) {
      const path = resolvePath(state.cwd, arg);
      const { parent, name } = getParentAndName(state.root, path);
      if (!parent) return { output: "", error: `touch: cannot touch '${arg}'` };
      if (!parent.children[name]) parent.children[name] = makeFile(name);
      else parent.children[name].modifiedAt = Date.now();
    }
    return { output: "" };
  },

  mkdir: (args, state) => {
    const recursive = args.includes("-p");
    const targets = args.filter((a) => a !== "-p");
    if (targets.length === 0) return { output: "", error: "mkdir: missing operand" };

    for (const arg of targets) {
      const path = resolvePath(state.cwd, arg);

      if (recursive) {
        // Walk the path, creating any missing directories along the way.
        let current: DirNode = state.root;
        for (const segment of path) {
          const existing = current.children[segment];
          if (existing) {
            if (existing.type !== "dir") {
              return { output: "", error: `mkdir: cannot create directory '${arg}': Not a directory` };
            }
            current = existing;
          } else {
            const created = makeDir(segment);
            current.children[segment] = created;
            current = created;
          }
        }
        continue;
      }

      const { parent, name } = getParentAndName(state.root, path);
      if (!parent) return { output: "", error: `mkdir: cannot create directory '${arg}': No such file or directory` };
      if (parent.children[name]) return { output: "", error: `mkdir: cannot create directory '${arg}': File exists` };
      parent.children[name] = makeDir(name);
    }
    return { output: "" };
  },

  rm: (args, state) => {
    const recursive = args.includes("-r") || args.includes("-rf") || args.includes("-fr");
    const targets = args.filter((a) => !a.startsWith("-"));
    if (targets.length === 0) return { output: "", error: "rm: missing operand" };
    for (const arg of targets) {
      const path = resolvePath(state.cwd, arg);
      const { parent, name } = getParentAndName(state.root, path);
      const node = parent?.children[name];
      if (!parent || !node) return { output: "", error: `rm: cannot remove '${arg}': No such file or directory` };
      if (node.type === "dir" && Object.keys(node.children).length > 0 && !recursive) {
        return { output: "", error: `rm: cannot remove '${arg}': Is a directory (use -r)` };
      }
      delete parent.children[name];
    }
    return { output: "" };
  },

  mv: (args, state) => {
    if (args.length < 2) return { output: "", error: "mv: missing operand" };
    const [src, dest] = args;
    const srcPath = resolvePath(state.cwd, src);
    const srcParentInfo = getParentAndName(state.root, srcPath);
    const node = srcParentInfo.parent?.children[srcParentInfo.name];
    if (!srcParentInfo.parent || !node) return { output: "", error: `mv: cannot stat '${src}': No such file or directory` };

    const destPath = resolvePath(state.cwd, dest);
    const destNode = getNode(state.root, destPath);
    if (destNode && destNode.type === "dir") {
      destNode.children[node.name] = node;
    } else {
      const destInfo = getParentAndName(state.root, destPath);
      if (!destInfo.parent) return { output: "", error: `mv: cannot move to '${dest}'` };
      node.name = destInfo.name;
      destInfo.parent.children[destInfo.name] = node;
    }
    delete srcParentInfo.parent.children[srcParentInfo.name];
    return { output: "" };
  },

  cp: (args, state) => {
    if (args.length < 2) return { output: "", error: "cp: missing operand" };
    const [src, dest] = args;
    const srcPath = resolvePath(state.cwd, src);
    const node = getNode(state.root, srcPath);
    if (!node) return { output: "", error: `cp: cannot stat '${src}': No such file or directory` };
    if (node.type !== "file") return { output: "", error: `cp: '${src}': omitting directory` };

    const destPath = resolvePath(state.cwd, dest);
    const destNode = getNode(state.root, destPath);
    if (destNode && destNode.type === "dir") {
      destNode.children[node.name] = makeFile(node.name, node.content, node.permissions);
    } else {
      const destInfo = getParentAndName(state.root, destPath);
      if (!destInfo.parent) return { output: "", error: `cp: cannot create '${dest}'` };
      destInfo.parent.children[destInfo.name] = makeFile(destInfo.name, node.content, node.permissions);
    }
    return { output: "" };
  },

  grep: (args, state) => {
    const flags = args.filter((a) => a.startsWith("-"));
    const rest = args.filter((a) => !a.startsWith("-"));
    const [pattern, file] = rest;
    if (!pattern || !file) return { output: "", error: "grep: usage: grep [pattern] [file]" };
    const path = resolvePath(state.cwd, file);
    const node = getNode(state.root, path);
    if (!node || node.type !== "file") return { output: "", error: `grep: ${file}: No such file or directory` };
    const ignoreCase = flags.includes("-i");
    const re = new RegExp(pattern, ignoreCase ? "i" : "");
    const matches = node.content.split("\n").filter((line) => re.test(line));
    return { output: matches.join("\n") };
  },

  whoami: () => ({ output: "learner" }),

  clear: () => ({ output: "", clear: true }),

  history: (_args, state) => ({ output: state.history.map((h, i) => `${i + 1}  ${h}`).join("\n") }),

  chmod: (args, state) => {
    if (args.length < 2) return { output: "", error: "chmod: missing operand" };
    const [, file] = args;
    const path = resolvePath(state.cwd, file);
    const node = getNode(state.root, path);
    if (!node) return { output: "", error: `chmod: cannot access '${file}': No such file or directory` };
    return { output: "" };
  },

  wc: (args, state) => {
    const file = args.find((a) => !a.startsWith("-"));
    if (!file) return { output: "", error: "wc: missing operand" };
    const path = resolvePath(state.cwd, file);
    const node = getNode(state.root, path);
    if (!node || node.type !== "file") return { output: "", error: `wc: ${file}: No such file or directory` };
    const lines = node.content.split("\n").filter((_, i, arr) => !(i === arr.length - 1 && arr[i] === "")).length;
    const words = node.content.trim().split(/\s+/).filter(Boolean).length;
    const chars = node.content.length;
    return { output: `${lines} ${words} ${chars} ${file}` };
  },

  head: (args, state) => {
    const nIndex = args.indexOf("-n");
    const n = nIndex !== -1 ? parseInt(args[nIndex + 1], 10) || 10 : 10;
    const file = args.find((a, i) => !a.startsWith("-") && args[i - 1] !== "-n");
    if (!file) return { output: "", error: "head: missing operand" };
    const path = resolvePath(state.cwd, file);
    const node = getNode(state.root, path);
    if (!node || node.type !== "file") return { output: "", error: `head: cannot open '${file}' for reading: No such file or directory` };
    return { output: node.content.replace(/\n$/, "").split("\n").slice(0, n).join("\n") };
  },

  tail: (args, state) => {
    const nIndex = args.indexOf("-n");
    const n = nIndex !== -1 ? parseInt(args[nIndex + 1], 10) || 10 : 10;
    const file = args.find((a, i) => !a.startsWith("-") && args[i - 1] !== "-n");
    if (!file) return { output: "", error: "tail: missing operand" };
    const path = resolvePath(state.cwd, file);
    const node = getNode(state.root, path);
    if (!node || node.type !== "file") return { output: "", error: `tail: cannot open '${file}' for reading: No such file or directory` };
    const lines = node.content.replace(/\n$/, "").split("\n");
    return { output: lines.slice(Math.max(0, lines.length - n)).join("\n") };
  },

  sort: (args, state) => {
    const reverse = args.includes("-r");
    const file = args.find((a) => !a.startsWith("-"));
    if (!file) return { output: "", error: "sort: missing operand" };
    const path = resolvePath(state.cwd, file);
    const node = getNode(state.root, path);
    if (!node || node.type !== "file") return { output: "", error: `sort: cannot read: ${file}: No such file or directory` };
    const lines = node.content.replace(/\n$/, "").split("\n").sort();
    if (reverse) lines.reverse();
    return { output: lines.join("\n") };
  },

  find: (args, state) => {
    const nameIndex = args.indexOf("-name");
    const namePattern = nameIndex !== -1 ? args[nameIndex + 1] : undefined;
    const positional = args.filter((a, i) => i !== nameIndex && i !== nameIndex + 1);
    const startArg = positional[0];
    const startPath = startArg ? resolvePath(state.cwd, startArg) : state.cwd;
    const startNode = getNode(state.root, startPath);
    if (!startNode) return { output: "", error: `find: '${startArg}': No such file or directory` };

    const results: string[] = [];
    function matchesPattern(name: string, pattern: string): boolean {
      if (!pattern.includes("*")) return name === pattern;
      const escaped = pattern.split("*").map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*");
      return new RegExp(`^${escaped}$`).test(name);
    }
    function walk(node: FSNode, path: string[]) {
      const matches = !namePattern || matchesPattern(node.name, namePattern);
      if (matches) results.push(pathToString(path));
      if (node.type === "dir") {
        for (const child of Object.values(node.children)) {
          walk(child, [...path, child.name]);
        }
      }
    }
    walk(startNode, startPath);
    return { output: results.join("\n") };
  },

  date: () => ({ output: new Date().toString() }),

  less: (args, state) => handlers.cat(args, state),

  man: (args) => {
    const topic = args[0];
    const entries: Record<string, string> = {
      ls: "ls [-a] [-l] [path] — list directory contents. -a shows hidden files, -l shows details.",
      cd: "cd [path] — change the working directory. No argument returns home.",
      cat: "cat <file> — print a file's contents to the terminal.",
      grep: "grep [-i] <pattern> <file> — print lines in a file matching a pattern.",
      head: "head [-n N] <file> — print the first N lines of a file (default 10).",
      tail: "tail [-n N] <file> — print the last N lines of a file (default 10).",
      find: "find [path] [-name pattern] — search for files/directories by name, supports * wildcards.",
    };
    if (!topic) return { output: "What manual page do you want?\nTry: man ls" };
    return { output: entries[topic] ?? `No manual entry for ${topic}` };
  },

  help: () => ({
    output:
      "Available commands:\n" +
      "  ls, cd, pwd, cat, less, echo, touch, mkdir, rm, mv, cp,\n" +
      "  grep, wc, head, tail, sort, find, date, chmod,\n" +
      "  whoami, history, clear, man, help\n\n" +
      "Try: ls -a, cat welcome.txt, find . -name \"*.txt\", man grep",
  }),
};

export function runCommand(rawInput: string, state: ShellState): CommandResult {
  const trimmed = rawInput.trim();
  if (!trimmed) return { output: "" };

  const tokens = (trimmed.match(/(?:[^\s"]+|"[^"]*")+/g) ?? []).map((tok) =>
    tok.startsWith('"') && tok.endsWith('"') && tok.length >= 2 ? tok.slice(1, -1) : tok
  );
  const [cmd, ...args] = tokens;
  if (!cmd) return { output: "" };

  const handler = handlers[cmd];
  if (!handler) {
    return { output: "", error: `${cmd}: command not found` };
  }
  return handler(args, state);
}

export const knownCommands = Object.keys(handlers);
