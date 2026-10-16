# Historia: Guardar todo desde una barra fija (UX-12)

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-10 (entrevista), RF-12 (registros inmutables), [UX-05](UX-05-respuesta-inmediata-entrevista.md) (guardar por categoría), RF-18 (ideas al puntuar bajo), RF-50 (todo en verde), PERF-01 (una sola petición), decisión del autor del 15 oct.

Como persona que actualiza varias categorías a la vez
Quiero guardarlas todas de una vez
Para no tener que pulsar un "Guardar" en cada una

## Por qué

UX-05 cambió el botón único del final por un "Guardar" en cada categoría: el del final no se encontraba y su mensaje quedaba fuera de la vista. Con muchas categorías, guardar una a una resulta pesado. Una barra fija resuelve las dos cosas: el botón siempre está a la vista, y el resultado se sigue viendo en cada categoría.

## Alcance

- **La barra:** los accesos a cada categoría y, a su derecha, **"Guardar todo (N)"**, con N las categorías que tienen una nota cambiada sin guardar. Al bajar, cuando la barra llegaría a la cabecera, la sustituye una **versión compacta fija** pegada a la cabecera, de lado a lado, con píldoras y botón más pequeños, para que ocupe poco. Sin cambios, el botón está desactivado.
- **El "Guardar" de cada categoría se queda:** sirve para guardar una sola.
- **Guardar todo envía todas las notas cambiadas en una sola petición;** el servidor guarda todas o ninguna (RF-12). Sigue sin haber autoguardado: un toque por error no crea un registro inmutable.
- **Lo que se ve después:**
  - Cada categoría guardada dice "Guardado ahora".
  - Si se abre **una** idea nueva, la ventana de siempre ("Cambios guardados").
  - Si hay **más de un aviso** (varias ideas nuevas, notas altas de UX-09, todo en verde de RF-50), **un solo resumen** los enumera todos, para que no se pierda ninguno: "Economía: tienes una idea nueva.", la nota alta de Familia… Dura más cuantos más avisos tiene, y enlaza a Inicio si hay ideas nuevas o todo quedó en verde (entonces sale en el centro, como el de RF-50). No se abren varias ventanas seguidas.
  - Si el único aviso es todo en verde, el de RF-50.
  - Si falla, un mensaje junto al botón; las notas cambiadas se conservan para reintentar.
- **En móvil:** los accesos se desplazan en horizontal y el botón queda a la derecha.
- **Sin cambios en el servidor:** el `POST /api/assessments` ya admite varias entradas.

## Criterios de aceptación

1. Given ninguna nota cambiada
   When se mira la barra
   Then "Guardar todo" está desactivado

2. Given dos categorías con la nota cambiada
   When se pulsa "Guardar todo (2)"
   Then se hace una sola petición con las dos, ambas dicen "Guardado ahora" y el botón vuelve a estar desactivado

3. Given un guardado que abre ideas nuevas en dos categorías (o una idea y una nota alta)
   When termina
   Then un resumen enumera todos los avisos y enlaza a Inicio, y no se abre ninguna ventana

4. Given un guardado que abre una sola idea nueva
   When termina
   Then se abre la ventana "Cambios guardados" con esa idea

5. Given el guardado falla
   When termina
   Then se ve el error junto al botón y las notas siguen cambiadas

6. Given la página de la entrevista
   When se baja por las preguntas y la barra sale por arriba
   Then aparece la versión compacta pegada a la cabecera, con un solo "Guardar todo" (la normal queda oculta), y desaparece al volver arriba

## Historial de cambios

- **v1.0 (15 oct. 2026)** — versión inicial.
- **v1.1 (15 oct. 2026)** — a petición del autor: un resumen con todos los avisos en lugar de solo las ideas ("que el usuario no pierda información"), y la barra pasa a una versión compacta fija pegada a la cabecera, a todo lo ancho, al bajar.
