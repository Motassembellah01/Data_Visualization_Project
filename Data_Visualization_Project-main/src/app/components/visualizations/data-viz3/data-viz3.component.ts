import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import * as d3 from 'd3';
import { HeatmapCell, MonthEntry } from '../../../models/data';
import { DataService } from '../../../services/data/data.service';
import { LoaderComponent } from '../../loader/loader.component';

@Component({
    selector: 'app-data-viz3',
    imports: [MatProgressSpinnerModule, CommonModule, LoaderComponent],
    templateUrl: './data-viz3.component.html',
    styleUrl: './data-viz3.component.scss',
    standalone: true,
})
export class DataViz3Component implements OnInit {
    isLoading = true;

    constructor(private dataService: DataService) {}

    ngOnInit(): void {
        this.loadData();
    }

    private loadData(): void {
        this.dataService.getMonthlyDeathData().subscribe((data) => {
            if (data.length > 0) {
                this.renderHeatmap(data);
                this.isLoading = false;
            }
        });
    }

    private renderHeatmap(data: MonthEntry[]): void {
        const container = d3.select('#heatmap-container');
        container.selectAll('*').remove();

        const margins = { top: 30, right: 60, bottom: 200, left: 150 };
        const dimensions = {
            width: 1200 - margins.left - margins.right,
            height: 600 - margins.top - margins.bottom,
        };

        const svg = container
            .append('svg')
            .attr('width', dimensions.width + margins.left + margins.right)
            .attr('height', dimensions.height + margins.top + margins.bottom)
            .append('g')
            .attr('transform', `translate(${margins.left},${margins.top})`);

        const heatmapData: HeatmapCell[] = [];
        let allCategories = new Set<string>();
        const allMonths = data.map((d) => d.month);

        data.forEach((monthEntry) => {
            monthEntry.counts.forEach((countEntry) => {
                allCategories.add(countEntry['category']);
            });
        });

        allCategories = new Set<string>();
        data.forEach((monthEntry) => {
            monthEntry.counts.forEach((countEntry) => {
                allCategories.add(countEntry['category']);
            });
        });

        const sortedCategories = [
            'Civils et institutions sociales',
            'Gouvernement et sécurité',
            'Secteur privé et médias',
            'Infrastructures et transports',
            'Autres',
        ];

        allMonths.forEach((month) => {
            sortedCategories.forEach((category) => {
                const monthData = data.find((d) => d.month === month);
                const countEntry = monthData?.counts.find(
                    (c) => c['category'] === category
                );
                heatmapData.push({
                    month,
                    category,
                    deaths: countEntry ? countEntry.count : 0,
                });
            });
        });

        const months = data.map((d) => d.month);

        const xScale = d3
            .scaleBand()
            .domain(sortedCategories)
            .range([0, dimensions.width])
            .padding(0.1);

        const yScale = d3
            .scaleBand()
            .domain(months)
            .range([0, dimensions.height])
            .padding(0.1);

        const colorThresholds = [1, 5, 10, 15, 20];
        const colorScale = d3
            .scaleThreshold<number, string>()
            .domain(colorThresholds)
            .range([
                '#f0f0f0',
                '#f5e8c9',
                '#e6c994',
                '#e68a4f',
                '#cc3311',
                '#800026',
            ]);

        svg.selectAll()
            .data(heatmapData)
            .enter()
            .append('rect')
            .attr('x', (d) => xScale(d.category)!)
            .attr('y', (d) => yScale(d.month)!)
            .attr('width', xScale.bandwidth())
            .attr('height', yScale.bandwidth())
            .attr('rx', 4)
            .attr('ry', 4)
            .style('fill', (d) => colorScale(d.deaths))
            .style('stroke', '#fff')
            .style('stroke-width', 0.5)
            .attr('class', 'heatmap-cell')
            .attr('data-month', (d) => d.month)
            .attr('data-category', (d) => d.category)
            .attr('data-deaths', (d) => d.deaths);

        svg.append('g')
            .attr('transform', `translate(0,${dimensions.height})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('dx', '-.8em')
            .attr('dy', '.15em')
            .attr('transform', 'rotate(-45)')
            .style('font-size', '12px');

        svg.append('g')
            .call(d3.axisLeft(yScale))
            .selectAll('text')
            .style('font-size', '12px')
            .style('text-anchor', 'end')
            .attr('dx', '-0.5em');

        svg.append('text')
            .attr('x', dimensions.width / 2)
            .attr('y', dimensions.height + margins.bottom / 1.8)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .text('Types de cibles');

        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -dimensions.height / 2)
            .attr('y', -margins.left + 20)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .text('Mois');

        this.addColorLegend(
            svg,
            dimensions.width,
            dimensions.height,
            colorThresholds
        );

        this.addTooltips(svg);
    }

    private addColorLegend(
        svg: d3.Selection<SVGGElement, unknown, HTMLElement, any>,
        width: number,
        height: number,
        thresholds: number[]
    ): void {
        const legendWidth = 325;
        const legendHeight = 25;
        const legendX = width - legendWidth;
        const legendY = height + 125;

        const legendGroup = svg
            .append('g')
            .attr('transform', `translate(${legendX},${legendY})`);

        const defs = svg.append('defs');
        const gradient = defs
            .append('linearGradient')
            .attr('id', 'heatmap-gradient')
            .attr('x1', '0%')
            .attr('x2', '100%');

        const colorStops = [
            { offset: 0, color: '#f0f0f0' },
            { offset: 0.0001, color: '#f5e8c9' },
            { offset: 0.2, color: '#e6c994' },
            { offset: 0.4, color: '#e68a4f' },
            { offset: 0.6, color: '#cc3311' },
            { offset: 0.8, color: '#800026' },
        ];

        colorStops.forEach((stop) => {
            gradient
                .append('stop')
                .attr('offset', `${stop.offset * 100}%`)
                .attr('stop-color', stop.color);
        });

        legendGroup
            .append('rect')
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .style('fill', 'url(#heatmap-gradient)')
            .style('stroke', '#999');

        const legendScale = d3
            .scaleLinear()
            .domain([0, thresholds[thresholds.length - 1]])
            .range([0, legendWidth]);

        const formatLegend = (d: number, i: number) => {
            if (i === 0) return '0';
            if (i === 1) return '1+';
            if (i === 2) return '5+';
            if (i === 3) return '10+';
            if (i === 4) return '15+';
            return '20+';
        };

        legendGroup
            .append('g')
            .attr('transform', `translate(0,${legendHeight})`)
            .call(
                d3
                    .axisBottom(legendScale)
                    .tickValues([0, 1, 5, 10, 15, 20])
                    .tickFormat((d, i) => formatLegend(d as number, i))
            )
            .style('font-size', '12px');

        legendGroup
            .append('text')
            .attr('x', legendWidth / 2)
            .attr('y', -5)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .text('Nombre de morts');
    }

    private addTooltips(
        svg: d3.Selection<SVGGElement, unknown, HTMLElement, any>
    ): void {
        const tooltip = d3
            .select('body')
            .append('div')
            .attr('class', 'heatmap-tooltip')
            .style('position', 'absolute')
            .style('opacity', 0)
            .style('background', 'white')
            .style('border', '1px solid #ddd')
            .style('border-radius', '5px')
            .style('padding', '10px')
            .style('pointer-events', 'none');

        svg.selectAll('.heatmap-cell')
            .on('mouseover', function (event) {
                d3.select(this)
                    .style('stroke', '#333')
                    .style('stroke-width', 2);

                const month = d3.select(this).attr('data-month');
                const category = d3.select(this).attr('data-category');
                const deaths = d3.select(this).attr('data-deaths');

                tooltip.transition().duration(200).style('opacity', 0.9);
                tooltip
                    .html(
                        `
          <div><strong>${month}</strong></div><br/>
          <div>Cible: ${category}</div>
          <div>Morts total: ${deaths}</div>
        `
                    )
                    .style('left', event.pageX + 10 + 'px')
                    .style('top', event.pageY - 28 + 'px');
            })
            .on('mouseout', function () {
                d3.select(this)
                    .style('stroke', '#fff')
                    .style('stroke-width', 0.5);
                tooltip.transition().duration(500).style('opacity', 0);
            });
    }
}
