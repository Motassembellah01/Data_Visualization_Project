import { Injectable } from '@angular/core';
import * as d3 from 'd3';
import { BehaviorSubject, map, Observable } from 'rxjs';
import {
    StateAttackCount,
    TARGET_CATEGORY_MAPPING,
    TargetCategory,
    WEAPON_TYPE_MAPPING,
} from '../../models/category';
import {
    CountEntry,
    DataField,
    HeatmapCell,
    MonthEntry,
    YearEntry,
} from '../../models/data';

@Injectable({
    providedIn: 'root',
})
export class DataService {
    private dataSubject = new BehaviorSubject<d3.DSVRowArray<string> | null>(
        null
    );
    data$ = this.dataSubject.asObservable();

    // Méthode appelée une seule fois dans la composante App
    loadData() {
        // Load data from the public folder
        d3.dsv(';', 'data/data_filtered.csv')
            .then((data) => {
                this.dataSubject.next(data);
            })
            .catch((error) => {
                console.error('Error loading data:', error);
            });
    }

    // Viz 1 et 2
    groupDataByYear(
        data: d3.DSVRowArray<string>,
        fieldName: DataField
    ): YearEntry[] {
        const allFieldValues: Set<string> = new Set();
        data.forEach((rawEntry) => {
            const fieldValue = rawEntry[fieldName];
            if (fieldValue && fieldValue !== 'Unknown') {
                allFieldValues.add(fieldValue);
            }
        });

        const groupedData = data.reduce((acc: YearEntry[], rawEntry) => {
            const year: number = +rawEntry['iyear'];
            const fieldValue: string = rawEntry[fieldName];

            if (!fieldValue || fieldValue === 'Unknown') return acc;

            let yearData = acc.find((entry: YearEntry) => entry.year === year);

            if (!yearData) {
                yearData = { year, total: 0, counts: [] };

                allFieldValues.forEach((value) => {
                    yearData!.counts.push({ field: value, count: 0 });
                });
                acc.push(yearData);
            }

            const countEntryToUpdate = yearData.counts.find(
                (countEntry: CountEntry) => countEntry['field'] === fieldValue
            );

            if (countEntryToUpdate) {
                countEntryToUpdate.count += 1;
                yearData.total += 1;
            }

            return acc;
        }, []);

        return groupedData;
    }

    // Viz 1
    categorizeTargetTypeData(yearlyData: YearEntry[]): YearEntry[] {
        const categorizedData = yearlyData.map((yearEntry: YearEntry) => {
            const { year, total, counts } = yearEntry;

            const categoryCountData: CountEntry[] = [
                { category: TargetCategory.GovernmentAndSecurity, count: 0 },
                { category: TargetCategory.PrivateSectorAndMedia, count: 0 },
                {
                    category: TargetCategory.InfrastructureAndTransport,
                    count: 0,
                },
                {
                    category: TargetCategory.CiviliansAndSocialInstitutions,
                    count: 0,
                },
                { category: TargetCategory.Others, count: 0 },
            ];

            counts.forEach((targetTypeCountEntry: CountEntry) => {
                const category =
                    TARGET_CATEGORY_MAPPING[targetTypeCountEntry['field']] ||
                    'Unknown';

                const categoryCountEntry = categoryCountData.find(
                    (categoryCountEntry: CountEntry) =>
                        categoryCountEntry['category'] === category
                );

                categoryCountEntry!.count += targetTypeCountEntry.count;
            });

            return { year, total, counts: categoryCountData };
        });

        return categorizedData;
    }

    // DATAVIZ 3

    getMonthlyDeathData(): Observable<MonthEntry[]> {
        return this.data$.pipe(
            map((data) => (data ? this.processMonthlyDeathData(data) : []))
        );
    }

    private processMonthlyDeathData(data: any[]): MonthEntry[] {
        if (!data) return [];

        const monthNames = this.getMonthNames();
        const allCategories = this.getTargetCategories();

        return monthNames
            .map((monthName, monthIndex) => {
                const monthNum = monthIndex + 1;
                const monthEntries = this.getEntriesForMonth(data, monthNum);
                const { counts, totalDeaths } = this.processMonthEntries(
                    monthEntries,
                    allCategories
                );

                return counts.length > 0
                    ? { month: monthName, counts, total: totalDeaths }
                    : null;
            })
            .filter((month) => month !== null) as MonthEntry[];
    }

