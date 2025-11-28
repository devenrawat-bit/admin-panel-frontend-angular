import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Cms } from './cms';

describe('Cms', () => {
  let component: Cms;
  let fixture: ComponentFixture<Cms>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cms]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Cms);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
