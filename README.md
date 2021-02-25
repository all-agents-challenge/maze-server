# Maze Server

_Compliant with Maze-XML media type: http://amundsen.com/media-types/maze/_

There is an XML version and an RDF (turtle) version of the server

## XML Version
```sh
$ node app-xml.js
```
Starts the server on port 1337

## RDF Version (by @kaefer3000)
```sh
$ node app-rdf.js
```
Starts the server on port 1337 by default.

Start browsing at `http://localhost:1337/`, look around and try to get out.
Gives you represtations of the cells in the Maze in [Turtle](https://www.w3.org/TR/turtle/).

With the [RDF Browser](https://addons.mozilla.org/en-US/firefox/addon/rdf-browser), you can look around using your (Firefox) browser.

_The RDF Server was created by @kaefer3000 and can be found here: https://github.com/kaefer3000/2021-02-dagstuhl_
