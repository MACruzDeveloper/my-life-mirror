# Historia: Eventos propios y calendario (RF-48)

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-48 (Could), RF-47 (ideas con fecha), RN-04 (la nota la pone la persona), RES-09 (sin analizar lo que escribe), RF-05 (exportar y borrar), decisión del autor del 13 oct.

Como persona que usa la app para mirarse
Quiero anotar lo que tengo por delante y verlo con mis ideas
Para acordarme de revisar cómo me va después

## Alcance

- **Un evento:** un título corto (hasta 80 caracteres), un día y, si se quiere, las categorías activas con las que tiene que ver, hasta cinco ("Boda de mi prima": vida social y familia). Se puede borrar.
- **El calendario:** una pantalla con la vista de un mes, que marca los días con eventos o con ideas con fecha (RF-47), y la lista de lo que hay el día elegido. En Inicio, un resumen de lo próximo con enlace al calendario.
- **La puntuación no cambia sola.** El autor planteó que una boda subiera automáticamente la vida social; se descarta: la app no sabe cómo fue, y la nota la pone la persona (RN-04). En su lugar, desde el día de un evento con categorías (y durante 14 días), Inicio invita: "¿Cómo fue? Si quieres, revisa tu nota en Vida social y Familia", con enlace a la entrevista. La invitación se puede cerrar. El formulario lo explica antes de añadir el evento: la app lo tendrá en cuenta invitando a revisar, haya ido bien o mal, y no cambia la nota. Sin avisos fuera de la app (RF-22 sigue fuera de alcance): el mensaje se ve al entrar en Inicio.
- **El título es privado:** texto libre que solo ve su autor. No se envía a la IA, no se comparte y no se analiza (RES-09).
- **Datos (RF-05):** los eventos se exportan y se borran con la cuenta.
- **Fuera de alcance:** horas, repeticiones, invitados, sincronizar con otros calendarios, avisos fuera de la app, editar un evento (se borra y se crea otro).

## Criterios de aceptación

1. Given la pantalla del calendario
   When se añade un evento con título, día y categoría
   Then aparece en ese día, también tras recargar

2. Given un evento sin título, con un título de más de 80 caracteres, con una fecha mal escrita o con una categoría que no es de la persona
   When llega al servidor
   Then se rechaza

3. Given ideas guardadas con fecha y eventos
   When se abre el calendario
   Then los días que tienen algo están marcados y al elegir uno se ve lo que hay

4. Given un evento con categorías cuyo día es hoy o ya pasó (hasta 14 días atrás)
   When se abre Inicio
   Then se invita a revisar la nota de esas categorías, y la puntuación no ha cambiado

5. Given un evento
   When se borra
   Then desaparece del calendario

6. Given una persona que exporta sus datos o borra su cuenta
   When lo hace
   Then los eventos salen en la exportación y desaparecen con la cuenta

## Historial de cambios

- **v1.0 (13 oct. 2026)** — versión inicial.
- **v1.1 (13 oct. 2026)** — implementada. Módulo nuevo `agenda`, con su función `api/agenda/[action].ts` (la duodécima del plan Hobby). El calendario está en "Mi perfil → Calendario". Las invitaciones cerradas se recuerdan en el navegador (como la guía de Inicio), no en la base de datos. Tope de 200 eventos por persona; días de un año atrás a dos años vista.
- **v1.2 (13 oct. 2026)** — tras probarlo el autor: un evento admite varias categorías (migración 0028, que sustituye la columna de una sola); la invitación a revisar la nota sale desde el mismo día del evento, no desde el siguiente; el formulario explica qué hará la app con el evento; hoy se marca en naranja; y se corrige que el título se borrara al cambiar de día.
- **v1.3 (13 oct. 2026)** — colores del mes: hoy en naranja, los días con algo anotado en azul marino y el día elegido con un contorno, sin relleno (antes el azul del día elegido tapaba el naranja de hoy).
