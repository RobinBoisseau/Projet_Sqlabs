import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChoixChampComponent } from './choix-champ.component';

describe('ChoixChampComponent', () => {
  let component: ChoixChampComponent;
  let fixture: ComponentFixture<ChoixChampComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChoixChampComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChoixChampComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
