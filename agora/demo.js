;
jQuery(function($) {
    'use strict';

    var App = {
        // Global variables
        api_user_agent: 'Agora Personal (minhhua12345@gmail.com)', // the ID of the client to identify to the Wikimedia API
        min_content_length: 280, // the minimum length of content to be passable
        max_post_length: 280, // the maximum length of characters for a post before being truncated
        maxPostsPerFeed: 30, // the maximum number of posts per feed before fetching more posts

        init: function() {
            // JQuery stuff. Renders the main game
            App.$doc = $(document);

            // On init, call these functions to set up area
            App.refreshFeed();
            
            // Buttons
            App.$doc.on('click', '#refresh-feed-btn', async function() {
                App.generatePost();
                // let imgData = await App.getRandomImage();
                // console.log(imgData);
            });

            App.$doc.on('click', '.post', function() {
                // console.log('clicked');
                if ($(this).css("height") == "300px") {
                    $(this).css({"height": "auto"});
                }
                else {
                    $(this).css({"height": "300px"});
                }
            });
        },
        // Methods
        refreshFeed: async function() {
            for (let i = 0; i < App.maxPostsPerFeed; i++) {
                App.generatePost();
            };
        },
        generatePost: async function() {
            let title = await App.getRandomPageTitle();
            // console.log(title);
            let html = await App.getPageHTML(title);
            // $('#sandbox').html(html);
            let [randomParagraph, randomAuthor] = App.getRandomPargraph(html);
            while (!randomParagraph) {
                title = await App.getRandomPageTitle();
                html = await App.getPageHTML(title);
                [randomParagraph, randomAuthor] = App.getRandomPargraph(html);
            }
            let titleClean = title.replaceAll('_', ' ').replaceAll('/', ': ');
            // if (randomParagraph.length > App.max_post_length) {
            //     $('#feed').append(`<div class="post"><p><b>${titleClean}</b></p><p>${randomParagraph}</p><p>By ${randomAuthor}</p><a href="https://en.wikisource.org/wiki/${title}" target="_blank" rel="noopener noreferrer">link</a><p></p></div>`);
            // }
            // else {
            //     $('#feed').append(`<div class="post"><p><b>${titleClean}</b></p><p>${randomParagraph}</p><p>By ${randomAuthor}</p><a href="https://en.wikisource.org/wiki/${title}" target="_blank" rel="noopener noreferrer">link</a><p></p></div>`);
            // }
            $('#feed').append(`<div class="post"><p><b>${titleClean}</b><br>By ${randomAuthor}<br><a href="https://en.wikisource.org/wiki/${title}" target="_blank" rel="noopener noreferrer">link</a></p><p>${randomParagraph}</p></div>`);
            },
        getRandomPageTitle: async function() {
        		let response = await fetch('https://en.wikisource.org/api/rest_v1/page/random/title', {
                headers: {
                  'Api-User-Agent': App.api_user_agent,  
                  'accept': 'application/problem+json'
                }
            });
            let title = await response.json();
            title = title.items[0]['title'];
            return title;
        },
        getPageHTML: async function(title) {
        		let response = await fetch(`https://en.wikisource.org/api/rest_v1/page/html/${encodeURIComponent(title)}`, {
                headers: {
                  'Api-User-Agent': App.api_user_agent,  
                  'accept': 'text/html; charset=utf-8; profile="https://www.mediawiki.org/wiki/Specs/HTML/2.1.0"'
                }
            });
            let html = await response.text();
            return html;        
        },
        getRandomPargraph: function(html) {
            var el = $('<div></div>');
    		el.html(html);
            // console.log($('a:contains(Author)', el).text());
            let authors = $('a[title]', el);
            let author = "anon";
            for (let i = 0; i < authors.length; i++) {
                if (authors[i].title.substring(0, 6) == "Author") {
                    author = authors[i].textContent;
                    break;
                };
            }
            // console.log($('p', el).text());
    				// console.log($('p', el)[12].textContent);
            let paragraphs = $('p', el);
            let randomIdx = Math.floor(Math.random() * paragraphs.length);
            let paragraphText = paragraphs[randomIdx].textContent;
            // console.log(paragraphText);
            let retries = 0;
            let maxRetries = 5;
            while (paragraphText.length < App.min_content_length) {
            	randomIdx = Math.floor(Math.random() * paragraphs.length);
                paragraphText = paragraphs[randomIdx].textContent;
                retries = retries + 1;
                if (retries > maxRetries) {
                	paragraphText = null;
                    break;
                }
            }
            // console.log(paragraphText);
            return [paragraphText, author];
        },
        // getRandomImage: async function() {
        //     let response = await fetch('https://commons.wikimedia.org/w/api.php', {
        //         headers: {
        //           'Api-User-Agent': App.api_user_agent,  
        //           'action': 'query',
        //           'list': 'random',
        //           'rnnamespace': '6',
        //           'rnlimit': '1'
        //         }
        //     });
        //     let imgJSON = await response.json();
        //     return imgJSON;         
        // }
    };

    App.init();

}($));