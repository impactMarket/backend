<div align="center">
    <img src="logo.png">
</div>

> A decentralized impact-driven 2-sided marketplace to provide financial services to charities and vulnerable beneficiaries in need or living in extreme poverty.

Welcome to the API fraction of the impactMarket codebase.

## Installation

Use the package manager [yarn](https://yarnpkg.com/) to install dependencies.

```bash
yarn
```

## Usage

Before moving any further, fill the `.env`. Write the correct postgres url. Use `npx sequelize db:migrate` to generate the tables.

Start with `yarn start` for dev demo with hot-reload.

If you prefer a production version instead, build with `yarn build` and then start with `yarn serve`.

### Development Notes

#### To Disable local SSL requirement

Disable SSL locally
`psql "sslmode=disable host=localhost dbname=impactmarket" --username postgres --host localhost --port 5432`

## License

[Apache-2.0](LICENSE)

## Thanks

Thanks to [Jetbrains](https://www.jetbrains.com/?from=impactMarket) for the free DataGrip license.
<img height="70" src="icon-datagrip.png">
