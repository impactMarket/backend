export interface AppLazyAgenda {
    id: number;
    userId: number;
    type: number;
    details: object;
    frequency: number;
    lastExecutedAt: Date;
}

export interface AppLazyAgendaCreation {
    userId: number;
    type: number;
    details: object;
    frequency: number;
}
