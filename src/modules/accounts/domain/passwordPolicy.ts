import commonPasswords from "./catalog/commonPasswords.json" with { type: "json" };

/**
 * Requisitos de una contraseña nueva (SEC-01), en el orden en que se enseñan.
 * Los cinco primeros se ven siempre en el formulario; los tres últimos, solo
 * cuando fallan (no se pueden "cumplir" de antemano).
 */
export const PASSWORD_RULES = ["length", "lowercase", "uppercase", "digit", "symbol", "sequence", "common", "personal"] as const;
export type PasswordRule = (typeof PASSWORD_RULES)[number];

export const PASSWORD_MIN_LENGTH = 12;
/** Límite del algoritmo con que Supabase guarda las contraseñas (bcrypt), en bytes. */
export const PASSWORD_MAX_BYTES = 72;

/** Lo que la contraseña no debe contener: datos que cualquiera que conozca a la persona probaría primero. */
export interface PasswordContext {
  email?: string;
  name?: string;
}

const RUN_LENGTH = 4;
const REPEAT_LENGTH = 3;
const PERSONAL_MIN_LENGTH = 4;
const COMMON_WORD_MIN_LENGTH = 3;

const SEQUENCES = ["abcdefghijklmnopqrstuvwxyz", "0123456789", "qwertyuiop", "asdfghjkl", "zxcvbnm"];
const RUNS: ReadonlySet<string> = new Set(
  SEQUENCES.flatMap((sequence) => {
    const runs: string[] = [];
    for (let start = 0; start + RUN_LENGTH <= sequence.length; start++) {
      const run = sequence.slice(start, start + RUN_LENGTH);
      runs.push(run, [...run].reverse().join(""));
    }
    return runs;
  }),
);

/** Sustituciones típicas de letras por números o símbolos ("P4ssw0rd"). */
const LOOKALIKES: Record<string, string> = { "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t", "@": "a", $: "s", "!": "i" };
const COMMON: ReadonlySet<string> = new Set(commonPasswords);

/** Minúsculas y sin tildes: "López" y "lopez" son lo mismo para quien adivina. */
function fold(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

function hasSequence(folded: string): boolean {
  for (let start = 0; start + REPEAT_LENGTH <= folded.length; start++) {
    if ([...folded.slice(start, start + REPEAT_LENGTH)].every((char) => char === folded[start])) return true;
  }
  for (let start = 0; start + RUN_LENGTH <= folded.length; start++) {
    if (RUNS.has(folded.slice(start, start + RUN_LENGTH))) return true;
  }
  return false;
}

/**
 * ¿Es, en el fondo, una palabra de la lista? Se quitan los números y símbolos
 * de los extremos ("Password-2026!" → "password"), se deshacen las
 * sustituciones del interior ("P4ssw0rd" → "password") y se mira lo que queda:
 * entero, o palabra a palabra si todas son comunes ("Admin-Password-99!").
 */
function isCommon(folded: string): boolean {
  const core = folded.replace(/^[^a-z]+|[^a-z]+$/g, "");
  const plainWords = core.split(/[^a-z]+/).filter((word) => word.length >= COMMON_WORD_MIN_LENGTH);
  const decoded = [...core].map((char) => LOOKALIKES[char] ?? char).join("");
  const candidates = [core.replace(/[^a-z]/g, ""), decoded.replace(/[^a-z]/g, "")];
  if (candidates.some((candidate) => COMMON.has(candidate))) return true;
  return plainWords.length > 0 && plainWords.every((word) => COMMON.has(word));
}

function hasPersonalData(folded: string, context: PasswordContext): boolean {
  const sources = [context.name ?? "", (context.email ?? "").split("@")[0]];
  return sources
    .flatMap((source) => fold(source).split(/[^a-z0-9]+/))
    .some((piece) => piece.length >= PERSONAL_MIN_LENGTH && folded.includes(piece));
}

/**
 * Los requisitos que una contraseña nueva NO cumple (vacío = válida). Función
 * pura: la usan el Value Object `Password` en el servidor y los formularios de
 * registro y de cambio de contraseña, para explicar lo mismo que se exige.
 *
 * Por qué varias comprobaciones y no una expresión regular: exigir tipos de
 * caracteres no distingue "Test1234!" de una contraseña buena. La frenan la
 * longitud, la secuencia y que su palabra base es de las primeras que se prueban.
 */
export function checkPassword(password: string, context: PasswordContext = {}): PasswordRule[] {
  const folded = fold(password);
  const failed: Record<PasswordRule, boolean> = {
    length: password.length < PASSWORD_MIN_LENGTH || new TextEncoder().encode(password).length > PASSWORD_MAX_BYTES,
    lowercase: !/\p{Ll}/u.test(password),
    uppercase: !/\p{Lu}/u.test(password),
    digit: !/\p{Nd}/u.test(password),
    symbol: !/[^\p{L}\p{N}]/u.test(password),
    sequence: hasSequence(folded),
    common: isCommon(folded),
    personal: hasPersonalData(folded, context),
  };
  return PASSWORD_RULES.filter((rule) => failed[rule]);
}
