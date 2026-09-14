import { BrowserRouter, Route, Routes } from 'react-router'
import { Landing } from '@pages/Landing'
import { RegistroForm } from '@modules/cuentas/ui/RegistroForm'
import { LoginForm } from '@modules/cuentas/ui/LoginForm'
import { SolicitarRecuperacionForm } from '@modules/cuentas/ui/SolicitarRecuperacionForm'
import { RestablecerPasswordForm } from '@modules/cuentas/ui/RestablecerPasswordForm'
import { RutaProtegida } from '@modules/cuentas/ui/RutaProtegida'
import { Home } from '@modules/panel/ui/Home'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/registro" element={<RegistroForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/olvide-password" element={<SolicitarRecuperacionForm />} />
        <Route path="/restablecer-password" element={<RestablecerPasswordForm />} />
        <Route
          path="/inicio"
          element={
            <RutaProtegida>
              <Home />
            </RutaProtegida>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
