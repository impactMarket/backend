import * as prismic from '@prismicio/client';

const endpoint = prismic.getRepositoryEndpoint(process.env.PRISMIC_REPO!);
const accessToken = process.env.PRISMIC_ACCESS_TOKEN;

export const client = prismic.createClient(endpoint, { accessToken });
