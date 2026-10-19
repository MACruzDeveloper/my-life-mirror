import { randomUUID } from "node:crypto";
import type { Result } from "#shared/domain/Result.js";
import { CURRENT_POLICY_VERSION } from "#modules/consent/domain/CurrentPolicy.js";
import { Password } from "#modules/accounts/domain/Password.js";
import type { AppContext } from "#shared/infrastructure/container.js";
import data from "./demoAccount.json" with { type: "json" };

export interface DemoCredentials {
  email: string;
  password: string;
}

export interface SeedSummary {
  demoUserId: string;
  donorUserId: string;
  assessments: number;
  experiences: number;
  sharedExperiences: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

interface CategorySeed {
  key: string;
  pastScores?: number[];
  current: number;
  helps?: string[];
  difficulties?: string[];
  experiences?: { daysAgo: number; text: string }[];
  shared?: { locale: string; text: string }[];
}

/** Un fallo al sembrar es un fallo del script, no del usuario: se corta con el motivo. */
function ensure<T>(result: Result<T, { message: string }>, what: string): T {
  if (!result.ok) throw new Error(`No se pudo ${what}: ${result.error.message}`);
  return result.value;
}

/** El mismo día, `months` meses antes (a media mañana, para que no baile de día con la zona horaria). */
function monthsAgo(now: Date, months: number): Date {
  const date = new Date(now);
  date.setUTCMonth(date.getUTCMonth() - months);
  date.setUTCHours(10, 0, 0, 0);
  return date;
}

/**
 * TFM-01: crea (o restaura) la cuenta de prueba de la entrega y la cuenta "otra
 * persona" que comparte experiencias con ella. Borra solo esas dos cuentas, por
 * su email exacto, y las vuelve a crear con el contenido de `demoAccount.json`.
 * Usa los casos de uso de la app (activar, puntuar, marcar, compartir), así que
 * lo sembrado cumple las mismas reglas que lo que haría una persona; solo el
 * historial y las fechas del diario se escriben directamente, para poder fecharlos
 * en el pasado.
 */
export async function seedDemoAccount(context: AppContext, credentials: DemoCredentials): Promise<SeedSummary> {
  const email = credentials.email.trim().toLowerCase();
  // Tiene rol de administración (TFM-01 v1.1): su contraseña, que se entrega en privado, cumple la
  // política de contraseñas como cualquier otra. Se comprueba antes de borrar nada.
  const password = Password.create(credentials.password, { email, name: data.demo.name });
  if (!password.ok) throw new Error(`La contraseña de la cuenta de prueba no cumple la política de contraseñas (${password.error.rules.join(", ")})`);
  const now = context.clock.now();
  const donorEmail = data.donor.email;

  // Restaurar = borrar las dos cuentas (y solo esas) con todos sus datos.
  for (const user of await context.authProvider.listAllUsers()) {
    if (user.email.toLowerCase() === email || user.email.toLowerCase() === donorEmail) await context.eraseUser(user.id);
  }

  let assessments = 0;
  let experiences = 0;
  let sharedExperiences = 0;

  async function seedUser(userEmail: string, password: string, name: string, categories: CategorySeed[]): Promise<string> {
    // Directo al proveedor, sin el caso de uso de registro: la contraseña de la cuenta de
    // prueba ya se comprobó con la política al empezar, y la de "otra persona" es aleatoria.
    const user = await context.authProvider.register(userEmail, password);
    ensure(await context.updateProfile({ userId: user.id, name }), `guardar el perfil de ${userEmail}`);
    const own = ensure(await context.listCategories(user.id), "listar las categorías");
    const catalog = await context.categoryCatalogRepository.findAll();
    const categoryOf = (key: string) => {
      const category = own.find((candidate) => candidate.catalogId === catalog.find((entry) => entry.key === key)?.id);
      if (!category) throw new Error(`No existe la categoría "${key}" en el catálogo`);
      return category;
    };

    for (const seed of categories) {
      const category = categoryOf(seed.key);
      ensure(await context.activateCategory({ userId: user.id, categoryId: category.id, policyVersion: CURRENT_POLICY_VERSION }), `activar ${seed.key}`);
      // Antes de puntuar: las ideas que se abran ya respetan lo que se le pone difícil (RF-42).
      if (seed.helps?.length) ensure(await context.setCategoryExperience({ userId: user.id, categoryId: category.id, tags: seed.helps }), `marcar qué ayuda en ${seed.key}`);
      if (seed.difficulties?.length) ensure(await context.setCategoryDifficulties({ userId: user.id, categoryId: category.id, tags: seed.difficulties }), `marcar qué lo pone difícil en ${seed.key}`);

      const past = (seed.pastScores ?? []).map((score, index, all) => ({ id: randomUUID(), userId: user.id, categoryId: category.id, score, recordedAt: monthsAgo(now, all.length - index) }));
      await context.assessmentRepository.saveMany(past);
      assessments += past.length;
    }

    // La evaluación de hoy, por el caso de uso: abre las ideas de las áreas bajas (RF-18).
    ensure(await context.recordAssessments({ userId: user.id, entries: categories.map((seed) => ({ categoryId: categoryOf(seed.key).id, score: seed.current })) }), "guardar la evaluación de hoy");
    assessments += categories.length;

    for (const seed of categories) {
      const category = categoryOf(seed.key);
      for (const entry of seed.experiences ?? []) {
        await context.experienceRepository.save({ id: randomUUID(), userId: user.id, categoryId: category.id, text: entry.text, createdAt: new Date(now.getTime() - entry.daysAgo * DAY_MS) });
        experiences += 1;
      }
      for (const entry of seed.shared ?? []) {
        const experience = ensure(await context.addExperience({ userId: user.id, categoryId: category.id, text: entry.text }), `añadir una experiencia en ${seed.key}`);
        ensure(await context.shareExperience({ userId: user.id, experienceId: experience.id, locale: entry.locale }), `compartir "${entry.text.slice(0, 30)}…"`);
        sharedExperiences += 1;
      }
    }
    return user.id;
  }

  const demoUserId = await seedUser(email, credentials.password, data.demo.name, data.demo.categories);
  // Para que quien evalúa vea también el panel de administración (decisión del autor del 19 oct.).
  await context.authProvider.changeRole(demoUserId, "admin");
  ensure(await context.setAiIdeas({ userId: demoUserId, enabled: true }), "activar las ideas con IA");
  ensure(await context.setAiSuggestions({ userId: demoUserId, enabled: true }), "activar las sugerencias con IA");

  // La contraseña de "otra persona" no la conoce nadie: solo existe para que sus experiencias compartidas se vean.
  const donorUserId = await seedUser(donorEmail, `${randomUUID()}${randomUUID()}`, data.donor.name, data.donor.categories);

  return { demoUserId, donorUserId, assessments, experiences, sharedExperiences };
}
