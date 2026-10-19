# Historia: Recordatorio amable de lo que lleva tiempo sin mirarse (UX-10)

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-14 (panel de Inicio), RF-12 (historial), RN-04 (sin presión), RF-23 (notificaciones, bajo la línea de corte: no se usa), segunda prueba con una usuaria (12 oct.)

Como persona que usa la app desde hace tiempo
Quiero que me recuerde las categorías que no miro desde hace semanas
Para no dar por hecha una que iba bien

## Alcance

- **En Inicio**, una tarjeta con las categorías cuya última puntuación tiene más de 30 días: hasta tres, la más antigua primero, con las semanas que hace.
- **Invita, no avisa.** Dice cuánto hace y pregunta si sigue igual, con un botón para actualizar las respuestas. Sin urgencia, sin reproche y sin palabras de obligación. La petición original era que la persona "no se relaje"; se recoge la intención (volver a mirar) sin la presión, que la app promete no ejercer.
- **Solo dentro de la app.** Sin correos ni notificaciones (RF-23 sigue bajo la línea de corte).
- **Sin nada pendiente, no se muestra.**
- **Fuera de alcance:** elegir la frecuencia, silenciar una categoría, recordatorios por correo.

## Criterios de aceptación

1. Given categorías puntuadas hace 45, 60 y 10 días
   When se abre Inicio
   Then la tarjeta nombra las dos primeras, la de 60 días antes, y no la reciente

2. Given más de tres categorías sin mirar
   When se abre Inicio
   Then se muestran las tres más antiguas

3. Given una categoría activa que nunca se ha puntuado
   When se abre Inicio
   Then no aparece en la tarjeta

4. Given todas las categorías puntuadas en el último mes
   When se abre Inicio
   Then no hay tarjeta
