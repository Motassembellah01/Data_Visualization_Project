import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DataService } from '../../services/data/data.service';

@Component({
    selector: 'app-root',
    imports: [RouterOutlet],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
})
export class AppComponent {
    constructor(private dataService: DataService) {
        this.dataService.loadData();
    }
}
