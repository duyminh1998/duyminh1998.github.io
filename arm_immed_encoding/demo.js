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
            App.$doc.on('input', '.val-input', App.update);
            // Populate examples
            App.$doc.on('click', "#ex-261120", function() {
                $('.val-input').val(261120);
                App.update();
                return false;
            });
            App.$doc.on('click', "#ex-0x102", function() {
                $('.val-input').val(0x102);
                App.update();
                return false;
            });
            App.$doc.on('click', "#ex-0xFF0000FF", function() {
                $('.val-input').val(0xFF0000FF);
                App.update();
                return false;
            });
            App.$doc.on('click', "#ex-0xC0000034", function() {
                $('.val-input').val(0xC0000034);
                App.update();
                return false;
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
                            $("#find-cor-bits-".concat(31 - i)).css("color", "rgb(255,98,102)");
                        }
                        else {
                            $("#find-cor-bits-".concat(31 - i)).css("color", '');
                        }
                    };
                    $(".continue-to-rot-container").html('');                   
                } else {
                    for (let i = 8; i < 32; i++) {
                        $("#find-cor-bits-".concat(31 - i)).css("color", '');
                    };
                    $(".continue-to-rot-container").html($("#continue-to-rot-template").html());
                    App.rotAmt = 0;
                    App.timesClickedShowOGBits = 0;
                    App.setBits(bitRotated, "#rot-back-bits-");                      
                    $("#8-bit-equals").text(bitRotated);
                    $("#8-bit-equals-2").text(bitRotated);
                    $("#8-bit-equals-3").text(bitRotated);
                    let bitRotatedBit = bitRotated.toString(2);
                    $("#8-bit-equals-bit").text(bitRotatedBit);
                    $("#8-bit-equals-bit-2").text(bitRotatedBit);
                    //window.scrollTo(0,document.body.scrollHeight);
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
                            $("#find-cor-bits-".concat(31 - i)).css("color", "rgb(255,98,102)");
                        }
                        else {
                            $("#find-cor-bits-".concat(31 - i)).css("color", '');
                        }
                    };
                    $(".continue-to-rot-container").html('');               
                } else {
                    for (let i = 8; i < 32; i++) {
                        $("#find-cor-bits-".concat(31 - i)).css("color", '');
                    };
                    $(".continue-to-rot-container").html($("#continue-to-rot-template").html());
                    App.rotAmt = 0;
                    App.timesClickedShowOGBits = 0;
                    App.setBits(bitRotated, "#rot-back-bits-");
                    $("#8-bit-equals").text(bitRotated);
                    $("#8-bit-equals-2").text(bitRotated);
                    $("#8-bit-equals-3").text(bitRotated);
                    let bitRotatedBit = bitRotated.toString(2);
                    $("#8-bit-equals-bit").text(bitRotatedBit);
                    $("#8-bit-equals-bit-2").text(bitRotatedBit);
                    //window.scrollTo(0,document.body.scrollHeight);               
                };                 
            });
            // Show original input bits
            App.$doc.on('click', '#show-og-bits-btn', function() {
                if (App.timesClickedShowOGBits % 2 == 0) {
                    $('.og-input-bits').html($('#og-input-bits-template').html());
                    App.setBits($(".val-input").val(), "#show-input-bits-");
                    App.timesClickedShowOGBits++;
                    let bits = App.getBits("#show-input-bits-");
                    let leadingBit = App.determineLeadBit(bits);
                    for (let i = 0; i <= leadingBit; i++) {
                        $("#show-input-bits-".concat(31 - i)).css("color", "#A7BCFD");
                    }
                } else {
                    $('.og-input-bits').html('');
                    App.timesClickedShowOGBits++;
                };
            });            
            // Second right arrow
            App.$doc.on('click', '#rot-back-right-arrow', function() {
                let bits = App.getBits("#rot-back-bits-");
                let ogBits = App.getBits("#find-cor-bits-");
                let bitRotated = App.ror(bits, 2);
                let leadingBit = App.determineLeadBit(bitRotated);
                App.setBits(bitRotated, "#rot-back-bits-");
                App.rotAmt = (App.rotAmt + 2) % 32;
                $("#rot-amt-blurb").text("You have rotated the bottom 8 bits ".concat(App.rotAmt, " times to the right."));
                if (bitRotated == $(".val-input").val()) {
                    for (let i = 0; i <= leadingBit; i++) {
                        $("#rot-back-bits-".concat(31 - i)).css("color", "#A7BCFD");
                    }
                    $("#correct-answer").text("Congratulations! You have transformed the 8-bit number in the instruction back to the original bits. Therefore, the correct ARM immediate encoding for ".concat(
                        $(".val-input").val(),
                        " is ",
                        ogBits,
                        " ROR ",
                        App.rotAmt,
                        "."
                    ));
                    $('#animation-container').html($('#play-animation-template').html());
                    $("#pre-animation-blurb").text("Here is a visualization of how ARM reconstructs the original number ".concat(
                        $(".val-input").val(),
                        " by rotating ",
                        ogBits,
                        " to the right ",
                        App.rotAmt,
                        " times. Press play animation to see it in action."
                    )); 
                    App.setBits(ogBits, "#animation-bits-");
                    $("#animation-blurb").text(String(ogBits).concat(" ROR 0 = ", ogBits));                    
                } else {
                    for (let i = 0; i <= 31; i++) {
                        $("#rot-back-bits-".concat(31 - i)).css("color", "");
                    }                    
                    $("#correct-answer").text('');
                    $('#animation-container').html('');
                };
                //window.scrollTo(0,document.body.scrollHeight);
            });
            // Reset button click
            App.$doc.on('click', '#rot-back-reset', function() {
                App.setBits(App.getBits("#find-cor-bits-"), "#rot-back-bits-");
                App.rotAmt = 0;
                $("#rot-amt-blurb").text("You have rotated the original value ".concat(App.rotAmt, " times to the right."));   
                $("#correct-answer").text('');   
                $('#animation-container').html('');          
                for (let i = 0; i <= 31; i++) {
                    $("#rot-back-bits-".concat(31 - i)).css("color", "");
                };                
            });
            // Play animation
            App.$doc.on('click', '#play-animation-btn', async function() {
                let bitRotated = App.getBits("#find-cor-bits-");
                let ogBits = bitRotated;
                App.setBits(bitRotated, "#animation-bits-");
                $("#animation-blurb").text(String(ogBits).concat(" ROR ", 0," = ", ogBits));
                let curRotAmt = 2;
                while (curRotAmt <= App.rotAmt) {
                    await App.sleep(1000);
                    bitRotated = App.ror(bitRotated, 2);
                    App.setBits(bitRotated, "#animation-bits-");
                    $("#animation-blurb").text(String(ogBits).concat(" ROR ", curRotAmt," = ", bitRotated));
                    curRotAmt = curRotAmt + 2;
                }
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

        update: function() {
            // Reset globals when we insert a new number
            $(".continue-container").html('');
            $(".continue-to-rot-container").html('');

            App.resetBits("#input-bits-");
            let inputNum = $(".val-input").val();
            
            $("#your-num-is").text("The binary representation of ".concat(inputNum, " is:"));
            if (inputNum) {
                App.setBits(inputNum, "#input-bits-");
                let leadingBit = App.determineLeadBit(inputNum);
                if (leadingBit > 7) {
                    for (let i = 8; i <= leadingBit; i++) {
                        $("#input-bits-".concat(31 - i)).css("color", "rgb(255,98,102)");
                    };
                    $(".continue-container").html($("#continue-no-template").html());
                    let inputNum = $(".val-input").val();
                    if (inputNum) {
                        App.setBits(inputNum, "#find-cor-bits-");
                        let leadingBit = App.determineLeadBit(inputNum);
                        if (leadingBit > 7) {
                            for (let i = 8; i <= leadingBit; i++) {
                                $("#find-cor-bits-".concat(31 - i)).css("color", "rgb(255,98,102)");
                            };                        
                        };
                    };                                                
                } else {
                    $(".continue-container").html($("#continue-yes-template").html());
                };
                //window.scrollTo(0,document.body.scrollHeight);
            };
        },

        sleep: function(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
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
                if (i < 24) { $(src.concat(i)).css("color", ''); };
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