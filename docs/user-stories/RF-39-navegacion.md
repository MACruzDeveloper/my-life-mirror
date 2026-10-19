# Historia: Navegación — Landing pública y Home tras iniciar sesión

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-39, RF-14 (Home es un adelanto mínimo del panel completo, que se tira del tablero después)

Como visitante
Quiero ver una página de inicio pública que explique el proyecto
Para decidir si quiero registrarme

Como usuario con sesión iniciada
Quiero llegar a una página propia tras iniciar sesión
Para saber que estoy dentro de la app

## Criterios de aceptación

1. Given un visitante sin sesión
   When entra a `/`
   Then ve la Landing pública, con enlaces a Registro e Login

2. Given un usuario sin sesión
   When intenta entrar a `/inicio`
   Then se le redirige a `/login`, no ve contenido protegido

3. Given un usuario con sesión válida (cookie httpOnly)
   When entra a `/inicio`
   Then ve la página Home: si todavía no tiene ninguna puntuación (primera vez), una bienvenida con un enlace grande a la entrevista (`/perfil/entrevista`), que es su primer paso; si ya tiene puntuaciones, directamente el panel (por ahora las tarjetas de resultados; los gráficos son RF-14) con un botón "Nueva entrevista"

## Cabecera

La cabecera de las pantallas protegidas enlaza a Inicio (el panel), a Administración (solo admin) y a Mi perfil, en ese orden.

## Nota "spec viva"

La sesión vive en una cookie `httpOnly` (ADR-06) — invisible a JS del navegador a propósito. Hace falta un endpoint propio (`/api/accounts/session`) que la compruebe en el servidor y le diga al frontend si hay sesión o no; no se puede leer la cookie directamente desde React.
