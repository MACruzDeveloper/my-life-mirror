/**
 * RF-41. Opciones cerradas de "¿Qué te ayuda en esta área?", por clave de
 * categoría estándar. Lista cerrada a propósito: es lo único que podrá usar la
 * IA para personalizar ideas (RF-40), y así nunca recibe texto libre (RES-09).
 * Los textos viven en i18n (`experiencias.<categoría>.<opción>`).
 */
const OPTIONS_BY_CATEGORY_KEY: Readonly<Record<string, readonly string[]>> = {
  economia: ["presupuesto", "ahorroAlCobrar", "apps", "hablarlo", "aprender", "ingresosExtra"],
  vidaSocial: ["quedarEnPersona", "mensajesYLlamadas", "actividadesEnGrupo", "voluntariado", "conocerGente", "planesTranquilos"],
  pareja: ["tiempoJuntos", "hablarLasCosas", "pequenosDetalles", "planesNuevos", "espacioPropio", "rutinasCompartidas"],
  sexo: ["comunicacion", "tiempoSinPrisa", "bienestarCorporal", "explorar", "informarme"],
  deporte: ["caminar", "gimnasio", "deporteEnEquipo", "naturaleza", "bailar", "yogaEstiramientos", "ejercicioEnCasa"],
  aventura: ["viajar", "escapadas", "aprenderAlgoNuevo", "naturaleza", "comidaNueva", "retosPersonales"],
  espiritualidad: ["meditacion", "naturaleza", "lectura", "comunidad", "silencio", "gratitud"],
  familia: ["comidasJuntos", "llamadas", "planesFinDeSemana", "tradiciones", "ayudarnos", "hablar"],
  inversiones: ["aprenderAntes", "largoPlazo", "consultarProfesional", "pocoAPoco", "revisarDeVezEnCuando"],
};

/** Claves completas (`deporte.caminar`) de una categoría; vacío si no tiene clave o no se conoce. */
export function experienceOptionsFor(categoryKey: string | undefined): string[] {
  const options = categoryKey ? OPTIONS_BY_CATEGORY_KEY[categoryKey] : undefined;
  return options ? options.map((option) => `${categoryKey}.${option}`) : [];
}
