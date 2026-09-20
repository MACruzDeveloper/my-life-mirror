import { useTranslation } from 'react-i18next'
import { BrowserRouter, Route, Routes } from 'react-router'
import { Landing } from '@pages/Landing'
import { PrivacyPolicyPage } from '@pages/PrivacyPolicyPage'
import { RegisterForm } from '@modules/cuentas/ui/RegisterForm'
import { LoginForm } from '@modules/cuentas/ui/LoginForm'
import { SolicitarRecuperacionForm } from '@modules/cuentas/ui/SolicitarRecuperacionForm'
import { RestablecerPasswordForm } from '@modules/cuentas/ui/RestablecerPasswordForm'
import { DataPrivacyPage } from '@modules/cuentas/ui/DataPrivacyPage'
import { ProfileForm } from '@modules/cuentas/ui/ProfileForm'
import { AccountPage } from '@modules/cuentas/ui/AccountPage'
import { ProtectedRoute } from '@modules/cuentas/ui/ProtectedRoute'
import { Home } from '@modules/panel/ui/Home'
import { InterviewPage } from '@modules/assessments/ui/InterviewPage'
import { ResultsPage } from '@modules/assessments/ui/ResultsPage'
import { AdminPage } from '@modules/admin/ui/AdminPage'
import { AdminRoute } from '@modules/admin/ui/AdminRoute'
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
        {/* Ruta de diseño: un único SessionProvider para todas las pantallas protegidas (no se remonta al navegar). */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/inicio"
            element={
              <ProtectedLayout>
                <Home />
              </ProtectedLayout>
            }
          />
          <Route
            path="/perfil"
            element={
              <ProtectedLayout
                breadcrumbs={[
                  { etiqueta: t('breadcrumbs.inicio'), ruta: '/inicio' },
                  { etiqueta: t('breadcrumbs.miPerfil') },
                ]}
              >
                <AccountPage />
              </ProtectedLayout>
            }
          >
            <Route index element={<ProfileForm />} />
            <Route path="entrevista" element={<InterviewPage />} />
            <Route path="resultados" element={<ResultsPage />} />
            <Route path="datos" element={<DataPrivacyPage />} />
          </Route>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <ProtectedLayout
                  breadcrumbs={[
                    { etiqueta: t('breadcrumbs.inicio'), ruta: '/inicio' },
                    { etiqueta: t('breadcrumbs.administracion') },
                  ]}
                >
                  <AdminPage />
                </ProtectedLayout>
              </AdminRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
