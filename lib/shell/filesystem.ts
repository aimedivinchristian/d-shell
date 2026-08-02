// A real in-memory POSIX-like filesystem tree.
// Every node is either a file (has content) or a directory (has children).

export type FSNode = FileNode | DirNode;

export interface FileNode {
  type: "file";
  name: string;
  content: string;
  permissions: string; // e.g. "-rw-r--r--"
  createdAt: number;
  modifiedAt: number;
}

export interface DirNode {
  type: "dir";
  name: string;
  children: Record<string, FSNode>;
  permissions: string; // e.g. "drwxr-xr-x"
  createdAt: number;
  modifiedAt: number;
}

export function makeFile(name: string, content = "", permissions = "-rw-r--r--"): FileNode {
  const now = Date.now();
  return { type: "file", name, content, permissions, createdAt: now, modifiedAt: now };
}

export function makeDir(name: string, permissions = "drwxr-xr-x"): DirNode {
  const now = Date.now();
  return { type: "dir", name, children: {}, permissions, createdAt: now, modifiedAt: now };
}

/** Builds the starter filesystem a learner drops into. */
export function createInitialFilesystem(): DirNode {
  const root = makeDir("");

  const home = makeDir("home");
  const user = makeDir("learner");

  user.children["welcome.txt"] = makeFile(
    "welcome.txt",
    "Welcome to D>shell.\n\nThis is a real filesystem, running entirely in your browser.\nTry: ls, cat welcome.txt, cd projects\n"
  );

  const projects = makeDir("projects");
  projects.children["notes.md"] = makeFile(
    "notes.md",
    "# Notes\n\nNothing here yet. Try creating a file with: touch idea.txt\n"
  );
  const secretDir = makeDir(".hidden");
  secretDir.children["secret.txt"] = makeFile(
    "secret.txt",
    "You found a hidden file. Hidden files start with a dot — try `ls -a`.\n"
  );

  user.children["projects"] = projects;
  user.children[".hidden"] = secretDir;

  home.children["learner"] = user;
  root.children["home"] = home;

  const etc = makeDir("etc");
  etc.children["motd"] = makeFile("motd", "Message of the day: real commands, real filesystem, zero servers.\n");
  root.children["etc"] = etc;

  root.children["tmp"] = makeDir("tmp");

  // Richer content for intermediate/advanced challenges — additive, doesn't
  // touch the paths beginner challenges already depend on.
  const logs = makeDir("logs");
  logs.children["access.log"] = makeFile(
    "access.log",
    [
      "10:01:02 GET /home 200",
      "10:01:04 GET /about 200",
      "10:01:09 POST /login 401",
      "10:02:15 GET /home 200",
      "10:02:47 GET /pricing 200",
      "10:03:01 POST /login 200",
      "10:03:22 GET /dashboard 200",
      "10:04:10 GET /dashboard 500",
      "10:05:00 GET /home 200",
      "10:05:31 DELETE /account 403",
    ].join("\n") + "\n"
  );
  user.children["logs"] = logs;

  const archive = makeDir("archive");
  archive.children["report-jan.txt"] = makeFile("report-jan.txt", "January summary.\nRevenue up slightly.\n");
  archive.children["report-feb.txt"] = makeFile("report-feb.txt", "February summary.\nRevenue flat.\n");
  const drafts = makeDir("drafts");
  drafts.children["outline.md"] = makeFile("outline.md", "# Outline\n\nTBD.\n");
  archive.children["drafts"] = drafts;
  user.children["archive"] = archive;

  return root;
}

/** Resolves a path (absolute or relative) against a cwd into a normalized absolute segment array. */
export function resolvePath(cwd: string[], input: string): string[] {
  const isAbsolute = input.startsWith("/");
  const parts = input.split("/").filter(Boolean);
  const stack = isAbsolute ? [] : [...cwd];

  for (const part of parts) {
    if (part === ".") continue;
    else if (part === "..") stack.pop();
    else stack.push(part);
  }
  return stack;
}

export function getNode(root: DirNode, path: string[]): FSNode | null {
  let node: FSNode = root;
  for (const segment of path) {
    if (node.type !== "dir") return null;
    const nextNode: FSNode | undefined = node.children[segment];
    if (!nextNode) return null;
    node = nextNode;
  }
  return node;
}

export function getParentAndName(root: DirNode, path: string[]): { parent: DirNode | null; name: string } {
  if (path.length === 0) return { parent: null, name: "" };
  const parentPath = path.slice(0, -1);
  const name = path[path.length - 1];
  const parent = getNode(root, parentPath);
  if (!parent || parent.type !== "dir") return { parent: null, name };
  return { parent, name };
}

export function pathToString(path: string[]): string {
  return "/" + path.join("/");
}
