import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TentativeButtonComponent } from './tentative-button.component';

describe('TentativeButtonComponent', () => {
  let component: TentativeButtonComponent;
  let fixture: ComponentFixture<TentativeButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TentativeButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TentativeButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
