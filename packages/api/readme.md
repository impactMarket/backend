
## Getting started

1. Install dependencies (`yarn` at root folder)
2. `docker compose up` (you will need docker)
3. From the root foldr, run sequelize migrations with `NODE_ENV=test npx sequelize-cli db:migrate --env development` (Using `NODE_ENV=test` avoid running updates the first time, potentially causing breaks)
4. `yarn dev`