import { contracts } from '@impactmarket/core';
import * as prismic from '@prismicio/client';
import axios from 'axios';
import { Contract, JsonRpcProvider } from 'ethers';

const endpoint = prismic.getRepositoryEndpoint(process.env.PRISMIC_REPO!);
const accessToken = process.env.PRISMIC_ACCESS_TOKEN;
const client = prismic.createClient(endpoint, { accessToken });

export const verifyProposals = async (event: any, context: any) => {
    try {
        const provider = new JsonRpcProvider(
            process.env.CHAIN_JSON_RPC_URL
        );

        const DAOContract = new Contract(
            process.env.PACT_DELEGATOR!,
            contracts.PACTDelegateABI,
            provider
        );

        const proposalCount = parseInt(await DAOContract.proposalCount(), 10);

        const lastHour = new Date(
            new Date().getTime() - 60 * 60 * 1000
        ).getTime();
        const newProposals: { id: string }[] = [];
        for (let i = proposalCount - 1; ; i--) {
            const proposal = await DAOContract.proposals(i);
            const block = await getBlockByNumber(proposal.startBlock._hex);
            const blockTimestamp = parseInt(block.timestamp, 10) * 1000;

            if (blockTimestamp >= lastHour) {
                if (!proposal.canceled && !proposal.executed) {
                    newProposals.push(proposal);
                }
            } else {
                break;
            }
        }

        if (newProposals.length > 0) {
            const data = await client.getAllByType(
                process.env.PRISMIC_CUSTOM_TYPE!,
                { lang: process.env.PRISMIC_LANGUAGE }
            );
            const title = data[0].data.opened_proposal_title;
            const description = data[0].data.opened_proposal_description;
            const promises = newProposals.map((proposal) =>
                axios.post(process.env.DISCORD_WEBHOOK!, {
                    embeds: [
                        {
                            type: 'rich',
                            title,
                            description: description.replace(
                                '{id}',
                                parseInt(proposal.id, 10)
                            ),
                            url: process.env.GOVERNACE_SYSTEM_URL,
                            color: 39423,
                            timestamp: null,
                            fields: [],
                            thumbnail: null,
                            image: null,
                            video: null,
                            author: null,
                            provider: null,
                            footer: null,
                            files: [],
                        },
                    ],
                })
            );
            await Promise.all(promises);
        } else {
            console.info('No new proposals');
        }
    } catch (error) {
        console.error(error);
    }
};

const getBlockByNumber = async (blockNumber: string) => {
    const requestContent = {
        id: 0,
        jsonrpc: '2.0',
        method: 'eth_getBlockByNumber',
        params: [blockNumber, false],
    };

    const requestHeaders = {
        headers: {
            Accept: 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
        },
    };
    const response = await axios.post(
        process.env.CHAIN_JSON_RPC_URL!,
        requestContent,
        requestHeaders
    );

    return response.data.result;
};
