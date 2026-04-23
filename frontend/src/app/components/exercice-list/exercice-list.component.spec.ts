import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExerciceListComponent } from './exercice-list.component';

describe('ExerciceListComponent', () => {
  let component: ExerciceListComponent;
  let fixture: ComponentFixture<ExerciceListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExerciceListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExerciceListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
