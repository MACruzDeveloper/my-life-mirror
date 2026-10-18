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
import { CalendarPage } from '@modules/agenda/ui/CalendarPage'
import { CategoriesPage } from '@modules/categories/ui/CategoriesPage'
import { CategoryPageRoute } from '@modules/categories/ui/CategoryPage'
import { AdminPage } from '@modules/admin/ui/AdminPage'
import { HelpRoute } from '@modules/wellbeing/ui/HelpPage'
import { AdminRoute } from '@modules/admin/ui/AdminRoute'
import { ProtectedLayout } from '@shared/ui/components/ProtectedLayout'
import { PublicLayout } from '@shared/ui/components/PublicLayout'

function App() {
  const { t } = useTranslation()

  return (
    <BrowserRouter>
      <Routes>
        {/* Páginas públicas: selector de idioma disponible antes de tener cuenta (RNF-10). */}
        {/* UX-08: la portada ocupa toda la pantalla; el selector de idioma va sobre la imagen. */}
        <Route element={<PublicLayout overlay />}>
          <Route path="/" element={<Landing />} />
        </Route>
        <Route element={<PublicLayout />}>
          <Route path="/registro" element={<RegisterForm />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/olvide-password" element={<RequestPasswordResetForm />} />
          <Route path="/restablecer-password" element={<ResetPasswordForm />} />
          <Route path="/politica-privacidad" element={<PrivacyPolicyPage />} />
        </Route>
        {/* Ruta de diseño: un único SessionProvider para todas las pantallas protegidas (no se remonta al navegar). */}
        {/* RF-30: pública, con la cabecera de la app si hay sesión. */}
        <Route path="/ayuda" element={<HelpRoute />} />

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
              <ProtectedLayout wide>
                <AccountPage breadcrumbs={[{ label: t('breadcrumbs.inicio'), path: '/inicio' }, { label: t('breadcrumbs.miPerfil') }]} />
              </ProtectedLayout>
            }
          >
            <Route index element={<ProfileForm />} />
            <Route path="entrevista" element={<InterviewPage />} />
            <Route path="resultados" element={<ResultsPage />} />
            <Route path="calendario" element={<CalendarPage />} />
            <Route path="datos" element={<DataPrivacyPage />} />
          </Route>
          <Route
            path="/categorias"
            element={
              <ProtectedLayout breadcrumbs={[{ label: t('breadcrumbs.inicio'), path: '/inicio' }, { label: t('breadcrumbs.categorias') }]}>
                <CategoriesPage />
              </ProtectedLayout>
            }
          />
          <Route path="/categorias/:key" element={<CategoryPageRoute />} />
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
