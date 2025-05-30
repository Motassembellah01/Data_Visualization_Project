export interface AttackData {
    year: number;
    month: number;
    day: number;
    state: string;
    city: string;
}

export enum DataField {
    AttackType = 'attacktype1_txt',
    TargetType = 'targtype1_txt',
    WeaponType = 'weaptype1_txt',
}

export interface YearEntry {
    year: number;
    total: number;
    counts: CountEntry[];
}

export interface CountEntry {
    [field: string]: any;
    count: number;
}

export interface MonthEntry {
    month: string;
    counts: CountEntry[];
    total: number;
}

export interface AttackData {
    year: number;
    month: number;
    day: number;
    state: string;
    city: string;
}

export interface YearEntry {
    year: number;
    total: number;
    counts: CountEntry[];
}

export interface HeatmapCell {
    month: string;
    category: string;
    deaths: number;
}
