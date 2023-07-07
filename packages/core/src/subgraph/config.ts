import axios from 'axios';
import axiosRetry from 'axios-retry';
import config from '../config';

const axiosSubgraph = axios.create({
    baseURL: config.subgraphUrl,
    headers: {
        'content-type': 'application/json'
    },
    timeout: 15000
});
const axiosCouncilSubgraph = axios.create({
    baseURL: config.councilSubgraphUrl,
    headers: {
        'content-type': 'application/json'
    },
    timeout: 15000
});
const axiosMicrocreditSubgraph = axios.create({
    baseURL: config.microcreditSubgraphUrl,
    headers: {
        'content-type': 'application/json'
    },
    timeout: 15000
});
// TODO: " as any" is a temporary solution to deploy to heroku
// TODO: test this works as expected to reduce timeout
axiosRetry(axiosSubgraph as any, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay
});
axiosRetry(axiosCouncilSubgraph as any, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay
});
axiosRetry(axiosMicrocreditSubgraph as any, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay
});

export { axiosSubgraph, axiosCouncilSubgraph, axiosMicrocreditSubgraph };
