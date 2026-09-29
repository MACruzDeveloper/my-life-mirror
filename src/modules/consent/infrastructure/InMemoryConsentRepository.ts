import type { Consent } from "../domain/Consent.js";
import type { ConsentRepository } from "../domain/ConsentRepository.js";

/**
 * Fake solo para tests — ADR-03 apartado 3.6. En dev/producción se usa
 * SupabaseConsentimientoRepository (04_Almacenamiento_Datos.md apartado 5.1).
 */
export class InMemoryConsentRepository implements ConsentRepository {
  private readonly consents: Consent[] = [];

  async save(consent: Consent): Promise<void> {
    this.consents.push(consent);
  }

  async findUser(userId: string, categoryId: string, policyVersion: string): Promise<Consent | undefined> {
    return this.consents.find(
      (c) => c.userId === userId && c.categoryId === categoryId && c.policyVersion === policyVersion,
    );
  }

  async findByUser(userId: string): Promise<Consent[]> {
    return this.consents.filter((c) => c.userId === userId);
  }

  async deleteByUser(userId: string): Promise<void> {
    for (let i = this.consents.length - 1; i >= 0; i--) {
      if (this.consents[i].userId === userId) this.consents.splice(i, 1);
    }
  }
}
