// ─── Logger console coloré ────────────────────────────────────────────────────

const C = {
  reset:  '\x1b[0m',
  green:  '\x1b[32m',
  red:    '\x1b[31m',
  yellow: '\x1b[33m',
  blue:   '\x1b[34m',
  cyan:   '\x1b[36m',
  gray:   '\x1b[90m',
  bold:   '\x1b[1m',
};

const ts = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

export const logger = {
  info: (msg: string) =>
    console.log(`${C.cyan}[INFO]${C.reset}  ${C.gray}${ts()}${C.reset}  ${msg}`),

  success: (msg: string) =>
    console.log(`${C.green}[OK]${C.reset}    ${C.gray}${ts()}${C.reset}  ${msg}`),

  warn: (msg: string) =>
    console.warn(`${C.yellow}[WARN]${C.reset}  ${C.gray}${ts()}${C.reset}  ${msg}`),

  error: (msg: string, err?: unknown) => {
    console.error(`${C.red}[ERROR]${C.reset} ${C.gray}${ts()}${C.reset}  ${msg}`);
    if (err instanceof Error) {
      console.error(`${C.red}  ↳ ${err.message}${C.reset}`);
    }
  },
};
