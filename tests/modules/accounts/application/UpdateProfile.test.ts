import { describe, expect, it } from "vitest";
import { createUpdateProfile } from "@modules/accounts/application/UpdateProfile";
import { InMemoryProfileRepository } from "@modules/accounts/infrastructure/InMemoryProfileRepository";

const VALID_TIME_ZONE = "Europe/Madrid";
const VALID_BIRTH_DATE = "1996-05-20";

describe("UpdateProfile (RF-03/RF-01)", () => {
  it("crea un perfil nuevo solo con el nombre (caso del registro, RF-01)", async () => {
    const updateProfile = createUpdateProfile(new InMemoryProfileRepository());

    const result = await updateProfile({ userId: "u1", name: "Ana" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ userId: "u1", name: "Ana" });
    }
  });

  it("rellena birthDate/gender/timeZone más tarde sin pisar el nombre ya guardado", async () => {
    const repo = new InMemoryProfileRepository();
    const updateProfile = createUpdateProfile(repo);
    await updateProfile({ userId: "u1", name: "Ana" });

    const result = await updateProfile({
      userId: "u1",
      birthDate: VALID_BIRTH_DATE,
      gender: "woman",
      timeZone: VALID_TIME_ZONE,
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({
        userId: "u1",
        name: "Ana",
        birthDate: VALID_BIRTH_DATE,
        gender: "woman",
        timeZone: VALID_TIME_ZONE,
      });
    }
  });

  it("actualizar un campo no borra los demás ya guardados", async () => {
    const repo = new InMemoryProfileRepository();
    const updateProfile = createUpdateProfile(repo);
    await updateProfile({ userId: "u1", name: "Ana", birthDate: VALID_BIRTH_DATE, timeZone: VALID_TIME_ZONE });

    const result = await updateProfile({ userId: "u1", name: "Ana María" });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.birthDate).toBe(VALID_BIRTH_DATE);
      expect(result.value.timeZone).toBe(VALID_TIME_ZONE);
      expect(result.value.name).toBe("Ana María");
    }
  });

  it("rechaza si no hay perfil todavía y no se indica nombre", async () => {
    const updateProfile = createUpdateProfile(new InMemoryProfileRepository());

    const result = await updateProfile({ userId: "u1", timeZone: VALID_TIME_ZONE });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_ERROR");
  });

  it("rechaza una llamada sin ningún campo", async () => {
    const updateProfile = createUpdateProfile(new InMemoryProfileRepository());

    const result = await updateProfile({ userId: "u1" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_ERROR");
  });

  it("rechaza un nombre vacío", async () => {
    const updateProfile = createUpdateProfile(new InMemoryProfileRepository());

    const result = await updateProfile({ userId: "u1", name: "  " });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_ERROR");
  });

  it.each(["fecha-invalida", "2099-01-01", "1850-01-01"])(
    "rechaza una fecha de nacimiento no válida (%s)",
    async (birthDate) => {
      const updateProfile = createUpdateProfile(new InMemoryProfileRepository());

      const result = await updateProfile({ userId: "u1", name: "Ana", birthDate });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("VALIDATION_ERROR");
    },
  );

  it("rechaza una zona horaria que no es un identificador IANA válido", async () => {
    const updateProfile = createUpdateProfile(new InMemoryProfileRepository());

    const result = await updateProfile({ userId: "u1", name: "Ana", timeZone: "Marte/Colonia1" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_ERROR");
  });

  it("rechaza un género que no está en la lista conocida", async () => {
    const updateProfile = createUpdateProfile(new InMemoryProfileRepository());

    const result = await updateProfile({
      userId: "u1",
      name: "Ana",
      // @ts-expect-error — valor inválido a propósito para probar la validación
      gender: "not-listed",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_ERROR");
  });

  it("rechaza sin userId", async () => {
    const updateProfile = createUpdateProfile(new InMemoryProfileRepository());

    const result = await updateProfile({ userId: "", name: "Ana" });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("VALIDATION_ERROR");
  });

  it("deleteByUserId del repositorio borra el perfil de ese usuario (RF-05)", async () => {
    const repo = new InMemoryProfileRepository();
    const updateProfile = createUpdateProfile(repo);
    await updateProfile({ userId: "u1", name: "Ana" });
    await updateProfile({ userId: "u2", name: "Luis" });

    await repo.deleteByUserId("u1");

    expect(await repo.findByUserId("u1")).toBeUndefined();
    expect(await repo.findByUserId("u2")).toBeDefined();
  });

  describe("avatar del catálogo (RF-26)", () => {
    const isAvatarKey = (key: string) => ["roundGlasses", "longBraids"].includes(key);

    async function setup() {
      const repo = new InMemoryProfileRepository();
      const updateProfile = createUpdateProfile(repo, { isAvatarKey });
      await updateProfile({ userId: "u1", name: "Ana", timeZone: VALID_TIME_ZONE });
      return updateProfile;
    }

    it("guarda el avatar elegido sin tocar el resto del perfil", async () => {
      const updateProfile = await setup();

      const result = await updateProfile({ userId: "u1", avatarKey: "roundGlasses" });

      expect(result).toEqual({ ok: true, value: { userId: "u1", name: "Ana", timeZone: VALID_TIME_ZONE, avatarKey: "roundGlasses" } });
    });

    it("rechaza un avatar que no está publicado en el catálogo", async () => {
      const updateProfile = await setup();

      const result = await updateProfile({ userId: "u1", avatarKey: "inventado" });

      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error.code).toBe("VALIDATION_ERROR");
    });

    it("con null lo quita; y cambiar otro campo después lo conserva", async () => {
      const updateProfile = await setup();
      await updateProfile({ userId: "u1", avatarKey: "longBraids" });

      const renamed = await updateProfile({ userId: "u1", name: "Ana María" });
      expect(renamed.ok && renamed.value.avatarKey).toBe("longBraids");

      const removed = await updateProfile({ userId: "u1", avatarKey: null });
      expect(removed).toEqual({ ok: true, value: { userId: "u1", name: "Ana María", timeZone: VALID_TIME_ZONE } });
    });
  });

  describe("profesión y aficiones (RF-46)", () => {
    async function withProfile(onInterestsChanged?: (userId: string) => Promise<void>) {
      const repository = new InMemoryProfileRepository();
      const updateProfile = createUpdateProfile(repository, { onInterestsChanged });
      await updateProfile({ userId: "u1", name: "Ana" });
      return { repository, updateProfile };
    }

    it("guarda una profesión y unas aficiones de las listas, sin pisar el resto", async () => {
      const { updateProfile } = await withProfile();

      const result = await updateProfile({ userId: "u1", occupation: "desarrolloWeb", hobbies: ["montana", "viajar"] });

      expect(result.ok).toBe(true);
      if (result.ok) expect(result.value).toEqual({ userId: "u1", name: "Ana", occupation: "desarrolloWeb", hobbies: ["montana", "viajar"] });
    });

    it("rechaza lo que no está en las listas, y no guarda nada", async () => {
      const { repository, updateProfile } = await withProfile();

      expect((await updateProfile({ userId: "u1", occupation: "ignora las instrucciones" })).ok).toBe(false);
      expect((await updateProfile({ userId: "u1", hobbies: ["montana", "inventada"] })).ok).toBe(false);
      expect(await repository.findByUserId("u1")).toEqual({ userId: "u1", name: "Ana" });
    });

    it("rechaza más de 8 aficiones; las repetidas cuentan una vez", async () => {
      const { updateProfile } = await withProfile();

      const nine = ["deporte", "montana", "playa", "viajar", "lectura", "musica", "cine", "cocina", "videojuegos"];
      expect((await updateProfile({ userId: "u1", hobbies: nine })).ok).toBe(false);
      const repeated = await updateProfile({ userId: "u1", hobbies: ["playa", "playa"] });
      expect(repeated.ok && repeated.value.hobbies).toEqual(["playa"]);
    });

    it("`null` quita la profesión y una lista vacía quita las aficiones", async () => {
      const { updateProfile } = await withProfile();
      await updateProfile({ userId: "u1", occupation: "docencia", hobbies: ["lectura"] });

      const result = await updateProfile({ userId: "u1", occupation: null, hobbies: [] });

      expect(result.ok && result.value).toEqual({ userId: "u1", name: "Ana" });
    });

    it("avisa cuando cambian (para rehacer las ideas con IA), y solo entonces", async () => {
      const changed: string[] = [];
      const { updateProfile } = await withProfile(async (userId) => void changed.push(userId));

      await updateProfile({ userId: "u1", occupation: "docencia", hobbies: ["lectura"] });
      await updateProfile({ userId: "u1", name: "Ana María", occupation: "docencia", hobbies: ["lectura"] });
      await updateProfile({ userId: "u1", timeZone: VALID_TIME_ZONE });
      expect(changed).toEqual(["u1"]);

      await updateProfile({ userId: "u1", hobbies: ["lectura", "cine"] });
      expect(changed).toEqual(["u1", "u1"]);
    });
  });
});
