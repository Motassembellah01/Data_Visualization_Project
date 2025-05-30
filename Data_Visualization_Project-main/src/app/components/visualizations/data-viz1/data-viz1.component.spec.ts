import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataViz1Component } from './data-viz1.component';

describe('DataViz1Component', () => {
    let component: DataViz1Component;
    let fixture: ComponentFixture<DataViz1Component>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DataViz1Component],
        }).compileComponents();

        fixture = TestBed.createComponent(DataViz1Component);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
