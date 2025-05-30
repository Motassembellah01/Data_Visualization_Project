import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { TargetCategory } from '../../../models/category';
import { DataField, YearEntry } from '../../../models/data';
import { DataService } from '../../../services/data/data.service';
import { LoaderComponent } from '../../loader/loader.component';

type Scales = {
    x: d3.ScaleLinear<number, number>;
    y: d3.ScaleLinear<number, number>;
    color: d3.ScaleOrdinal<string, string, never>;
};

type Dimensions = {
    width: number;
    height: number;
};

@Component({
    selector: 'app-data-viz1',
    imports: [LoaderComponent, CommonModule],
    templateUrl: './data-viz1.component.html',
    styleUrl: './data-viz1.component.scss',
})
export class DataViz1Component implements OnInit {
    protected isLoading: boolean = true;
    private dimensions: Dimensions = { width: 0, height: 0 };
    private margins = { top: 50, right: 60, bottom: 75, left: 60 };
    private scales: Scales | null = null;
    private svg: d3.Selection<SVGGElement, unknown, HTMLElement, any> | null =
        null;

    constructor(private dataService: DataService) {}

    ngOnInit(): void {
        this.getData();
    }

    private getData() {
        this.dataService.data$.subscribe((data) => {
            if (data) {
                const targetTypeData = this.dataService.groupDataByYear(
                    data,
                    DataField.TargetType
                );

                const targetTypeCategories =
                    this.dataService.categorizeTargetTypeData(targetTypeData);

                this.createStackedAreaChart(targetTypeCategories);
                this.isLoading = false;
            }
        });
    }

    private createStackedAreaChart(targetTypeCategories: YearEntry[]) {
        this.dimensions = {
            width: 1000 - this.margins.left - this.margins.right,
            height: 500 - this.margins.top - this.margins.bottom,
        };

        this.svg = d3
            .select('#stacked-area-chart')
            .append('svg')
            .attr(
                'width',
                this.dimensions.width + this.margins.left + this.margins.right
            )
            .attr(
                'height',
                this.dimensions.height + this.margins.top + this.margins.bottom
            )
            .append('g')
            .attr(
                'transform',
                `translate(${this.margins.left},${this.margins.top})`
            );

        this.addTitle();

        this.scales = this.createScales(targetTypeCategories);
        const stackedData = this.stackData(targetTypeCategories);

        this.addGridLines();
        this.drawStackedAreas(stackedData);
        this.drawAxes(targetTypeCategories);
        this.addAxisLabels();
        this.generateLegend();
        this.addHoverEffect(targetTypeCategories);
    }

    private addTitle() {
        this.svg!.append('text')
            .attr('x', this.dimensions.width / 2)
            .attr('y', -this.margins.top / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '18px')
            .style('font-weight', 'bold')
            .text(
                'Évolution des attaques terroristes aux États-Unis par catégorie de cibles entre 1990 et 2015'
            );
    }

    private generateTooltipContent(yearData: YearEntry): string {
        const sortedCounts = [...yearData.counts].sort(
            (a, b) => b.count - a.count
        );

        let content = `
            <div>Année ${yearData.year}</div>
            <div>${yearData.total.toLocaleString()} attaques</div>
            <hr>
        `;

        sortedCounts.forEach((item) => {
            const percentage = ((item.count / yearData.total) * 100).toFixed(1);
            const color = this.scales!.color(item['category']);

            content += `
                <div style="color: ${color}">
                    <span>${item['category']}:</span>
                    <span>${item.count} (${percentage}%)</span>
                </div>
            `;
        });

        return content;
    }

    private addGridLines() {
        this.svg!.append('g')
            .selectAll('.grid')
            .data(this.scales!.y.ticks(10))
            .join('line')
            .attr('class', 'grid')
            .attr('x1', 0)
            .attr('x2', this.dimensions.width)
            .attr('y1', (d) => this.scales!.y(d))
            .attr('y2', (d) => this.scales!.y(d))
            .style('stroke', '#ccc')
            .style('stroke-width', '1');
    }

    private createScales(targetTypeCategories: YearEntry[]) {
        const x = d3
            .scaleLinear()
            .domain(
                d3.extent(targetTypeCategories, (d) => d.year) as [
                    number,
                    number
                ]
            )
            .range([0, this.dimensions.width]);

        const y = d3
            .scaleLinear()
            .domain([0, d3.max(targetTypeCategories, (d) => d.total)!])
            .range([this.dimensions.height, 0]);

        const color = d3
            .scaleOrdinal<string>()
            .domain(Object.values(TargetCategory))
            .range(d3.schemeCategory10);

        return { x, y, color };
    }

