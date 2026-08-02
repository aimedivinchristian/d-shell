export type TypingMode = "commands" | "words";

// Common English words — classic typing-test pool, deliberately short/common
// so the test measures typing speed, not vocabulary.
const WORD_POOL = [
  "the", "of", "and", "to", "a", "in", "is", "you", "that", "it",
  "he", "was", "for", "on", "are", "with", "as", "his", "they", "at",
  "be", "this", "have", "from", "or", "one", "had", "by", "word", "but",
  "not", "what", "all", "were", "we", "when", "your", "can", "said", "there",
  "use", "each", "which", "she", "do", "how", "their", "if", "will", "up",
  "other", "about", "out", "many", "then", "them", "these", "so", "some", "her",
  "would", "make", "like", "him", "into", "time", "has", "look", "two", "more",
  "write", "go", "see", "number", "no", "way", "could", "people", "than", "first",
  "water", "been", "call", "who", "its", "now", "find", "long", "down", "day",
  "did", "get", "come", "made", "may", "part", "over", "new", "sound", "take",
];

// Realistic shell command fragments — the whole point of this mode is
// building muscle memory for syntax you'd actually type in D>shell or a
// real terminal: flags, quoting, paths, pipes.
const COMMAND_POOL = [
  "ls -la",
  "cd ..",
  "cd ~/projects",
  "cat welcome.txt",
  "grep -i error log.txt",
  "grep -r \"TODO\" .",
  "mkdir -p src/components",
  "rm -rf node_modules",
  "cp file.txt backup.txt",
  "mv draft.md final.md",
  "touch index.js",
  "pwd",
  "echo \"hello world\"",
  "head -n 10 access.log",
  "tail -f server.log",
  "find . -name \"*.ts\"",
  "wc -l file.txt",
  "sort -r data.csv",
  "chmod +x script.sh",
  "history | grep git",
  "man grep",
  "whoami",
  "date",
  "clear",
  "ls -a | grep hidden",
];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/** Generates a space-joined token list for the typing test — either whole
 *  command fragments (each fragment is one "word" the user types including
 *  its internal spaces) or plain individual words. */
export function generateTypingContent(mode: TypingMode, tokenCount: number): string[] {
  const pool = mode === "commands" ? COMMAND_POOL : WORD_POOL;
  const tokens: string[] = [];
  while (tokens.length < tokenCount) {
    tokens.push(...shuffle(pool));
  }
  return tokens.slice(0, tokenCount);
}
