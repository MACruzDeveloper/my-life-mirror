import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import { useTranslation } from "react-i18next";

const INTERVIEW_STEPS = ["intro", "categories", "questions"] as const;
export type InterviewStep = (typeof INTERVIEW_STEPS)[number];

const STEP_LABEL_KEYS: Record<InterviewStep, string> = {
  intro: "entrevista.pasoIntro",
  categories: "entrevista.pasoCategorias",
  questions: "entrevista.pasoPreguntas",
};

/** UX-07: dónde está el usuario en su primera entrevista (introducción → categorías → preguntas). */
export function InterviewSteps({ active }: { active: InterviewStep }) {
  const { t } = useTranslation();
  const activeIndex = INTERVIEW_STEPS.indexOf(active);

  return (
    <Stepper activeStep={activeIndex} aria-label={t("entrevista.pasosAria")} sx={{ "& .MuiStepLabel-label": { fontSize: { xs: "0.8rem", sm: "0.875rem" } } }}>
      {INTERVIEW_STEPS.map((step, index) => (
        <Step key={step} completed={index < activeIndex} aria-current={index === activeIndex ? "step" : undefined}>
          <StepLabel>{t(STEP_LABEL_KEYS[step])}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
}
