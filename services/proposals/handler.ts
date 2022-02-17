import axios from 'axios';
import { ethers } from 'ethers';
import { contracts } from '@impactmarket/core';

export const verifyProposals = async (event: any, context: any) => {
  try {
    const provider = new ethers.providers.JsonRpcProvider(
      process.env.CHAIN_JSON_RPC_URL
    );
  
    const DAOContract = new ethers.Contract(
      process.env.PACT_DELEGATOR!,
      contracts.PACTDelegateStorageV1,
      provider
    );

    const proposalCount = await DAOContract.proposalCount();
    const proposals = await DAOContract.proposals(process.env.PACT_DELEGATOR!);

    console.log(parseInt(proposalCount))
    console.log(proposals)

    const resp = await axios.post(process.env.WEBHOOK_URL!, {
      embeds: [{
        type: 'rich',
        title: 'New Proposal',
        description: 'New proposal for the community: TESTE',
        url: 'https://www.impactmarket.com/',
        color: 39423,
        timestamp: null,
        fields: [],
        thumbnail: null,
        image: null,
        video: null,
        author: null,
        provider: null,
        footer: null,
        files: []
      }]
    });
    return !!resp
  } catch (error) {
    console.log('erro ==> ', error);
    return false;
  }
}
