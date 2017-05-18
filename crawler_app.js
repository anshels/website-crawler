#!/usr/bin/env node

const request = require('request');
const cheerio = require('cheerio');
const URL = require('url-parse');
const fs = require('fs');
const program = require('commander');
const ProgressBar = require('progress');

const bar = new ProgressBar('Loading :bar :urlCount', { total: 20, clear: true});
const allLinks = {};

let startUrl = "";
let counter = 0;
let callOnce = true;
let testCount = 0;
let outputOnce = true;
let searchDepth = 50;
let urlCount = 0;

const startCommander = () => {
    program
        .version('0.0.1')
        .option('-u, --url <url>', 'Write URL')
        .option('-o, --output <output>' , 'Output file name')
        .option('-d, --depth <depth>' , 'Search depth')
        .parse(process.argv);

    console.log('Your Site map:');
    if (!program.url) console.log('Please write URL or -h for help');
    if (program.output) console.log('Outputfile :', program.output);
    if (program.depth) console.log('Depth :', program.depth);
    if (program.depth) searchDepth = program.depth;
    startUrl = program.url;
};

const parseBody = (urlPage, linkParent) => {
    request(parseUrl(urlPage), (error, response, body) => {
        if (error) {
            console.log("Error" + error);
        }
        if (response.statusCode === 200) {
            var parsedHtml = cheerio.load(body);
            findLinks(parsedHtml, urlPage, linkParent);
        }
    });
};

const parseUrl = url => {
    return url.substring(0, 1) === '/' ? startUrl + url : url;
};

const updateBar = () => {
    if (bar.curr === 19){
        bar.curr = 0;
    }
    bar.tick({
        urlCount
    });
};

const findLinks = (parsedHtml, pageUrl, linkParent) => {
    testCount++;
    if (testCount < searchDepth) {
        const links = parsedHtml("a");
        const parsedTitle = parsedHtml('title').text();
        const parsedImg = parsedHtml('img').length;
        const eachLinkFound = [];

        updateBar();

        links.each( function() {
            const inputLink = parsedHtml(this).attr('href');
            if (!(typeof inputLink === 'undefined')) { // checks if link is not equal to undefined
                if (inputLink.includes(startUrl) || inputLink.substring(0, 1) == '/' ) { //checks if they are routes
                    urlCount++;
                    if (inputLink in allLinks){ //checks if current url equal child url and checks if current url already exists
                        const foundLinksParents = allLinks[inputLink].parent;
                        if (!foundLinksParents.includes(linkParent)) {
                            allLinks[inputLink]
                                .parent
                                .push(linkParent);
                        }
                    } else {
                        eachLinkFound.push(inputLink);
                        parseBody(inputLink, pageUrl);
                        allLinks[pageUrl] = {
                            title: parsedTitle,
                            child: eachLinkFound,
                            parent: [linkParent],
                            img: parsedImg
                        };
                    }
                }
            }
        });
    } else {
        if (outputOnce) { // checks if file writes only one time
            outputOnce = false;
            bar.curr = 19;
            bar.tick();
            console.log(JSON.stringify(allLinks, null, '  '));
            if (program.output) { // checks if output file name is entered
                fs.writeFile((program.output + ".json"), JSON.stringify(allLinks, null, '  '), function (err) {

                    if (err) throw err;
                });
            }
        }
    }
};
startCommander();
parseBody('/', '');



