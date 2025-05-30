import { NgIf } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { WEAPON_TYPE_MAPPING } from '../../../models/category';
import { HeatmapCell } from '../../../models/data';
import { DataService } from '../../../services/data/data.service';
import { LoaderComponent } from '../../loader/loader.component';

@Component({
    selector: 'app-data-viz4',
    standalone: true,
    imports: [NgIf, LoaderComponent],
    templateUrl: './data-viz4.component.html',
    styleUrls: ['./data-viz4.component.scss'],
})
export class DataViz4Component implements OnInit {
    isLoading = true;

    constructor(private dataService: DataService) {}

    ngOnInit(): void {
        this.dataService.getWeaponMonthFrequencyData().subscribe((data) => {
            this.createHeatmap(data);
            d3.select('.heatmap-tooltip').remove();
            d3.select('body')
                .append('div')
                .attr('class', 'heatmap-tooltip')
                .style('opacity', 0);

            this.isLoading = false;
        });
    }

    private createHeatmap(data: HeatmapCell[]): void {
        d3.select('#heatmap-container-viz4').selectAll('*').remove();
        const margins = { top: 70, right: 60, bottom: 150, left: 170 };
        const width = 1200 - margins.left - margins.right;
        const height = 700 - margins.top - margins.bottom;

        const svg = d3
            .select('#heatmap-container-viz4')
            .append('svg')
            .attr('width', width + margins.left + margins.right)
            .attr('height', height + margins.top + margins.bottom)
            .append('g')
            .attr('transform', `translate(${margins.left},${margins.top})`);

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', -margins.top / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '20px')
            .style('font-weight', 'bold')
            .text(
                'Utilisation des armes par mois — Tendances globales entre 1990 et 2015'
            );

        const months = [
            'Janvier',
            'Février',
            'Mars',
            'Avril',
            'Mai',
            'Juin',
            'Juillet',
            'Août',
            'Septembre',
            'Octobre',
            'Novembre',
            'Décembre',
        ];
        let categories = Array.from(new Set(data.map((d) => d.category)));
        categories = categories.filter((c) => c !== 'Other');
        categories.push('Other');

        const x = d3.scaleBand().range([0, width]).domain(months).padding(0.05);

        const y = d3
            .scaleBand()
            .range([0, height])
            .domain(categories)
            .padding(0.05);

        const color = d3
            .scaleSequential(d3.interpolateYlOrRd)
            .domain([0, d3.max(data, (d) => d.deaths) || 1]);

        svg.append('g').call(
            d3.axisLeft(y).tickFormat((d) => WEAPON_TYPE_MAPPING[d] || d)
        );

        svg.append('g')
            .attr('transform', `translate(0, ${height})`)
            .call(d3.axisBottom(x));

        svg.selectAll('.tick text')
            .style('font-size', '12px')
            .style('fill', '#333');
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height + margins.top)
            .style('text-anchor', 'middle')
            .style('font-size', '15px')
            .style('fill', '#444')
            .text('Mois');

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -(margins.left - 40))
            .attr('x', -height / 2)
            .style('text-anchor', 'middle')
            .style('font-size', '15px')
            .style('fill', '#444')
            .text('Type d’arme');

        svg.selectAll()
            .data(data)
            .enter()
            .append('rect')
            .attr('x', (d) => x(d.month) || 0)
            .attr('y', (d) => y(d.category) || 0)
            .attr('width', x.bandwidth())
            .attr('height', y.bandwidth())
            .style('fill', (d) => color(d.deaths))
            .on('mouseover', function (event, d) {
                d3.select(this)
                    .style('stroke', '#333')
                    .style('stroke-width', '1.5px');

                d3.select('.heatmap-tooltip')
                    .style('opacity', 1)
                    .html(
                        `<strong>${
                            WEAPON_TYPE_MAPPING[d.category] || d.category
                        }</strong><br/>${d.month} : ${d.deaths} attaque(s)`
                    )
                    .style('left', event.pageX + 10 + 'px')
                    .style('top', event.pageY - 28 + 'px');
            })
            .on('mousemove', function (event) {
                d3.select('.heatmap-tooltip')
                    .style('left', event.pageX + 10 + 'px')
                    .style('top', event.pageY - 28 + 'px');
            })
            .on('mouseout', function () {
                d3.select(this).style('stroke', 'none');
                d3.select('.heatmap-tooltip').style('opacity', 0);
            });

        svg.selectAll('.heatmap-text')
            .data(data)
            .enter()
            .append('text')
            .attr('x', (d) => (x(d.month) || 0) + x.bandwidth() / 2)
            .attr('y', (d) => (y(d.category) || 0) + y.bandwidth() / 2 + 5)
            .text((d) => (d.deaths > 0 ? d.deaths : '')) // Ne pas afficher les zeros - POssible de changer apres le feedback
            .attr('text-anchor', 'middle')
            .style('fill', '#000')
            .style('font-size', '12px')
            .style('pointer-events', 'none');

        // légende verticale
        const legendWidth = 20;
        const legendHeight = 300;
        const legendMargins = { top: 10, right: 20 };

        const maxDeaths = d3.max(data, (d) => d.deaths) || 1;
        const legendScale = d3
            .scaleLinear()
            .range([legendHeight, 0])
            .domain([0, maxDeaths]);

        const legendAxis = d3
            .axisRight(legendScale)
            .ticks(5)
            .tickFormat(d3.format('d'));

        const legendGroup = svg
            .append('g')
            .attr(
                'transform',
                `translate(${width + legendMargins.right}, ${
                    (height - legendHeight) / 2
                })`
            );

        // gradient vertical
        const defs = svg.append('defs');
        const linearGradient = defs
            .append('linearGradient')
            .attr('id', 'linear-gradient-vertical')
            .attr('x1', '0%')
            .attr('y1', '100%')
            .attr('x2', '0%')
            .attr('y2', '0%');

        const stops = d3.range(0, 1.01, 0.01);
        linearGradient
            .selectAll('stop')
            .data(stops)
            .enter()
            .append('stop')
            .attr('offset', (d) => `${d * 100}%`)
            .attr('stop-color', (d) => color(d * maxDeaths));

        legendGroup
            .append('rect')
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .style('fill', 'url(#linear-gradient-vertical)')
            .style('stroke', '#ccc');

        legendGroup
            .append('g')
            .attr('transform', `translate(${legendWidth}, 0)`)
            .call(legendAxis);

        // Titre de la légende
        legendGroup
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -margins.left)
            .attr('y', -8)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('fill', '#555')
            .text("Nombre d'attaques");
    }
}
