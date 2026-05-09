import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, filter, take } from 'rxjs';

export const teacherGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.isAuthenticated) return router.createUrlTree(['/login']);

  const user = auth.currentUser;
  if (user) {
    return (user.role === 'professeur' || user.role === 'admin')
      ? true
      : router.createUrlTree(['/']);
  }

  return auth.currentUser$.pipe(
    filter(u => u !== null),
    take(1),
    map(u => (u?.role === 'professeur' || u?.role === 'admin')
      ? true
      : router.createUrlTree(['/']))
  );
};
