;
jQuery(function($) {
    'use strict';

    var App = {
        // Global variables
        n: 100, // the dimensions of the board
        F: 0.03, // parameter in the Gray-Scott equation
        k: 0.06, // parameter in the Gray-Scott equation
        Du: 0.16, // diffusion constant of u. Default is 2e-5
        Dv: 0.03, // diffusion constant of v. Default is 1e-5
        delay: 0, // the delay between each frame for the animation (ms)
        neighborhoodType: 'moore', // the type of neighborhoods, ['moore', 'neumann']
        boundaryCond: 'periodic', // the boundary conditions, ['cut-off', 'periodic']
        paused: true, // whether or not the simulation is paused
        maxGenNoChange: 1, // the maximum number of generations to check for no change
        countGenNoChange: 0, // the current number of generations where no agents moved
        // animation parameters
        nFrames: 100, // the number of frames to generate the animation for
        stepsPerFrames: 10, // the number of simulation steps per frame
        animationIteration: 0, // the current iteration of the animation we are playing
        lo: 0,
        hi: 1,
        initConds: ["center square", "center point", "random"], // possible initial conditions
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
            [0.032, 0.065, 0.088, 0.044]
        ], // parameters to display for the sample gifs

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
            $("#board-size-intext").text("(".concat(App.n.toString(), 'x', App.n, ")"));

            // On init, call these functions to set up area
            App.initBoardNP();
            App.setBoardInHTML();
            App.observeNP(App.chemType, '#pos');

            // Event bindings
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
                $("#animation-gen-status").text("Idle");
            });            
            // Start the simulation
            App.$doc.on('click', '#start-btn', function() {
                App.pauseAnimation();
                App.canceled = false;
                App.observeNP(App.chemType, '#pos');
                App.startSimulation();
            });
            // Play the animation
            App.$doc.on('click', '#play-btn', function() {
                if (App.uFrames.length == 0 || App.vFrames.length == 0) {
                    $("#animation-gen-status").text("No animation available. Please press the 'Generate' button.");
                } else {
                    App.paused = false;
                    $("#animation-gen-status").text("Playing animation...");
                    App.playAnimation();
                }
            });
            // Pause the animation
            App.$doc.on('click', '#pause-btn', function() {
                App.canceled = true;
                App.pauseAnimation();
                $("#animation-gen-status").text("Paused animation...");
            });
            // Cancel the frames generation
            App.$doc.on('click', '#cancel-btn', function() {
                App.canceled = true;
            });
            // Left and right buttons to choose gifs
            App.$doc.on('click', '#find-cor-bits-right-arrow', function() {
                App.curGif = App.mod(App.curGif + 1, 36);
                $('#sample-pattern-gif').attr({src: 'img/'.concat(App.curGif, '.gif')});
                // $('#sample-pattern-F-intext').text(App.gifParams[App.curGif][0]);
                // $('#sample-pattern-k-intext').text(App.gifParams[App.curGif][1]);
                // $('#sample-pattern-Du-intext').text(App.gifParams[App.curGif][2]);
                // $('#sample-pattern-Dv-intext').text(App.gifParams[App.curGif][3]);
            });                         
            App.$doc.on('click', '#find-cor-bits-left-arrow', function() {
                App.curGif = App.mod(App.curGif - 1, 36);
                $('#sample-pattern-gif').attr({src: 'img/'.concat(App.curGif, '.gif')});
                // $('#sample-pattern-F-intext').text(App.gifParams[App.curGif][0]);
                // $('#sample-pattern-k-intext').text(App.gifParams[App.curGif][1]);
                // $('#sample-pattern-Du-intext').text(App.gifParams[App.curGif][2]);
                // $('#sample-pattern-Dv-intext').text(App.gifParams[App.curGif][3]);                
            });            

            // Drop-downs
            $("#chemical-type").on("change", function() {
                App.updateChemType();
                App.observeNP(App.chemType, '#pos');
            });
            $("#init-cond").on("change", function() {
                App.updateInitCond();
                App.initBoardNP();
                App.observeNP(App.chemType, '#pos');
                $("#animation-gen-status").text("Idle");
            });
            $("#sample-params").on("change", function() {
                let selectedParams = $("#sample-params option:selected").text().split(" | ");
                App.F = parseFloat(selectedParams[0]);
                App.k = parseFloat(selectedParams[1]);
                App.Du = parseFloat(selectedParams[2]);
                App.Dv = parseFloat(selectedParams[3]);
                $('#F-range').val(App.F);
                $('#k-range').val(App.k);
                $('#du-range').val(App.Du);
                $('#dv-range').val(App.Dv);                
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
          
            // define radius of initial conditions
            // let n2 = Math.floor(App.n / 2);
            // let r = 10;

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
            else { // default, "center square" initial conditions
                for (let x = 0; x < App.n + 2; x++) {
                    for (let y = 0; y < App.n + 2; y++) {
                        if (Math.floor(0.4 * App.n) < x && x < Math.floor(0.6 * App.n) && Math.floor(0.4 * App.n) < y && y < Math.floor(0.6 * App.n)) {
                            u.set(x, y, 0.25);
                            v.set(x, y, 0.5);
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
            App.uFrames = [];
            App.vFrames = [];
            
            // meta info
            App.step = 0;
            App.countGenNoChange = 0;
            App.animationIteration = 0;       
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
                    let cellValScaled = 255 - parseInt(255 * (cellVal - chemMin) / chemDiff);
                    $(src.concat(i)).css("background-color", 'rgb('.concat(cellValScaled, ',', cellValScaled, ',', cellValScaled, ')'));
                }
            }
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
                u.set(0, i, App.u.get(-2, i));
                u.set(-1, i, App.u.get(1, i));
                u.set(i, 0, App.u.get(i, -2));
                u.set(i, -1, App.u.get(i, 1));
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
            result = result.subtract(Neighbor3.multiply(4));          
            result = result.add(Neighbor4);
            result = result.add(Neighbor5);
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
            let u = App.u.slice([1, -1], [1, -1]);
            let v = App.v.slice([1, -1], [1, -1]);

            let Lu = App.diffusion(App.u);
            let Lv = App.diffusion(App.v);
            let uvv = u.multiply(v);
            uvv = uvv.multiply(v);
            
            u = u.add(Lu.multiply(App.Du));
            u = u.subtract(uvv);
            u = u.add(u.multiply(-1).add(1).multiply(App.F));
            
            v = v.add(Lv.multiply(App.Dv));
            v = v.add(uvv);
            v = v.subtract(v.multiply(App.F + App.k));
            
            for (let x = 0; x < App.n; x++) {
                for (let y = 0; y < App.n; y++) {
                    App.u.set(x + 1, y + 1, u.get(x, y));
                    App.v.set(x + 1, y + 1, v.get(x, y));
                }
            }                

            App.u = App.periodicBC(App.u);
            App.v = App.periodicBC(App.v);  
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
                    $("#animation-gen-status").text("Generating frame ".concat(i + 1, " of ", App.nFrames));                    
                } else {
                    break;
                }
            }; 
            // save completed frames or partially completed frames
            App.uFrames = uFrames;
            App.vFrames = vFrames;
            $("#animation-gen-status").text("Done! Press 'Play' to play the animation.");
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
            App.initBoardNP();
            App.createFrames();
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