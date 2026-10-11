# Historia: Cuenta de prueba para la entrega (TFM-01)

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** requisitos de entrega del máster (usuario y contraseña de prueba), RF-05 (eliminar la cuenta), RF-43 (experiencias compartidas), RF-40/RF-45 (IA), RNF-13 (roles), decisión del autor del 11 oct.

Como persona que evalúa el TFM
Quiero entrar con una cuenta que ya tenga contenido
Para ver la app funcionando (gráficos, ideas, diario, IA, experiencias de otras personas) sin tener que rellenarla durante un año

## Alcance

- **Una cuenta de prueba en producción**, con email y contraseña publicados en el README. Sin rol de administrador (gestiona usuarios reales; la administración se enseña en el vídeo y se prueba en local).
- **Contenido con el que llega:**
  - seis áreas activas (ninguna sensible) y **un año de historial**, una evaluación al mes, con trayectorias distintas (una que mejora, otras que bajan, una estable);
  - tres áreas por debajo del umbral, con sus **ideas abiertas**;
  - opciones marcadas en "¿Qué te ayuda?" y "¿Qué te lo pone difícil?";
  - **experiencias en el diario**, con fechas repartidas; una de ellas menciona viajar sin que "Viajar" esté marcada, para que "Sugerir opciones con IA" tenga algo que proponer;
  - un área con 8 o más y una experiencia sin compartir, para poder probar "Compartir de forma anónima";
  - los dos interruptores de IA activados.
- **Una segunda cuenta, "otra persona"**, sin contraseña publicada, con puntuaciones altas y experiencias ya compartidas en español y en inglés: así la cuenta de prueba ve la pestaña "De otras personas" en sus ideas.
- **Restaurable:** `npm run demo:reset` borra las dos cuentas (solo esas, por su email exacto) y las vuelve a crear con el mismo contenido. Se ejecuta a mano, con las credenciales del `.env`, y pide confirmación expresa (`-- --yes`) porque escribe en la base de datos real. La contraseña de la cuenta de prueba sale de `DEMO_USER_PASSWORD`, para que la del README siga valiendo tras restaurar.
- **Protegida contra el borrado:** si `DEMO_USER_EMAIL` está definida en el servidor, esa cuenta no se puede eliminar desde la app: se explica que es una cuenta de demostración. El resto de lo que haga quien la pruebe (puntuar, escribir, compartir, reportar) se deshace al restaurar.
- **Fuera de alcance:** restaurarla automáticamente (exigiría la clave de servicio en GitHub Actions), impedir que se cambien sus datos, una cuenta de administrador pública.

## Criterios de aceptación

1. Given una base sin las cuentas de prueba
   When se ejecuta el sembrado
   Then existe la cuenta de prueba con seis áreas activas, 12 meses de historial más el de hoy, tres ideas abiertas, sus opciones marcadas, sus experiencias y la IA activada

2. Given la cuenta de prueba sembrada
   When pide lo que comparten otras personas en un área con idea abierta, en español o en inglés
   Then recibe al menos una experiencia de "otra persona"

3. Given las cuentas ya existentes, con cambios hechos por quien las probó
   When se vuelve a ejecutar el sembrado
   Then quedan como al principio, sin duplicados, y ninguna otra cuenta cambia

4. Given `DEMO_USER_EMAIL` definida
   When la cuenta de prueba intenta eliminarse con su contraseña
   Then no se elimina y se explica que es una cuenta de demostración; cualquier otra cuenta se elimina como siempre

## Historial de cambios

- **v1.0 (11 oct. 2026)** — versión inicial. Decisiones del autor: `demo@example.com` (dominio reservado, no recibe correo) y protección contra el borrado.
