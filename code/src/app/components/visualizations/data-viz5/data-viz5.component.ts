import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { FeatureCollection } from 'geojson';
import { DataService } from '../../../services/data/data.service';
import { LoaderComponent } from '../../loader/loader.component';

@Component({
    selector: 'app-data-viz5',
    imports: [LoaderComponent, CommonModule],
    templateUrl: './data-viz5.component.html',
    styleUrl: './data-viz5.component.scss',
})
export class DataViz5Component implements OnInit {
    isLoading = true;

    constructor(private dataService: DataService) {}

    ngOnInit(): void {
        this.dataService.getIncendiaryCountsByState().subscribe((stateData) => {
            d3.json<FeatureCollection>('geojson/us-states.geojson').then(
                (geoData) => {
                    if (!geoData) return;
                    this.drawMap(stateData, geoData);
                    this.isLoading = false;
                }
            );
        });
    }

    private drawMap(
        stateData: { state: string; count: number }[],
        geoData: FeatureCollection
    ): void {
        const width = 1200;
        const height = 600;

        d3.select('#map-container').selectAll('*').remove();

        const svg = d3
            .select('#map-container')
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .style('font-size', '20px')
            .style('font-weight', 'bold')
            .text('Répartition des attaques incendiaires par État (1990–2015)');

        const projection = d3
            .geoAlbersUsa()
            .translate([width / 2, height / 2])
            .scale(1000);
        const path = d3.geoPath().projection(projection);

        const maxCount = d3.max(stateData, (d) => d.count) || 1;
        const color = d3
            .scaleSequential(d3.interpolateYlOrRd)
            .domain([0, maxCount]);

        //Ajout tooltip
        svg.selectAll('path')
            .data(geoData.features)
            .enter()
            .append('path')
            .attr('d', path)
            .attr('fill', (d) => {
                const stateName = d.properties?.['NAME'];
                const state = stateData.find((s) => s.state === stateName);
                const count = state?.count || 0;
                return count === 0 ? '#eee' : color(count);
            })
            .attr('stroke', '#999')
            .attr('stroke-width', 0.5)
            .on('mouseover', function (event, d) {
                const stateName = d.properties?.['NAME'];
                const count =
                    stateData.find((s) => s.state === stateName)?.count || 0;

                tooltip.transition().duration(200).style('opacity', 1);
                tooltip
                    .html(
                        `<strong>${stateName}</strong><br>${count} attaque(s)`
                    )
                    .style('left', event.pageX + 10 + 'px')
                    .style('top', event.pageY - 28 + 'px');

                d3.select(this)
                    .attr('stroke', '#333')
                    .attr('stroke-width', 1.5);
            })
            .on('mousemove', function (event) {
                tooltip
                    .style('left', event.pageX + 10 + 'px')
                    .style('top', event.pageY - 28 + 'px');
            })
            .on('mouseout', function () {
                tooltip.transition().duration(200).style('opacity', 0);
                d3.select(this)
                    .attr('stroke', '#999')
                    .attr('stroke-width', 0.5);
            });

        const tooltip = d3
            .select('body')
            .append('div')
            .attr('class', 'state-tooltip')
            .style('position', 'absolute')
            .style('background', 'white')
            .style('padding', '6px 10px')
            .style('border', '1px solid #aaa')
            .style('border-radius', '4px')
            .style('pointer-events', 'none')
            .style('opacity', 0);

        // Ajout de la légende verticale
        const legendWidth = 20;
        const legendHeight = 300;
        const legendRightMargin = 120;

        const maxInc = d3.max(stateData, (d) => d.count) || 1;
        const legendScale = d3
            .scaleLinear()
            .range([legendHeight, 0])
            .domain([0, maxInc]);

        const legendAxis = d3
            .axisRight(legendScale)
            .ticks(5)
            .tickFormat(d3.format('d'));

        const legendGroup = svg
            .append('g')
            .attr(
                'transform',
                `translate(${width - legendRightMargin}, ${
                    (height - legendHeight) / 2
                })`
            );

        // Définir un gradient vertical
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
            .attr('stop-color', (d) => color(d * maxInc));

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
            .attr('x', -150)
            .attr('y', -8)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .style('fill', '#555')
            .text("Nombre d'incidents");
    }
}
