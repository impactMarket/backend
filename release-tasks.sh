#!/bin/bash

npx sequelize db:migrate --env $API_ENVIRONMENT
if [ $API_ENVIRONMENT != 'production' ]
then
    npx sequelize-cli db:seed:all --env $API_ENVIRONMENT
fi