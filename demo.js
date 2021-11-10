;
jQuery(function($){    
    'use strict';

    var App = {
        init: function () {
            // JQuery stuff. Renders the main game
            App.$doc = $(document);

            // Binds buttons to events
            // First right arrow  
            App.$doc.on('click', '#input-right-arrow', function() {
                let bits= App.getBits();
                let bitRotated = App.ror(bits, 2);
                App.setBits(bitRotated);
            });
            // First left arrow  
            App.$doc.on('click', '#input-left-arrow', function() {
                let bits= App.getBits();
                let bitRotated = App.rol(bits, 2);
                App.setBits(bitRotated);
            });            
        },

        rol: function(n, i) {
            return ((n << i) | (n >>> (32 - i))) >>> 0;
        },
        
        ror: function(n, i) {
        return ((n >>> i) | (n << (32 - i))) >>> 0;
        },

        setBits: function(n) {
            for (let i = 0; i < 32; i++) {
                $("#input-bits-".concat(i)).text(((n >>> (31 - i)) & 1).toString());
            };          
        },

        getBits: function() {
            let bitStr = "";
            for (let i = 0; i < 32; i++) {
                bitStr = bitStr.concat($("#input-bits-".concat(i)).text());
            };
            let bits = parseInt(bitStr, 2);
            return bits;
        }        
    };

    App.init();

}($));