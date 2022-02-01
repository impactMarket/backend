// To use Apollo Client without a browser, is necessary to polyfill or provide a fetch method.
import 'cross-fetch/polyfill';

import ApolloClient, { InMemoryCache } from 'apollo-boost';

import config from '../config';

export const client = new ApolloClient({
    uri: config.subgraphUrl,
    cache: new InMemoryCache(),
});
