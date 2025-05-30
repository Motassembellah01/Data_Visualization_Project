import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataViz4Component } from './data-viz4.component';

describe('DataViz4Component', () => {
    let component: DataViz4Component;
    let fixture: ComponentFixture<DataViz4Component>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [DataViz4Component],
        }).compileComponents();

        fixture = TestBed.createComponent(DataViz4Component);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
