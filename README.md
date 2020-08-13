# IO - Testing
This is a project containing some test suites for IO (Backend and Functions). In this repo you can find all integration tests and end-to-end tests, over IO application components.

## Usage

In order to run tests correctly (in a local environment) you must:

 - set your environment variables by copying `env.example` in `.env` ( see `env.example` for required variables ) and fill them with proper values
 - run io-mock ( please refers to [https://github.com/pagopa/io-mock](https://github.com/pagopa/io-mock) )
 - run `yarn install`
 - run `yarn generate`
 - run `yarn start` or `yarn test`