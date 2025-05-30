import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataViz3Component } from './data-viz3.component';

describe('DataViz3Component', () => {
    let component: DataViz3Component;
    let fixture: ComponentFixture<DataViz3Component>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DataViz3Component],
        }).compileComponents();

        fixture = TestBed.createComponent(DataViz3Component);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
