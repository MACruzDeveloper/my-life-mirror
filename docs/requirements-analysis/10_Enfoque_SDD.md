# Enfoque de Spec-Driven Development (SDD) para este proyecto

**Basado en:** *Introducción a Spec Driven Development* (material del máster, BIG School), [01_Justificacion_Ciclo_Vida.md](01_Justificacion_Ciclo_Vida.md) v1.1
**Fecha:** 8 de septiembre de 2026

---

## 1. Los tres niveles (según el material del máster)

| Nivel | Definición | Encaja cuando... |
|---|---|---|
| **1 — Spec First** | Especificación completa y exhaustiva antes de que la IA genere una sola línea de código. Estilo cascada, pero con ejecución rápida. | Dominio muy conocido, **baja incertidumbre**. |
| **2 — Spec Anchored** | Especificación **viva**: se reajusta a medida que se descubre información nueva durante el desarrollo, y la implementación se reajusta con ella. | Entornos de alta incertidumbre, prototipos, metodologías ágiles. |
| **3 — Spec Source** | La especificación es la única fuente de verdad; el desarrollador ya no toca el código fuente directamente, solo el diseño/contratos/historias, y un agente de IA traduce esos cambios a código ejecutable. | Objetivo con **alta claridad** + desafío de tamaño medio/complejo. |

**Criterio de aplicación del propio documento** (importante, corrige algo que dije yo antes de tener esta fuente): el eje que decide si aplicar SDD —y qué nivel— no es "cuánta incertidumbre técnica hay", sino **tamaño del desafío × claridad del objetivo**. Se puede tener mucha incertidumbre sobre el *cómo* (qué librería, qué patrón) y total claridad sobre el *qué* — ahí SDD rinde más, porque ancla el qué mientras se explora el cómo. Donde SDD no sirve es cuando el *qué* en sí es ambiguo: ahí hace falta "pico y pala" (análisis, aclarar el problema) antes de especificar nada — exactamente lo que hicimos cada vez que un diagrama sacó un hallazgo (RD-04, el disparador del consentimiento, etc.).

## 2. Por qué Nivel 1 no es el que gobierna este proyecto

Nivel 1 asume baja incertidumbre. Pero elegimos deliberadamente un ciclo de vida espiral precisamente por **alta incertidumbre técnica** (motivo personal explícito en [01_Justificacion_Ciclo_Vida.md](01_Justificacion_Ciclo_Vida.md) apartado 2, punto 4: quieres aplicar lo aprendido en el máster, lo que implica tecnologías con poca experiencia previa). Forzar Nivel 1 como filosofía general del proyecto sería contradecir esa decisión ya tomada.

Dicho esto: la Fase 2 (`02_Requisitos_Fase1.md` y los diagramas) sí se comportó, a nivel de sistema completo, de forma parecida a un Spec First inicial — pero en la práctica ya fue una **especificación viva**: pasó de v0.1 a v0.5 según fuimos aprendiendo cosas (comentarios tuyos, hallazgos de los diagramas). Eso es, en espíritu, ya Nivel 2, aplicado al conjunto del sistema en vez de a una historia de usuario suelta.

## 3. Qué nivel usamos, y con qué granularidad

| Nivel | Granularidad en este proyecto | Estado |
|---|---|---|
| **Spec First** | No se adopta como filosofía general — ver apartado 2. | Descartado como enfoque gobernante |
| **Spec Anchored** | **Nivel por defecto para cada historia de usuario** del Ciclo 1 en adelante: criterios de aceptación Given/When/Then, referenciados a RF/RD, que se reajustan si al construir aparece algo que no habíamos visto (como ya nos ha pasado varias veces). | ✅ Adoptado — se aplica ya a partir de las historias de usuario del Ciclo 1 |
| **Spec Source** | Selectivo, historia por historia, con el criterio real del documento: objetivo con alta claridad + tamaño medio/complejo. No para cambios triviales (ver riesgo de "documentación muerta", apartado 4). | Selectivo — se decide caso por caso |

## 4. Cuándo NO escribir una spec formal

