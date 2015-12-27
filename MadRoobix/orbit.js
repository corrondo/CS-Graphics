pc.script.create('orbit', function (app) {
    // Creates a new Orbit instance
    var Orbit = function (entity) {
        this.entity = entity;
    };

    Orbit.prototype = {
        // Called once after all resources are loaded and before the first update
        initialize: function () {
              this.pivot1 = app.root.findByName("Pivot1");
         
        },

        // Called every frame, dt is time in seconds since last update
        update: function (dt) {
              this.pivot();
        },
        
         // this function rotates all three lights about their parent entities (all at the centre of the scene) to easily create circular motion.
         pivot: function (){
            this.pivot1.rotate(0, 2, 2);
           
             
        }
    };
      
          

    return Orbit;
});