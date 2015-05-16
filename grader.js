#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes. Uses commander.js and cherio. Teaches command line application development and basic DOM parsing.

References:

  + cheerio
    - https://github.com/MatthewMueller/cheerio
    - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
    - http://maxogden.com/scraping-with-node.html

  + commander.js
    - https://github.com/visionmedia/commander.js
    - http://tjholowaychunk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

  + JSON
    - http://en.wikipedia.com/wiki/JSON
    - https://developer.mozilla.org/en-US/docs/JSON
    - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var CHECKSFILE_DEFAULT = "checks.json";
var URL_DEFAULT = '';

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
	console.log("%s does not exist. Exiting.", instr);
	process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var checkUrl = function(url, checksfile) {
    rest.get(url).on('complete', function(result) {
	if (result instanceof Error) {
	    console.log('Error:', result.message);
	    this.retry(5000);
	} else {
	    console.log('got html from url');
	    $ = cheerio.load(result);
	    var checks = loadChecks(checksfile).sort();
	    var out = {};
	    for(var ii in checks) {
		var present = $(checks[ii]).length > 0;
		out[checks[ii]] = present;
	    }
	    printResults(out);
	}
    });
};

var printResults = function(results) {
    var outJson = JSON.stringify(results, null, 4);
    console.log(outJson);
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
	var present = $(checks[ii]).length > 0;
	out[checks[ii]] = present;
    }
    printResults(out);
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <html_url>', 'URL to html', URL_DEFAULT)
        .parse(process.argv);
    if(program.url !== URL_DEFAULT) {
	console.log('its a url!');
	checkUrl(program.url, program.checks);

    } else {
	checkHtmlFile(program.file, program.checks);
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
