;
jQuery(function($) {
    'use strict';

    var App = {
        // Global variables
        api_user_agent: 'Agora Personal (https://github.com/duyminh1998)', // the ID of the client to identify to the Wikimedia API
        min_text_content_length: 280, // the minimum length of content to be passable
        max_post_text_length: 280, // the maximum length of characters for a post before being truncated
        post_height: 200, // the default height of a post
        max_text_posts: 20, // the maximum number of text posts per feed before fetching more posts
        max_image_posts: 10, // the maximum number of image posts per feed before fetching more posts
        max_video_posts: 10, // the maximum number of video posts per feed before fetching more posts
        accepted_image_types: ['PNG', 'SVG', 'JPG', 'JPEG', 'png', 'svg', 'jpg', 'jpeg'],
        accepted_video_types: ['webm', 'WEBM', 'ogv', 'OGV', 'ogg', 'OGG', 'mpeg', 'MPEG', 'mpg', 'MPG'],
        source_for_text_posts: 'wikipedia', // wikipedia or wikisource, but wikisource endpoint is currently unstable
        request_timeout: 500,
        throttleTimer: false,

        init: function() {
            // JQuery stuff. Renders the main game
            App.$doc = $(document);

            App.mediaQueryLimit = Math.ceil(Math.min(App.max_image_posts, App.max_video_posts) * 0.5);
            App.maxMediaRequestRetries = Math.min(App.max_image_posts, App.max_video_posts)

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
            App.generateMediaPosts("image");
            App.generateMediaPosts("video");
            for (let i = 0; i < App.max_text_posts; i++) {
                App.generateTextPost();
            };          
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

        generateMediaPosts: async function(media_type="image") {
            let generatedPostsCount = 0;
            let mediaRequestsCount = 0;
            let targetPostsCount = App.max_image_posts;
            let acceptedFileTypes = App.accepted_image_types;
            let fileJSONKey = 'preferred';

            if (media_type == 'video') {
                targetPostsCount = App.max_video_posts
                acceptedFileTypes = App.accepted_video_types
                fileJSONKey = 'original'
            }

            while (generatedPostsCount < targetPostsCount) {
                let query = await App.getRandomTitle();
    
                if (media_type == "video") query = App.getRandomVideoQuery(query);
    
                let pages = await App.getMediaPages(query, App.mediaQueryLimit);
                
                if (pages && pages.length > 0) {
                    let txt_split;
                    let file_titles = [];
                    pages.forEach((page) => {
                        txt_split = page['key'].split(".");
                        if (txt_split.length > 1 && (acceptedFileTypes.includes(txt_split[1]))) file_titles.push(page['key'])
                    })

                    if (file_titles.length > 0) {
                        for (let i = 0; i < file_titles.length; i++) {
                            let file_title = file_titles[i]
                            let fileJSON = await App.getWikimediaFileJSON(file_title);
                            if (fileJSON && fileJSON[fileJSONKey]) {
                                let fileURL = fileJSON[fileJSONKey]['url'];
                                let file_title_clean = file_title.split(':')[1].split('.')[0].replaceAll('_', ' ').replaceAll('/', ': ');
                                let file_url = `<a href="https://commons.wikimedia.org/wiki/${file_title}" target="_blank" rel="noopener noreferrer">link</a>`
                                let author = 'anon';
                                if (fileJSON['latest']['user']['name']) {
                                    author = fileJSON['latest']['user']['name'];
                                }
                                let post_text = `<div class="agora-feed-image-post"><p><b class="post-title">${file_title_clean}</b><br>By ${author} | ${file_url}</p><img src="${fileURL}"></div>`;
                                if (media_type == 'video') post_text = `<div class="agora-feed-video-post"><p><b class="post-title">${file_title_clean}</b><br>By ${author} | ${file_url}</p><div class="vid-container"><iframe allowfullscreen="true" src="${fileURL}"></iframe></div></div>`;
                                $('#feed').append(post_text);
                                generatedPostsCount++;
                            }
                        }
                    }
                }
                
                mediaRequestsCount++;
                if (mediaRequestsCount > App.maxMediaRequestRetries) break;
                await App.sleep(App.request_timeout);
            }

        },

        getMediaPages: async function(query, limit=App.mediaQueryLimit) {
            let url = `https://api.wikimedia.org/core/v1/commons/search/page?q=${encodeURIComponent(query)}&limit=${encodeURIComponent(limit)}`
            let response = await fetch(url, {
                headers: {
                    'Api-User-Agent': App.api_user_agent
                }
            });
            let response_json = await response.json();
            return response_json['pages'];
        },

        getRandomVideoQuery: function(query) {
            let randomVideoFormat
            if (Math.random() > 0.6) {
                randomVideoFormat = App.accepted_video_types.slice(2)[Math.floor(Math.random() * App.accepted_video_types.slice(2).length)]
            } else {
                randomVideoFormat = 'webm'
            }

            query = query.split("_")
            return query[Math.floor(Math.random() * query.length)].concat("_", randomVideoFormat)
        },

        getWikimediaFileJSON: async function(file) {
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