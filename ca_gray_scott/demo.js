;
jQuery(function($) {
    'use strict';

    var App = {
        // Global variables
        n: 100, // the dimensions of the board
        F: 0.014, // parameter in the Gray-Scott equation
        k: 0.039, // parameter in the Gray-Scott equation
        Dh: 1, // spatial resolution
        Dt: 1, // temporal resolution. Default is 0.02
        Du: 0.1, // diffusion constant of u. Default is 2x10e-5
        Dv: 0.05, // diffusion constant of v. Default is 10e-5
        delay: 0, // the delay between each frame for the animation (ms)
        neighborhoodType: 'moore', // the type of neighborhoods, ['moore', 'neumann']
        boundaryCond: 'cut-off', // the boundary conditions, ['cut-off', 'periodic']
        cellClasses: ["cell white", "cell white", "cell white"], // strings that identify the colors of the cells
        paused: true, // whether or not the simulation is paused
        maxGenNoChange: 1, // the maximum number of generations to check for no change
        countGenNoChange: 0, // the current number of generations where no agents moved
        // animation parameters
        nFrames: 100, // the number of frames to generate the animation for
        stepsPerFrames: 40, // the number of simulation steps per frame
        animationIteration: 0, // the current iteration of the animation we are playing
        lo: 0,
        hi: 1,

        init: function() {
            // JQuery stuff. Renders the main game
            App.$doc = $(document);

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
                App.initBoardNP();
                App.observeNP(App.chemType, '#pos');
                $("#animation-gen-status").text("Idle");
            });            
            // Start the simulation
            App.$doc.on('click', '#start-btn', function() {
            	// $("#animation-gen-status").text("Generating...");
                // await App.sleep(100);
                App.startSimulation();
                // $("#animation-gen-status").text("Done!");
            });
            // Play the animation
            App.$doc.on('click', '#play-btn', function() {
            	App.paused = false;
                $("#animation-gen-status").text("Playing animation...");
                App.playAnimation();
            });
            // Pause the animation
            App.$doc.on('click', '#pause-btn', function() {
                App.pauseAnimation();
                $("#animation-gen-status").text("Paused animation...");
            });            

            // Drop-downs
            $("#chemical-type").on("change", function() {
                let selectedVal = this.value;
                App.chemTypeStr = selectedVal;
                if (App.chemTypeStr == "u-chem") {
                		App.chemType = App.u;
                } else {
                		App.chemType = App.v;
                };
                App.observeNP(App.chemType, '#pos');
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
                    $("#pos".concat(i)).attr('class', "cell black");
                    i++;
                }
            }
        },
        initBoard: function() {
            /*
            Description:
                Initializes the CA board with a new configuration.

            Arguments:
                None

            Return:
                (None)
            */
            // CA configurations
            let u = App.createArray(App.n, App.n);
            let v = App.createArray(App.n, App.n);
            let nextu = App.createArray(App.n, App.n);
            let nextv =  App.createArray(App.n, App.n);
            // initial conditions
            for (let x = 0; x < App.n; x++) {
            		for (let y = 0; y < App.n; y++) {
                		if (Math.floor(0.4 * App.n) < x && x < Math.floor(0.6 * App.n) && Math.floor(0.4 * App.n) < y && y < Math.floor(0.6 * App.n)) {
                    		u[x][y] = 0.5;
                            nextu[x][y] = 0.5;
                            v[x][y] = 0.25;
                            nextv[x][y] = 0.25;
                        }
                        else {
                                u[x][y] = 1;
                                nextu[x][y] = 1;
                                v[x][y] = 0;
                                nextv[x][y] = 0;                    
                        }
            		}
            }
            // save the configuration
            App.u = u;
            App.v = v;
            App.nextu = nextu;
            App.nextv = nextv;
            
            App.step = 0;
            App.countGenNoChange = 0;        
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
            // let u = nj.random([App.n + 2, App.n + 2]).multiply(0.02);
            // let v = nj.random([App.n + 2, App.n + 2]).multiply(0.02);          
            // define radius of initial conditions
            let n2 = Math.floor(App.n / 2);
            let r = 10;
            // initial conditions
            for (let x = 0; x < App.n + 2; x++) {
                for (let y = 0; y < App.n + 2; y++) {
                    // if (n2 - r <= x && x <= n2 + r && n2 - r <= y && y <= n2 + r) {
                    //     u.set(x, y, 0.5);
                    //     v.set(x, y, 0.25);
                    // }
                    if ((Math.floor(0.39 * App.n) <= x && x <= Math.floor(0.41 * App.n) || Math.floor(0.59 * App.n) <= x && x <= Math.floor(0.61 * App.n)) && n2 - r <= y && y <= n2 + r) {
                        u.set(x, y, 0.5);
                        v.set(x, y, 0.25);
                    }
                    if ((Math.floor(0.39 * App.n) <= y && y <= Math.floor(0.41 * App.n) || Math.floor(0.59 * App.n) <= y && y <= Math.floor(0.61 * App.n)) && n2 - r <= x && x <= n2 + r) {
                        u.set(x, y, 0.5);
                        v.set(x, y, 0.25);
                    }                                        
                }
            }      
            
            // save the configuration
            App.u = u;
            App.v = v;
            App.chemTypeStr = $("#chemical-type").val();
            if (App.chemTypeStr == "u-chem") {
              App.chemType = App.u;
            } else {
              App.chemType = App.v;
            }
            
            // meta info
            App.step = 0;
            App.countGenNoChange = 0;
            App.animationIteration = 0;       
        },
        observe: function(obj, src = '#pos') {
            /*
            Description:
                Use config to put color on the board in the HTML document.
                
            Arguments:
                src: the common ID of the cells. To be concatenated with numbers to find the cells.
                
            Return:
                (None)
            */
            for (let x = 0; x < App.n; x++) {
                for (let y = 0; y < App.n; y++) {
                    let cellVal;
                    if (obj[x][y] <= 1 && obj[x][y] >= 0) {
                        cellVal =  obj[x][y];
                    } else if (obj[x][y] < 0) {
                        cellVal =  0;
                    } else {
                        cellVal =  1;
                    };
                    let i = x + App.n * y;
                    $(src.concat(i)).attr('class', App.cellClasses[0]);
                    $(src.concat(i)).css("opacity", String(cellVal));
                }
            }
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
            for (let x = 0; x < App.n; x++) {
                for (let y = 0; y < App.n; y++) {
                    let cellVal = obj.get(x + 1, y + 1);
                    if (cellVal === undefined) {
                        console.log(x);
                        console.log(y);
                    }
                    let i = x + App.n * y;
                    // $(src.concat(i)).attr('class', App.cellClasses[0]);
                    $(src.concat(i)).css("opacity", cellVal.toString());
                }
            }
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
        updateConfig: function() {
            /*
            Description:
                Loop through the current configuration and update each cell's value according to its neighbors.
            
            Arguments:
                None
            
            Return:
                (None)
            */
            // loop through the config and update each cell's value according to its neighbors
            for (let x = 0; x < App.n; x++) {
                for (let y = 0; y < App.n; y++) {
                    let safe_x_minus_1 = (x - 1 < 0) ? App.n - 1 : (x - 1) % App.n;
                    let safe_y_minus_1 = (y - 1 < 0) ? App.n - 1 : (y - 1) % App.n;
                    
                		let uC = App.u[x][y];
                    let uR = App.u[(x + 1) % App.n][y];
                    let uL = App.u[safe_x_minus_1][y];
                    let uU = App.u[x][(y + 1) % App.n];
                    let uD = App.u[x][safe_y_minus_1];
                    // let uUL = App.u[safe_x_minus_1][(y + 1) % App.n];
                    // let uUR = App.u[(x + 1) % App.n][(y + 1) % App.n];
                    // let uDL = App.u[safe_x_minus_1][safe_y_minus_1];
                    // let uDR = App.u[(x + 1) % App.n][safe_y_minus_1];
                    
                		let vC = App.v[x][y];
                    let vR = App.v[(x + 1) % App.n][y];
                    let vL = App.v[safe_x_minus_1][y];
                    let vU = App.v[x][(y + 1) % App.n];
                    let vD = App.v[x][safe_y_minus_1];
                    // let vUL = App.v[safe_x_minus_1][(y + 1) % App.n];
                    // let vUR = App.v[(x + 1) % App.n][(y + 1) % App.n];
                    // let vDL = App.v[safe_x_minus_1][safe_y_minus_1];
                    // let vDR = App.v[(x + 1) % App.n][safe_y_minus_1];
                    
                    let uLap = (uR + uL + uU + uD - 4 * uC) / (App.Dh ** 2);
                    let vLap = (vR + vL + vU + vD - 4 * vC) / (App.Dh ** 2);
                    
                    App.nextu[x][y] = uC + (App.F * (1 - uC) - uC * (vC**2) + App.Du * uLap) * App.Dt;
                    App.nextv[x][y] = vC + (-(App.F + App.k) * vC + uC * (vC**2) + App.Dv * vLap) * App.Dt;                                        
                }
            }
            // should implement a truly random loop by getting a random shuffling of the indices of the cells

            // step the config forward
            let tempU = structuredClone(App.u);
            App.u = App.nextu;
            App.nextu = tempU;
            let tempV = structuredClone(App.v);
            App.v = App.nextv;
            App.nextv = tempV;            
            /* App.u = structuredClone(nextu);
            App.nextu = structuredClone(u);
            App.v = structuredClone(nextv);
            App.nextv = structuredClone(v); */
            // if we did not move any agents, stop the simulation
            /* if (!moved) {
                App.countGenNoChange = App.countGenNoChange + 1;
            }
            if (App.countGenNoChange > App.maxGenNoChange) {
                App.paused = true;
                // console.log("Done")
            } */
            // update the blog page's text
            // $("#generation-intext").text(App.step);
            // $("#percent-satisfied-intext").text(((App.totalSatisfied / App.totalAgents) * 100).toFixed(2));   
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
        	// return (u[:-2, 1:-1] + u[1:-1, :-2] - 4*u[1:-1, 1:-1] + u[1:-1, 2:] + u[2:, 1:-1])
            let Neighbor1 = u.slice([null, -2], [1, -1]);
            let Neighbor2 = u.slice([1, -1], [null, -2]);
            let Neighbor3 = u.slice([1, -1], [1, -1]);
            let Neighbor4 = u.slice([1, -1], 2);
            let Neighbor5 = u.slice(2, [1, -1]);
            // $("#result").text(Neighbor5.shape);
            
            let result = Neighbor1.add(Neighbor2);
            result = result.subtract(Neighbor3.multiply(4));          
            result = result.add(Neighbor4);
            result = result.add(Neighbor5);
            // $("#result").text(result.get(0, 0));  
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
            let frames = [];
            let uFrames = [];
            let vFrames = [];
            for (let i = 0; i < App.nFrames; i++) {
            	// update the model for stepsPerFrames and save the frames
                for (let j = 0; j < App.stepsPerFrames; j++) {
                	App.updateConfigNP();
                }
                // save frames
                uFrames.push(App.u);
                vFrames.push(App.v);
                // console.log("Frame ".concat(i));
                await App.sleep(1);
                $("#animation-gen-status").text("Generating frame ".concat(i + 1, " of ", App.nFrames));
            };
            // need to do some scaling to u and v frames
            
            frames.push(uFrames);
            frames.push(vFrames);
            App.uFrames = frames[0];
            App.vFrames = frames[1];
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
            // console.log(App.uFrames.length);
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
                // console.log(App.animationIteration);
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