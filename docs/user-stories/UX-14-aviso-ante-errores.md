# Historia: Un aviso en lugar de una pantalla en blanco (UX-14)

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** [ADR-08](../architecture-decisions/08_Observabilidad.md), apartado 4 (errores en el navegador), RNF-10 (i18n), RNF-06 (mobile-first), revisión de calidad del 18 oct., decisión del autor del 18 oct.

Como persona que usa la app
Quiero que, si una pantalla falla al mostrarse, me lo diga y me ofrezca cómo seguir
Para no quedarme ante una pantalla en blanco sin saber qué ha pasado

## Por qué

React desmonta toda la aplicación cuando un componente falla al pintarse. Hoy solo las partes que se cargan aparte (el mapa de viajes) tienen un `LoadErrorBoundary`. Un fallo en cualquier otra pantalla deja la página en blanco, sin mensaje y sin salida. Salió en la revisión de calidad del 18 oct., al repasar la lección de errores en producción del máster. No se envía el error a ningún servicio externo (ADR-08, apartado 4): queda en la consola del navegador.

## Alcance

- **Un límite de errores en la raíz de la app** (`AppErrorBoundary`, en `shared/ui/components/`), que reutiliza `LoadErrorBoundary` con una pantalla propia.
- **La pantalla de aviso:**
  - título "Algo ha fallado";
  - texto que dice que no se ha podido mostrar la pantalla y que lo ya guardado sigue a salvo;
  - botón **"Recargar"** (recarga la página) y enlace **"Ir al inicio"** (`/`, recarga completa, que también restablece el límite).
- Textos en español e inglés (`t()`); mobile-first; colores del tema.
- Sin cambios en el servidor. Los `LoadErrorBoundary` de las partes que se cargan aparte se quedan: un fallo ahí sigue sin tumbar el resto de la página.

## Criterios de aceptación

1. Given una pantalla que falla al pintarse
   When se abre
   Then se ve "Algo ha fallado", con "Recargar" e "Ir al inicio", en lugar de una pantalla en blanco

2. Given la pantalla de aviso
   When se pulsa "Recargar"
   Then la página se recarga

3. Given la interfaz en inglés
   When una pantalla falla
   Then el aviso sale en inglés

4. Given ningún fallo
   When se usa la app
   Then no cambia nada

## Historial de cambios

- **v1.0 (18 oct. 2026)** — versión inicial.
