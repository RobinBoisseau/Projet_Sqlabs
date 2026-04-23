import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ExerciceDetailComponent } from './exercice-detail.component';

describe('ExerciceDetailComponent', () => {
  let component: ExerciceDetailComponent;
  let fixture: ComponentFixture<ExerciceDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExerciceDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExerciceDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
