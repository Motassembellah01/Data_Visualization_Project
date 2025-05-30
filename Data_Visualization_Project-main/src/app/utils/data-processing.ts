import { AttackData } from '../models/data';

export function getAttacks(rawData: d3.DSVRowArray<string>) {
    const processedData: AttackData[] = rawData.map((d) => ({
        year: +d['iyear'],
        month: +d['imonth'],
        day: +d['iday'],
        state: d['provstate'] ?? 'Unknown',
        city: d['city'] ?? 'Unknown',
    }));

    return processedData;
}
