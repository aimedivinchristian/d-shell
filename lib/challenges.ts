import { getNode } from "@/lib/shell/filesystem";
import { ShellState } from "@/lib/shell/commands";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export interface Challenge {
  id: string;
  title: string;
  description: string;
  command: string; // the command family this teaches, shown as a small tag
  difficulty: Difficulty;
  /** Returns true once the learner's current shell state satisfies the goal. */
  verify: (state: ShellState) => boolean;
}

function ranCommand(state: ShellState, matcher: RegExp): boolean {
  return state.history.some((cmd) => matcher.test(cmd));
}

export const challenges: Challenge[] = [
  // ── Beginner ──────────────────────────────────────────────
  {
    id: "find-hidden-file",
    title: "Find the hidden file",
    description: "There's a file in your home directory that ls doesn't show by default. Reveal it.",
    command: "ls -a",
    difficulty: "beginner",
    verify: (state) => ranCommand(state, /^ls\s+.*-a/),
  },
  {
    id: "read-the-welcome",
    title: "Read the welcome note",
    description: "Print the contents of welcome.txt to the terminal without opening an editor.",
    command: "cat",
    difficulty: "beginner",
    verify: (state) => ranCommand(state, /^cat\s+.*welcome\.txt/),
  },
  {
    id: "make-a-directory",
    title: "Set up a workspace",
    description: "Create a new directory called scratch inside your home folder.",
    command: "mkdir",
    difficulty: "beginner",
    verify: (state) => {
      const node = getNode(state.root, ["home", "learner", "scratch"]);
      return !!node && node.type === "dir";
    },
  },
  {
    id: "write-a-file",
    title: "Leave yourself a note",
    description: "Create idea.txt inside projects/ containing a single line of text.",
    command: "echo >",
    difficulty: "beginner",
    verify: (state) => {
      const node = getNode(state.root, ["home", "learner", "projects", "idea.txt"]);
      return !!node && node.type === "file" && node.content.trim().length > 0;
    },
  },
  {
    id: "search-inside-a-file",
    title: "Search inside a file",
    description: "Find every line in notes.md that mentions the word 'idea'.",
    command: "grep",
    difficulty: "beginner",
    verify: (state) => ranCommand(state, /^grep\s+.*idea.*notes\.md/),
  },
  {
    id: "clean-up",
    title: "Clean up after yourself",
    description: "Remove the scratch directory you created earlier, contents and all.",
    command: "rm -r",
    difficulty: "beginner",
    verify: (state) => {
      const existedBefore = ranCommand(state, /^mkdir\s+.*scratch/);
      const node = getNode(state.root, ["home", "learner", "scratch"]);
      return existedBefore && !node && ranCommand(state, /^rm\s+.*-r/);
    },
  },

  // ── Intermediate ──────────────────────────────────────────
  {
    id: "peek-the-start",
    title: "Peek at the start of a log",
    description: "Print just the first 5 lines of logs/access.log.",
    command: "head",
    difficulty: "intermediate",
    verify: (state) => ranCommand(state, /^head\s+.*-n\s*5.*access\.log/),
  },
  {
    id: "peek-the-end",
    title: "Peek at the end of a log",
    description: "Print just the last 3 lines of logs/access.log.",
    command: "tail",
    difficulty: "intermediate",
    verify: (state) => ranCommand(state, /^tail\s+.*-n\s*3.*access\.log/),
  },
  {
    id: "count-the-lines",
    title: "Count log entries",
    description: "Use wc to count how many lines are in logs/access.log.",
    command: "wc",
    difficulty: "intermediate",
    verify: (state) => ranCommand(state, /^wc\s+.*access\.log/),
  },
  {
    id: "sort-the-log",
    title: "Sort a file's contents",
    description: "Print logs/access.log sorted alphabetically.",
    command: "sort",
    difficulty: "intermediate",
    verify: (state) => ranCommand(state, /^sort\s+(?!.*-r).*access\.log/),
  },
  {
    id: "copy-a-report",
    title: "Duplicate a file",
    description: "Copy archive/report-jan.txt to a new file called report-jan-backup.txt in the same folder.",
    command: "cp",
    difficulty: "intermediate",
    verify: (state) => {
      const original = getNode(state.root, ["home", "learner", "archive", "report-jan.txt"]);
      const copy = getNode(state.root, ["home", "learner", "archive", "report-jan-backup.txt"]);
      return !!original && !!copy && copy.type === "file" && original.type === "file" && copy.content === original.content;
    },
  },
  {
    id: "rename-a-draft",
    title: "Rename a file",
    description: "Rename archive/drafts/outline.md to archive/drafts/final.md.",
    command: "mv",
    difficulty: "intermediate",
    verify: (state) => {
      const oldNode = getNode(state.root, ["home", "learner", "archive", "drafts", "outline.md"]);
      const newNode = getNode(state.root, ["home", "learner", "archive", "drafts", "final.md"]);
      return !oldNode && !!newNode && newNode.type === "file";
    },
  },

  // ── Advanced ──────────────────────────────────────────────
  {
    id: "find-all-reports",
    title: "Find files by pattern",
    description: "Use find with a wildcard to locate every .txt file under archive/.",
    command: "find -name",
    difficulty: "advanced",
    verify: (state) => ranCommand(state, /^find\s+.*archive.*-name\s+.*\*\.txt/),
  },
  {
    id: "case-insensitive-search",
    title: "Search without case sensitivity",
    description: "grep for the word \"get\" in logs/access.log, ignoring case, so it also matches GET.",
    command: "grep -i",
    difficulty: "advanced",
    verify: (state) => ranCommand(state, /^grep\s+.*-i.*get.*access\.log/i),
  },
  {
    id: "reverse-sort-errors",
    title: "Reverse-sort a file",
    description: "Print logs/access.log sorted in reverse alphabetical order.",
    command: "sort -r",
    difficulty: "advanced",
    verify: (state) => ranCommand(state, /^sort\s+.*-r.*access\.log/),
  },
  {
    id: "check-your-past",
    title: "Review your command history",
    description: "You've run a lot of commands by now — pull up your full history.",
    command: "history",
    difficulty: "advanced",
    verify: (state) => ranCommand(state, /^history\s*$/) && state.history.length >= 10,
  },
  {
    id: "build-and-verify",
    title: "Multi-step: build a structure and confirm it",
    description: "Create nested directories project/src, then list project/ with details to confirm it.",
    command: "mkdir -p / ls -l",
    difficulty: "advanced",
    verify: (state) => {
      const node = getNode(state.root, ["home", "learner", "project", "src"]);
      const listedAfter = ranCommand(state, /^ls\s+.*-l.*project/);
      return !!node && node.type === "dir" && listedAfter;
    },
  },
];

/** Resolve which challenge IDs are currently complete against a live shell state. */
export function getCompletedChallengeIds(state: ShellState): Set<string> {
  const completed = new Set<string>();
  for (const c of challenges) {
    if (c.verify(state)) completed.add(c.id);
  }
  return completed;
}
