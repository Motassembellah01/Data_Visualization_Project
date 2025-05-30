export enum TargetCategory {
    GovernmentAndSecurity = 'Gouvernement et sécurité',
    PrivateSectorAndMedia = 'Secteur privé et médias',
    InfrastructureAndTransport = 'Infrastructures et transports',
    CiviliansAndSocialInstitutions = 'Civils et institutions sociales',
    Others = 'Autres',
}

export enum AttackType {
    BombingOrExplosion = 'Attentat/Explosion',
    ArmedAssault = 'Assaut armé',
    Assassination = 'Assassinat',
    FacilityOrInfrastructureAttack = 'Installation/infrastructure',
    HostageTakingBarricadeIncident = "Prise d'otages (incident de barricade)",
    Unknown = 'Inconnu',
    UnarmedAssault = 'Assaut non armé',
    HostageTakingKidnapping = "Prise d'otages (kidnapping)",
    Hijacking = 'Détournement',
}

export const WEAPON_TYPE_MAPPING: { [key: string]: string } = {
    'Explosives/Bombs/Dynamite': 'Explosifs/Bombes/Dynamite',
    Firearms: 'Armes à feu',
    'Sabotage Equipment': 'Équipement de sabotage',
    Incendiary: 'Incendiaire',
    Melee: 'Mêlée',
    Unknown: 'Inconnu',
    'Fake Weapons': 'Fausses armes',
    Chemical: 'Chimique',
    Other: 'Autre',
    Biological: 'Biologique',
    'Vehicle (not to include vehicle-borne explosives, i.e., car or truck bombs)':
        'Véhicule',
};

export const ATTACK_TYPE_MAPPING: { [key: string]: AttackType } = {
    'Bombing/Explosion': AttackType.BombingOrExplosion,
    'Armed Assault': AttackType.ArmedAssault,
    Assassination: AttackType.Assassination,
    'Facility/Infrastructure Attack': AttackType.FacilityOrInfrastructureAttack,
    'Hostage Taking (Barricade Incident)':
        AttackType.HostageTakingBarricadeIncident,
    Unknown: AttackType.Unknown,
    'Unarmed Assault': AttackType.UnarmedAssault,
    'Hostage Taking (Kidnapping)': AttackType.HostageTakingKidnapping,
    Hijacking: AttackType.Hijacking,
};

export const TARGET_CATEGORY_MAPPING: { [key: string]: TargetCategory } = {
    'Abortion Related': TargetCategory.Others,
    'Airports & Aircraft': TargetCategory.InfrastructureAndTransport,
    Business: TargetCategory.PrivateSectorAndMedia,
    'Educational Institution': TargetCategory.CiviliansAndSocialInstitutions,
    'Food or Water Supply': TargetCategory.InfrastructureAndTransport,
    'Government (Diplomatic)': TargetCategory.GovernmentAndSecurity,
    'Government (General)': TargetCategory.GovernmentAndSecurity,
    'Journalists & Media': TargetCategory.PrivateSectorAndMedia,
    Maritime: TargetCategory.InfrastructureAndTransport,
    Military: TargetCategory.GovernmentAndSecurity,
    NGO: TargetCategory.CiviliansAndSocialInstitutions,
    Police: TargetCategory.GovernmentAndSecurity,
    'Private Citizens & Property':
        TargetCategory.CiviliansAndSocialInstitutions,
    'Religious Figures/Institutions':
        TargetCategory.CiviliansAndSocialInstitutions,
    Telecommunication: TargetCategory.InfrastructureAndTransport,
    'Terrorists/Non-State Militia': TargetCategory.Others,
    Tourists: TargetCategory.CiviliansAndSocialInstitutions,
    Transportation: TargetCategory.InfrastructureAndTransport,
    Utilities: TargetCategory.InfrastructureAndTransport,
    'Violent Political Party': TargetCategory.Others,
};

export interface StateAttackCount {
    state: string;
    count: number;
}
