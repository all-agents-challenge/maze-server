/* RESTful Web APIs - 2013 (original) */
/* Autonomous Agents on the Web : Dagstuhl 2021-02 (fork)
/* Maze RDF server implementation */
/* Added "green" shortcut signifier : 20201-02 (mamund) */

var http = require('http');
var mazes = require('./mazes.js');

var port = (process.env.PORT||1337);
var root = '';
var maze_prefix = 'https://kaefer3000.github.com/2021-02-dagstuhl/vocab#';

var counter = 0;
// add support for CORS
var headers = {
    'Content-Type' : 'text/turtle',
    'Access-Control-Allow-Origin' : '*',
    'Access-Control-Allow-Methods' : '*',
    'Access-Control-Allow-Headers' : '*'
};

// document model for responses
var template = {};
template.mazeStart = '<#it> a <'+maze_prefix+'Maze> .';
template.mazeEnd = '';
template.collectionStart = '<#it> a <http://www.w3.org/ns/ldp#Collection> .';
template.collectionEnd = '';
template.itemStart = '<{l}#it> <http://www.w3.org/2000/01/rdf-schema#label> "{t}".';
template.itemEnd = '';
template.cellStart = '<{l}#it> a <'+maze_prefix+'Cell> ; <http://www.w3.org/2000/01/rdf-schema#label> "{t}" .';
template.cellEnd = '';
template.link = '<#it> <'+maze_prefix+'{d}> <{l}#it> .';
template.titleLink = '<#it> <'+maze_prefix+'{d}> <{l}#it> . <{l}#it> <http://www.w3.org/2000/01/rdf-schema#label> "{t}" .';
template.error = '';

var m = {};
m.signifier = "green"; // shortcut signifier

// node.js only recently added replaceAll, so here a workaround for older versions
if (!(typeof String.prototype.replaceAll === 'function')) {
String.prototype.replaceAll = function(s, r) {
    var thizz = this;
    return thizz.replace(new RegExp(s, 'g'), r);
};
}

// handle request
function handler(req, res) {
    var segments, i, x, parts;

    // set global var
    root = 'http://'+req.headers.host+'/';

    // add tracking echo
    console.log("%d - %s",counter++, req.url)

    // simple routing
    parts = [];
    segments = req.url.split('/');
    for(i=0,x=segments.length;i<x;i++) {
        if(segments[i]!=='') {
            parts.push(segments[i]);
        }
    }

    // ignore thes requests
    if(req.url==='/favicon.ico') {
        return;
    }

    // handle CORS OPTIONS call
    if(req.method==='OPTIONS') {
        var body = JSON.stringify(headers);
        showResponse(req, res, body, 200);
    }

    // only accept GETs
    if(req.method!=='GET') {
        showError(req, res, 'Method Not Allowed', 405);
    }
    else {
        // route to handle requests
        switch(parts.length) {
            case 0:
                showCollection(req, res);
                break;
            case 1:
                showMaze(req, res, parts[0]);
                break;
            case 2:
                showCell(req, res, parts[0], parts[1]);
                break;
            default:
                showError(req, res, 'Not Found', 404);
                break;
        }
    }
}

// show list of available mazes
function showCollection(req, res) {
    var body, list, i, x;
    
    body = '';
    body += template.collectionStart.replaceAll('{l}',root);
    
    list = mazes('list');
    if(list!==undefined) {
        for(i=0,x=list.length;i<x;i++) {
            body += template.titleLink.replaceAll('{l}',root+list[i].link).replaceAll('{d}','maze').replaceAll('{t}',list[i].title);
        }
    }

    body = body.replaceAll('<'+maze_prefix+'maze>','<http://www.w3.org/ns/ldp#contains>');
    
    body += template.collectionEnd;

    showResponse(req, res, body, 200);
}

// response for a single maze
function showMaze(req, res, maze) {
    var body, data;
   
    // make sure it exists before crafting response
    data = mazes('maze',maze);
    if(data!==undefined) {
        body = '';
        body += template.mazeStart;
        body += template.itemStart.replaceAll('{l}',root+maze).replaceAll('{t}',data.title);
        body += template.link.replaceAll('{l}',root+maze+'/0').replaceAll('{d}','start');
        body += template.itemEnd;
        body += template.mazeEnd;

	body = body.replaceAll('<'+maze_prefix+'start>','<http://www.w3.org/1999/xhtml/vocab#start>');

        showResponse(req, res, body, 200);
    }
    else {
        showError(req, res, 'Maze Not Found', 404);
    }
}

// response for a cell within the maze
function showCell(req, res, maze, cell) {
    var body, data, rel, mov, mz, sq, ex, z, t;

    // validate the maze
    mz = mazes('maze',maze);
    if(mz===undefined) {
        showError(req, res, 'Maze Not Found', 404);
        return;
    }

    // compute state and set up possible moves
    z = parseInt(cell, 10);
    t = Object.keys(mz.cells).length;
    sq = Math.sqrt(t);
    ex = t-1;

    rel = ['north', 'west', 'south', 'east'];
    mov = [z-1, z+(sq*-1), z+1, z+sq]
    
    // get cell details
    if(z===999) {
        data = {"title":"The Exit",doors:[1,1,1,1]};
    }
    else {
        data = mazes('cell', maze, cell);
    }
    
    // if we have details, craft representation
    if(data!==undefined) {
        body = '';
        body += template.cellStart.replaceAll('{l}',root+maze+'/'+cell).replaceAll('{t}',data.title);

        // add doors & signifier
        for(i=0,x=data.doors.length;i<x;i++) {
            if(data.doors[i]===0) {
                body += template.link.replaceAll('{l}',root+maze+'/'+mov[i]).replaceAll('{d}',rel[i]);
            }
            if(data.green && data.green[i]===1) {
                body += template.link.replaceAll('{l}',root+maze+'/'+mov[i]).replaceAll('{d}',m.signifier);
            }
        }

        // if there is an exit, add it
        if(z===ex) {
            body += template.link.replaceAll('{l}',root+maze+'/999').replaceAll('{d}','exit').replaceAll('{t}',data.title);
        }

        // add link to start of the maze and the entire collection
        body += template.titleLink.replaceAll('{l}',root+maze).replaceAll('{d}','maze').replaceAll('{t}',mz.title);
        body += template.link.replaceAll('{l}',root).replaceAll('{d}', 'collection');
        
        body += template.cellEnd;
    
        showResponse(req, res, body, 200);
    }
    else {
        showError(req, res, 'Cell Not Found', 404);
    }
}

// unexpected request
function showError(req, res, title, code) {
    var body = ''
        + template.error.replaceAll('{t}',title)
        + '';
    showResponse(req, res, body, code);
}

// return response to caller
function showResponse(req, res, body, code) {
    res.writeHead(code,headers);
    res.end(body);
}

// wait for someone to call
http.createServer(handler).listen(port);
console.log('listening on port '+port);

