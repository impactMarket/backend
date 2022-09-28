/**
 * @swagger
 *  components:
 *    schemas:
 *      LearnAndEarnPayment:
 *        type: object
 *        required:
 *          - id
 *          - userId
 *          - levelId
 *          - amount
 *          - tx
 *          - txAt
 *        properties:
 *          id:
 *            type: integer
 *          userId:
 *            type: integer
 *          levelId:
 *            type: integer
 *          amount:
 *            type: number
 *          tx:
 *            type: string
 *          txAt:
 *            type: date
 */
export interface LearnAndEarnPayment {
    id: number;
    userId: number;
    levelId: number;
    amount: number;
    signature: string;
    status: 'pending' | 'paid';
    tx: string;
    txAt: Date;
}

export interface LearnAndEarnPaymentCreation {
    userId: number;
    levelId: number;
    amount: number;
    signature: string;
    status: 'pending' | 'paid';
    tx?: string;
    txAt?: Date;
}
