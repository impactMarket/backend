<div align="center">
    <img src="logo.png">
</div>

> impactMarket enables access to inclusive financial solutions, including Unconditional Basic Income programs to support and empower vulnerable communities. Donate now and join our mission of promoting financial inclusion.

## Getting started

Use the package manager [yarn](https://yarnpkg.com/) to install dependencies.

### Run API

1. Config .env
2. Install dependencies (`yarn` at root folder)
3. `docker compose up` (you will need docker)
4. From the root foldr, run sequelize migrations with `NODE_ENV=test API_ENVIRONMENT=development ./release-tasks.sh` (Using `NODE_ENV=test` avoid running updates the first time, potentially causing breaks)
5. `yarn dev`

### Run Test

1. Config .env.test in each folder
2. From rootm run `yarn test`

## License

[Apache-2.0](LICENSE)
