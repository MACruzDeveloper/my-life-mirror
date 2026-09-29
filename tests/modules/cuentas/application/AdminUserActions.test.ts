import { describe, expect, it } from "vitest";
import { createAdminUserActions } from "@modules/cuentas/application/AdminUserActions";
import { createRegisterUser } from "@modules/cuentas/application/RegisterUser";
import { createUpdateProfile } from "@modules/cuentas/application/UpdateProfile";
import { InMemoryAdminAuditRepository } from "@modules/cuentas/infrastructure/InMemoryAdminAuditRepository";
import { InMemoryAuthProvider } from "@modules/cuentas/infrastructure/InMemoryAuthProvider";
import { InMemoryProfileRepository } from "@modules/cuentas/infrastructure/InMemoryProfileRepository";
import { InMemoryAssessmentRepository } from "@modules/assessments/infrastructure/InMemoryAssessmentRepository";
import { InMemoryCategoryRepository } from "@modules/categories/infrastructure/InMemoryCategoryRepository";
import { InMemoryRecommendationRepository } from "@modules/recommendations/infrastructure/InMemoryRecommendationRepository";
import { InMemoryConsentimientoRepository } from "@modules/consentimiento/infrastructure/InMemoryConsentimientoRepository";
import { AuthenticationError, ConflictError, ForbiddenError, NotFoundError, ValidationError } from "@shared/domain/DomainError";
import type { Clock } from "@shared/domain/Clock";

const reloj: Clock = { now: () => new Date("2026-09-20T12:00:00Z") };

async function setup() {
  const authProvider = new InMemoryAuthProvider();
  const profileRepository = new InMemoryProfileRepository();
  const categoryRepository = new InMemoryCategoryRepository();
  const consentimientoRepository = new InMemoryConsentimientoRepository();
  const assessmentRepository = new InMemoryAssessmentRepository();
  const recommendationRepository = new InMemoryRecommendationRepository();
  const auditRepository = new InMemoryAdminAuditRepository();
  const updateProfile = createUpdateProfile(profileRepository);

  const admin = { ...(await authProvider.registrar("admin@ejemplo.com", "adminpass1")), rol: "admin" as const };
  authProvider.asignarRolParaTest("admin@ejemplo.com", "admin");
  const ana = await authProvider.registrar("ana@ejemplo.com", "12345678");
  await updateProfile({ userId: ana.id, name: "Ana" });
  await assessmentRepository.saveMany([{ id: "a1", userId: ana.id, categoryId: "c1", score: 5, recordedAt: new Date() }]);

  const acciones = createAdminUserActions({
    authProvider,
    profileRepository,
    categoryRepository,
    consentimientoRepository,
    assessmentRepository,
    recommendationRepository,
    auditRepository,
    registerUser: createRegisterUser(authProvider, updateProfile),
    updateProfile,
    clock: reloj,
  });
  return { acciones, authProvider, profileRepository, assessmentRepository, auditRepository, admin, ana };
}

async function accionesRegistradas(auditRepository: InMemoryAdminAuditRepository) {
  return (await auditRepository.findRecent(50)).map((e) => e.action);
}

