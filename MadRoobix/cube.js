pc.script.create('cube', function (app) {
	// Creates a new Cube instance
	var Cube = function (entity) {
		this.entity = entity;
		this.status = "intro";				// Current status of the cube
		this.boxes = [];					// All boxes in cube
		this.faces = [];					// All faces in cube
		this.pickedFace 	= null;			// Face selected on pick
		this.activeFace 	= null;			// Active face, will deselect when new is picked
		this.faceAxis		= null;			// Axis which activeFace rests upon (x, y, or z)
		this.activeBox 		= null;			// Box with activeFace
		this.activeGroup 	= [];			// Array of 9 boxes to flip
		this.activePos 		= new pc.Vec3();// Position of activeBox
		this.soundManager;					// Will control sound effects
		this.pickSrc;
		this.moveSrc;
        this.ambientSrc;
        this.ambient;
		this.pickTO;
		this.moveTO;
        this.ambientTO;
		this.boxCounter = 0;				// Counter to iterate through boxes
		this.faceCounter = 0;				// Counter to iterate through faces
		this.axes = ["x", "y", "z", "-x", "-y", "-z"];
		this.mute = false;
		this.rotatingCount = 0;				// Number of boxes that are rotating
	};

	Cube.prototype = {
		// Called once after all resources are loaded and before the first update
		initialize: function(){
			// Will create array of only Boxes with Faces
			this.boxes = this.entity.getChildren().filter(function(thisChild){
				if(thisChild.getName() === "111"){
					return false;
				}else{
					return true;
				}
			});

			// Add box.js script to each box
			this.boxes.forEach(function(box, index){
				app.systems.script.addComponent(box,{
					scripts: [{url: "box.js"}]
				});
				this.faces.push.apply(this.faces, box.script.box.faces);
				console.log(index);
			}.bind(this));

			this.soundManager = app.systems.audiosource.manager;
			this.pickSrc = this.entity.audiosource.data.sources.pick;
			this.moveSrc = this.entity.audiosource.data.sources.moves;
            this.ambientSrc = this.entity.audiosource.data.sources.pick2;
            this.sfxAmbient();
        
                      
		},

		// Called every frame, dt is time in seconds since last update
		update: function(dt){
			switch(this.status){
				case "whiteout":
					this.whiteBoxes(dt);
				break;
				case "colorize":
					this.colorBoxes(dt);
				break;
			}
            
            
		},

        //Groups 9 boxes, based on axis and a box
		makeGroup: function(axis, axisBox){
			this.activeGroup = [];
			this.activePos = axisBox.script.box.getPos();

			for(var i = 0; i < this.boxes.length; i++){
				if((axis === "x" || axis === "-x") && this.boxes[i].script.box.getPos().x == this.activePos.x){
					this.activeGroup.push(this.boxes[i]);
				}
				else if((axis === "y" || axis === "-y") && this.boxes[i].script.box.getPos().y == this.activePos.y){
					this.activeGroup.push(this.boxes[i]);
				}
				else if((axis === "z" || axis === "-z") && this.boxes[i].script.box.getPos().z == this.activePos.z){
					this.activeGroup.push(this.boxes[i]);
				}
			}

			return this.activeGroup;
		},

		// Returns array of boxes in diagonal order
		makeDiagonalBoxes: function(){
			this.faces = [];
			var x = 0;
			var y = 0;
			var z = 0;
			var tempVec = new pc.Vec3.set(2,0,0);
			this.boxes.forEach(function(thisBox){
				for(x = 0; x < 3; x++){
					for(y = 0; y < 3; y++){
						for(z = 0; z < 3; z++){
							if(thisBox.script.box.getPos() == x){

							}
						}
					}
				}
			});
		},

		// Rotate cube or box face
		rotate: function(axis){
			if(this.isBusy() || this.status !== ""){return false;}
			this.changeStatus("rotating");

			// If no face is selected, rotate whole cube
			if(this.activeFace === null){
				this.boxes.forEach(function(thisBox, index){
					if(thisBox.script.box.rotate(axis)){
						this.rotatingCount ++;
					}
				}.bind(this));
			}
			// Otherwise, only rotate boxes in desired axis
			else{
				this.makeGroup(axis, this.activeBox).forEach(function(thisBox){
					if(thisBox.script.box.rotate(axis)){
						this.rotatingCount ++;
					}
				}.bind(this));
			}
			this.sfxMove(axis);
		},

		// Select new active face
		faceSelect: function(){
			this.activeFace = this.pickedFace;
			this.activeBox = this.activeFace.getParent().getParent();
			this.faceAxis = this.activeBox.script.box.faceActivate(this.activeFace);
		},

		// Deselect active face
		faceDeselect: function(){
			if(this.activeFace === null){return false;}

			this.activeBox.script.box.faceDeactivate(this.activeFace);

			this.activeFace = null;
			this.activeBox = null;
			this.faceAxis = null;
		},

		// Deselect old face, select new face
		faceToggle: function(){
			this.faceDeselect();
			this.faceSelect();
		},

		////////////////////// CALLS FROM BOX.JS //////////////////////
		rotationComplete: function(auto){
			if(this.status === "autoShuffle"){
				this.rotatingCount --;
				if(this.rotatingCount === 0){
					this.autoShuffle();
				}
			}else{
				this.rotatingCount --;
				if(this.rotatingCount === 0){
					this.changeStatus("");
				}
			}
		},

		////////////////////// CALLS FROM CAMERA.JS //////////////////////
		// New face picked
		pick: function(entity){
			// Avoids selecting faces on back side of cube
			if(entity.getName() === "111" || this.status !== ""){return false;}

			this.pickedFace = entity;
			
			// Deselects face if picking active one
			if(this.pickedFace == this.activeFace){
				this.faceDeselect();
			}
			// Selects new face if active doesn't exist
			else if(this.activeFace === null){
				this.faceSelect();
			}
			// Toggles faces if active already exists
			else{
				this.faceToggle();
			}
			this.sfxPick();
		},

		// Shuffles cube into superflip configuration
		startSuperflip: function(){
			var x = (Math.random() < 0.5) ? "-x" : "x";
			var y = (Math.random() < 0.5) ? "-y" : "y";
			var z = (Math.random() < 0.5) ? "-z" : "z";

			this.boxes.forEach(function(thisBox){
				switch(thisBox.script.box.type){
					case "edge":
						thisBox.script.box.startSuperflip(x, 6);
					break;
					case "corner":
						thisBox.script.box.startSuperflip(y, 3);
					break;
					case "center":
						thisBox.script.box.startSuperflip(z, 0);
					break;
				}
			});
		},

		////////////////////// SHUFFLE METHODS //////////////////////
		// Shuffle cube using traditional method
		startShuffle: function(){
			if(this.status !== "intro" && this.status !== ""){return false;}
			this.faceCounter = 0;
			this.boxCounter = 0;
			this.changeStatus("whiteout");
		},

		// Turns all boxes white
		whiteBoxes: function(dt){
			this.faces[this.faceCounter].model.materialAsset = app.assets.find("myMat1");
			this.faceCounter ++;
			if(this.faceCounter == this.faces.length){
				this.faceCounter = 0;
				this.changeStatus("autoShuffle");
				this.autoShuffle();
			}
		},

		// Rotates boxes automatically
		autoShuffle: function(){
			if(this.boxCounter > 10){
				this.boxCounter = 0;
				this.changeStatus("colorize");
			}else{ 
				this.autoRotate(this.axes[this.boxCounter % 6]);
				this.boxCounter ++;
			}
		},

		// Auto rotate group of 9 boxes
		autoRotate: function(axis){
			var x = 0;
			var y = 0;
			var z = 0;
			var axis2 = this.axes[(this.boxCounter + 3) % 6];

			switch(axis){
				case "x":
				case "-x":
					x = Math.round(Math.random() * 2);
				break;
				case "y":
				case "-y":
					y = Math.round(Math.random() * 2);
				break;
				case "z":
				case "-z":
					z = Math.round(Math.random() * 2);
				break;
			}

			this.makeGroup(axis, this.getBoxByPosition(x, y, z)).forEach(function(thisBox){
				if(thisBox.script.box.autoRotate(axis)){
					this.rotatingCount ++;
				}
			}.bind(this));

			switch(axis){
				case "x":
				case "-x":
					x = (x + 1) % 3;
				break;
				case "y":
				case "-y":
					y = (y + 1) % 3;
				break;
				case "z":
				case "-z":
					z = (z + 1) % 3;
				break;
			}

			this.makeGroup(axis2, this.getBoxByPosition(x, y, z)).forEach(function(thisBox){
				if(thisBox.script.box.autoRotate(axis2)){
					this.rotatingCount ++;
				}
			}.bind(this));
            
            this.sfxMove(axis);
		},

		// Colorizes all boxes
		colorBoxes: function(dt){
			this.faces[this.faceCounter].model.materialAsset = app.assets.find(this.faces[this.faceCounter].getName());
			this.faceCounter ++;
			if(this.faceCounter == this.faces.length){
				this.faceCounter = 0;
				this.changeStatus("");
			}
		},

		////////////////////// INTERNAL STATUS //////////////////////
		// Changes the status of the cube
		changeStatus: function(newStatus){
			if(typeof(newStatus) !== "string"){
				this.status = "";
			}else{
				this.status = newStatus;
			}
		},

		// Returns true if any block is busy
		isBusy: function(){
			for(var i = 0; i < this.boxes.length; i++){
				if(this.boxes[i].script.box.status !== ""){
					return true;
				}
			}
			return false;
		},

		////////////////////// UTILITIES //////////////////////
		getBoxByPosition: function(x, y, z){
			var coordinates = "[" + (x - 1) + ", " + (y - 1) + ", " + (z - 1) + "]";
			for(var i = 0; i < this.boxes.length ; i++){
				if(this.boxes[i].script.box.getPos().toString() == coordinates){
					return this.boxes[i];
				}
			}

			return false;
		},

		////////////////////// SOUND EFFECTS //////////////////////
		// Play Pick sound
		sfxPick: function(){
			if(this.mute){return false;}
			var pickSnd = new pc.Channel(this.soundManager, this.pickSrc);
			pickSnd.startOffset = Math.round(Math.random() * 17);
			pickSnd.play();

			this.pickTO = window.setTimeout(function(){
				pickSnd.stop();
			}, 900);
		},

        // Play Ambient Sound
        sfxAmbient: function(){
			
			var ambientSnd = new pc.Channel(this.soundManager, this.ambientSrc);
            var volume = 0.1;           // Ambient sound lower volume than Move and Pick sounds
            ambientSnd.volume = volume;
            ambientSnd.loop = true;
             
           ambientSnd.play();	

			
		},
        
		// Play Move sound
		sfxMove: function(axis){
			if(this.mute){return false;}
			// 0 - 10 up
			// 11 - 21 dn
			var moveSnd = new pc.Channel(this.soundManager, this.moveSrc);
            var volume = 0.1;                 // Move sound lower volume than Pick sound
            moveSnd.volume = volume;
			moveSnd.pitch = 0.35;
			switch(axis){
				case "x":
                    moveSnd.pitch += 0.1;
                    moveSnd.volume = volume;
                case "-x":
                    moveSnd.pitch += 0.15;
                    moveSnd.volume = volume;
                case "-z":
                    moveSnd.pitch += 0.2;
                    moveSnd.volume = volume;
				case "z":
                    moveSnd.pitch += 0.25;
                    moveSnd.volume = volume;
				case "-y":
					moveSnd.pitch += 0.3;
                    moveSnd.volume = volume;
				break;
			}
			moveSnd.play();

			this.moveTO = window.setTimeout(function(){
				moveSnd.stop();
			}, 950);
		}
	};

	return Cube;
});