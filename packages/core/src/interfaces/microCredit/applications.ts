export interface MicroCreditApplications {
    id: number;
    userId: number;
    amount: number;
    period: number;
    status: number;
	decisionOn: Date;

    // timestamps
    createdAt: Date;
    updatedAt: Date;
}

export interface MicroCreditApplicationsCreation {
    userId: number;
    amount: number;
    period: number;
    status: number;
	decisionOn: Date;
}
