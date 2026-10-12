-- RF-26: el avatar que elige cada persona, de un catálogo cerrado generado con IA
-- y revisado por el autor. Se guarda la clave del catálogo (p. ej. 'curlyGlasses'),
-- nunca una imagen: las imágenes son archivos estáticos de la app. Sin valor, la
-- app enseña el dibujo genérico. Va en el perfil: se exporta y se borra con él.
--
-- IMPORTANTE: ejecutar ANTES de desplegar la versión que lo usa. Repetible.

alter table public.profiles
  add column if not exists avatar_key text check (avatar_key is null or char_length(avatar_key) <= 100);
