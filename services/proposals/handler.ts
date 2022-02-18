import axios from 'axios';
import { ethers } from 'ethers';
import { contracts } from '@impactmarket/core';

export const verifyProposals = async (event: any, context: any) => {
  const provider = new ethers.providers.JsonRpcProvider(
    process.env.CHAIN_JSON_RPC_URL
  );

  const DAOContract = new ethers.Contract(
    process.env.PACT_DELEGATOR!,
    contracts.PACTDelegateStorageV1,
    provider
  );

  const proposalCount = parseInt(await DAOContract.proposalCount());

  const lastHour = new Date(new Date().getTime() - 60*60*1000).getTime();
  const newProposals: any = [];
  for(let i = proposalCount-1; ; i--) {
    const proposal = await DAOContract.proposals(i);
    const block = await getBlockByNumber(proposal.startBlock._hex);
    // const block = await provider.getBlock(parseInt(proposal.startBlock));
    const blockTimestamp = parseInt(block.timestamp) * 1000;

    if(blockTimestamp >= lastHour) {
      if(!proposal.canceled && !proposal.executed) {
        newProposals.push(proposal);
      }
    } else {
      break
    }
  }
  
  const promises = newProposals.map((proposal) =>
    axios.post(process.env.DISCORD_WEBHOOK!, {
      embeds: [{
        type: 'rich',
        title: 'New Proposal',
        description: 'New proposal opened: ' + parseInt(proposal.id),
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
    })
  );
  await Promise.all(promises);
}

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
}
