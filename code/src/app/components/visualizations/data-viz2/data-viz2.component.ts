import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as d3 from 'd3';
import {
    ATTACK_TYPE_MAPPING,
    WEAPON_TYPE_MAPPING,
} from '../../../models/category';
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
    selector: 'app-data-viz2',
    standalone: true,
    imports: [LoaderComponent, CommonModule, FormsModule],
    templateUrl: './data-viz2.component.html',
    styleUrls: ['./data-viz2.component.scss'],
})
export class DataViz2Component implements OnInit {
    protected isLoading: boolean = true;
    private currentDataField: DataField = DataField.AttackType;
    private currentData: YearEntry[] = [];
    private svg: any;
    private scales: Scales | null = null;
    private dimensions: Dimensions = { width: 0, height: 0 };
    private margins = { top: 50, right: 60, bottom: 75, left: 60 };
    protected startYear: number = 1990;
    protected isPlaying: boolean = false;
    protected playbackSpeed: number = 300;
    private playbackInterval: any;
    protected isAttack: boolean = false;

    constructor(private dataService: DataService) {}

    ngOnInit(): void {
        this.initializeChart();
        this.getData();
    }

    private initializeChart() {
        this.dimensions = {
            width: 1000 - this.margins.left - this.margins.right,
            height: 500 - this.margins.top - this.margins.bottom,
        };

        d3.select('#line-chart').selectAll('*').remove();

        this.svg = d3
            .select('#line-chart')
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
    }

    private addTitle() {
        this.svg
            .append('text')
            .attr('x', this.dimensions.width / 2)
            .attr('y', -this.margins.top / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '18px')
            .style('font-weight', 'bold')
            .text(
                'Évolution des attaques terroristes aux États-Unis (1990-2015)'
            );
    }

    protected onCategoryChange(event: Event) {
        this.isAttack = !this.isAttack;
        const selectElement = event.target as HTMLSelectElement;
        this.currentDataField =
            selectElement.value === 'attack'
                ? DataField.AttackType
                : DataField.WeaponType;
        this.getData();
    }

    private getData() {
        this.isLoading = true;
        this.dataService.data$.subscribe((data) => {
            if (data) {
                const groupedData = this.dataService.groupDataByYear(
                    data,
                    this.currentDataField
                );
                this.currentData = groupedData;
                this.updateChart();
                this.isLoading = false;
            }
        });
    }

    private updateChart() {
        const filteredData = this.currentData.filter(
            (d) => d.year >= this.startYear
        );

        this.svg.selectAll('.line').remove();
        this.svg.selectAll('.grid').remove();
        this.svg.selectAll('.axis').remove();
        this.svg.selectAll('.legend').remove();
        this.svg.selectAll('.axis-label').remove();

        this.scales = this.createScales(filteredData);

        this.addGridLines();
        this.drawLines(filteredData);
        this.drawAxes(filteredData);
        this.addAxisLabels();
        this.generateLegend(filteredData);
        this.addHoverEffect(filteredData);
    }

    private createScales(data: YearEntry[]): Scales {
        const x = d3
            .scaleLinear()
            .domain(d3.extent(data, (d) => d.year) as [number, number])
            .range([0, this.dimensions.width]);

        const y = d3
            .scaleLinear()
            .domain([0, d3.max(data, (d) => d.total)! * 1.1])
            .range([this.dimensions.height, 0]);

        const categories =
            data[0]?.counts.map(
                (c) =>
                    WEAPON_TYPE_MAPPING[c['field']] ||
                    ATTACK_TYPE_MAPPING[c['field']]
            ) || [];
        const color = d3
            .scaleOrdinal<string>()
            .domain(categories)
            .range(d3.schemeCategory10);

        return { x, y, color };
    }

    private addGridLines() {
        if (!this.scales) return;

        this.svg
            .append('g')
            .attr('class', 'grid')
            .call(
                d3
                    .axisLeft(this.scales.y)
                    .tickSize(-this.dimensions.width)
                    .tickFormat('' as any)
            )
            .style('stroke', '#e0e0e0')
            .style('stroke-width', '1px')
            .style('opacity', 0.5);
    }

