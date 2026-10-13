import { SHARE_MIN_SCORE } from "@modules/assessments/domain/Experience";

/** A partir de qué puntuación se felicita, y solo en categorías no sensibles. */
const CONGRATULATE_MIN_SCORE = 9;

export interface ScoreFeedback {
  /** "recognize": reconoce el momento, sin valorar. "congratulate": además felicita, con sobriedad. */
  tone: "recognize" | "congratulate";
  /** Si el mensaje invita a compartir de forma anónima (solo donde se puede, RF-43). */
  inviteToShare: boolean;
}

/**
 * UX-09: qué decir al guardar una puntuación alta. La app es "un espejo, no un examen": por
 * defecto reconoce el momento e invita a pensar qué está ayudando, sin poner nota a la persona.
 * La excepción, decidida por el autor: con 9 o 10 en una categoría no sensible, felicita. En
 * las sensibles nunca (ni felicita ni invita a compartir). Por debajo de 8 no dice nada: las
 * puntuaciones bajas ya tienen su idea.
 */
export function scoreFeedback({ score, isSensitive, canShare }: { score: number; isSensitive: boolean; canShare: boolean }): ScoreFeedback | undefined {
  if (score < SHARE_MIN_SCORE) return undefined;
  return { tone: !isSensitive && score >= CONGRATULATE_MIN_SCORE ? "congratulate" : "recognize", inviteToShare: !isSensitive && canShare };
}
