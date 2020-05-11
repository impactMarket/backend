<div align="center">
    <img style="max-height: 408px" src="logo.png">
</div>


> A decentralized impact-driven 2-sided marketplace to provide financial services to charities and vulnerable beneficiaries in need or living in extreme poverty.

Welcome to the API fraction of the impactMarket codebase.

## Installation

Use the package manager [yarn](https://yarnpkg.com/) to install dependencies.

```bash
yarn
```

## Usage

Start with `yarn start` for dev demo with hot-reload.

If you prefer a production version instead, build with `yarn build` and then start with `yarn serve`.

### Development Notes

#### To Disable local SSL requirement
Disable SSL locally
psql "sslmode=disable host=localhost dbname=impactmarket" --username postgres --host localhost --port 5432

## Step by step...

- [x] Basic API functionality to save community creation requests and beneficiary requests
- [ ] Transaction cache server for faster loading (WIP)
- [ ] ...

## License
[Apache-2.0](LICENSE)