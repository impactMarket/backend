import axios from 'axios';

export const verifyProposals = async (event: any, context: any) => {
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
}
