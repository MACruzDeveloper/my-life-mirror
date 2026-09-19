import { useTranslation } from 'react-i18next'
import { BrowserRouter, Route, Routes } from 'react-router'
import { Landing } from '@pages/Landing'
import { PrivacyPolicyPage } from '@pages/PrivacyPolicyPage'
import { RegisterForm } from '@modules/cuentas/ui/RegisterForm'
import { LoginForm } from '@modules/cuentas/ui/LoginForm'
import { SolicitarRecuperacionForm } from '@modules/cuentas/ui/SolicitarRecuperacionForm'
import { RestablecerPasswordForm } from '@modules/cuentas/ui/RestablecerPasswordForm'
import { ProfileForm } from '@modules/cuentas/ui/ProfileForm'
import { AccountPage } from '@modules/cuentas/ui/AccountPage'
import { ProtectedRoute } from '@modules/cuentas/ui/ProtectedRoute'
import { Home } from '@modules/panel/ui/Home'
import { CategoriesPage } from '@modules/categories/ui/CategoriesPage'
import { ProtectedLayout } from '@shared/ui/components/ProtectedLayout'

function App() {
  const { t } = useTranslation()

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/registro" element={<RegisterForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/olvide-password" element={<SolicitarRecuperacionForm />} />
        <Route path="/restablecer-password" element={<RestablecerPasswordForm />} />
        <Route path="/politica-privacidad" element={<PrivacyPolicyPage />} />
        <Route
          path="/inicio"
          element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Home />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <ProtectedLayout
                breadcrumbs={[
                  { etiqueta: t('breadcrumbs.inicio'), ruta: '/inicio' },
                  { etiqueta: t('breadcrumbs.miPerfil') },
                ]}
              >
                <AccountPage />
              </ProtectedLayout>
            </ProtectedRoute>
          }
        >
          <Route index element={<ProfileForm />} />
          <Route path="categorias" element={<CategoriesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
