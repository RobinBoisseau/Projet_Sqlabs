import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TollButtonComponent } from './toll-button.component';

describe('TollButtonComponent', () => {
  let component: TollButtonComponent;
  let fixture: ComponentFixture<TollButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TollButtonComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TollButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
