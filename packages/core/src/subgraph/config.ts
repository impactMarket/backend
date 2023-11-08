import axios from 'axios';
import axiosRetry from 'axios-retry';
import config from '../config';

const axiosSubgraph = axios.create({
    baseURL: config.subgraphUrl,
    headers: {
        'content-type': 'application/json'
    },
    timeout: 10000
});
const axiosCouncilSubgraph = axios.create({
    baseURL: config.councilSubgraphUrl,
    headers: {
        'content-type': 'application/json'
    },
    timeout: 10000
});
const axiosMicrocreditSubgraph = axios.create({
    baseURL: config.microcreditSubgraphUrl,
    headers: {
        'content-type': 'application/json'
    },
    timeout: 10000
});
// TODO: " as any" is a temporary solution to deploy to heroku
// TODO: test this works as expected to reduce timeout
axiosRetry(axiosSubgraph as any, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: _error => true, // retry regardless of the error
    shouldResetTimeout: true
});
axiosRetry(axiosCouncilSubgraph as any, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: _error => true,
    shouldResetTimeout: true
});
axiosRetry(axiosMicrocreditSubgraph as any, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    retryCondition: _error => true,
    shouldResetTimeout: true
});

export { axiosSubgraph, axiosCouncilSubgraph, axiosMicrocreditSubgraph };
