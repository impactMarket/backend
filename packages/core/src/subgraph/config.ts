import axios from 'axios';
import axiosRetry from 'axios-retry'
import config from '../config';

const axiosSubgraph = axios.create({
    baseURL: config.subgraphUrl,
    headers: {
        'content-type': 'application/json',
    },
    timeout: 4000,
});
const axiosCouncilSubgraph = axios.create({
    baseURL: config.councilSubgraphUrl,
    headers: {
        'content-type': 'application/json',
    },
    timeout: 4000,
});
axiosRetry(axiosSubgraph, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
});
axiosRetry(axiosCouncilSubgraph, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
});

export { axiosSubgraph, axiosCouncilSubgraph };