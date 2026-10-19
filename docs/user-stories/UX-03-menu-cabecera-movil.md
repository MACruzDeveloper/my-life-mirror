# Historia: Menú de la cabecera en móvil

**Nivel:** 2 — Spec Anchored ([10_Enfoque_SDD.md](../requirements-analysis/10_Enfoque_SDD.md))
**Referencias:** RF-39 (navegación), RNF-06 (móvil primero), RNF-10 (i18n), ADM-01 (enlace de administración), [07_UI.md](../architecture-decisions/07_UI.md) apartado 5-6

Como usuario que usa la app en el móvil
Quiero una cabecera ordenada, con la navegación en un menú
Para no tener cinco botones apretados en 360 px

## Alcance

- **Móvil (por debajo de `sm`):** logo, selector de idioma (corto, "EN"/"ES") y un botón de menú. El menú contiene "Inicio", "Administración" (solo admin), "Mi perfil", el nombre de la sesión y "Cerrar sesión".
- **Desde `sm`:** igual que ahora (botones en línea).
- **Accesibilidad:** el botón de menú tiene nombre ("Abrir menú") y el menú se maneja con teclado (MUI `Menu`).
- **Sin cambios** en la protección de `/admin` (sigue en el servidor).

## Criterios de aceptación

1. Given una pantalla estrecha
   When se muestra la cabecera
   Then se ven el logo, el idioma y "Abrir menú", y no los enlaces sueltos

2. Given el menú abierto
   When el usuario lo mira
   Then encuentra "Inicio" (`/inicio`), "Mi perfil" (`/perfil`), su nombre y "Cerrar sesión"; "Administración" (`/admin`) solo si es admin

3. Given el menú abierto
   When pulsa "Cerrar sesión"
   Then se cierra la sesión como desde la cabecera de escritorio

4. Given una pantalla ancha
   When se muestra la cabecera
   Then se ve como antes, sin botón de menú
