import { BeneficiaryTransactionCreationAttributes } from '@models/ubi/beneficiaryTransaction';
import { Logger } from '@utils/logger';

import { models } from '../../database';

export default class BeneficiaryTransactionService {
    public static beneficiaryTransaction = models.beneficiaryTransaction;

    public static async add(
        beneficiaryTx: BeneficiaryTransactionCreationAttributes
    ): Promise<void> {
        try {
            await this.beneficiaryTransaction.create(beneficiaryTx);
        } catch (e) {
            if (e.name !== 'SequelizeUniqueConstraintError') {
                Logger.error(
                    'Error inserting new BeneficiaryTransaction. Data = ' +
                        JSON.stringify(beneficiaryTx)
                );
                Logger.error(e);
            }
        }
    }
}
