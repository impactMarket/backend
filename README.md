<div align="center">
    <img src="logo.png">
</div>

> Decentralized Poverty Alleviation Protocol. impactMarket enables any vulnerable community to implement poverty alleviation mechanisms, like Unconditional Basic Income.

Welcome to the backend monorepo of impactMarket.

## Installation

Use the package manager [yarn](https://yarnpkg.com/) to install dependencies.

```bash
yarn
```

## Usage

Before moving any further, fill the `.env`. Write the correct postgres url. Use `npx sequelize db:migrate` to generate the tables.

Start with `yarn start` for dev environment with hot-reload.

If you prefer a production version instead, build with `yarn build` and then start with `yarn serve`.

## License

[Apache-2.0](LICENSE)
