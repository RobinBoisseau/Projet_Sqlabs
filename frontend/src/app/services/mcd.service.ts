import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Mcd } from '../models/mcd';
import { Entity } from '../models/entity';
import { Association } from '../models/association';
import { Link } from '../models/link';

@Injectable({
  providedIn: 'root'
})
export class McdService {
  // Le Subject permet de diffuser les changements du MCD à travers l'app
  private mcdSubject = new BehaviorSubject<Mcd | null>(null);
  mcd$ = this.mcdSubject.asObservable();

  constructor() {}

  /**
   * Charge le MCD depuis le localStorage.
   * Utilise Mcd.fromJSON pour transformer le JSON brut en véritables instances de classes.
   */
  loadMcd(slug: string): Mcd {
    const key = `mcd_cache_${slug}`;
    const cached = localStorage.getItem(key);
    
    let mcd: Mcd;
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        mcd = Mcd.fromJSON(parsed);
      } catch (e) {
        console.error("Erreur lors du parsing du MCD caché", e);
        mcd = new Mcd([], [], []);
      }
    } else {
      // Si rien en cache, on part sur un MCD vide
      mcd = new Mcd([], [], []);
    }
    
    this.mcdSubject.next(mcd);
    return mcd;
  }

  /**
   * Sauvegarde l'objet MCD complet dans le localStorage.
   * Cette méthode est appelée par l'autoSave du composant.
   */
  saveMcd(slug: string, mcd: Mcd): void {
    if (!slug || !mcd) return;
    
    try {
      localStorage.setItem(`mcd_cache_${slug}`, JSON.stringify(mcd));
      this.mcdSubject.next(mcd);
    } catch (e) {
      console.error("Erreur lors de la sauvegarde du MCD", e);
    }
  }

  /**
   * Supprime le cache d'un exercice spécifique.
   */
  clearCache(slug: string): void {
    localStorage.removeItem(`mcd_cache_${slug}`);
    this.mcdSubject.next(new Mcd([], [], []));
  }

  /**
   * Récupère la valeur actuelle du MCD sans s'abonner à l'observable.
   */
  getCurrentMcd(): Mcd | null {
    return this.mcdSubject.value;
  }
}