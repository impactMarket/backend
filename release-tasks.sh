#!/bin/bash

npx sequelize db:migrate --env $API_ENVIRONMENT
if [ $API_ENVIRONMENT != 'production' ] && [ $NODE_ENV != 'production' ] && [ $NODE_ENV != 'prod' ] && [ $NODE_ENV != 'PROD' ]
then
    npx sequelize-cli db:seed:all --env $API_ENVIRONMENT
fi