    private drawLines(data: YearEntry[]) {
        if (!this.scales || !data.length) return;

        const categories = data[0].counts.map((c) => c['field']);

        categories.forEach((category) => {
            const lineGenerator = d3
                .line<YearEntry>()
                .x((d) => this.scales!.x(d.year))
                .y((d) => {
                    const countEntry = d.counts.find(
                        (c) => c['field'] === category
                    );
                    return this.scales!.y(countEntry ? countEntry.count : 0);
                })
                .curve(d3.curveMonotoneX);

            const translated_category =
                WEAPON_TYPE_MAPPING[category] || ATTACK_TYPE_MAPPING[category];
            this.svg
                .append('path')
                .datum(data)
                .attr('class', 'line')
                .attr('d', lineGenerator)
                .attr('stroke', this.scales!.color(translated_category))
                .attr('stroke-width', 3)
                .attr('fill', 'none');
        });
    }

    private drawAxes(data: YearEntry[]) {
        if (!this.scales || !data.length) return;

        const years = d3
            .range(
                Math.max(
                    d3.min(data, (d) => d.year)!,
                    d3.max(data, (d) => d.year)! + 1
                )
            )
            .filter((year) => year >= this.startYear);

        this.svg
            .append('g')
            .attr('class', 'axis axis-x')
            .attr('transform', `translate(0,${this.dimensions.height})`)
            .call(
                d3
                    .axisBottom(this.scales.x)
                    .tickValues(years)
                    .tickFormat(d3.format('d'))
            )
            .style('font-size', '12px');

        this.svg
            .append('g')
            .attr('class', 'axis axis-y')
            .call(d3.axisLeft(this.scales.y))
            .style('font-size', '12px');
    }

    private addAxisLabels() {
        this.svg
            .append('text')
            .attr('class', 'axis-label')
            .attr('x', this.dimensions.width / 2)
            .attr('y', this.dimensions.height + this.margins.bottom / 2)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .text('Années');

        this.svg
            .append('text')
            .attr('class', 'axis-label')
            .attr('transform', 'rotate(-90)')
            .attr('x', -this.dimensions.height / 2)
            .attr('y', -this.margins.left / 1.5)
            .attr('text-anchor', 'middle')
            .style('font-size', '14px')
            .text("Nombre d'attaques");
    }

    private generateLegend(data: YearEntry[]) {
        if (!this.scales || !data.length) return;

        const categories = data[0].counts.map(
            (c) =>
                WEAPON_TYPE_MAPPING[c['field']] ||
                ATTACK_TYPE_MAPPING[c['field']]
        );
        const legendWidth = 240;
        const legendHeight = categories.length * 20 + 10;
        const legendX = this.dimensions.width - legendWidth - 10;
        const legendY = 20;

        this.svg
            .append('rect')
            .attr('x', legendX - 10)
            .attr('y', legendY - 10)
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .attr('fill', 'white')
            .attr('opacity', 0.8)
            .attr('rx', 5)
            .attr('ry', 5)
            .style('stroke', '#ddd');

        const legend = this.svg
            .selectAll('.legend')
            .data(categories)
            .enter()
            .append('g')
            .attr('class', 'legend')
            .attr(
                'transform',
                (d: string, i: number) =>
                    `translate(${legendX},${legendY + i * 20})`
            )
            .style('cursor', 'pointer');

        legend
            .append('rect')
            .attr('x', 0)
            .attr('width', 18)
            .attr('height', 18)
            .attr('fill', (d: string) => this.scales!.color(d))
            .style('stroke', '#333');

        legend
            .append('text')
            .attr('x', 24)
            .attr('y', 9)
            .attr('dy', '.35em')
            .style('font-size', '12px')
            .style('text-anchor', 'start')
            .text((d: string) => d);

        legend.on('click', (event: MouseEvent, category: string) => {
            const line = this.svg
                .selectAll('.line')
                .filter((d: any, i: number, nodes: any) => {
                    return nodes[i].__data__.key === category;
                });

            const currentOpacity = line.style('opacity');
            const newOpacity = currentOpacity === '1' ? '0.2' : '1';
            line.style('opacity', newOpacity);

            const legendItem = d3.select(event.currentTarget as SVGGElement);
            legendItem.select('rect').style('opacity', newOpacity);
            legendItem.select('text').style('opacity', newOpacity);
        });
    }

