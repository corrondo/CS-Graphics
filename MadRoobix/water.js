pc.script.attribute('normalMap', 'asset', [], {
    type: 'texture',
    max: 1
});

pc.script.create('water', function (context) {
    // Creates a new Water instance
    var Water = function (entity) {
        this.entity = entity;
    };

    Water.prototype = {
        // Called once after all resources are loaded and before the first update
        initialize: function () {
            
            this.pivot1 = context.root.findByName("Water");
            // Create shader
            var gd = context.graphicsDevice;
            
            
            var shaderDefinition = {
                attributes: {
                    aPosition: pc.SEMANTIC_POSITION
                },
                vshader: [
                    "attribute vec3 aPosition;",
                    "",
                    "uniform mat4 matrix_model;",
                    "uniform mat4 matrix_viewProjection;",
                    "",
                    "varying vec3 vWorldPos;",
                    "varying vec4 vProjectedPos;",
                    "",
                    "void main(void)",
                    "{",
                    "    vec4 worldPos = matrix_model * vec4(aPosition, 1.0);",
                    "    vWorldPos = worldPos.xyz;",
                    "    vProjectedPos = matrix_viewProjection * worldPos;",
                    "    gl_Position = vProjectedPos;",
                    "}"
                ].join("\n"),
                fshader: [
                    "precision " + gd.precision + " float;",
                    "",
                    "varying vec3 vWorldPos;",
                    "varying vec4 vProjectedPos;",
                    "",
                    "uniform sampler2D uNormalMap;",
                    "uniform float uTime;",
                    "uniform vec3 view_position;",
                    "uniform vec3 sunColor;",
                    "uniform vec3 sunDirection;",
                    "",
                    "uniform vec3 horizonColor;",
                    "uniform vec3 zenithColor;",
                    "",
                    "vec3 atmosphereColor(vec3 rayDirection) {",
                    "    float a = max(0.0, dot(rayDirection, vec3(0.0, 1.0, 0.0)));",
                    "    vec3 skyColor = mix(horizonColor, zenithColor, a);",
                    "    float sunTheta = max( dot(rayDirection, sunDirection), 0.0 );",
                    "    return skyColor+sunColor*pow(sunTheta, 256.0)*0.5;",
                    "}",
                    "",
                    "vec3 applyFog(vec3 albedo, float dist, vec3 rayOrigin, vec3 rayDirection) {",
                    "    float fogDensity = 0.00006;",
                    "    float vFalloff = 20.0;",
                    "    vec3 fogColor = vec3(0.88, 0.92, 0.999);",
                    "    float fog = exp((-rayOrigin.y*vFalloff)*fogDensity) * (1.0-exp(-dist*rayDirection.y*vFalloff*fogDensity))/(rayDirection.y*vFalloff);",
                    "    return mix(albedo, fogColor, clamp(fog, 0.0, 1.0));",
                    "}",
                    "",
                    "vec3 aerialPerspective(vec3 albedo, float dist, vec3 rayOrigin, vec3 rayDirection) {",
                    "    float atmosphereDensity = 0.000025;",
                    "    vec3 atmosphere = atmosphereColor(rayDirection)+vec3(0.0, 0.02, 0.04);",
                    "    vec3 color = mix(albedo, atmosphere, clamp(1.0-exp(-dist*atmosphereDensity), 0.0, 1.0));",
                    "    return applyFog(color, dist, rayOrigin, rayDirection);",
                    "}",
                    "",
                    "void sunLight(const vec3 surfaceNormal, const vec3 eyeDirection, float shiny, float spec, float diffuse,",
                    "              inout vec3 diffuseColor, inout vec3 specularColor){",
                    "    vec3 reflection = normalize(reflect(-sunDirection, surfaceNormal));",
                    "    float direction = max(0.0, dot(eyeDirection, reflection));",
                    "    specularColor += pow(direction, shiny)*sunColor*spec;",
                    "    diffuseColor += max(dot(sunDirection, surfaceNormal),0.0)*sunColor*diffuse;",
                    "}",
                    "",
                    "vec4 getNoise(vec2 uv)",
                    "{",
                    "    vec2 uv0 = (uv / 103.0) + vec2(uTime / 17.0, uTime / 29.0);",
                    "    vec2 uv1 = uv / 107.0 - vec2(uTime / -19.0, uTime / 31.0) + vec2(0.23);",
                    "    vec2 uv2 = uv / vec2(897.0, 983.0) + vec2(uTime / 101.0, uTime / 97.0) + vec2(0.51);",
                    "    vec2 uv3 = uv / vec2(991.0, 877.0) - vec2(uTime / 109.0, uTime / -113.0) + vec2(0.71);",
                    "",
                    "    vec4 noise = (texture2D(uNormalMap, uv0)) +",
                    "                 (texture2D(uNormalMap, uv1)) +",
                    "                 (texture2D(uNormalMap, uv2)) +",
                    "                 (texture2D(uNormalMap, uv3));",
                    "",
                    "    return noise * 0.5 - 1.0;",
                    "}",
                    "",
                    "void main(void)",
                    "{",
                    "    vec3 diffuse = vec3(0.0);",
                    "    vec3 specular = vec3(0.0);",
                    "",
                    "    vec3 worldToEye = view_position - vWorldPos;",
                    "    vec3 eyeDirection = normalize(worldToEye);",
                    "",
                    "    vec2 uv = vWorldPos.xz * 0.5;",
                    "    vec4 noise = getNoise(uv);",
                    "    float dist = length(worldToEye);",
                    "    float distortionFactor = max(dist / 100.0, 10.0);",
                    "",
                    "    vec3 surfaceNormal = normalize(noise.xzy * vec3(2.0, clamp(dist * 0.001, 1.0, 100.0), 2.0));",
                    "",
                    "    sunLight(surfaceNormal, eyeDirection, 10000.0, 20.0, 0.1, diffuse, specular);",
                    "",
                    "    vec3 albedo = diffuse + specular;",
                    "",
                    "    albedo = aerialPerspective(albedo, dist, view_position, -eyeDirection);",
                    "",
                    "    gl_FragColor = vec4(albedo, 1.0);",
                    "}"
                ].join("\n")
            };
    
            this.shader = new pc.Shader(gd, shaderDefinition);

            this.normalMap = context.assets.getAssetById(this.normalMap).resource;

            var material = new pc.Material();
            material.setShader(this.shader);
            material.setParameter('uTime', 0);
            material.setParameter('sunColor', [2.0, 1.75, 1.65]);
            material.setParameter('sunDirection', [-1.0, 0.2, 0.0]);
            material.setParameter('horizonColor', [0.6, 0.7, 1]);
            material.setParameter('zenithColor', [0.025, 0.1, 0.5]);
            material.setParameter('uNormalMap', this.normalMap);

            this.entity.model.model.meshInstances[0].material = material;

            this.material = material;
            this.time = 0;
        },

        // Called every frame, dt is time in seconds since last update
        update: function (dt) {
            this.time += dt;
            this.material.setParameter('uTime', this.time);
             this.pivot();
        },
        
         // this function rotates all three lights about their parent entities (all at the centre of the scene) to easily create circular motion.
         pivot: function (){
            this.pivot1.rotate(0.1, 0.1, 0.1);
             //this.pivot1.translate(Math.sin(1) ,0,Math.sin(1));
           
             
        }
    };

    return Water;
});