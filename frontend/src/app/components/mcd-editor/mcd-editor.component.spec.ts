import { ComponentFixture, TestBed } from '@angular/core/testing';

import { McdEditorComponent } from './mcd-editor.component';

describe('McdEditorComponent', () => {
  let component: McdEditorComponent;
  let fixture: ComponentFixture<McdEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [McdEditorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(McdEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