    private addHoverEffect(data: YearEntry[]) {
        if (!this.scales || !data.length) return;

        const chartContainer = document.getElementById('line-chart');
        if (!chartContainer) return;

        const containerRect = chartContainer.getBoundingClientRect();

        const tooltip = d3
            .select('#line-chart')
            .append('div')
            .attr('class', 'custom-tooltip')
            .style('opacity', 0)
            .style('position', 'absolute')
            .style('pointer-events', 'none')
            .style('background', 'white')
            .style('color', '#333')
            .style('padding', '10px')
            .style('border-radius', '5px')
            .style('font-size', '12px')
            .style('box-shadow', '0 2px 10px rgba(0, 0, 0, 0.5)')
            .style('transition', 'opacity 0.2s')
            .style('z-index', '10')
            .style('font-weight', '500');

        const hoverLine = this.svg
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

        const dots = this.svg.append('g').attr('class', 'dots');

        this.svg
            .append('rect')
            .attr('class', 'hover-zone')
            .attr('width', this.dimensions.width)
            .attr('height', this.dimensions.height)
            .style('fill', 'none')
            .style('pointer-events', 'all')
            .on('mouseover', () => {
                hoverLine.style('opacity', 1);
                tooltip.style('opacity', 1);
            })
            .on('mouseout', () => {
                hoverLine.style('opacity', 0);
                tooltip.style('opacity', 0);
                dots.selectAll('*').remove();
            })
            .on('mousemove', (event: MouseEvent) => {
                const mouseX = d3.pointer(event, this.svg.node())[0];
                const year = Math.round(this.scales!.x.invert(mouseX));

                const closestYearData = data.reduce((prev, curr) =>
                    Math.abs(curr.year - year) < Math.abs(prev.year - year)
                        ? curr
                        : prev
                );

                const xPos = this.scales!.x(closestYearData.year);
                hoverLine.attr('x1', xPos).attr('x2', xPos);

                dots.selectAll('*').remove();
                closestYearData.counts.forEach((countEntry: any) => {
                    dots.append('circle')
                        .attr('cx', xPos)
                        .attr('cy', this.scales!.y(countEntry.count))
                        .attr('r', 5)
                        .attr(
                            'fill',
                            this.scales!.color(
                                WEAPON_TYPE_MAPPING[countEntry.field] ||
                                    ATTACK_TYPE_MAPPING[countEntry.field]
                            )
                        )
                        .attr('stroke', 'white')
                        .attr('stroke-width', 1);
                });

                const [mouseXPos, mouseYPos] = d3.pointer(
                    event,
                    chartContainer
                );
                const tooltipWidth = 220;
                const tooltipHeight = 180;

                let left = mouseXPos + 20;
                let top = mouseYPos + 20;

                if (left + tooltipWidth > containerRect.width) {
                    left = mouseXPos - tooltipWidth - 10;
                }
                if (top + tooltipHeight > containerRect.height) {
                    top = mouseYPos - tooltipHeight - 10;
                }

                tooltip
                    .html(this.generateTooltipContent(closestYearData))
                    .style('left', `${left}px`)
                    .style('top', `${top}px`)
                    .style('opacity', 1);
            });
    }

    private generateTooltipContent(yearData: YearEntry): string {
        const sortedCounts = [...yearData.counts].sort(
            (a, b) => b.count - a.count
        );
        const total = sortedCounts.reduce((sum, item) => sum + item.count, 0);

        let content = `
            <div class="tooltip-container">
                <div class="tooltip-header">
                    <strong>
                    <div class="tooltip-year"> Année: ${yearData.year}</div>
                    <div style="margin-top: 2px;"></div>
                    <div class="tooltip-total">${total} attaques</div>
                    <div style="margin-top: 2px;"></div>
                    </strong>
                </div>
                <hr style="border: none; border-top: 1px solid white; margin: 4px 0;">
                <div style="margin-top: 5px;"></div>
                <div class="tooltip-items">
        `;

        sortedCounts.forEach((item) => {
            const percentage =
                total > 0 ? ((item.count / total) * 100).toFixed(1) : '0';
            content += `
                <div class="tooltip-item"
                        style="color: ${this.scales!.color(
                            WEAPON_TYPE_MAPPING[item['field']] ||
                                ATTACK_TYPE_MAPPING[item['field']]
                        )};
                        border: 2px solid white;
                        box-shadow: 0 0 2px rgba(0,0,0,0.3)">
                        </span>
                >
                    <strong>
                    <span class="tooltip-category">${
                        WEAPON_TYPE_MAPPING[item['field']] ||
                        ATTACK_TYPE_MAPPING[item['field']]
                    }</span>
                    <span class="tooltip-value">${
                        item.count
                    } <strong>(${percentage}%) </span>
                    </strong>
                </div>
                <div style="margin-top: 3px;"></div>
            `;
        });

        content += `</div></div>`;
        return content;
    }

    protected onStartYearChange(event: Event) {
        const input = event.target as HTMLInputElement;
        this.startYear = parseInt(input.value);
        this.updateChart();
    }
}
