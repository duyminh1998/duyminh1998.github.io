;
jQuery(function($) {
    'use strict';

    var App = {
        // Global variables
        n: 100, // the dimensions of the board
        F: 0.021, // parameter in the Gray-Scott equation
        k: 0.06, // parameter in the Gray-Scott equation
        Du: 0.088, // diffusion constant of u. Default is 2e-5
        Dv: 0.044, // diffusion constant of v. Default is 1e-5
        delay: 0, // the delay between each frame for the animation (ms)
        neighborhoodType: 'neumann', // the type of neighborhoods, ['moore', 'neumann']
        boundaryCond: 'periodic', // the boundary conditions, ['cut-off', 'periodic']
        paused: true, // whether or not the simulation is paused
        maxGenNoChange: 1, // the maximum number of generations to check for no change
        countGenNoChange: 0, // the current number of generations where no agents moved
        // animation parameters
        nFrames: 100, // the number of frames to generate the animation for
        stepsPerFrames: 20, // the number of simulation steps per frame
        animationIteration: 0, // the current iteration of the animation we are playing
        lo: 0,
        hi: 1,
        initConds: ["center square", "center point", "hollow square", "hashtag", "diagonal", "X", "cross", "pyramid", "spots", "random"], // possible initial conditions
        curInitCond: "center square", // the type of initial condition
        canceled: false, // whether to cancel the generation of the animation
        uFrames: [], // frames for U chem
        vFrames: [], // frames for V chem
        curGif: 0, // the current gif to display
        gifParams: [
            [0.045, 0.06, 0.16, 0.008],
            [0.021, 0.06, 0.088, 0.044],
            [0.021, 0.06, 0.16, 0.08],
            [0.021, 0.06, 0.16, 0.008],
            [0.037, 0.055, 0.016, 0.08],
            [0.032, 0.065, 0.088, 0.044],
            [0.021, 0.055, 0.16, 0.08],
            [0.026, 0.055, 0.088, 0.08],
            [0.015, 0.055, 0.016, 0.08],
            [0.037, 0.0625, 0.16, 0.08],
            [0.01, 0.06, 0.16, 0.008],
            [0.037, 0.0575, 0.088, 0.08],
            [0.03, 0.06, 0.16, 0.08],
            [0.01, 0.055, 0.16, 0.044],
            [0.01, 0.06, 0.16, 0.008],
            [0.0349, 0.055, 0.16, 0.08],
            [0.05, 0.055, 0.16, 0.008], 
            [0.04, 0.065, 0.16, 0.008],
            [0.03, 0.055, 0.16, 0.08],
            [0.05, 0.055, 0.16, 0.08],
            [0.055, 0.065, 0.16, 0.08],
            [0.06, 0.06, 0.16, 0.08],
            [0.065, 0.065, 0.16, 0.008], 
            [0.04, 0.055, 0.16, 0.08],
            [0.045, 0.055, 0.016, 0.044],
            [0.045, 0.055, 0.016, 0.08],
            [0.045, 0.055, 0.16, 0.044],
            [0.01, 0.055, 0.16, 0.044],
            [0.02, 0.055, 0.088, 0.008], 
            [0.04, 0.055, 0.16, 0.044],
            [0.06, 0.06, 0.16, 0.008],
            [0.01, 0.065, 0.16, 0.044],
            [0.032, 0.055, 0.16, 0.08],
            [0.032, 0.06, 0.16, 0.08],
            [0.055, 0.065, 0.16, 0.08],
            [0.055, 0.065, 0.16, 0.008]
        ], // parameters to display for the sample gifs
        colorRGBValues: {
            "peach": [255, 218, 185],
            "magenta": [255, 113, 206],
            "homepurple": [252, 131, 252],
            "brightpurple": [252, 131, 252],
            "red": [255, 0, 0],
            "brown": [165, 42, 42],
            "maroon": [128, 0, 0],
            "orange": [255, 144, 31],
            "yellow": [255, 211, 25],
            "lime": [173, 255, 47],
            "green": [0, 128, 0],
            "aquamarine": [5, 255, 161],
            "homeblue": [167, 188, 253],
            "skyblue": [135, 206, 235],
            "blue": [0, 0, 255],
            "white": [255, 255, 255],
            "black": [0, 0, 0],
            "blank": [29, 33, 44]                        
        }, // all color codes
        loColor: [29, 33, 44], // the color to use for the low concentration color
        hiColor: [255, 113, 206], // the color to use for the high concentration color
        mouseDown: false, // whether the mouse is clicked down
        curMaxVal: 1, // the current max value to paint when mousing down over the board      
        curMinVal: 0, // the current max value to paint when mousing down over the board      

        init: function() {
            // JQuery stuff. Renders the main game
            App.$doc = $(document);

            // Set default parameters in HTML page during init
            $('#F-range').val(App.F);
            $('#k-range').val(App.k);
            $('#du-range').val(App.Du);
            $('#dv-range').val(App.Dv);
            $('#n-frames-range').val(App.nFrames);
            $('#steps-per-frame-range').val(App.stepsPerFrames);
            $('#delay-range').val(App.delay);
            $("#delay-intext").text("(".concat(App.delay.toString(), "ms", ")"));
            $('#board-size-range').val(App.n);
            $("#board-size-intext").text("(".concat(App.n, 'x', App.n, ")"));

            // if we are in mobile browser, reduce the size of the board
            if(window.matchMedia("(max-width: 767px)").matches){
                // The viewport is less than 768 pixels wide
                App.n = 50;
                $("#board-size-intext").text("(".concat(App.n, 'x', App.n, ")"));
                // $("table").css({"width": "".concat(window.width(), "px"), "height": "".concat(window.width(), "px")});
            };
            // } else{
            //     // The viewport is at least 768 pixels wide
            //     alert("This is a tablet or desktop.");
            // }

            // On init, call these functions to set up area
            App.initBoardNP();
            App.setBoardInHTML();
            App.observeNP(App.chemType, '#pos');

            // Event bindings
            // check when the mouse is held down
            App.$doc.mousedown(function() {
                App.mouseDown = true;
            }).mouseup(function() {
                App.mouseDown = false;
            });
            // check when the mouse is hovering over the board
            $('td').hover(function() {
                if (App.mouseDown) {
                    let cellIdx = parseInt($(this).attr('id').substring(3));
                    let cellX = App.mod(cellIdx, App.n);
                    let cellY = Math.floor(cellIdx / App.n);
                    if (App.chemTypeStr == 'u-chem') {
                        App.u.set(cellX + 1, cellY + 1, App.curMinVal);
                        App.uFrames[App.animationIteration].set(cellX + 1, cellY + 1, App.curMinVal);                        
                        $(this).css("background-color", 'rgb('.concat(App.loColor[0], ',', App.loColor[1], ',', App.loColor[2], ')'));
                        // App.observeNP(App.uFrames[App.animationIteration], "#pos");
                    }
                    else {
                        App.v.set(cellX + 1, cellY + 1, App.curMaxVal);
                        App.vFrames[App.animationIteration].set(cellX + 1, cellY + 1, App.curMaxVal);
                        $(this).css("background-color", 'rgb('.concat(App.hiColor[0], ',', App.hiColor[1], ',', App.hiColor[2], ')'));
                        // App.observeNP(App.vFrames[App.animationIteration], "#pos");
                    }
                    // if (App.curValToPaint == 1) {
                    //     $(this).css("background-color", 'rgb('.concat(App.hiColor[0], ',', App.hiColor[1], ',', App.hiColor[2], ')'));
                    // } else {
                    //     $(this).css("background-color", 'rgb('.concat(App.loColor[0], ',', App.loColor[1], ',', App.loColor[2], ')'));
                    // }                    
                }
            });

            // text input
            App.$doc.on('input', '#F-range', function() {
                App.F = parseFloat(document.getElementById('F-range').value);
            }); 
            App.$doc.on('input', '#k-range', function() {
                App.k = parseFloat(document.getElementById('k-range').value);
            }); 
            App.$doc.on('input', '#du-range', function() {
                App.Du = parseFloat(document.getElementById('du-range').value);
            }); 
            App.$doc.on('input', '#dv-range', function() {
                App.Dv = parseFloat(document.getElementById('dv-range').value);
            }); 
            App.$doc.on('input', '#n-frames-range', function() {
                App.nFrames = parseInt(document.getElementById('n-frames-range').value);
            });
            App.$doc.on('input', '#steps-per-frame-range', function() {
                App.stepsPerFrames = parseInt(document.getElementById('steps-per-frame-range').value);
            });            

            // Range input sliders
            App.$doc.on('input', '#delay-range', function() {
                App.delay = parseInt(document.getElementById('delay-range').value);
                $("#delay-intext").text("(".concat(App.delay.toString(), "ms", ")"));
            });  
            App.$doc.on('input', '#board-size-range', function() {
                App.n = parseInt(document.getElementById('board-size-range').value);
                $("#board-size-intext").text("(".concat(App.n.toString(), 'x', App.n, ")"));
                App.initBoardNP();
                App.setBoardInHTML();
                App.observeNP(App.chemType, '#pos');
            });            

            // Buttons   
            // Reset the board
            App.$doc.on('click', '#reset-board-btn', function() {
                App.pauseAnimation();
                App.canceled = false;         
                App.initBoardNP();
                App.observeNP(App.chemType, '#pos');
                $("#animation-gen-status").text("Idle - Press 'Generate' to generate the animation frames");
            });            
            // Start the simulation
            App.$doc.on('click', '#start-btn', function() {
                // Make sure we have the right parameters
                App.F = parseFloat(document.getElementById('F-range').value);
                App.k = parseFloat(document.getElementById('k-range').value);
                App.Du = parseFloat(document.getElementById('du-range').value);
                App.Dv = parseFloat(document.getElementById('dv-range').value);

                App.pauseAnimation();
                App.canceled = false;
                App.observeNP(App.chemType, '#pos');
                App.startSimulation();
            });
            // Play the animation
            App.$doc.on('click', '#play-btn', function() {
                if (App.uFrames.length == 1 || App.vFrames.length == 1) {
                    $("#animation-gen-status").text("No animation available. Please press the 'Generate' button.");
                } else {
                    App.paused = false;
                    $("#animation-gen-status").text("Playing animation...");
                    App.playAnimation();
                }
            });
            // Display the previous animation frame
            App.$doc.on('click', '#prev-frame-btn', function() {
                if (App.uFrames.length == 1 || App.vFrames.length == 1) {
                    $("#animation-gen-status").text("No animation available. Please press the 'Generate' button.");
                } else {
                    App.paused = true;
                    App.prevFrame();
                    $("#animation-gen-status").text("Displaying frame ".concat(App.animationIteration + 1, " of ", App.vFrames.length));
                }
            });    
            // Display the next animation frame
            App.$doc.on('click', '#next-frame-btn', function() {
                if (App.uFrames.length == 1 || App.vFrames.length == 1) {
                    $("#animation-gen-status").text("No animation available. Please press the 'Generate' button.");
                } else {
                    App.paused = true;
                    App.nextFrame();
                    $("#animation-gen-status").text("Displaying frame ".concat(App.animationIteration + 1, " of ", App.vFrames.length));
                }
            });                    
            // Pause the animation
            App.$doc.on('click', '#pause-btn', function() {
                App.canceled = true;
                App.pauseAnimation();
                $("#animation-gen-status").text("Paused animation. Displaying frame ".concat(App.animationIteration + 1, " of ", App.vFrames.length));
            });
            // Cancel the frames generation
            App.$doc.on('click', '#cancel-btn', function() {
                App.canceled = true;
            });
            // Left and right buttons to choose gifs
            App.$doc.on('click', '#find-cor-bits-right-arrow', function() {
                App.curGif = App.mod(App.curGif + 1, 36);
                $('#sample-pattern-gif').attr({src: 'img/'.concat(App.curGif, '.gif')});
                $('#sample-pattern-F-intext').text(App.gifParams[App.curGif][0]);
                $('#sample-pattern-k-intext').text(App.gifParams[App.curGif][1]);
                $('#sample-pattern-Du-intext').text(App.gifParams[App.curGif][2]);
                $('#sample-pattern-Dv-intext').text(App.gifParams[App.curGif][3]);
                $('#sample-pattern-id-intext').text(App.curGif + 1);
            });                         
            App.$doc.on('click', '#find-cor-bits-left-arrow', function() {
                App.curGif = App.mod(App.curGif - 1, 36);
                $('#sample-pattern-gif').attr({src: 'img/'.concat(App.curGif, '.gif')});
                $('#sample-pattern-F-intext').text(App.gifParams[App.curGif][0]);
                $('#sample-pattern-k-intext').text(App.gifParams[App.curGif][1]);
                $('#sample-pattern-Du-intext').text(App.gifParams[App.curGif][2]);
                $('#sample-pattern-Dv-intext').text(App.gifParams[App.curGif][3]); 
                $('#sample-pattern-id-intext').text(App.curGif + 1);               
            });
            // Pick random colors for the cells
            App.$doc.on('click', '#random-colors-btn', function() {
                App.randomizeCellColors();
                if (App.uFrames.length == 0 || App.vFrames.length == 0) {
                    App.observeNP(App.chemType, '#pos');
                } else {
                    if (App.chemTypeStr == "u-chem") {App.chemType
                        App.observeNP(App.uFrames[App.animationIteration], "#pos");
                    } else {
                        App.observeNP(App.vFrames[App.animationIteration], "#pos");
                    }
                }
            });
            // Pick random parameters
            App.$doc.on('click', '#random-params-btn', function() {
                App.randomizeParameters();

                // update display
                App.pauseAnimation();
                App.canceled = false;         
                App.initBoardNP();
                App.observeNP(App.chemType, '#pos');
                $("#animation-gen-status").text("Idle - Press 'Generate' to generate the animation frames");
            });
            // Pick random ICs
            App.$doc.on('click', '#random-ICs-btn', function() {
                App.randomizeInitialConditions();

                // update display
                App.pauseAnimation();
                App.canceled = false;         
                App.initBoardNP();
                App.observeNP(App.chemType, '#pos');
                $("#animation-gen-status").text("Idle - Press 'Generate' to generate the animation frames");
            }); 
            // Pick all random parameters
            App.$doc.on('click', '#random-all-btn', function() {
                App.randomizeInitialConditions();
                App.randomizeParameters();
                App.randomizeCellColors();

                // update display
                App.pauseAnimation();
                App.canceled = false;         
                App.initBoardNP();
                App.observeNP(App.chemType, '#pos');
                $("#animation-gen-status").text("Idle - Press 'Generate' to generate the animation frames");
            });
            // Pick all random parameters and run
            App.$doc.on('click', '#random-all-and-run-btn', async function() {
                // stop any ongoing animations
                App.pauseAnimation();
                App.canceled = false;

                // randomize params
                App.randomizeInitialConditions();
                App.randomizeParameters();
                App.randomizeCellColors();

                // Make sure we have the right parameters
                App.F = parseFloat(document.getElementById('F-range').value);
                App.k = parseFloat(document.getElementById('k-range').value);
                App.Du = parseFloat(document.getElementById('du-range').value);
                App.Dv = parseFloat(document.getElementById('dv-range').value);

                // update display
                if (!App.canceled) {
                    App.canceled = true
                } 
                App.pauseAnimation();
                await App.sleep(1);

                App.initBoardNP();
                App.observeNP(App.chemType, '#pos');
                App.canceled = false;
                App.startSimulation();                
            });          
            // jump to specific frame
            App.$doc.on('click', '#jump-btn', function() {
                if (App.uFrames.length == 1 || App.vFrames.length == 1) {
                    $("#animation-gen-status").text("No animation available. Please press the 'Generate' button.");
                } 
                else if ($('#frame-range').val()) {
                    App.paused = true;
                    let curFrame = parseInt($('#frame-range').val() - 1);
                    App.displayFrame(curFrame);
                    $("#animation-gen-status").text("Displaying frame ".concat(App.animationIteration + 1, " of ", App.vFrames.length));
                }
            });                                                                          

            // Drop-downs
            $("#chemical-type").on("change", function() {
                // update display
                App.pauseAnimation();
                App.canceled = false;

                App.updateChemType();
                
                if (App.uFrames.length == 0 || App.vFrames.length == 0) {
                    App.observeNP(App.chemType, '#pos');
                } else {
                    if (App.chemTypeStr == "u-chem") {
                        App.observeNP(App.uFrames[App.animationIteration], "#pos");
                    } else {
                        App.observeNP(App.vFrames[App.animationIteration], "#pos");
                    }
                    $("#animation-gen-status").text("Paused animation. Displaying frame ".concat(App.animationIteration + 1, " of ", App.vFrames.length));
                }
            });
            $("#neighborhood-type").on("change", function() {
                let selectedVal = this.value;
                App.neighborhoodType = selectedVal;
            });               
            $("#init-cond").on("change", function() {
                App.updateInitCond();
                App.initBoardNP();
                App.observeNP(App.chemType, '#pos');
                $("#animation-gen-status").text("Idle - Press 'Generate' to generate the animation frames");
            });
            $("#sample-params").on("change", function() {
                let selectedParams = $("#sample-params option:selected").val().split("|");
                App.F = parseFloat(selectedParams[0]);
                App.k = parseFloat(selectedParams[1]);
                App.Du = parseFloat(selectedParams[2]);
                App.Dv = parseFloat(selectedParams[3]);
                $('#F-range').val(App.F);
                $('#k-range').val(App.k);
                $('#du-range').val(App.Du);
                $('#dv-range').val(App.Dv);                
            });   
            $("#chem-color-1").on("change", function() {
                App.loColor = App.colorRGBValues[$("#chem-color-1").val()];
                if (App.uFrames.length == 0 || App.vFrames.length == 0) {
                    App.observeNP(App.chemType, '#pos');
                } else {
                    if (App.chemTypeStr == "u-chem") {
                        App.observeNP(App.uFrames[App.animationIteration], "#pos");
                    } else {
                        App.observeNP(App.vFrames[App.animationIteration], "#pos");
                    }
                }
            });
            $("#chem-color-2").on("change", function() {
                App.hiColor = App.colorRGBValues[$("#chem-color-2").val()];
                if (App.uFrames.length == 0 || App.vFrames.length == 0) {
                    App.observeNP(App.chemType, '#pos');
                } else {
                    if (App.chemTypeStr == "u-chem") {
                        App.observeNP(App.uFrames[App.animationIteration], "#pos");
                    } else {
                        App.observeNP(App.vFrames[App.animationIteration], "#pos");
                    }
                }
            });
        },
        // Methods
        setBoardInHTML: function() {
            /*
            Description:
                Resets the CA board in HTML.

            Arguments:
                None

            Return:
                (None)
            */
            // Clear the html board
            $('#config-table').empty();
            let i = 0;
            // add td elements
            for (let x = 0; x < App.n; x++) {
                // add a row
                $('#config-table').append("<tr id='tr".concat(x, "'></tr>"));
                for (let y = 0; y < App.n; y++) {
                    $('#tr'.concat(x)).append("<td id='pos".concat(i, "'></td>"));
                    $("#pos".concat(i)).attr('class', "cell white");
                    i++;
                }
            }
        },
        initBoardNP: function() {
            /*
            Description:
                Initializes the CA board with a new configuration.

            Arguments:
                None

            Return:
                (None)
            */
            // CA configurations
            let u = nj.ones([App.n + 2, App.n + 2], "float64");
            let v = nj.zeros([App.n + 2, App.n + 2], "float64");

            const uSpecialVal = 0.25;
            const vSpecialVal = 0.5;

            // initial conditions
            if (App.curInitCond == "center point") {
                let mid = Math.floor(App.n / 2);
                u.set(mid, mid, 0);
                v.set(mid, mid, 1);
            }
            else if (App.curInitCond == "random") {
                u = nj.random([App.n + 2, App.n + 2]).multiply(0.02);
                v = nj.random([App.n + 2, App.n + 2]).multiply(0.02);
            }
            else if (App.curInitCond == "hollow square" || App.curInitCond == "hashtag") {
                // define radius of initial conditions
                let n2 = Math.floor(App.n / 2);
                let r = Math.floor(App.n / 4);
                let lhbound = 0.4;
                let rhbound = 0.3;
                let lvbound = 0.6;
                let rvbound = 0.7;
                if (App.curInitCond == "hashtag") {
                    lhbound = 0.3999;
                    rhbound = 0.39999;
                    lvbound = 0.5999;
                    rvbound = 0.59999;
                }
                for (let x = 0; x < App.n + 2; x++) {
                    for (let y = 0; y < App.n + 2; y++) {
                        if (App.curInitCond == "hashtag") {
                            if ((Math.floor(lhbound * App.n) <= x && x <= Math.floor(rhbound * App.n) || Math.floor(lvbound * App.n) <= x && x <= Math.floor(rvbound * App.n)) && n2 - r <= y && y <= n2 + r) {
                                u.set(x, y, 0.5);
                                v.set(x, y, 0.25);
                            }
                            if ((Math.floor(lhbound * App.n) <= y && y <= Math.floor(rhbound * App.n) || Math.floor(lvbound * App.n) <= y && y <= Math.floor(rvbound * App.n)) && n2 - r <= x && x <= n2 + r) {
                                u.set(x, y, 0.5);
                                v.set(x, y, 0.25);
                            }
                        }
                        else {
                            if ((Math.floor(rhbound * App.n) < x) && (Math.floor(rvbound * App.n) > x) && (Math.floor(rhbound * App.n) < y) && (Math.floor(rvbound * App.n) > y)) {
                                u.set(x, y, uSpecialVal);
                                v.set(x, y, vSpecialVal);
                            }                         
                            if ((Math.floor(lhbound * App.n) < x) && (Math.floor(lvbound * App.n) > x) && (Math.floor(lhbound * App.n) < y) && (Math.floor(lvbound * App.n) > y)) {
                                u.set(x, y, 1);
                                v.set(x, y, 0);
                            } 
                        }                          
                    }
                }
            }
            else if (App.curInitCond == "diagonal" || App.curInitCond == "X") {
                for (let x = 0; x < App.n + 2; x++) {
                    for (let y = 0; y < App.n + 2; y++) {
                        if (x == y || (App.curInitCond == "X" && (App.n - 2 - x) == y)) {
                            u.set(x, y, uSpecialVal);
                            v.set(x, y, vSpecialVal);
                        }
                    }
                }
            }
            else if (App.curInitCond == "cross") {
                let n2 = Math.floor((App.n + 2) / 2);
                let thickness = 1;
                for (let x = 0; x < App.n + 2; x++) {
                    for (let y = 0; y < App.n + 2; y++) {
                        if ((x >= n2 - thickness && x <= n2 + thickness) || (y >= n2 - thickness && y <= n2 + thickness)) {
                            u.set(x, y, uSpecialVal);
                            v.set(x, y, vSpecialVal);
                        }
                    }
                }
            }
            else if (App.curInitCond == "pyramid") {
                let mid = Math.floor((App.n + 2) / 2);
                let height = Math.floor((App.n + 2) / 5);
                let x, y;
                for (let i = 0; i < height; i++) {
                    for (let j = 0; j < i; j++) {
                        x = mid + i;
                        y = mid + j;
                        u.set(y, x, 0);
                        v.set(y, x, 1);
                        y = mid - j;
                        u.set(y, x, 0);
                        v.set(y, x, 1);                        
                    }
                }
            }
            else if (App.curInitCond == "spots") {
                let nSpots = Math.floor(0.005 * (App.n * App.n))
                let xLoc, yLoc;
                for (let i = 0; i < nSpots; i++) {
                    xLoc = App.randomIntFromInterval(1, App.n);
                    yLoc = App.randomIntFromInterval(1, App.n);
                    u.set(xLoc, yLoc, 0);
                    v.set(xLoc, yLoc, 1);
                }
            }                                   
            else { // default, "center square" initial conditions
                for (let x = 0; x < App.n + 2; x++) {
                    for (let y = 0; y < App.n + 2; y++) {
                        if (Math.floor(0.4 * App.n) < x && x < Math.floor(0.6 * App.n) && Math.floor(0.4 * App.n) < y && y < Math.floor(0.6 * App.n)) {
                            u.set(x, y, uSpecialVal);
                            v.set(x, y, vSpecialVal);
                        }                                     
                    }
                }
            }    
            
            // save the configuration
            App.u = u;
            App.v = v;
            // save the type of chemical to display
            App.updateChemType();
            // reset frames
            App.uFrames = [App.u];
            App.vFrames = [App.v];
            
            // meta info
            App.step = 0;
            App.countGenNoChange = 0;
            App.animationIteration = 0;     
            App.curMaxVal = App.chemType.max();
            App.curMinVal = App.chemType.min();    
        },
        observeNP: function(obj, src = '#pos') {
            /*
            Description:
                Use config to put color on the board in the HTML document.
                
            Arguments:
                src: the common ID of the cells. To be concatenated with numbers to find the cells.
                
            Return:
                (None)
            */
            let chemMax = obj.max();
            let chemMin = obj.min();
            let chemDiff = chemMax - chemMin;
            for (let x = 0; x < App.n; x++) {
                for (let y = 0; y < App.n; y++) {
                    let cellVal = obj.get(x + 1, y + 1); // 0 = white, 1 = black on v chem type
                    if (cellVal === undefined) { // error checking
                        console.log(x);
                        console.log(y);
                    }
                    let i = x + App.n * y;
                    // scale cell value
                    let cellValScaled = (parseInt(255 * (cellVal - chemMin) / chemDiff)) / 255;
                    let m = [App.hiColor[0] - App.loColor[0], App.hiColor[1] - App.loColor[1], App.hiColor[2] - App.loColor[2]];
                    let blendedColor = [Math.floor(m[0] * cellValScaled + App.loColor[0]), Math.floor(m[1] * cellValScaled + App.loColor[1]), Math.floor(m[2] * cellValScaled + App.loColor[2])]
                    $(src.concat(i)).css("background-color", 'rgb('.concat(blendedColor[0], ',', blendedColor[1], ',', blendedColor[2], ')'));
                }
            }
        },  
        randomizeCellColors: function() {
            /*
            Description:
                Randomly sets the colors of the populations.

            Arguments:
                None

            Return:
                (None)
            */
            let randomColors = App.getRandomSubarray(Object.keys(App.colorRGBValues), 2);
            App.loColor = App.colorRGBValues[randomColors[0]];
            $('#chem-color-1').val(randomColors[0]);
            App.hiColor = App.colorRGBValues[randomColors[1]];
            $('#chem-color-2').val(randomColors[1]);
        },
        randomizeAll: function() {
            /*
            Description:
                Randomly sets the parameters and initial conditions of the simulation.

            Arguments:
                None

            Return:
                (None)
            */
            const decimalPlaces = 4;
            App.F = App.randomNumber(0, 0.5); // good range: 0.03, 0.065
            $('#F-range').val(App.F.toFixed(decimalPlaces));
            App.k = App.randomNumber(0, 0.5); // good range: 0.055, 0.065
            $('#k-range').val(App.k.toFixed(decimalPlaces));
            App.Du = App.randomNumber(0, 0.2); // good range: 0.016, 0.16
            $('#du-range').val(App.Du.toFixed(decimalPlaces));
            App.Dv = App.randomNumber(0, 0.2); // good range: 0.008, 0.08
            $('#dv-range').val(App.Dv.toFixed(decimalPlaces));

            const neighborhoodChoice = App.randomNumber(0, 1);
            if (neighborhoodChoice > 0.5) {
                if (App.neighborhoodType == 'neumann') {
                    App.neighborhoodType = 'moore'
                    $('#neighborhood-type').val('moore');
                } else {
                    App.neighborhoodType = 'neumann'
                    $('#neighborhood-type').val('neumann');
                }
            }

            const initCondChoice = App.randomIntFromInterval(0, App.initConds.length - 1);
            App.curInitCond = App.initConds[initCondChoice];
            $('#init-cond').val(App.curInitCond);

        },
        randomizeParameters: function() {
            /*
            Description:
                Randomly sets the parameters of the simulation.

            Arguments:
                None

            Return:
                (None)
            */
            const decimalPlaces = 4;
            App.F = App.randomNumber(0, 0.2); // good range: 0.03, 0.065
            $('#F-range').val(App.F.toFixed(decimalPlaces));
            App.k = App.randomNumber(0, 0.2); // good range: 0.055, 0.065
            $('#k-range').val(App.k.toFixed(decimalPlaces));
            App.Du = App.randomNumber(0, 0.2); // good range: 0.016, 0.16
            $('#du-range').val(App.Du.toFixed(decimalPlaces));
            App.Dv = App.randomNumber(0, 0.1); // good range: 0.008, 0.08
            $('#dv-range').val(App.Dv.toFixed(decimalPlaces));

            const neighborhoodChoice = App.randomNumber(0, 1);
            if (neighborhoodChoice > 0.5) {
                if (App.neighborhoodType == 'neumann') {
                    App.neighborhoodType = 'moore'
                    $('#neighborhood-type').val('moore');
                } else {
                    App.neighborhoodType = 'neumann'
                    $('#neighborhood-type').val('neumann');
                }
            }
        },
        randomizeInitialConditions: function() {
            /*
            Description:
                Randomly sets the initial conditions of the simulation.

            Arguments:
                None

            Return:
                (None)
            */
            const initCondChoice = App.randomIntFromInterval(0, App.initConds.length - 1);
            App.curInitCond = App.initConds[initCondChoice];
            $('#init-cond').val(App.curInitCond);
        },                                   
        updateChemType: function() {
            /*
            Description:
                Updates the type of chemical being displayed.
                
            Arguments:
                (None)
                
            Return:
                (None)
            */
            App.chemTypeStr = $("#chemical-type").val();
            if (App.chemTypeStr == "u-chem") {
                App.chemType = App.u;
            } else {
                App.chemType = App.v;
            }           
        },
        updateInitCond: function() {
            /*
            Description:
                Updates the type of initial condition.
                
            Arguments:
                (None)
                
            Return:
                (None)
            */
            App.curInitCond = $("#init-cond").val();          
        },                  
        updateColor: function(population, color) {
            /*
            Description:
                Use config to put color on the board in the HTML document.
                
            Arguments:
                population: the index to the population that we want to update the color for.
                color: the color value to set.
                
            Return:
                (None)
            */
           let newColor = 'cell '.concat(color);
           App.cellClasses[population] = newColor;
        },        
        createArray: function(length) {
            // https://stackoverflow.com/questions/966225/how-can-i-create-a-two-dimensional-array-in-javascript/966938#966938
            let arr = new Array(length || 0),
                i = length;

            if (arguments.length > 1) {
                let args = Array.prototype.slice.call(arguments, 1);
                while (i--) arr[length - 1 - i] = App.createArray.apply(this, args);
            }

            return arr;
        },
        getRandomSubarray: function(arr, size) {
            // https://stackoverflow.com/questions/11935175/sampling-a-random-subset-from-an-array
            let shuffled = arr.slice(0),
                i = arr.length,
                min = i - size,
                temp, index;
            while (i-- > min) {
                index = Math.floor((i + 1) * Math.random());
                temp = shuffled[index];
                shuffled[index] = shuffled[i];
                shuffled[i] = temp;
            }
            return shuffled.slice(min);
        },
        randomNumber: function(min, max) {
            // https://stackoverflow.com/questions/4959975/generate-random-number-between-two-numbers-in-javascript
            return Math.random() * (max - min) + min;
        },
        randomIntFromInterval: function(min, max) { // min and max included 
            // https://stackoverflow.com/questions/4959975/generate-random-number-between-two-numbers-in-javascript
            return Math.floor(Math.random() * (max - min + 1) + min)
        },         
        periodicBC: function(u) {
            /*
            Description:
                Apply periodic boundary conditions to the configuration.
            
            Arguments:
                u: one of the chemicals of the current configuration.
            
            Return:
                (np.array) the input configuration with periodic boundary conditions applied.
            */
            for (let i = 0; i < App.n + 2; i++) {
                u.set(0, i, u.get(App.n, i));
                u.set(App.n + 1, i, u.get(1, i));
                u.set(i, 0, u.get(i, App.n));
                u.set(i, App.n + 1, u.get(i, 1));
            };
            return u;
        },
        diffusion: function(u) {
            /*
            Description:
                Calculate the Laplacian between a cell and its neighbors.
            
            Arguments:
                u: one of the chemicals of the current configuration.
            
            Return:
                (np.array) the Laplacian at each point of u.
            */
            // left neighbor, bottom neighbor, top neighbor, left neighbor
            let Neighbor1 = u.slice([null, -2], [1, -1]);
            let Neighbor2 = u.slice([1, -1], [null, -2]);
            let Neighbor3 = u.slice([1, -1], [1, -1]);
            let Neighbor4 = u.slice([1, -1], 2);
            let Neighbor5 = u.slice(2, [1, -1]);

            let result = Neighbor1.add(Neighbor2);
            result = result.add(Neighbor4);
            result = result.add(Neighbor5);
            if (App.neighborhoodType == "neumann") {
                result = result.subtract(Neighbor3.multiply(4));
            } else if (App.neighborhoodType == "moore") {
                let Neighbor6 = u.slice([null, -2], [null, -2]);
                let Neighbor7 = u.slice([null, -2], 2);
                let Neighbor8 = u.slice(2, [null, -2]);
                let Neighbor9 = u.slice(2, 2);
                result = result.add(Neighbor6);
                result = result.add(Neighbor7);
                result = result.add(Neighbor8);
                result = result.add(Neighbor9);
                result = result.subtract(Neighbor3.multiply(8));
                // result = result.add(Neighbor3);
                // result = result.multiply(1/9);
            }
            
            return result;
        },
        updateConfigNP: function() {
            /*
            Description:
                Loop through the current configuration and update each cell's value according to its neighbors.
            
            Arguments:
                None
            
            Return:
                (None)
            */
            App.u = nj.clip(App.u, App.lo, App.hi);
            App.v = nj.clip(App.v, App.lo, App.hi); 
            const u = App.u.slice([1, -1], [1, -1]);
            const v = App.v.slice([1, -1], [1, -1]);

            const Lu = App.diffusion(App.u);
            const Lv = App.diffusion(App.v);
            let uvv = u.multiply(v);
            uvv = uvv.multiply(v);
            
            let temp = u.multiply(-1);
            temp.add(1, false);
            temp.multiply(App.F, false);
            u.add(temp, false);
            
            temp = Lu.multiply(App.Du);
            u.add(temp, false);
            u.subtract(uvv, false);
            
            temp = v.multiply(App.F + App.k);
            v.subtract(temp, false);
            temp = Lv.multiply(App.Dv);
            v.add(temp, false);
            v.add(uvv, false);            

            App.periodicBC(App.u);
            App.periodicBC(App.v);  
        },
        createFrames: async function() {
            /*
            Description:
                Runs the model and creates a set of frames.
            
            Arguments:
                None
            
            Return:
                (None)
            */
            let uFrames = [];
            let vFrames = [];
            for (let i = 0; i < App.nFrames; i++) {
                if (!App.canceled) {
                    // update the model for stepsPerFrames and save the frames
                    for (let j = 0; j < App.stepsPerFrames; j++) {
                        App.updateConfigNP();
                    }
                    // need to do some scaling to u and v frames

                    // save frames
                    uFrames.push(App.u);
                    vFrames.push(App.v);
                    await App.sleep(1);
                    $("#animation-gen-status").text("Generating frame ".concat(i + 1, " of ", App.nFrames + 1));                    
                } else {
                    break;
                }
            }; 
            // save completed frames or partially completed frames
            App.uFrames = App.uFrames.concat(uFrames);
            App.vFrames = App.vFrames.concat(vFrames);
            $("#animation-gen-status").text("Done! Press 'Play' to play the animation.");

            // Auto-play animation
            if ($('#autoplay').val() == 'true') {
                App.paused = false;
                $("#animation-gen-status").text("Playing animation...");
                App.playAnimation();
            }            
        },
        startSimulation: function() {
            /*
            Description:
                Starts the simulation and run until there is no change in satisfaction.
            
            Arguments:
                None
            
            Return:
                (None)
            */
            if (App.uFrames.length != 1 || App.vFrames.length != 1) {
                App.initBoardNP();
            }
            App.createFrames();
        },
        displayFrame: function(frameNum) {
            /*
            Description:
                Display a specific animation frame.
            
            Arguments:
                frameNum: the frame number.
            
            Return:
                (None)
            */
            if (App.paused) {
                if (App.chemTypeStr == "u-chem") {
                    App.animationIteration = App.mod(frameNum, App.uFrames.length);
                    App.observeNP(App.uFrames[App.animationIteration], "#pos");
                } else {
                    App.animationIteration = App.mod(frameNum, App.vFrames.length);
                    App.observeNP(App.vFrames[App.animationIteration], "#pos");
                }   
            }      
        },        
        nextFrame: function() {
            /*
            Description:
                Plays the next frame of the animation.
            
            Arguments:
                None
            
            Return:
                (None)
            */
            if (App.paused) {
                if (App.chemTypeStr == "u-chem") {
                    App.animationIteration = (App.animationIteration + 1) % App.uFrames.length;
                    App.observeNP(App.uFrames[App.animationIteration], "#pos");
                } else {
                    App.animationIteration = (App.animationIteration + 1) % App.vFrames.length;
                    App.observeNP(App.vFrames[App.animationIteration], "#pos");
                }   
            }      
        },
        prevFrame: function() {
            /*
            Description:
                Plays the previous frame of the animation.
            
            Arguments:
                None
            
            Return:
                (None)
            */
           if (App.paused) {
                if (App.chemTypeStr == "u-chem") {
                    App.animationIteration = App.mod(App.animationIteration - 1, App.uFrames.length);
                    App.observeNP(App.uFrames[App.animationIteration], "#pos");
                } else {
                    App.animationIteration = App.mod(App.animationIteration - 1, App.vFrames.length);
                    App.observeNP(App.vFrames[App.animationIteration], "#pos");
                }
            }
        },        
        playAnimation: async function() {
            /*
            Description:
                Plays the generated animation.
            
            Arguments:
                None
            
            Return:
                (None)
            */
            while (!App.paused) {
                if (App.chemTypeStr == "u-chem") {
                    App.observeNP(App.uFrames[App.animationIteration], "#pos");
                } else {
                    App.observeNP(App.vFrames[App.animationIteration], "#pos");
                }
                App.animationIteration = (App.animationIteration + 1) % App.vFrames.length;
                // $("#animation-frame").text("Playing frame ".concat(App.animationIteration));
                await App.sleep(App.delay);
                // $("#result").text(App.animationIteration + 1);
            }
        },
        pauseAnimation: function() {
            /*
            Description:
                Stops the simulation.
            
            Arguments:
                None
            
            Return:
                (None)
            */
            App.paused = true;
        },
        sleep: function(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        },
        mod: function(n, m) {
            // https://stackoverflow.com/questions/4467539/javascript-modulo-gives-a-negative-result-for-negative-numbers
            return ((n % m) + m) % m;
        }
    };

    App.init();

}($));