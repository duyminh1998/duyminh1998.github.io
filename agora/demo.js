;
jQuery(function($) {
    'use strict';

    var App = {
        // Global variables
        api_user_agent: 'Agora Personal (minhhua12345@gmail.com)', // the ID of the client to identify to the Wikimedia API
        min_text_content_length: 280, // the minimum length of content to be passable
        max_post_text_length: 280, // the maximum length of characters for a post before being truncated
        max_posts_per_feed: 30, // the maximum number of posts per feed before fetching more posts

        init: function() {
            // JQuery stuff. Renders the main game
            App.$doc = $(document);

            // On init, call these functions to set up area
            // App.refreshFeed();
            
            // Buttons
            App.$doc.on('click', '#refresh-feed-btn', async function() {
                // App.generateTextPost();
                // let imgData = await App.getRandomImageTitle('oh_my_girl', 3);
                let imgData = await App.getRandomImage();
                // console.log(imgData);
            });

            App.$doc.on('click', '.post', function() {
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
            let feed = [];
            let cur_post;
            for (let i = 0; i < App.max_posts_per_feed; i++) {
                App.generateTextPost();
                // feed.push(cur_post);
                // $('#feed').append(cur_post);
            };
            // for (let i = 0; i < feed.length; i++) {
            //     $('#feed').append(feed[i]);
            // };            
        },
        generateTextPost: async function() {
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
            let post_text =  `<div class="post"><p><b>${titleClean}</b><br>By ${randomAuthor}<br><a href="https://en.wikisource.org/wiki/${title}" target="_blank" rel="noopener noreferrer">link</a></p><p>${randomParagraph}</p></div>`;
            $('#feed').append(post_text);
            // return post_text
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
            let authors = $('a[title]', el);
            let author = "anon";
            for (let i = 0; i < authors.length; i++) {
                if (authors[i].title.substring(0, 6) == "Author") {
                    author = authors[i].textContent;
                    break;
                };
            }

            let paragraphs = $('p', el);
            let randomIdx = Math.floor(Math.random() * paragraphs.length);
            let paragraphText = paragraphs[randomIdx].textContent;

            let retries = 0;
            let maxRetries = 5;
            while (paragraphText.length < App.min_text_content_length) {
            	randomIdx = Math.floor(Math.random() * paragraphs.length);
                paragraphText = paragraphs[randomIdx].textContent;
                retries = retries + 1;
                if (retries > maxRetries) {
                	paragraphText = null;
                    break;
                }
            }

            return [paragraphText, author];
        },
        // getRandomImageTitle: async function(q, limit) {
        //     let base_url = `https://api.wikimedia.org/core/v1/commons/search/page?q=${q}&limit=${limit}`
        //     let url = base_url
        //     let response = await fetch(url, {
        //         headers: {
        //             'Api-User-Agent': App.api_user_agent
        //         }
        //     });
        //     let images = await response.json();
        //     console.log(images)
        //     return images;
        // },
        getRandomImage: async function() {
            let url = 'https://commons.wikimedia.org/wiki/Special:Random/File/'
            let response = await fetch(url, {
                headers: {
                    'Api-User-Agent': App.api_user_agent
                }
            });
            let imgJSON = await response.json();
            console.log(imgJSON)
            return imgJSON; 
        },
        getImageURL: async function(file) {
            let base_url = 'https://api.wikimedia.org/core/v1/commons/file/'
            // let file = 'File:IZONE Logo 480 340.png'
            let url = base_url + file
            let response = await fetch(url, {
                headers: {
                    'Api-User-Agent': App.api_user_agent
                }
            });
            let imgJSON = await response.json();
            console.log(imgJSON)
            return imgJSON;         
        }   
    };

    App.init();

}($));