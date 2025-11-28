import { Routes } from '@angular/router';

// AUTH
import { Login } from './login/login';

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

export const routes: Routes = [
  // -----------------------------
  // LOGIN STAYS OUTSIDE LAYOUT
  // -----------------------------
  {
    path: 'login',
    component: Login,
  },

  // -----------------------------
  // ALL OTHER PAGES INSIDE LAYOUT
  // -----------------------------
  {
    path: '',
    component: Layout,
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