    private getMonthNames(): string[] {
        return [
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
    }

    private getTargetCategories(): TargetCategory[] {
        return [
            TargetCategory.GovernmentAndSecurity,
            TargetCategory.CiviliansAndSocialInstitutions,
            TargetCategory.InfrastructureAndTransport,
            TargetCategory.PrivateSectorAndMedia,
            TargetCategory.Others,
        ];
    }

    private getEntriesForMonth(data: any[], monthNum: number): any[] {
        return data.filter((entry) => +entry['imonth'] === monthNum);
    }

    private processMonthEntries(
        entries: any[],
        allCategories: TargetCategory[]
    ): { counts: CountEntry[]; totalDeaths: number } {
        const categoryCounts = this.initializeCategoryCounts(allCategories);
        let totalDeaths = 0;

        entries.forEach((entry) => {
            const { targetType, deaths } = this.extractEntryData(entry);

            if (targetType && deaths > 0) {
                const category = this.getTargetCategory(targetType);
                this.incrementCategoryCount(categoryCounts, category, deaths);
                totalDeaths += deaths;
            }
        });

        const counts = this.buildCountEntries(categoryCounts, allCategories);
        return { counts, totalDeaths };
    }

    private initializeCategoryCounts(
        categories: TargetCategory[]
    ): Map<TargetCategory, number> {
        const counts = new Map<TargetCategory, number>();
        categories.forEach((cat) => counts.set(cat, 0));
        return counts;
    }

    private extractEntryData(entry: any): {
        targetType: string;
        deaths: number;
    } {
        return {
            targetType: entry['targtype1_txt'],
            deaths: +(entry['nkill'] || 0),
        };
    }

    private getTargetCategory(targetType: string): TargetCategory {
        return TARGET_CATEGORY_MAPPING[targetType] ?? TargetCategory.Others;
    }

    private incrementCategoryCount(
        counts: Map<TargetCategory, number>,
        category: TargetCategory,
        deaths: number
    ): void {
        counts.set(category, (counts.get(category) || 0) + deaths);
    }

    private buildCountEntries(
        categoryCounts: Map<TargetCategory, number>,
        allCategories: TargetCategory[]
    ): CountEntry[] {
        const counts: CountEntry[] = [];

        allCategories.forEach((category) => {
            const count = categoryCounts.get(category) || 0;
            if (count > 0) {
                counts.push({
                    category: category.toString(),
                    count: count,
                });
            }
        });

        return counts;
    }

    // DATAVIZ 3
    // DATAVIZ 4

    getWeaponMonthFrequencyData(): Observable<HeatmapCell[]> {
        return this.data$.pipe(
            map((data) => (data ? this.processWeaponMonthFrequency(data) : []))
        );
    }

    private processWeaponMonthFrequency(
        data: d3.DSVRowArray<string>
    ): HeatmapCell[] {
        const result: Map<string, number> = new Map();
        const monthLabels = [
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

        data.forEach((row) => {
            const month = parseInt(row['imonth'] || '0');
            const weapon = row[DataField.WeaponType];
            if (
                !weapon ||
                weapon === 'Unknown' ||
                isNaN(month) ||
                month < 1 ||
                month > 12
            )
                return;

            const key = `${weapon}_${month}`;
            result.set(key, (result.get(key) || 0) + 1);
        });

        const heatmapData: HeatmapCell[] = [];

        result.forEach((count, key) => {
            const [weapon, monthNum] = key.split('_');
            heatmapData.push({
                month: monthLabels[parseInt(monthNum) - 1],
                category: weapon,
                deaths: count,
            });
        });
        // Ajout des cases manquantes à 0
        const weaponKeys = Object.keys(WEAPON_TYPE_MAPPING); // en anglais : ex. 'Firearms', 'Melee', etc.
        for (let weapon of weaponKeys) {
            if (weapon === 'Unknown') continue;
            for (let month = 1; month <= 12; month++) {
                const key = `${weapon}_${month}`;
                if (!result.has(key)) {
                    heatmapData.push({
                        month: monthLabels[month - 1],
                        category: weapon,
                        deaths: 0,
                    });
                }
            }
        }
        return heatmapData;
    }

    getIncendiaryCountsByState(): Observable<StateAttackCount[]> {
        return this.data$.pipe(
            map((data) => {
                if (!data) return [];

                const filtered = data.filter(
                    (d) =>
                        d['weaptype1_txt'] === 'Incendiary' &&
                        d['country_txt'] === 'United States'
                );

                const counts = d3.rollup(
                    filtered,
                    (v) => v.length,
                    (d) => d['provstate'] || 'Unknown'
                );

                const result: StateAttackCount[] = [];
                counts.forEach((count, state) => {
                    result.push({ state, count });
                });
                return result;
            })
        );
    }
}
