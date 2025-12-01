import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

// AUTH
import { Login } from './login/login';
import { ForgotPassword } from './forgot-password/forgot-password';
import { ResetPassword } from './reset-password/reset-password';

// LAYOUT WRAPPER
import { Layout } from './layout/layout';

// DASHBOARD
import { Dashboard } from './dashboard/dashboard';

// USERS
import { Users } from './users/users';
import { UserForm } from './users/user-form';

// ROLES
import { Roles } from './roles/roles';
import { EditRole } from './roles/edit-role';

//cms
import { CmsList } from './cms/cms';
import { CmsForm } from './cms/cms-form';

// FAQ
import { Faq } from './faq/faq';
import { FaqForm } from './faq/faq-form';


export const routes: Routes = [
  // -----------------------------
  // ROOT REDIRECT TO LOGIN
  // -----------------------------
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  // -----------------------------
  // LOGIN STAYS OUTSIDE LAYOUT
  // -----------------------------
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'forgot-password',
    component: ForgotPassword,
  },
  {
    path: 'reset-password',
    component: ResetPassword,
  },

  // -----------------------------
  // ALL OTHER PAGES INSIDE LAYOUT
  // -----------------------------
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // Dashboard
      { path: 'dashboard', component: Dashboard },

      // USERS
      { path: 'users', component: Users },
      { path: 'users/add', component: UserForm },
      {
        path: 'users/edit/:id',
        component: UserForm
      },

      // ROLES
      { path: 'roles', component: Roles },
      { path: 'roles/add', component: EditRole },
      { path: 'roles/edit/:id', component: EditRole },

      //cms
       { path: 'cms', component: CmsList },
       { path: 'cms/add', component: CmsForm },
       { path: 'cms/edit/:id', component: CmsForm },

      // FAQ
      { path: 'faq', component: Faq },
      { path: 'faq/add', component: FaqForm },
      { path: 'faq/edit/:id', component: FaqForm }
    ],
  },

  // -----------------------------
  // WRONG URL → LOGIN
  // -----------------------------
  {
    path: '**',
    redirectTo: 'login',
  },
];
