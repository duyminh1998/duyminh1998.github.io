;
jQuery(function($) {
    'use strict';

    var App = {
        // Global variables
        api_user_agent: 'Agora Personal (https://github.com/duyminh1998)', // the ID of the client to identify to the Wikimedia API
        min_text_content_length: 280, // the minimum length of content to be passable
        max_post_text_length: 280, // the maximum length of characters for a post before being truncated
        post_height: 200, // the default height of a post
        max_text_posts: 30, // the maximum number of posts per feed before fetching more posts
        max_image_posts: 20, // the ratio of images/media to text-only posts
        accepted_image_types: ['PNG', 'SVG', 'JPG', 'JPEG', 'png', 'svg', 'jpg', 'jpeg'],
        source_for_text_posts: 'wikipedia', // wikipedia or wikisource, but wikisource endpoint is currently unstable
        current_image_posts_count: 0,
        request_timeout: 1,
        throttleTimer: false,

        init: function() {
            // JQuery stuff. Renders the main game
            App.$doc = $(document);

            // On init, call these functions to set up area
            App.refreshFeed();
            
            // Buttons
            App.$doc.on('click', '#load-more-btn', async function() {
                App.refreshFeed();
            });            

            // Expand post card when clicked
            App.$doc.on('click', '.agora-feed-text-post', function() {
                if ($(this).css("height") == `${App.post_height}px`) {
                    $(this).css({"height": "auto"});
                }
                else {
                    $(this).css({"height": `${App.post_height}px`});
                }
            });

            App.$doc.on('click', '.agora-feed-image-post', function() {
                if ($(this).css("height") == `${App.post_height}px`) {
                    $(this).css({"height": "auto"});
                }
                else {
                    $(this).css({"height": `${App.post_height}px`});
                }
            });
            
            window.addEventListener("scroll", App.handleInfiniteScroll);
        },

        // Methods
        refreshFeed: async function() {
            App.current_image_posts_count = 0;
            for (let i = 0; i < App.max_text_posts; i++) {
                App.generateTextPost();
            };          
            for (let j = 0; j < App.max_image_posts; j++) {
                // App.getRandomImage();
            }
        },

        generateTextPost: async function(source=App.source_for_text_posts) {
            let post_text;
            let title = await App.getRandomTitle(source);
            let html = await App.getPageHTML(title, source);
            
            if (html) {
                let [randomParagraph, randomAuthor] = App.getRandomParagraph(html, source);
                let titleClean = title.replaceAll('_', ' ').replaceAll('/', ': ');
                if (randomParagraph && randomAuthor) {
                    if (source == "wikipedia") post_text = `<div class="agora-feed-text-post"><p><b class="post-title">${titleClean}</b><br>By ${randomAuthor} | <a href="https://en.wikipedia.org/wiki/${title}" target="_blank" rel="noopener noreferrer">link</a></p><p>${randomParagraph}</p></div>`;
                }
            }

            if (post_text) {
                $('#feed').append(post_text);
            }
        },

        getRandomTitle: async function(source=App.source_for_text_posts) {
            let url;
            let title;
            switch(source) {
                case 'wikipedia':
                    url = 'https://en.wikipedia.org/api/rest_v1/page/random/title';
                    break;
                case 'wikisource':
                    url = 'https://en.wikisource.org/api/rest_v1/page/random/title';
                    break;
                default:
                    break;
            }
            if (url) {
                let response = await fetch(url, {
                    headers: {
                      'Api-User-Agent': App.api_user_agent,  
                      'accept': 'application/problem+json'
                    }
                });
                if (response) {
                    let response_json = await response.json();
                    if (response_json.items.length > 0) {
                        title = response_json.items[0]['title'];
                    }
                }
            }
            return title
        },

        getPageHTML: async function(title, source=App.source_for_text_posts) {
            let url;
            let page_html;
            switch(source) {
                case 'wikipedia':
                    url = `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(title)}`;
                    break;
                case 'wikisource':
                    url = `https://en.wikisource.org/api/rest_v1/page/html/${encodeURIComponent(title)}`;
                    break;
                default:
                    break;
            }
            if (url) {
                let response = await fetch(url, {
                    headers: {
                      'Api-User-Agent': App.api_user_agent,  
                      'accept': 'text/html; charset=utf-8; profile="https://www.mediawiki.org/wiki/Specs/HTML/2.1.0"'
                    }
                });
                page_html = await response.text();
            }
            return page_html
        },

        getRandomParagraph: function(html, source=App.source_for_text_posts) {
            let paragraph_and_author;

            var el = $('<div></div>');
            el.html(html);

            if (source == "wikipedia") {
                paragraph_and_author = App.getRandomParagraphFromWikipedia(el)
            } else if (source == "wikisource") {
                // TODO
            }

            return paragraph_and_author;
        },

        getRandomParagraphFromWikipedia: function(mounted_html) {
            let author = "Wikipedia contributers";
            let paragraphText;

            let paragraphs = $('p', mounted_html);
            if (paragraphs.length > 0) {
                let randomIdx = Math.floor(Math.random() * paragraphs.length);
                paragraphText = paragraphs[randomIdx].textContent;
    
                let retries = 0;
                let maxRetries = Math.ceil(0.75 * paragraphs.length);
                while (paragraphText.length < App.min_text_content_length) {
                    randomIdx = Math.floor(Math.random() * paragraphs.length);
                    paragraphText = paragraphs[randomIdx].textContent;
                    retries = retries + 1;
                    if (retries > maxRetries) {
                        paragraphText = null;
                        break;
                    }
                }
            }

            return [paragraphText, author];
        },

        getRandomParagraphFromWikisource: function(mounted_html) {
            // TODO
            // let authors = $('a[title]', el);
            // let author = "anon";
            // for (let i = 0; i < authors.length; i++) {
            //     if (authors[i].title.substring(0, 6) == "Author") {
            //         author = authors[i].textContent;
            //         break;
            //     };
            // }
        },

        getRandomImage: async function() {
            let q = await App.getRandomTitle();
            let limit = 10
            let url = `https://api.wikimedia.org/core/v1/commons/search/page?q=${q}&limit=${limit}`
            let response = await fetch(url, {
                headers: {
                    'Api-User-Agent': App.api_user_agent
                }
            });
            let response_json = await response.json();
            let pages = response_json['pages'];

            if (pages && pages.length > 0) {
                let txt_split;
                let image_title;
                for (let i = 0; i < pages.length; i++) {
                    txt_split = pages[i]['key'].split(".");
                    if (txt_split.length > 1 && (App.accepted_image_types.includes(txt_split[1]))) {
                        image_title = pages[i]['key'];
                        break
                    }
                }
                
                if (image_title) {
                    let imageJSON = await App.getImageJSON(image_title);
                    if (imageJSON && imageJSON['preferred']) {
                        let imageURL = imageJSON['preferred']['url'];
                        let image_title_clean = image_title.split(':')[1].split('.')[0].replaceAll('_', ' ').replaceAll('/', ': ');
                        let author = 'anon';
                        if (imageJSON['latest']['user']['name']) {
                            author = imageJSON['latest']['user']['name'];
                        }
                        let post_text =  `<div class="agora-feed-image-post"><p><b class="post-title">${image_title_clean}</b><br>By ${author}</p><img src="${imageURL}"></div>`;
                        $('#feed').append(post_text);
                        App.current_image_posts_count++;
                    }
                }
            }
        },

        getImageJSON: async function(file) {
            let base_url = 'https://api.wikimedia.org/core/v1/commons/file/'
            let url = base_url + file
            let response = await fetch(url, {
                headers: {
                    'Api-User-Agent': App.api_user_agent
                }
            });
            let imgJSON = await response.json();
            return imgJSON;         
        },   

        sleep: function(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },

        handleInfiniteScroll: function() {
            App.throttle(() => {
                let pageScrollProgress = window.innerHeight + window.scrollY
                if ((pageScrollProgress / document.body.offsetHeight) >= 0.9)  { 
                    App.refreshFeed()
                }
            }, 1000)
        },

        throttle: function(callback, time) {
            if (App.throttleTimer) return;

            App.throttleTimer = true;

            setTimeout(() => {
                callback();
                App.throttleTimer = false;
            }, time)
        },
    };

    App.init();

}($));