describe("Gestión de usuarios por el admin (ADM-03)", () => {
  describe("control de acceso", () => {
    it("un usuario no admin recibe Forbidden en todas las operaciones y no cambia nada", async () => {
      const { acciones, ana, admin, authProvider } = await setup();
      const noAdmin = { ...ana, rol: "usuario" as const };

      const resultados = [
        await acciones.changeRole({ actor: noAdmin, userId: admin.id, rol: "usuario", password: "12345678" }),
        await acciones.suspendUser({ actor: noAdmin, userId: admin.id, password: "12345678" }),
        await acciones.reactivateUser({ actor: noAdmin, userId: ana.id }),
        await acciones.deleteUser({ actor: noAdmin, userId: admin.id, password: "12345678" }),
        await acciones.updateEmail({ actor: noAdmin, userId: admin.id, email: "x@y.zz", password: "12345678" }),
        await acciones.updateName({ actor: noAdmin, userId: admin.id, name: "X" }),
        await acciones.createUser({ actor: noAdmin, email: "nuevo@ejemplo.com", name: "N" }),
        await acciones.sendRecoveryLink({ actor: noAdmin, userId: admin.id }),
        await acciones.listAudit(noAdmin),
      ];

      for (const r of resultados) {
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error).toBeInstanceOf(ForbiddenError);
      }
      const usuarios = await authProvider.listarUsuarios();
      expect(usuarios.find((u) => u.id === admin.id)?.rol).toBe("admin");
    });
  });

  describe("confirmación con la contraseña del admin", () => {
    it("una contraseña incorrecta se rechaza, no cambia nada y queda anotado el intento", async () => {
      const { acciones, admin, ana, authProvider, auditRepository } = await setup();

      const r = await acciones.suspendUser({ actor: admin, userId: ana.id, password: "equivocada" });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBeInstanceOf(AuthenticationError);
      expect((await authProvider.listarUsuarios()).find((u) => u.id === ana.id)?.suspendido).toBe(false);
      expect(await accionesRegistradas(auditRepository)).toContain("reauth.failed");
    });

    it("una contraseña vacía es un error de validación", async () => {
      const { acciones, admin, ana } = await setup();

      const r = await acciones.deleteUser({ actor: admin, userId: ana.id, password: "" });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBeInstanceOf(ValidationError);
    });
  });

  describe("cambiar el rol", () => {
    it("cambia el rol y lo anota (sin contenido personal)", async () => {
      const { acciones, admin, ana, authProvider, auditRepository } = await setup();

      const r = await acciones.changeRole({ actor: admin, userId: ana.id, rol: "premium", password: "adminpass1" });

      expect(r.ok).toBe(true);
      expect((await authProvider.listarUsuarios()).find((u) => u.id === ana.id)?.rol).toBe("premium");
      const [entrada] = await auditRepository.findRecent(1);
      expect(entrada).toMatchObject({ actorId: admin.id, action: "role.changed", targetId: ana.id, detail: "usuario->premium" });
    });

    it("rechaza un rol que no existe", async () => {
      const { acciones, admin, ana } = await setup();

      const r = await acciones.changeRole({ actor: admin, userId: ana.id, rol: "superadmin" as never, password: "adminpass1" });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBeInstanceOf(ValidationError);
    });

    it("un admin no puede cambiarse el rol a sí mismo (siempre debe quedar un administrador)", async () => {
      const { acciones, admin, authProvider } = await setup();

      const r = await acciones.changeRole({ actor: admin, userId: admin.id, rol: "usuario", password: "adminpass1" });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBeInstanceOf(ConflictError);
      expect((await authProvider.listarUsuarios()).find((u) => u.id === admin.id)?.rol).toBe("admin");
    });

    it("un usuario inexistente da NotFound", async () => {
      const { acciones, admin } = await setup();

      const r = await acciones.changeRole({ actor: admin, userId: "no-existe", rol: "premium", password: "adminpass1" });

      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error).toBeInstanceOf(NotFoundError);
    });

    it("un admin puede degradar a otro admin (queda el suyo)", async () => {
      const { acciones, admin, ana, authProvider } = await setup();
      authProvider.asignarRolParaTest("ana@ejemplo.com", "admin");

      const r = await acciones.changeRole({ actor: admin, userId: ana.id, rol: "usuario", password: "adminpass1" });

      expect(r.ok).toBe(true);
    });
  });

  describe("suspender y reactivar", () => {
    it("suspender bloquea el inicio de sesión y la sesión abierta; reactivar lo devuelve todo", async () => {
      const { acciones, admin, ana, authProvider } = await setup();
      const sesion = await authProvider.iniciarSesion("ana@ejemplo.com", "12345678");

      const suspendida = await acciones.suspendUser({ actor: admin, userId: ana.id, password: "adminpass1" });

      expect(suspendida.ok).toBe(true);
      await expect(authProvider.iniciarSesion("ana@ejemplo.com", "12345678")).rejects.toBeInstanceOf(AuthenticationError);
      await expect(authProvider.verificarSesion(sesion.token)).rejects.toBeInstanceOf(AuthenticationError);

      const reactivada = await acciones.reactivateUser({ actor: admin, userId: ana.id });

      expect(reactivada.ok).toBe(true);
      await expect(authProvider.iniciarSesion("ana@ejemplo.com", "12345678")).resolves.toBeDefined();
    });

    it("no se puede suspender a un administrador ni a uno mismo", async () => {
      const { acciones, admin, ana, authProvider } = await setup();
      authProvider.asignarRolParaTest("ana@ejemplo.com", "admin");

      const aOtroAdmin = await acciones.suspendUser({ actor: admin, userId: ana.id, password: "adminpass1" });
      const aSiMismo = await acciones.suspendUser({ actor: admin, userId: admin.id, password: "adminpass1" });

      for (const r of [aOtroAdmin, aSiMismo]) {
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error).toBeInstanceOf(ConflictError);
      }
    });
  });

  describe("eliminar a otro usuario", () => {
    it("borra sus datos y su cuenta, con la contraseña del admin, y anota solo el id", async () => {
      const { acciones, admin, ana, authProvider, profileRepository, assessmentRepository, auditRepository } = await setup();

      const r = await acciones.deleteUser({ actor: admin, userId: ana.id, password: "adminpass1" });

      expect(r.ok).toBe(true);
      expect(await profileRepository.findByUserId(ana.id)).toBeUndefined();
      expect(await assessmentRepository.findByUserId(ana.id)).toEqual([]);
      expect((await authProvider.listarUsuarios()).some((u) => u.id === ana.id)).toBe(false);
      const [entrada] = await auditRepository.findRecent(1);
      expect(entrada).toMatchObject({ action: "user.deleted", targetId: ana.id });
      expect(JSON.stringify(entrada)).not.toContain("ana@ejemplo.com");
    });

    it("no se puede eliminar a un administrador (hay que degradarlo antes) ni a uno mismo por esta vía", async () => {
      const { acciones, admin, ana, authProvider } = await setup();
      authProvider.asignarRolParaTest("ana@ejemplo.com", "admin");

      const aOtroAdmin = await acciones.deleteUser({ actor: admin, userId: ana.id, password: "adminpass1" });
      const aSiMismo = await acciones.deleteUser({ actor: admin, userId: admin.id, password: "adminpass1" });

      for (const r of [aOtroAdmin, aSiMismo]) {
        expect(r.ok).toBe(false);
        if (!r.ok) expect(r.error).toBeInstanceOf(ConflictError);
      }
      expect((await authProvider.listarUsuarios()).some((u) => u.id === ana.id)).toBe(true);
    });
  });

  describe("crear un usuario", () => {
    it("crea la cuenta con rol usuario, su perfil y una contraseña temporal que solo se devuelve una vez", async () => {
      const { acciones, admin, authProvider, profileRepository } = await setup();

      const r = await acciones.createUser({ actor: admin, email: " Nuevo@Ejemplo.com ", name: "Nuria" });

      expect(r.ok).toBe(true);
      if (!r.ok) return;
      expect(r.value.email).toBe("nuevo@ejemplo.com");
      expect(r.value.temporaryPassword.length).toBeGreaterThanOrEqual(12);
      expect((await profileRepository.findByUserId(r.value.id))?.name).toBe("Nuria");
      expect((await authProvider.listarUsuarios()).find((u) => u.id === r.value.id)?.rol).toBe("usuario");
      await expect(authProvider.iniciarSesion("nuevo@ejemplo.com", r.value.temporaryPassword)).resolves.toBeDefined();
    });

    it("cada contraseña temporal es distinta", async () => {
      const { acciones, admin } = await setup();

      const a = await acciones.createUser({ actor: admin, email: "a1@ejemplo.com", name: "A" });
      const b = await acciones.createUser({ actor: admin, email: "b1@ejemplo.com", name: "B" });

      expect(a.ok && b.ok && a.value.temporaryPassword !== b.value.temporaryPassword).toBe(true);
    });

    it("rechaza un email ya registrado y un email o nombre inválidos", async () => {
      const { acciones, admin } = await setup();

      const repetido = await acciones.createUser({ actor: admin, email: "ana@ejemplo.com", name: "Otra Ana" });
      const malEmail = await acciones.createUser({ actor: admin, email: "no-es-email", name: "X" });
      const sinNombre = await acciones.createUser({ actor: admin, email: "z@ejemplo.com", name: "  " });

      expect(!repetido.ok && repetido.error).toBeInstanceOf(ConflictError);
      expect(!malEmail.ok && malEmail.error).toBeInstanceOf(ValidationError);
      expect(!sinNombre.ok && sinNombre.error).toBeInstanceOf(ValidationError);
    });

    it("la anotación de auditoría no incluye la contraseña", async () => {
      const { acciones, admin, auditRepository } = await setup();

      const r = await acciones.createUser({ actor: admin, email: "nuevo@ejemplo.com", name: "Nuria" });

      const texto = JSON.stringify(await auditRepository.findRecent(10));
      expect(texto).toContain("user.created");
      expect(r.ok && texto.includes(r.value.temporaryPassword)).toBe(false);
    });
  });

  describe("modificar email y nombre, y enviar el enlace de recuperación", () => {
    it("cambia el email (con contraseña) y lo anota sin guardar los emails", async () => {
      const { acciones, admin, ana, authProvider, auditRepository } = await setup();

      const r = await acciones.updateEmail({ actor: admin, userId: ana.id, email: "ana.nueva@ejemplo.com", password: "adminpass1" });

      expect(r.ok).toBe(true);
      await expect(authProvider.iniciarSesion("ana.nueva@ejemplo.com", "12345678")).resolves.toBeDefined();
      const [entrada] = await auditRepository.findRecent(1);
      expect(entrada.action).toBe("user.email.changed");
      expect(JSON.stringify(entrada)).not.toContain("ejemplo.com");
    });

    it("rechaza un email inválido o ya en uso", async () => {
      const { acciones, admin, ana } = await setup();

      const malo = await acciones.updateEmail({ actor: admin, userId: ana.id, email: "malo", password: "adminpass1" });
      const enUso = await acciones.updateEmail({ actor: admin, userId: ana.id, email: "admin@ejemplo.com", password: "adminpass1" });

      expect(!malo.ok && malo.error).toBeInstanceOf(ValidationError);
      expect(!enUso.ok && enUso.error).toBeInstanceOf(ConflictError);
    });

    it("cambia el nombre (sin contraseña) y rechaza uno vacío", async () => {
      const { acciones, admin, ana, profileRepository } = await setup();

      const ok = await acciones.updateName({ actor: admin, userId: ana.id, name: " Ana María " });
      const vacio = await acciones.updateName({ actor: admin, userId: ana.id, name: " " });

      expect(ok.ok).toBe(true);
      expect((await profileRepository.findByUserId(ana.id))?.name).toBe("Ana María");
      expect(!vacio.ok && vacio.error).toBeInstanceOf(ValidationError);
    });

    it("envía el enlace de recuperación y lo anota", async () => {
      const { acciones, admin, ana, authProvider, auditRepository } = await setup();

      const r = await acciones.sendRecoveryLink({ actor: admin, userId: ana.id });

      expect(r.ok).toBe(true);
      expect(authProvider.tokenDeRecuperacionParaTest("ana@ejemplo.com")).toBeDefined();
      expect(await accionesRegistradas(auditRepository)).toContain("user.recovery.sent");
    });
  });

  describe("auditoría", () => {
    it("el admin lista las anotaciones, la más reciente primero", async () => {
      const { acciones, admin, ana } = await setup();
      await acciones.reactivateUser({ actor: admin, userId: ana.id });
      await acciones.sendRecoveryLink({ actor: admin, userId: ana.id });

      const r = await acciones.listAudit(admin);

      expect(r.ok && r.value.map((e) => e.action)).toEqual(["user.recovery.sent", "user.reactivated"]);
    });
  });
});
