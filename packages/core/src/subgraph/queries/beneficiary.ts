import { axiosMicrocreditSubgraph, axiosSubgraph } from '../config';

export const hasSubgraphSyncedToBlock = async (block: number): Promise<boolean> => {
    try {
        const graphqlQuery = {
            operationName: 'lastBlockSubgraph',
            query: `query lastBlockSubgraph {
                _meta {
                    block {
                        number
                    }
                }
            }`
        };

        const response = await axiosSubgraph.post<
            any,
            {
                data: {
                    data: {
                        _meta: {
                            block: {
                                number: number;
                            };
                        };
                    };
                };
            }
        >('', graphqlQuery);

        const responseSubgraphMicroCredit = await axiosMicrocreditSubgraph.post<
            any,
            {
                data: {
                    data: {
                        _meta: {
                            block: {
                                number: number;
                            };
                        };
                    };
                };
            }
        >('', graphqlQuery);

        const lastSubgraphBlock = response.data?.data._meta.block.number;
        const lastSubgraphBlockMicrocredit = responseSubgraphMicroCredit.data?.data._meta.block.number;

        return lastSubgraphBlock >= block && lastSubgraphBlockMicrocredit >= block;
    } catch (error) {
        return false;
    }
};

export const getBeneficiaryState = async (where: string, fields: string) => {
    try {
        const graphqlQuery = {
            operationName: 'beneficiaryEntities',
            query: `query beneficiaryEntities {
                beneficiaryEntities(
                    ${where}
                ) {
                    ${fields}
                }
            }`,
            variables: {}
        };

        const response = await axiosSubgraph.post('', graphqlQuery);

        if (response.data.errors) {
            throw new Error(response.data.error);
        }

        const beneficiaryEntities = response.data?.data.beneficiaryEntities;

        return beneficiaryEntities;
    } catch (error) {
        throw new Error(error);
    }
};