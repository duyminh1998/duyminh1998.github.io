;
jQuery(function($){    
    'use strict';

    var App = {
        // Global variables
        timesClickedShowOGBits: 0,
        rotAmt: 0,

        init: function () {
            // JQuery stuff. Renders the main game
            App.$doc = $(document);

            // On init, call these functions to set up area
            App.resetBits("#input-bits-");

            // Binds buttons to events
            // Populate input number
            App.$doc.on('input', '.val-input', function() {
                // Reset globals when we insert a new number
                $(".continue-container").html('');
                $(".continue-to-rot-container").html('');

                App.resetBits("#input-bits-");
                let inputNum = $(".val-input").val();
                if (inputNum) {
                    App.setBits(inputNum, "#input-bits-");
                    let leadingBit = App.determineLeadBit(inputNum);
                    if (leadingBit > 7) {
                        for (let i = 8; i <= leadingBit; i++) {
                            $("#input-bits-".concat(31 - i)).css("background-color", "#fc9b9b");
                        };                        
                    };
                };
            });
            // Continue
            App.$doc.on('click', '#cont-no', function() {
                $(".continue-container").html($("#continue-no-template").html());
                let inputNum = $(".val-input").val();
                if (inputNum) {
                    App.setBits(inputNum, "#find-cor-bits-");
                    let leadingBit = App.determineLeadBit(inputNum);
                    if (leadingBit > 7) {
                        for (let i = 8; i <= leadingBit; i++) {
                            $("#find-cor-bits-".concat(31 - i)).css("background-color", "#fc9b9b");
                        };                        
                    };
                };                
            });
            // First right arrow  
            App.$doc.on('click', '#find-cor-bits-right-arrow', function() {
                let bits= App.getBits("#find-cor-bits-");
                let bitRotated = App.ror(bits, 2);
                App.setBits(bitRotated, "#find-cor-bits-");
                let leadingBit = App.determineLeadBit(bitRotated);
                if (leadingBit > 7) {
                    for (let i = 8; i < 32; i++) {
                        if (i <= leadingBit) {
                            $("#find-cor-bits-".concat(31 - i)).css("background-color", "#fc9b9b");
                        }
                        else {
                            $("#find-cor-bits-".concat(31 - i)).css("background-color", '');
                        }
                    };
                    $(".continue-to-rot-container").html('');                   
                } else {
                    for (let i = 8; i < 32; i++) {
                        $("#find-cor-bits-".concat(31 - i)).css("background-color", '');
                    };
                    $(".continue-to-rot-container").html($("#continue-to-rot-template").html());
                    App.rotAmt = 0;
                    App.timesClickedShowOGBits = 0;
                    App.setBits(bitRotated, "#rot-back-bits-");                      
                };                
            });
            // First left arrow  
            App.$doc.on('click', '#find-cor-bits-left-arrow', function() {
                let bits= App.getBits("#find-cor-bits-");
                let bitRotated = App.rol(bits, 2);
                App.setBits(bitRotated, "#find-cor-bits-");
                let leadingBit = App.determineLeadBit(bitRotated);
                if (leadingBit > 7) {
                    for (let i = 8; i < 32; i++) {
                        if (i <= leadingBit) {
                            $("#find-cor-bits-".concat(31 - i)).css("background-color", "#fc9b9b");
                        }
                        else {
                            $("#find-cor-bits-".concat(31 - i)).css("background-color", '');
                        }
                    };
                    $(".continue-to-rot-container").html('');               
                } else {
                    for (let i = 8; i < 32; i++) {
                        $("#find-cor-bits-".concat(31 - i)).css("background-color", '');
                    };
                    $(".continue-to-rot-container").html($("#continue-to-rot-template").html());
                    App.rotAmt = 0;
                    App.timesClickedShowOGBits = 0;
                    App.setBits(bitRotated, "#rot-back-bits-");               
                };                
            });
            // Show original input bits
            App.$doc.on('click', '#show-og-bits-btn', function() {
                if (App.timesClickedShowOGBits % 2 == 0) {
                    $('.og-input-bits').html($('#og-input-bits-template').html());
                    App.setBits($(".val-input").val(), "#show-input-bits-");
                    App.timesClickedShowOGBits++;
                } else {
                    $('.og-input-bits').html('');
                    App.timesClickedShowOGBits++;
                };
            });            
            // Second right arrow
            App.$doc.on('click', '#rot-back-right-arrow', function() {
                let bits = App.getBits("#rot-back-bits-");
                let bitRotated = App.ror(bits, 2);
                App.setBits(bitRotated, "#rot-back-bits-");
                App.rotAmt = (App.rotAmt + 2) % 32;
                $("#rot-amt-blurb").text("You have rotated the original value ".concat(App.rotAmt, " times to the right."));
                if (bitRotated == $(".val-input").val()) {
                    $("#correct-answer").text("You have lined up the 8 bits into the original bits. The correct ARM immediate encoding for ".concat(
                        $(".val-input").val(),
                        " is ",
                        App.getBits("#find-cor-bits-"),
                        " ROR ",
                        App.rotAmt,
                        "."
                    ));
                } else {
                    $("#correct-answer").text('');
                };
            });
            // Reset button click
            App.$doc.on('click', '#rot-back-reset', function() {
                App.setBits(App.getBits("#find-cor-bits-"), "#rot-back-bits-");
                App.rotAmt = 0;
                $("#rot-amt-blurb").text("You have rotated the original value ".concat(App.rotAmt, " times to the right."));   
                $("#correct-answer").text('');             
            });            
            // Prevent enter button from refreshing page
            App.$doc.on('keyup keypress', function(e) {
                var keyCode = e.keyCode || e.which;
                if (keyCode == 13) { 
                    e.preventDefault();
                    return false;
                }
            });            
        },

        rol: function(n, i) {
            return ((n << i) | (n >>> (32 - i))) >>> 0;
        },
        
        ror: function(n, i) {
            return ((n >>> i) | (n << (32 - i))) >>> 0;
        },

        setBits: function(n, src) {
            for (let i = 0; i < 32; i++) {
                $(src.concat(i)).text(((n >>> (31 - i)) & 1).toString());
            };          
        },

        resetBits: function(src) {
            for (let i = 0; i < 32; i++) {
                $(src.concat(i)).text('0');
                if (i < 24) { $(src.concat(i)).css("background-color", ''); };
            };            
        },

        determineLeadBit: function(n) {
            let pos = 0;
            for (let i = 0; i < 32; i++) {
                if (((n >>> (31 - i)) & 1) == 1) {
                    pos = 31 - i;
                    break;
                };
            };
            return pos;        
        },

        getBits: function(src) {
            let bitStr = "";
            for (let i = 0; i < 32; i++) {
                bitStr = bitStr.concat($(src.concat(i)).text());
            };
            let bits = parseInt(bitStr, 2);
            return bits;
        }               
    };

    App.init();

}($));