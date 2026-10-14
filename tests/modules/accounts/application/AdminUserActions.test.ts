import { checkPassword } from "@modules/accounts/domain/passwordPolicy";
import { describe, expect, it } from "vitest";
import { InMemoryEventRepository } from "@modules/agenda/infrastructure/InMemoryEventRepository";
import { InMemoryTripRepository } from "@modules/agenda/infrastructure/InMemoryTripRepository";
import { InMemoryIdeaReactionRepository } from "@modules/recommendations/infrastructure/InMemoryIdeaReactionRepository";
import { InMemoryPersonalizedIdeaRepository } from "@modules/recommendations/infrastructure/InMemoryPersonalizedIdeaRepository";
import { InMemoryExperienceRepository } from "@modules/assessments/infrastructure/InMemoryExperienceRepository";
import { createAdminUserActions } from "@modules/accounts/application/AdminUserActions";
import { createRegisterUser } from "@modules/accounts/application/RegisterUser";
import { createUpdateProfile } from "@modules/accounts/application/UpdateProfile";
import { InMemoryAdminAuditRepository } from "@modules/accounts/infrastructure/InMemoryAdminAuditRepository";
import { InMemoryAuthProvider } from "@modules/accounts/infrastructure/InMemoryAuthProvider";
import { InMemoryProfileRepository } from "@modules/accounts/infrastructure/InMemoryProfileRepository";
import { InMemoryAssessmentRepository } from "@modules/assessments/infrastructure/InMemoryAssessmentRepository";
import { InMemoryCategoryRepository } from "@modules/categories/infrastructure/InMemoryCategoryRepository";
import { InMemoryRecommendationRepository } from "@modules/recommendations/infrastructure/InMemoryRecommendationRepository";
import { InMemoryConsentRepository } from "@modules/consent/infrastructure/InMemoryConsentRepository";
import { AuthenticationError, ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@shared/domain/DomainError";
import type { Clock } from "@shared/domain/Clock";

const clock: Clock = { now: () => new Date("2026-09-20T12:00:00Z") };

async function setup() {
  const authProvider = new InMemoryAuthProvider();
  const profileRepository = new InMemoryProfileRepository();
  const categoryRepository = new InMemoryCategoryRepository();
  const consentRepository = new InMemoryConsentRepository();
  const assessmentRepository = new InMemoryAssessmentRepository();
  const recommendationRepository = new InMemoryRecommendationRepository();
  const auditRepository = new InMemoryAdminAuditRepository();
  const updateProfile = createUpdateProfile(profileRepository);

  const admin = { ...(await authProvider.register("admin@ejemplo.com", "adminpass1")), rol: "admin" as const };
  authProvider.assignRoleForTest("admin@ejemplo.com", "admin");
  const ana = await authProvider.register("ana@ejemplo.com", "Bici-Azul-Lluvia-47");
  await updateProfile({ userId: ana.id, name: "Ana" });
  await assessmentRepository.saveMany([{ id: "a1", userId: ana.id, categoryId: "c1", score: 5, recordedAt: new Date() }]);

  const actions = createAdminUserActions({
    authProvider,
    profileRepository,
    categoryRepository,
    consentRepository,
    assessmentRepository,
    recommendationRepository,
    personalizedIdeaRepository: new InMemoryPersonalizedIdeaRepository(),
    ideaReactionRepository: new InMemoryIdeaReactionRepository(),
    eventRepository: new InMemoryEventRepository(),
    tripRepository: new InMemoryTripRepository(),
    experienceRepository: new InMemoryExperienceRepository(),
    auditRepository,
    registerUser: createRegisterUser(authProvider, updateProfile),
    updateProfile,
    clock: clock,
  });
  return { actions: actions, authProvider, profileRepository, assessmentRepository, auditRepository, admin, ana };
}

async function recordedActions(auditRepository: InMemoryAdminAuditRepository) {
  return (await auditRepository.findRecent(50)).map((e) => e.action);
}

describe("Gestión de usuarios por el admin (ADM-03)", () => {
  describe("control de acceso", () => {
    it("un usuario no admin recibe Forbidden en todas las operaciones y no cambia nada", async () => {
      const { actions, ana, admin, authProvider } = await setup();
      const noAdmin = { ...ana, rol: "usuario" as const };

      const results = [
        await actions.changeRole({ actor: noAdmin, userId: admin.id, rol: "usuario", password: "Bici-Azul-Lluvia-47" }),
        await actions.suspendUser({ actor: noAdmin, userId: admin.id, password: "Bici-Azul-Lluvia-47" }),
        await actions.reactivateUser({ actor: noAdmin, userId: ana.id }),
        await actions.deleteUser({ actor: noAdmin, userId: admin.id, password: "Bici-Azul-Lluvia-47" }),
        await actions.updateEmail({ actor: noAdmin, userId: admin.id, email: "x@y.zz", password: "Bici-Azul-Lluvia-47" }),
        await actions.updateName({ actor: noAdmin, userId: admin.id, name: "X" }),
        await actions.createUser({ actor: noAdmin, email: "nuevo@ejemplo.com", name: "N" }),
        await actions.sendRecoveryLink({ actor: noAdmin, userId: admin.id }),
        await actions.listAudit(noAdmin),
      ];

      for (const r of results) {
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error).toBeInstanceOf(ForbiddenError);
      }
      const users = await authProvider.listAllUsers();
      expect(users.find((u) => u.id === admin.id)?.rol).toBe("admin");
    });
  });

  describe("confirmación con la contraseña del admin", () => {
    it("una contraseña incorrecta se rechaza, no cambia nada y queda anotado el intento", async () => {
      const { actions, admin, ana, authProvider, auditRepository } = await setup();

      const r = await actions.suspendUser({ actor: admin, userId: ana.id, password: "equivocada" });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBeInstanceOf(AuthenticationError);
      expect((await authProvider.listAllUsers()).find((u) => u.id === ana.id)?.suspendido).toBe(false);
      expect(await recordedActions(auditRepository)).toContain("reauth.failed");
    });

    it("una contraseña vacía es un error de validación", async () => {
      const { actions, admin, ana } = await setup();

      const r = await actions.deleteUser({ actor: admin, userId: ana.id, password: "" });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBeInstanceOf(ValidationError);
    });
  });

  describe("cambiar el rol", () => {
    it("cambia el rol y lo anota (sin contenido personal)", async () => {
      const { actions, admin, ana, authProvider, auditRepository } = await setup();

      const r = await actions.changeRole({ actor: admin, userId: ana.id, rol: "premium", password: "adminpass1" });

      expect(r.ok).toBe(true);
      expect((await authProvider.listAllUsers()).find((u) => u.id === ana.id)?.rol).toBe("premium");
      const [entry] = await auditRepository.findRecent(1);
      expect(entry).toMatchObject({ actorId: admin.id, action: "role.changed", targetId: ana.id, detail: "usuario->premium" });
    });

    it("rechaza un rol que no existe", async () => {
      const { actions, admin, ana } = await setup();

      const r = await actions.changeRole({ actor: admin, userId: ana.id, rol: "superadmin" as never, password: "adminpass1" });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBeInstanceOf(ValidationError);
    });

    it("un admin no puede cambiarse el rol a sí mismo (siempre debe quedar un administrador)", async () => {
      const { actions, admin, authProvider } = await setup();

      const r = await actions.changeRole({ actor: admin, userId: admin.id, rol: "usuario", password: "adminpass1" });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBeInstanceOf(ConflictError);
      expect((await authProvider.listAllUsers()).find((u) => u.id === admin.id)?.rol).toBe("admin");
    });

    it("un usuario inexistente da NotFound", async () => {
      const { actions, admin } = await setup();

      const r = await actions.changeRole({ actor: admin, userId: "no-existe", rol: "premium", password: "adminpass1" });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBeInstanceOf(NotFoundError);
    });

    it("un admin puede degradar a otro admin (queda el suyo)", async () => {
      const { actions, admin, ana, authProvider } = await setup();
      authProvider.assignRoleForTest("ana@ejemplo.com", "admin");

      const r = await actions.changeRole({ actor: admin, userId: ana.id, rol: "usuario", password: "adminpass1" });

      expect(r.ok).toBe(true);
    });
  });

  describe("suspender y reactivar", () => {
    it("suspender bloquea el inicio de sesión y la sesión abierta; reactivar lo devuelve todo", async () => {
      const { actions, admin, ana, authProvider } = await setup();
      const session = await authProvider.logIn("ana@ejemplo.com", "Bici-Azul-Lluvia-47");

      const suspended = await actions.suspendUser({ actor: admin, userId: ana.id, password: "adminpass1" });

      expect(suspended.ok).toBe(true);
      await expect(authProvider.logIn("ana@ejemplo.com", "Bici-Azul-Lluvia-47")).rejects.toBeInstanceOf(AuthenticationError);
      await expect(authProvider.verifySession(session.token)).rejects.toBeInstanceOf(AuthenticationError);

      const reactivated = await actions.reactivateUser({ actor: admin, userId: ana.id });

      expect(reactivated.ok).toBe(true);
      await expect(authProvider.logIn("ana@ejemplo.com", "Bici-Azul-Lluvia-47")).resolves.toBeDefined();
    });

    it("no se puede suspender a un administrador ni a uno mismo", async () => {
      const { actions, admin, ana, authProvider } = await setup();
      authProvider.assignRoleForTest("ana@ejemplo.com", "admin");

      const toOtherAdmin = await actions.suspendUser({ actor: admin, userId: ana.id, password: "adminpass1" });
      const toSelf = await actions.suspendUser({ actor: admin, userId: admin.id, password: "adminpass1" });

      for (const r of [toOtherAdmin, toSelf]) {
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error).toBeInstanceOf(ConflictError);
      }
    });
  });

  describe("eliminar a otro usuario", () => {
    it("borra sus datos y su cuenta, con la contraseña del admin, y anota solo el id", async () => {
      const { actions, admin, ana, authProvider, profileRepository, assessmentRepository, auditRepository } = await setup();

      const r = await actions.deleteUser({ actor: admin, userId: ana.id, password: "adminpass1" });

      expect(r.ok).toBe(true);
      expect(await profileRepository.findByUserId(ana.id)).toBeUndefined();
      expect(await assessmentRepository.findByUserId(ana.id)).toEqual([]);
      expect((await authProvider.listAllUsers()).some((u) => u.id === ana.id)).toBe(false);
      const [entry] = await auditRepository.findRecent(1);
      expect(entry).toMatchObject({ action: "user.deleted", targetId: ana.id });
      expect(JSON.stringify(entry)).not.toContain("ana@ejemplo.com");
    });

    it("no se puede eliminar a un administrador (hay que degradarlo antes) ni a uno mismo por esta vía", async () => {
      const { actions, admin, ana, authProvider } = await setup();
      authProvider.assignRoleForTest("ana@ejemplo.com", "admin");

      const toOtherAdmin = await actions.deleteUser({ actor: admin, userId: ana.id, password: "adminpass1" });
      const toSelf = await actions.deleteUser({ actor: admin, userId: admin.id, password: "adminpass1" });

      for (const r of [toOtherAdmin, toSelf]) {
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error).toBeInstanceOf(ConflictError);
      }
      expect((await authProvider.listAllUsers()).some((u) => u.id === ana.id)).toBe(true);
    });
  });

  describe("crear un usuario", () => {
    it("crea la cuenta con rol usuario, su perfil y una contraseña temporal que solo se devuelve una vez", async () => {
      const { actions, admin, authProvider, profileRepository } = await setup();

      const r = await actions.createUser({ actor: admin, email: " Nuevo@Ejemplo.com ", name: "Nuria" });

      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.value.email).toBe("nuevo@ejemplo.com");
      // SEC-01: la contraseña temporal cumple la misma política que la de cualquier registro.
      expect(checkPassword(r.value.temporaryPassword)).toEqual([]);
      expect((await profileRepository.findByUserId(r.value.id))?.name).toBe("Nuria");
      expect((await authProvider.listAllUsers()).find((u) => u.id === r.value.id)?.rol).toBe("usuario");
      await expect(authProvider.logIn("nuevo@ejemplo.com", r.value.temporaryPassword)).resolves.toBeDefined();
    });

    it("cada contraseña temporal es distinta", async () => {
      const { actions, admin } = await setup();

      const a = await actions.createUser({ actor: admin, email: "a1@ejemplo.com", name: "A" });
      const b = await actions.createUser({ actor: admin, email: "b1@ejemplo.com", name: "B" });

      expect(a.ok && b.ok && a.value.temporaryPassword !== b.value.temporaryPassword).toBe(true);
    });

    it("rechaza un email ya registrado y un email o nombre inválidos", async () => {
      const { actions, admin } = await setup();

      const duplicate = await actions.createUser({ actor: admin, email: "ana@ejemplo.com", name: "Otra Ana" });
      const badEmail = await actions.createUser({ actor: admin, email: "no-es-email", name: "X" });
      const noName = await actions.createUser({ actor: admin, email: "z@ejemplo.com", name: "  " });

      expect(!duplicate.ok && duplicate.error).toBeInstanceOf(ConflictError);
      expect(!badEmail.ok && badEmail.error).toBeInstanceOf(ValidationError);
      expect(!noName.ok && noName.error).toBeInstanceOf(ValidationError);
    });

    it("la anotación de auditoría no incluye la contraseña", async () => {
      const { actions, admin, auditRepository } = await setup();

      const r = await actions.createUser({ actor: admin, email: "nuevo@ejemplo.com", name: "Nuria" });

      const text = JSON.stringify(await auditRepository.findRecent(10));
      expect(text).toContain("user.created");
      expect(r.ok && text.includes(r.value.temporaryPassword)).toBe(false);
    });
  });

  describe("modificar email y nombre, y enviar el enlace de recuperación", () => {
    it("cambia el email (con contraseña) y lo anota sin guardar los emails", async () => {
      const { actions, admin, ana, authProvider, auditRepository } = await setup();

      const r = await actions.updateEmail({ actor: admin, userId: ana.id, email: "ana.nueva@ejemplo.com", password: "adminpass1" });

      expect(r.ok).toBe(true);
      await expect(authProvider.logIn("ana.nueva@ejemplo.com", "Bici-Azul-Lluvia-47")).resolves.toBeDefined();
      const [entry] = await auditRepository.findRecent(1);
      expect(entry.action).toBe("user.email.changed");
      expect(JSON.stringify(entry)).not.toContain("ejemplo.com");
    });

    it("rechaza un email inválido o ya en uso", async () => {
      const { actions, admin, ana } = await setup();

      const malo = await actions.updateEmail({ actor: admin, userId: ana.id, email: "malo", password: "adminpass1" });
      const inUse = await actions.updateEmail({ actor: admin, userId: ana.id, email: "admin@ejemplo.com", password: "adminpass1" });

      expect(!malo.ok && malo.error).toBeInstanceOf(ValidationError);
      expect(!inUse.ok && inUse.error).toBeInstanceOf(ConflictError);
    });

    it("cambia el nombre (sin contraseña) y rechaza uno vacío", async () => {
      const { actions, admin, ana, profileRepository } = await setup();

      const ok = await actions.updateName({ actor: admin, userId: ana.id, name: " Ana María " });
      const empty = await actions.updateName({ actor: admin, userId: ana.id, name: " " });

      expect(ok.ok).toBe(true);
      expect((await profileRepository.findByUserId(ana.id))?.name).toBe("Ana María");
      expect(!empty.ok && empty.error).toBeInstanceOf(ValidationError);
    });

    it("envía el enlace de recuperación y lo anota", async () => {
      const { actions, admin, ana, authProvider, auditRepository } = await setup();

      const r = await actions.sendRecoveryLink({ actor: admin, userId: ana.id });

      expect(r.ok).toBe(true);
      expect(authProvider.resetTokenForTest("ana@ejemplo.com")).toBeDefined();
      expect(await recordedActions(auditRepository)).toContain("user.recovery.sent");
    });
  });

  describe("auditoría", () => {
    it("el admin lista las anotaciones, la más reciente primero", async () => {
      const { actions, admin, ana } = await setup();
      await actions.reactivateUser({ actor: admin, userId: ana.id });
      await actions.sendRecoveryLink({ actor: admin, userId: ana.id });

      const r = await actions.listAudit(admin);

      expect(r.ok && r.value.map((e) => e.action)).toEqual(["user.recovery.sent", "user.reactivated"]);
    });
  });
});
