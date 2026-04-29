import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DependenceTableComponent } from './dependence-table.component';

describe('DependenceTableComponent', () => {
  let component: DependenceTableComponent;
  let fixture: ComponentFixture<DependenceTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DependenceTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DependenceTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
