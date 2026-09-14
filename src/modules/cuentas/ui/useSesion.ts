import { useEffect, useState } from "react";

export interface EstadoSesion {
  cargando: boolean;
  autenticado: boolean;
  email?: string;
}

/** Consulta /api/sesion — la cookie es httpOnly, así que no hay otra forma de saberlo desde el navegador. */
export function useSesion(): EstadoSesion {
  const [estado, setEstado] = useState<EstadoSesion>({ cargando: true, autenticado: false });

  useEffect(() => {
    let cancelado = false;

    fetch("/api/sesion")
      .then((respuesta) => respuesta.json())
      .then((datos) => {
        if (!cancelado) {
          setEstado({ cargando: false, autenticado: !!datos.autenticado, email: datos.email });
        }
      })
      .catch(() => {
        if (!cancelado) {
          setEstado({ cargando: false, autenticado: false });
        }
      });

    return () => {
      cancelado = true;
    };
  }, []);

  return estado;
}
