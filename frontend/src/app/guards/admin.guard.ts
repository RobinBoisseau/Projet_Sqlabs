import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated) return router.createUrlTree(['/login']);

  const user = auth.currentUser;
  if (user) return user.role === 'admin' ? true : router.createUrlTree(['/']);

  return auth.currentUser$.pipe(
    filter(u => u !== null),
    take(1),
    map(u => u?.role === 'admin' ? true : router.createUrlTree(['/']))
  );
};
