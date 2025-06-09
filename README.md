# Docker Registry Browser

> [!IMPORTANT]
> This project is archived because I do not actively maintain it.
> 
> There are other great projects which you can use AND get updates, e.g. [Joxit/docker-registry-ui](https://github.com/Joxit/docker-registry-ui).

A simple [Docker registry](https://hub.docker.com/_/registry/) browser. Compatible with [version 2 of the HTTP API](https://docs.docker.com/registry/spec/api/).

## How to develop

You will need Node.js v16 or later, and a package manager (like npm or yarn).

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) in the official React documention for more information.

## How to deploy

Take the outputs from the `build` folder (see `npm run build` command above) and deploy it with a web server of your choice (e.g. nginx or Apache2).

If you operate the Registry Browser and the Registry with separate hostnames, make sure to allow Cross-origin requests to your Registry API. The Registry API must then also expose the `docker-distribution-api-version` header for cross-origin requests.

## License

This project is [licensed under MPL-2.0](https://github.com/phidevz/docker-registry-browser/blob/main/LICENSE).
