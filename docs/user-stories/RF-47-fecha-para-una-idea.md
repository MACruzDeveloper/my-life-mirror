# Historia: Una fecha para probar una idea (RF-47)

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-47 (Could), RF-19 (guardar ideas), RN-04 y RES-07 (sin presión), RF-05 (exportar y borrar), decisión del autor del 13 oct.

Como persona que ha guardado una idea
Quiero ponerle una fecha orientativa
Para que no se quede en una lista que nunca miro

## Alcance

- **Cuándo se ofrece:** al pulsar "Me gusta" en una idea, bajo el mensaje de guardado: "¿Cuándo te apetece probarla?", con "En una semana", "En un mes", una fecha a elegir y "Sin fecha". También desde "Tus ideas guardadas", en Inicio.
- **Es una propuesta, no un plazo:** opcional, se puede cambiar o quitar. Si la fecha pasa, la idea sigue en la lista con su fecha, sin color de error ni reproche.
- **En Inicio:** las ideas guardadas se ordenan por fecha (primero las más próximas; sin fecha, al final) y cada una enseña la suya.
- **Sin avisos fuera de la app:** ni correo ni notificaciones (RF-22 sigue fuera de alcance).
- **Lo que se guarda:** la fecha (día, sin hora) junto a la reacción. De hoy a un año vista.
- **Datos (RF-05):** se exporta y se borra con las reacciones.
- **Fuera de alcance:** recordatorios, repeticiones, hora del día.

## Criterios de aceptación

1. Given una idea recién guardada
   When se elige "En una semana"
   Then la idea queda con fecha dentro de siete días y se ve en Inicio, también tras recargar

2. Given una idea guardada con fecha
   When se elige "Sin fecha"
   Then sigue guardada, sin fecha

3. Given varias ideas guardadas
   When se abre Inicio
   Then salen por fecha, y las que no tienen, al final

4. Given una fecha pasada, de más de un año o mal escrita
   When llega al servidor
   Then se rechaza

5. Given una idea que se marca como hecha o descartada
   When la petición lleva una fecha
   Then se rechaza: la fecha es de una idea guardada. Al marcar hecha una idea con fecha, la fecha desaparece

## Historial de cambios

- **v1.0 (13 oct. 2026)** — versión inicial.
- **v1.1 (13 oct. 2026)** — al implementarla: los atajos se llaman "En una semana" y "En un mes" (dicen lo que hacen: hoy más 7 y más 30 días); el criterio 5 se concreta con el contrato real (una sola petición guarda y fecha).
