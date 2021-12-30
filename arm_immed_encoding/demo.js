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
            App.$doc.on('click', "#ex-261121", function() {
                $('.val-input').val(-36865);
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
            App.$doc.on('click', "#ex-0x103", function() {
                $('.val-input').val(-265);
                App.update();
                return false;
            });
            /////////////////////////////////////// POSTIVE NUMBERS ///////////////////////////////////////////////////////                                 
            // First right arrow  
            App.$doc.on('click', '#find-cor-bits-right-arrow', function() {
                let bits= App.getBits("#find-cor-bits-");
                let bitRotated = App.ror(bits, 2);
                App.setBits(bitRotated, "#find-cor-bits-");
                let leadingBit = App.determineLeadBit(bitRotated, 1);
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
                let leadingBit = App.determineLeadBit(bitRotated, 1);
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
                    let leadingBit = App.determineLeadBit(bits, 1);
                    for (let i = 0; i <= leadingBit; i++) {
                        $("#show-input-bits-".concat(31 - i)).css("color", "#FFBF00");
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
                let leadingBit = App.determineLeadBit(bitRotated, 1);
                App.setBits(bitRotated, "#rot-back-bits-");
                App.rotAmt = (App.rotAmt + 2) % 32;
                $("#rot-amt-blurb").text("You have rotated the bottom 8 bits ".concat(App.rotAmt, " times to the right."));
                if (bitRotated == $(".val-input").val()) {
                    for (let i = 0; i <= leadingBit; i++) {
                        $("#rot-back-bits-".concat(31 - i)).css("color", "#FFBF00");
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
                $("#rot-amt-blurb").text("You have rotated the bottom 8 bits ".concat(App.rotAmt, " times to the right."));   
                $("#correct-answer").text('');   
                $('#animation-container').html('');          
                for (let i = 0; i <= 31; i++) {
                    $("#rot-back-bits-".concat(31 - i)).css("color", "");
                };                
            });
            // Play animation
            App.$doc.on('click', '#play-animation-btn', async function() {
                if ($(".val-input").val() >= 0) {
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
                } else {
                    let bitRotated = ~(App.getBits("#find-cor-bits-"));
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
                    };
                    await App.sleep(1000);
                    $("#animation-blurb").text(String(ogBits).concat(" ROR ", curRotAmt - 2," = ", bitRotated, ". Inverting ", bitRotated, " yields ", ~bitRotated, "."));
                    App.setBits(~bitRotated, "#animation-bits-");
                };
            });                        
            // Prevent enter button from refreshing page
            App.$doc.on('keyup keypress', function(e) {
                var keyCode = e.keyCode || e.which;
                if (keyCode == 13) { 
                    e.preventDefault();
                    return false;
                }
            });
            /////////////////////////////////////// POSTIVE NUMBERS /////////////////////////////////////////////////////// 

            /////////////////////////////////////// NEGATIVE NUMBERS ///////////////////////////////////////////////////////
            // First right arrow  
            App.$doc.on('click', '#find-cor-bits-neg-num-right-arrow', function() {
                let bits= App.getBits("#find-cor-bits-");
                let bitRotated = App.ror(bits, 2);
                App.setBits(bitRotated, "#find-cor-bits-");
                let leadingBit = App.determineLeadBit(bitRotated, 0);
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
                    $(".continue-to-rot-container").html($("#continue-to-rot-neg-num-template").html());
                    App.rotAmt = 0;
                    App.timesClickedShowOGBits = 0;
                    //App.setBits(bitRotated, "#invert-pre-rot-neg-bits-");
                    //App.setBits(~bitRotated, "#invert-post-rot-neg-bits-");
                    $("#invert-pre-rot-neg-bits").text(bitRotated.toString(2));
                    let temp = (~bitRotated).toString(2);
                    $("#invert-post-rot-neg-bits").text("0".repeat(32 - temp.length) + temp);
                    App.setBits(~bitRotated, "#invert-post-rot-neg-bits-2-"); 
                    App.setBits(bitRotated, "#invert-post-rot-post-neg-bits-"); 
                };               
            });
            // First left arrow  
            App.$doc.on('click', '#find-cor-bits-neg-num-left-arrow', function() {
                let bits= App.getBits("#find-cor-bits-");
                let bitRotated = App.rol(bits, 2);
                App.setBits(bitRotated, "#find-cor-bits-");
                let leadingBit = App.determineLeadBit(bitRotated, 0);
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
                    $(".continue-to-rot-container").html($("#continue-to-rot-neg-num-template").html()); 
                    App.rotAmt = 0;
                    App.timesClickedShowOGBits = 0;
                    //App.setBits(bitRotated, "#invert-pre-rot-neg-bits-");
                    //App.setBits(~bitRotated, "#invert-post-rot-neg-bits-");
                    $("#invert-pre-rot-neg-bits").text(bitRotated.toString(2));
                    let temp = (~bitRotated).toString(2);
                    $("#invert-post-rot-neg-bits").text("0".repeat(32 - temp.length) + temp);                 
                    App.setBits(~bitRotated, "#invert-post-rot-neg-bits-2-");
                    App.setBits(bitRotated, "#invert-post-rot-post-neg-bits-");                     
                };                 
            });
            // Second right arrow
            App.$doc.on('click', '#rot-back-neg-num-right-arrow', function() {
                let bits = App.getBits("#invert-post-rot-neg-bits-2-");
                let ogBits = App.getBits("#find-cor-bits-");
                ogBits = (~ogBits).toString(2);
                ogBits = "0".repeat(8 - ogBits.length) + ogBits;
                let bitRotated = App.ror(bits, 2);
                let leadingBit = App.determineLeadBit(~bitRotated, 0);
                App.setBits(bitRotated, "#invert-post-rot-neg-bits-2-");
                App.setBits(~bitRotated, "#invert-post-rot-post-neg-bits-");
                App.rotAmt = (App.rotAmt + 2) % 32;
                $("#neg-num-rot-amt").text(App.rotAmt);
                if (~bitRotated == $(".val-input").val()) {
                    for (let i = 0; i <= leadingBit; i++) {
                        $("#invert-post-rot-post-neg-bits-".concat(31 - i)).css("color", "#FFBF00");
                    }
                    $("#neg-num-correct-answer").text("Congratulations! You have transformed the 8-bit number back to the original bits. Therefore, the correct instruction to move ".concat(
                        $(".val-input").val(),
                        " into register r0 (for example) is MVN r0, 0b",
                        ogBits,
                        ", ",
                        App.rotAmt,
                        "."
                    ));
                    $('#neg-num-animation-container').html($('#play-animation-template').html());
                    $("#pre-animation-blurb").text("Here is a visualization of how ARM reconstructs the original number ".concat(
                        $(".val-input").val(),
                        " by rotating ",
                        ogBits,
                        " to the right ",
                        App.rotAmt,
                        " times and then inverting it. Press play animation to see it in action."
                    ));
                    App.setBits(~(App.getBits("#find-cor-bits-")), "#animation-bits-");                    
                } else {
                    for (let i = 0; i <= 31; i++) {
                        $("#invert-post-rot-post-neg-bits-".concat(31 - i)).css("color", "");
                    }
                    $("#neg-num-correct-answer").text('');
                    $('#neg-num-animation-container').html('');
                };
            });
            // Show original input bits
            App.$doc.on('click', '#show-neg-num-og-bits-btn', function() {
                if (App.timesClickedShowOGBits % 2 == 0) {
                    $('.og-neg-num-input-bits').html($('#og-neg-num-input-bits-template').html());
                    App.setBits($(".val-input").val(), "#show-neg-num-input-bits-");
                    App.timesClickedShowOGBits++;
                    let bits = App.getBits("#show-neg-num-input-bits-");
                    let leadingBit = App.determineLeadBit(bits, 0);
                    for (let i = 0; i <= leadingBit; i++) {
                        $("#show-neg-num-input-bits-".concat(31 - i)).css("color", "#FFBF00");
                    }
                } else {
                    $('.og-neg-num-input-bits').html('');
                    App.timesClickedShowOGBits++;
                };
            });
            // Reset button click
            App.$doc.on('click', "#rot-back-neg-num-reset", function() {
                App.setBits(~App.getBits("#find-cor-bits-"), "#invert-post-rot-neg-bits-2-");
                App.setBits(App.getBits("#find-cor-bits-"), "#invert-post-rot-post-neg-bits-");
                App.rotAmt = 0;
                $("#neg-num-rot-amt").text(App.rotAmt);   
                $("#neg-num-correct-answer").text('');   
                $('#neg-num-animation-container').html('');          
                for (let i = 0; i <= 31; i++) {
                    $("#invert-post-rot-post-neg-bits-".concat(31 - i)).css("color", "");
                };                
            });             
            /////////////////////////////////////// NEGATIVE NUMBERS /////////////////////////////////////////////////////// 
        },

        update: function() {
            // Reset globals when we insert a new number
            $(".continue-container").html('');
            $(".continue-to-rot-container").html('');

            App.resetBits("#input-bits-");
            let inputNum = $(".val-input").val();
            
            $("#your-num-is").text("The binary representation of ".concat(inputNum, " is:"));
            if (inputNum && inputNum >= 0) {
                App.setBits(inputNum, "#input-bits-");
                let leadingBit = App.determineLeadBit(inputNum, 1);
                if (leadingBit > 7) {
                    for (let i = 8; i <= leadingBit; i++) {
                        $("#input-bits-".concat(31 - i)).css("color", "rgb(255,98,102)");
                    };
                    $(".continue-container").html($("#continue-no-template").html());
                    let inputNum = $(".val-input").val();
                    if (inputNum) {
                        App.setBits(inputNum, "#find-cor-bits-");
                        let leadingBit = App.determineLeadBit(inputNum, 1);
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
            } else if (inputNum && inputNum < 0) {
                App.setBits(inputNum, "#input-bits-");
                let leadingBit = App.determineLeadBit(inputNum, 0);
                if (leadingBit > 7) {
                    for (let i = 8; i <= leadingBit; i++) {
                        $("#input-bits-".concat(31 - i)).css("color", "rgb(255,98,102)");
                    };
                    $(".continue-container").html($("#continue-no-negative-num-template").html());                                                
                    let inputNum = $(".val-input").val();
                    if (inputNum) {
                        App.setBits(inputNum, "#find-cor-bits-");
                        let leadingBit = App.determineLeadBit(inputNum, 0);
                        if (leadingBit > 7) {
                            for (let i = 8; i <= leadingBit; i++) {
                                $("#find-cor-bits-".concat(31 - i)).css("color", "rgb(255,98,102)");
                            };                        
                        };
                    };                     
                } else {
                    $(".continue-container").html($("#continue-yes-negative-num-template").html());
                    let preInverse = (inputNum & 255).toString(2);
                    let postInverse = (~inputNum).toString(2);
                    if (postInverse.length < 8) {
                        postInverse = "0".repeat(8 - postInverse.length) + postInverse;
                    }
                    $("#pre-invert-8-bits").text(preInverse);
                    $("#post-invert-8-bits").text(postInverse);
                    $("#post-invert-8-bits-2").text("0".repeat(24) + postInverse);
                };                
            } else {
                $(".continue-container").html('');
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

        determineLeadBit: function(n, zeroOrOne) {
            let pos = 0;
            for (let i = 0; i < 32; i++) {
                if (((n >>> (31 - i)) & 1) == zeroOrOne) {
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