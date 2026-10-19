# Historia: Profesión y aficiones en el perfil (RF-46)

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-46 (Could), RF-03 (perfil), RF-40 (ideas personalizadas con IA), RF-05 (exportar y borrar), [05_Fundamentos_IA.md](../architecture-decisions/05_Fundamentos_IA.md) apartado 4.4.1, primera prueba con una usuaria (27 sept.: "que las ideas tengan que ver con mi perfil"), decisión del autor del 13 oct.

Como persona que usa las ideas con IA
Quiero decir a qué me dedico y qué me gusta
Para que las ideas se parezcan más a mi vida

## Alcance

- **Dónde:** en "Mi perfil", no en el registro (el registro sigue pidiendo solo nombre, email y contraseña). Los dos campos son opcionales.
- **Profesión:** un desplegable con una lista cerrada de ejemplo (`accounts/domain/catalog/occupations.json`), que incluye "Desarrollo web". Una sola.
- **Aficiones:** opciones para marcar de una lista cerrada (`accounts/domain/catalog/hobbies.json`), hasta 8.
- **Nunca texto libre:** así nadie puede escribir datos de otra persona ni instrucciones para la IA. A la IA le llegan los textos de la lista, como un campo de datos más.
- **Para qué se usan:** solo para redactar las ideas con IA, y solo si la persona las tiene activadas. Nunca en categorías sensibles ni excluidas de la IA (ahí no se llama a la IA). Sin IA, no cambian nada.
- **Al cambiarlas,** las ideas ya personalizadas se borran y se vuelven a escribir la próxima vez que se abran.
- **Datos (RF-05):** van en el perfil: se exportan y se borran con él.
- **Fuera de alcance:** elegir las ideas del catálogo según el perfil sin IA; profesiones o aficiones escritas por el usuario; más de una profesión.

## Criterios de aceptación

1. Given la pantalla "Mi perfil"
   When se elige una profesión y se marcan aficiones y se guarda
   Then siguen ahí al volver a entrar

2. Given una profesión o una afición que no está en la lista, o más de 8 aficiones
   When llega al servidor
   Then se rechaza y no se guarda nada

3. Given una persona con las ideas con IA activadas, profesión y aficiones
   When abre una idea de una categoría no sensible
   Then la petición a la IA lleva su profesión y sus aficiones como datos, con el texto de la lista

4. Given una persona sin las ideas con IA activadas, o una categoría sensible
   When abre una idea
   Then no se envía nada a la IA

5. Given ideas ya personalizadas
   When cambia su profesión o sus aficiones
   Then se borran y la siguiente se escribe con los datos nuevos

6. Given una persona que quita su profesión y sus aficiones
   When guarda
   Then el perfil queda sin ellas

## Resultado con el modelo real (13 oct. 2026)

8 de 10 ideas con perfil llegarían al usuario y el revisor para todos los borradores que abusan del perfil. Es algo más estricto de la cuenta con los buenos: cae a la idea original, que es segura ([ADR-05](../architecture-decisions/05_Fundamentos_IA.md), apartado 4.3).
