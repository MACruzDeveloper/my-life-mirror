# Historia: Avatares generados con IA, de un catálogo revisado (RF-26)

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-26 (Should), RF-03 (perfil), RF-25 (avatar que refleja el estado, Could: no incluido), [ADR-01](../architecture-decisions/01_Stack_Tecnologico.md) apartado 7 (Python solo como herramienta offline), [ADR-05](../architecture-decisions/05_Fundamentos_IA.md) apartados 2 y 4.1 (modelo de imagen y razonamiento previo), RES-09, decisión del autor del 11 oct. (fase de mejoras)

Como persona que usa la app
Quiero elegir un avatar que me represente
Para sentir el espacio como mío, sin subir una foto

## Alcance

- **Un catálogo cerrado.** Doce avatares, hechos de antemano. La persona elige uno; nunca genera uno nuevo ni escribe nada que llegue a un modelo de imagen.
- **Cómo se hacen** (una vez, en el ordenador del autor; no forma parte de la app desplegada):
  1. Cada avatar parte de una **descripción escrita a mano**, en el catálogo (`accounts/domain/catalog/avatars.json`): solo rasgos visibles (pelo, tono de piel, gafas, ropa), nunca etiquetas de género, origen, religión o edad, ni adjetivos que valoren el aspecto.
  2. Antes de generar, un **paso de razonamiento** con un modelo de lenguaje revisa cada descripción y explica si cae en algún estereotipo cultural, de género o de apariencia (ADR-05, apartado 4.1). Si lo ve, no se genera y queda anotado por qué.
  3. Un **modelo de texto a imagen** de HuggingFace (SDXL base), ejecutado en el ordenador del autor, genera las candidatas, todas con la misma semilla para que compartan estilo.
  4. **Revisión editorial del autor**, imagen a imagen, en una hoja de contactos: solo las que elige se publican en la app.
- **Dos filtros, de distinta naturaleza:** una lista de palabras prohibidas en las descripciones, que comprueba un test (determinista), y el razonamiento del modelo (lo que una lista no ve). La decisión final es siempre de una persona.
- **En la app:** el avatar se elige en "Mi perfil" y se puede cambiar o quitar cuando se quiera. Se ve en la cabecera y en la entrevista, en lugar del dibujo genérico. Sin avatar elegido, todo sigue como hasta ahora.
- **Accesibilidad:** cada avatar tiene un texto alternativo que describe lo que se ve en la imagen publicada (no lo que se pidió al modelo, que a veces difiere), en español y en inglés. Por la misma razón, la clave de cada avatar nombra lo que se ve.
- **Datos (RF-05):** la elección se guarda en el perfil, entra en la exportación y se borra con la cuenta.
- **Dónde se elige:** en el perfil, no en el registro como decía RF-26 al principio. El registro ya pide nombre, email y una contraseña con sus requisitos (SEC-01), y el avatar no es necesario para empezar. Confirmado por el autor el 11 oct.; el requisito se ha actualizado.
- **Lo aprendido al generarlos** (detalle en ADR-05, apartado 4.1.1): la API de HuggingFace ya no tenía capa gratuita para esto; el modelo rápido dibujaba a todos con piel clara y hubo que cambiar al normal; y aun ese sigue el texto solo a medias, así que la revisión descarta más de lo que publica.
- **Fuera de alcance:** RF-25 (que el avatar cambie con el estado de vida), subir una foto propia, generar avatares a petición, avatares de pago.

## Criterios de aceptación

1. Given el catálogo de descripciones
   When se revisa su integridad
   Then ninguna contiene palabras de género, origen, religión, edad ni valoraciones del aspecto, y cada una tiene su clave y su texto alternativo en los dos idiomas

2. Given una descripción que el paso de razonamiento considera estereotipada
   When se ejecuta la generación
   Then esa imagen no se genera y el motivo queda en el registro de la ejecución

3. Given las candidatas generadas
   When el autor no ha publicado ninguna
   Then la app no ofrece ningún avatar (nada llega a la app sin revisión)

4. Given una persona en "Mi perfil"
   When elige un avatar del catálogo
   Then se guarda y se ve en la cabecera y en la entrevista

5. Given una petición directa al servidor con un avatar que no está en el catálogo
   When llega
   Then se rechaza

6. Given una persona con avatar
   When lo quita
   Then vuelve el dibujo genérico

7. Given una persona con avatar
   When exporta sus datos o elimina su cuenta
   Then la elección aparece en la exportación y desaparece con la cuenta

## Historial de cambios

- **v1.0 (11 oct. 2026)** — versión inicial, primera tarea de la fase de mejoras. Hecho: catálogo de descripciones, script de generación y parte del servidor. Pendiente: generar y revisar las imágenes (necesita la cuenta de HuggingFace del autor) y, con ellas, la pantalla.
- **v1.1 (11 oct. 2026)** — confirmado por el autor: se elige en el perfil, y las 12 descripciones valen por ahora. Migración 0022 ejecutada en producción. La generación con la capa gratuita de HuggingFace no ha sido posible (sin crédito incluido): pendiente de decidir cómo se generan.
- **v1.2 (12 oct. 2026)** — generación en local con SDXL base tras descartar la API de HuggingFace (de pago) y el modelo rápido (sesgo de tono de piel). Catálogo ajustado: siete de la primera tanda y cinco nuevas (dos personas rubias, una con pelo afro, una con barba blanca y una de cabeza rapada); salen del catálogo las de pelo pelirrojo y rastas plateadas. Pantalla hecha: selector en el perfil, avatar en la cabecera y en la entrevista.
- **v1.3 (12 oct. 2026)** — los doce avatares, revisados y publicados por el autor (`public/avatars/`, 116 KB en total). Las claves y los textos alternativos se reescriben según lo que muestra cada imagen: en cinco casos el modelo dibujó algo distinto de lo pedido (por ejemplo, sin audífono, o con un pañuelo en la cabeza). El de barba blanca no se generó: el razonamiento vio en la combinación de rasgos el estereotipo del "abuelo bonachón"; lo sustituye uno de cabeza rapada. Comprobado con capturas en móvil y escritorio; el E2E (`e2e/api/avatars.spec.ts`) está escrito y pendiente de ejecutarse con Docker abierto.
