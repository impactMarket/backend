import { ApolloClient, InMemoryCache } from 'apollo-boost';
import { HttpLink } from 'apollo-link-http';
import { fetch } from 'cross-fetch';

import config from '../config';

export const clientDAO = new ApolloClient({
    link: new HttpLink({
        uri: config.subgraphUrl,
        fetch,
    }),
    cache: new InMemoryCache(),
});

export const clientCouncil = new ApolloClient({
    link: new HttpLink({
        uri: config.councilSubgraphUrl,
        fetch,
    }),
    cache: new InMemoryCache(),
});