    private stackData(targetTypeCategories: YearEntry[]) {
        const stack = d3
            .stack<YearEntry>()
            .keys(Object.values(TargetCategory))
            .value((d, key) => {
                const categoryEntry = d.counts.find(
                    (c) => c['category'] === key
                );
                return categoryEntry ? categoryEntry.count : 0;
            });

        return stack(targetTypeCategories);
    }

    private drawStackedAreas(stackedData: d3.Series<YearEntry, string>[]) {
        const area = d3
            .area<d3.SeriesPoint<YearEntry>>()
            .x((d) => this.scales!.x(d.data.year))
            .y0((d) => this.scales!.y(d[0]))
            .y1((d) => this.scales!.y(d[1]));

        this.svg!.selectAll('path')
            .data(stackedData)
            .join('path')
            .attr('fill', (d) => this.scales!.color(d.key))
            .attr('d', area);
    }

    private drawAxes(targetTypeCategories: YearEntry[]) {
        this.svg!.append('g')
            .attr('transform', `translate(0,${this.dimensions.height})`)
            .call(
                d3
                    .axisBottom(this.scales!.x)
                    .ticks(targetTypeCategories.length)
                    .tickFormat(d3.format('d'))
            )
            .style('font-size', '12px');

        this.svg!.append('g')
            .call(d3.axisLeft(this.scales!.y))
            .style('font-size', '12px');
    }

    private addAxisLabels() {
        const offset = 50;
        this.svg!.append('text')
            .attr('x', this.dimensions.width / 2)
            .attr('y', this.dimensions.height + offset)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .text('Années');

        this.svg!.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -this.dimensions.height / 2)
            .attr('y', -offset)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .text("Nombre total d'attaques terroristes");
    }

    private generateLegend() {
        const colorContainerSize = 18;
        const legendItemHeight = 20;
        const legendItemCount = Object.values(TargetCategory).length;

        const legendWidth = 200;
        const legendHeight = legendItemCount * legendItemHeight;
        const legendPadding = 10;

        this.svg!.append('rect')
            .attr('x', this.dimensions.width - legendWidth - legendPadding)
            .attr('y', -legendPadding)
            .attr('width', legendWidth + legendPadding * 2)
            .attr('height', legendHeight + legendPadding * 2)
            .attr('fill', 'white')
            .style('opacity', 0.8)
            .attr('rx', 5)
            .attr('ry', 5)
            .style('stroke', '#ddd');

        const legend = this.svg!.selectAll('.legend')
            .data(Object.values(TargetCategory))
            .join('g')
            .attr('class', 'legend')
            .attr(
                'transform',
                (d, i) =>
                    `translate(${this.dimensions.width - legendWidth},${
                        i * legendItemHeight
                    })`
            );

        legend
            .append('rect')
            .attr('x', 0)
            .attr('width', colorContainerSize)
            .attr('height', colorContainerSize)
            .attr('fill', this.scales!.color)
            .style('stroke', 'black')
            .style('stroke-width', 1);

        legend
            .append('text')
            .attr('x', colorContainerSize + 6)
            .attr('y', colorContainerSize / 2)
            .attr('dy', '.35em')
            .style('text-anchor', 'start')
            .style('font-size', '14px')
            .text((d) => d);
    }

    private addHoverEffect(targetTypeCategories: YearEntry[]) {
        const hoverGroup = this.svg!.append('g').attr('class', 'hover-group');

        const hoverLine = hoverGroup
            .append('line')
            .attr('class', 'hover-line')
            .attr('x1', 0)
            .attr('x2', 0)
            .attr('y1', 0)
            .attr('y2', this.dimensions.height)
            .style('stroke', '#333')
            .style('stroke-width', 1)
            .style('stroke-dasharray', '3,3')
            .style('opacity', 0);

        const hoverZone = this.svg!.append('rect')
            .attr('class', 'hover-zone')
            .attr('width', this.dimensions.width)
            .attr('height', this.dimensions.height)
            .style('fill', 'none')
            .style('pointer-events', 'all')
            .on('mouseover', () => hoverLine.style('opacity', 1))
            .on('mouseout', () => {
                hoverLine.style('opacity', 0);
                d3.select('#tooltip').style('opacity', 0);
            })
            .on('mousemove', (event) => {
                const mouseX = d3.pointer(event)[0];
                const year = Math.round(this.scales!.x.invert(mouseX));

                const closestYearData = targetTypeCategories.reduce(
                    (prev, curr) =>
                        Math.abs(curr.year - year) < Math.abs(prev.year - year)
                            ? curr
                            : prev
                );

                const xPos = this.scales!.x(closestYearData.year);

                hoverLine.attr('x1', xPos).attr('x2', xPos);

                const tooltip = d3.select('#tooltip');
                tooltip
                    .html(this.generateTooltipContent(closestYearData))
                    .style('opacity', 1)
                    .style('left', `${xPos + 60}px`)
                    .style('top', `${d3.pointer(event)[1] + 60}px`);
            });
    }
}
