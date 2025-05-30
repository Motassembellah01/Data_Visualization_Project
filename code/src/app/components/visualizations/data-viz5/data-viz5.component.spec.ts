import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataViz5Component } from './data-viz5.component';

describe('DataViz5Component', () => {
    let component: DataViz5Component;
    let fixture: ComponentFixture<DataViz5Component>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DataViz5Component],
        }).compileComponents();

        fixture = TestBed.createComponent(DataViz5Component);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
