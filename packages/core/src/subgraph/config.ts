// To use Apollo Client without a browser, is necessary to polyfill or provide a fetch method.
import 'cross-fetch/polyfill';

import ApolloClient, { InMemoryCache } from 'apollo-boost';

import config from '../config';

export const clientDAO = new ApolloClient({
    uri: config.subgraphUrl,
    cache: new InMemoryCache(),
});

export const clientSubDAO = new ApolloClient({
    uri: config.subDAOsubgraphUrl,
    cache: new InMemoryCache(),
});
