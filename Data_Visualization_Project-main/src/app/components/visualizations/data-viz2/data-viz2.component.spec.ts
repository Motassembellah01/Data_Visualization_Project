import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataViz2Component } from './data-viz2.component';

describe('DataViz2Component', () => {
    let component: DataViz2Component;
    let fixture: ComponentFixture<DataViz2Component>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DataViz2Component],
        }).compileComponents();

        fixture = TestBed.createComponent(DataViz2Component);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
