/**
 * @swagger
 *  components:
 *    schemas:
 *      AppProposal:
 *        type: object
 *        required:
 *          - id
 *          - status
 *          - endBlock
 *        properties:
 *          id:
 *            type: integer
 *          status:
 *            type: integer
 *          endBlock:
 *            type: integer
 */

export interface AppProposal {
    id: number;
    status: number;
    endBlock: number;
}
export interface AppProposalCreation {
    id: number;
    status: number;
    endBlock: number;
}
