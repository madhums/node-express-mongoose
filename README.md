[![Build Status](https://img.shields.io/travis/madhums/node-express-mongoose.svg?style=flat)](https://travis-ci.org/madhums/node-express-mongoose)
[![Dependencies](https://img.shields.io/david/madhums/node-express-mongoose.svg?style=flat)](https://david-dm.org/madhums/node-express-mongoose)
[![Code Climate](https://codeclimate.com/github/codeclimate/codeclimate/badges/gpa.svg)](https://codeclimate.com/github/madhums/node-express-mongoose)
[![Greenkeeper badge](https://badges.greenkeeper.io/madhums/node-express-mongoose.svg)](https://greenkeeper.io/)
[![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/madhums/node-express-mongoose?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)

## Node Express Mongoose

A boilerplate application for building web apps using express, mongoose and passport.

Read the [wiki](https://github.com/madhums/node-express-mongoose/wiki) to understand how the application is structured.

## Usage

    $ git clone https://github.com/madhums/node-express-mongoose.git
    $ cd node-express-mongoose
    $ npm install
    $ cp .env.example .env
    $ npm start

Checkout the [apps that are built using this approach](https://github.com/madhums/node-express-mongoose/wiki/Apps-built-using-this-approach)

## Docker

You can also use docker for development. Make sure you run npm install on your host machine so that code linting and everything works fine.

```sh
$ npm i
$ cp .env.example .env
```

Start the services

```sh
$ docker-compose up -d
```

View the logs

```sh
$ docker-compose logs -f
```

In case you install a npm module while developing, it should also be installed within docker container, to do this first install the module you want with simple `npm i module name`, then run it within docker container

```sh
$ docker-compose exec node npm i
```

If you make any changes to the file, nodemon should automatically pick up and restart within docker (you can see this in the logs)

To run tests

```sh
$ docker-compose exec node npm test
```

## License

MIT
