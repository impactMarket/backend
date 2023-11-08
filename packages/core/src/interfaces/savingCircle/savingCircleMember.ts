export interface SavingCircleMember {
    id: number;
    userId: number;
    groupId: number;
    accept: boolean;
    decisionOn: Date;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
}

export interface SavingCircleMemberCreation {
    userId: number;
    groupId: number;
    accept?: boolean;
    decisionOn?: Date;
}