El propio documento lo dice explícitamente: aplicar SDD a un cambio trivial (texto de un botón, un color) es sobrecoste — ahí un prompt directo es más eficiente, y escribir specs para todo genera "documentación muerta" que nadie llega a consultar. Regla práctica para este proyecto: si el cambio no toca un RF/RD y no tiene lógica de negocio propia, no le hace falta spec — se pide directamente.

## 5. Ejemplo completo — Nivel 2 (Spec Anchored)

Así es como se verá cada historia de usuario del Ciclo 1 a partir de ahora (ejemplo real, sobre RF-18):

```
Historia: Recibir una recomendación cuando mi puntuación es baja

Como usuario
Quiero que el sistema me proponga una recomendación cuando puntúo bajo en una categoría
Para tener una acción concreta que probar, en vez de solo ver un número bajo

Referencias: RF-18, RD-04, RES-09

Criterios de aceptación:
  1. Given una categoría activa con umbral configurado
     When el usuario puntúa por debajo del umbral
     Then el sistema muestra al menos una recomendación asociada a esa categoría,
          con estado inicial "pendiente_respuesta" (RD-04)

  2. Given una categoría activa con puntuación en el umbral o por encima
     When el usuario completa el check-in
     Then el sistema NO muestra ninguna recomendación

  3. Given que se muestra una recomendación
     Then el texto no contiene juicios de valor ni lenguaje diagnóstico (RES-09)

Nota "spec viva": si al implementar descubrimos, por ejemplo, que hacen falta
varias recomendaciones candidatas para poder rotar (evitar repetir siempre la misma),
este documento se actualiza con ese criterio ANTES de tocar el código — no se
improvisa directamente en la implementación.
```

Esto es exactamente lo que ya usamos como muestra en [04_Plan_Verificacion_Validacion.md](04_Plan_Verificacion_Validacion.md) apartado 3, ahora formalizado como el molde estándar por historia.

## 6. El mismo ejemplo llevado a Nivel 3 (Spec Source)

Para una historia con objetivo muy claro (como esta) y complejidad media, se puede ir un paso más allá: especificar el "contrato" con precisión suficiente para que el código sea una traducción casi mecánica de la spec — y para que, si algo cambia, el cambio se haga **en la spec**, no a mano en el código:

```
Contrato de la función de decisión (añadido sobre la spec del Nivel 2):

  evaluarUmbral(puntuacion: number, umbral: number): boolean
    → true si puntuacion < umbral

  generarRecomendacion(categoriaId, usuarioId): Recomendacion
    → crea una entidad Recomendacion con estado="pendiente_respuesta",
      texto tomado del catálogo versionable (RD-09) para esa categoría,
      nunca generado libremente por un LLM en este punto (evita RES-09
      por construcción, no solo por revisión posterior)
```

En este nivel, si mañana decides que el texto de la recomendación sí puede generarse con IA en vez de venir de un catálogo fijo, el cambio se hace **aquí**, en la spec, y la implementación se regenera a partir de ella — no se edita el código suelto primero y la spec después.

## 7. Responsabilidad humana (no se pierde con SDD)

El documento del máster lo remarca: usar IA no exime de responsabilidad — el humano sigue siendo quien valida que el código cumple lo definido. Esto ya está cubierto por lo que definimos en [04_Plan_Verificacion_Validacion.md](04_Plan_Verificacion_Validacion.md): cada criterio Given/When/Then de una spec Nivel 2/3 es precisamente lo que se ejecuta manualmente o vía Playwright para esa validación.

---
## Historial de cambios

- **v1.0 (8 sept. 2026)** — versión inicial a partir del material del máster: los 3 niveles, por qué Nivel 1 no gobierna el proyecto, granularidad adoptada (Nivel 2 por defecto, Nivel 3 selectivo), ejemplo completo sobre RF-18 en ambos niveles.
- **v1.1 (29 sept. 2026)** — se elimina el apartado "Próximo paso": era una nota de la conversación de trabajo y lo pendiente vive en el [tablero](../project-management/01_Backlog_MVP.md).
