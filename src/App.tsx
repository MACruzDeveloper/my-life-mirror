import { useTranslation } from 'react-i18next'
import { BrowserRouter, Route, Routes } from 'react-router'
import { Landing } from '@pages/Landing'
import { PrivacyPolicyPage } from '@pages/PrivacyPolicyPage'
import { RegisterForm } from '@modules/accounts/ui/RegisterForm'
import { LoginForm } from '@modules/accounts/ui/LoginForm'
import { RequestPasswordResetForm } from '@modules/accounts/ui/RequestPasswordResetForm'
import { ResetPasswordForm } from '@modules/accounts/ui/ResetPasswordForm'
import { DataPrivacyPage } from '@modules/accounts/ui/DataPrivacyPage'
import { ProfileForm } from '@modules/accounts/ui/ProfileForm'
import { AccountPage } from '@modules/accounts/ui/AccountPage'
import { ProtectedRoute } from '@modules/accounts/ui/ProtectedRoute'
import { Home } from '@modules/panel/ui/home/Home'
import { InterviewPage } from '@modules/assessments/ui/InterviewPage'
import { ResultsPage } from '@modules/assessments/ui/ResultsPage'
import { AdminPage } from '@modules/admin/ui/AdminPage'
import { AdminRoute } from '@modules/admin/ui/AdminRoute'
import { ProtectedLayout } from '@shared/ui/components/ProtectedLayout'
import { PublicLayout } from '@shared/ui/components/PublicLayout'

function App() {
  const { t } = useTranslation()

  return (
    <BrowserRouter>
      <Routes>
        {/* Páginas públicas: selector de idioma disponible antes de tener cuenta (RNF-10). */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/registro" element={<RegisterForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/olvide-password" element={<RequestPasswordResetForm />} />
          <Route path="/restablecer-password" element={<ResetPasswordForm />} />
          <Route path="/politica-privacidad" element={<PrivacyPolicyPage />} />
        </Route>
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
                  { label: t('breadcrumbs.inicio'), path: '/inicio' },
                  { label: t('breadcrumbs.miPerfil') },
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
                    { label: t('breadcrumbs.inicio'), path: '/inicio' },
                    { label: t('breadcrumbs.administracion') },
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
