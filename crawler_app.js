const request = require('request');
const cheerio = require('cheerio');
const URL = require('url-parse');
const fs = require('fs');
const promptly = require('promptly');

let startUrl = "";
let counter = 0;
let callOnce = true;
let testCount = 0;
const allLinks = {};
let outputOnce = true;
let searchDepth = 5;
const parseBody = (urlPage, linkParent) => {
    if (urlPage.substring(0, 1) == '/'){
      request((startUrl + urlPage), (error, response, body) =>{
        if (error) {
            console.log("Error" + error);
        }
        if (response.statusCode === 200) {
            var parsedHtml = cheerio.load(body);
            findLinks(parsedHtml, urlPage, linkParent);
        }
    });
    } else {
        request((urlPage), (error, response, body) =>{
        if (error) {
            console.log("Error" + error);
        }
        if (response.statusCode === 200) {
            var parsedHtml = cheerio.load(body);
            findLinks(parsedHtml, urlPage, linkParent);
        }
    });
    }
};

promptly.prompt('Please write website : ', function (err, value){
    startUrl = value;
    parseBody('/', '');
    console.log(value);
})

const findLinks = (parsedHtml, pageUrl, linkParent) => {
    testCount++;
    if (testCount < searchDepth) {
        let links = parsedHtml("a");
        const parsedTitle = parsedHtml('title').text();
        const parsedImg = parsedHtml('img').length;
        const eachLinkFound = [];
        links.each( function() {
            let inputLink = parsedHtml(this).attr('href');
            console.log(inputLink);
            if (inputLink.includes(startUrl) || inputLink.substring(0, 1)== '/' ) { //checks if they are routes
                if (inputLink == pageUrl){ //checks if current url equal child url
                } else if (inputLink in allLinks) { // checks if current url already exists
                    let foundLinksParents = allLinks[inputLink].parent;
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
        });
    } else {
                if (outputOnce === true) {
                    fs.writeFile("crawlerResults.json", JSON.stringify(allLinks, null, '  '), function (err) {
                        if (err) throw err;
                    });
                    console.log(JSON.stringify(allLinks, null, '  '));
                    outputOnce = false;
                }
    }
};



