import { 
    Scene, 
    SceneLoader, 
    Vector3, 
    Mesh,
    AbstractMesh,
    MeshBuilder,
    StandardMaterial,
    Color3,
    TransformNode
} from "@babylonjs/core";
// Import GLB loader
import "@babylonjs/loaders";
import "@babylonjs/loaders/glTF/glTFFileLoader";

export class Environment {
    private scene: Scene;
    private environmentMesh: AbstractMesh | null = null;
    private hub: TransformNode;
    private pathway: TransformNode;
    private platform: TransformNode;
    private altar: TransformNode;

    constructor(scene: Scene) {
        this.scene = scene;
        // Initialize properties
        this.hub = new TransformNode("hub", this.scene);
        this.pathway = new TransformNode("pathway", this.scene);
        this.platform = new TransformNode("platform", this.scene);
        this.altar = new TransformNode("altar", this.scene);
    }

    // Method to create a simple environment (previously createBasicEnvironment)
    public async createBasicEnvironment(): Promise<void> {
        console.log("Creating stylized fantasy environment...");
        
        // Sky backdrop color
        this.scene.clearColor = new Color3(0.6, 0.7, 0.9).toColor4(); // Light blue sky color
        
        // Main center platform
        const centerPlatform = MeshBuilder.CreateCylinder(
            "centerPlatform",
            { height: 0.5, diameter: 8, tessellation: 48 },
            this.scene
        );
        centerPlatform.position.y = 0.25;
        
        // Material for center platform
        const centerMaterial = new StandardMaterial("centerMaterial", this.scene);
        centerMaterial.diffuseColor = new Color3(0.7, 0.6, 0.8); // Lavender purple
        centerMaterial.specularColor = new Color3(0.3, 0.3, 0.5);
        centerPlatform.material = centerMaterial;
        
        // Create decorative ring around center platform
        const decorRing = MeshBuilder.CreateTorus(
            "decorRing",
            { diameter: 7.8, thickness: 0.3, tessellation: 48 },
            this.scene
        );
        decorRing.position.y = 0.5;
        const ringMaterial = new StandardMaterial("ringMaterial", this.scene);
        ringMaterial.diffuseColor = new Color3(0.8, 0.7, 0.9); // Lighter purple
        decorRing.material = ringMaterial;
        
        // Create altar in the center
        const altarBase = MeshBuilder.CreateCylinder(
            "altarBase",
            { height: 0.6, diameter: 2, tessellation: 24 },
            this.scene
        );
        altarBase.position.y = 0.55;
        const altarBaseMaterial = new StandardMaterial("altarBaseMaterial", this.scene);
        altarBaseMaterial.diffuseColor = new Color3(0.6, 0.7, 0.9); // Light blue
        altarBase.material = altarBaseMaterial;
        
        // Create water/light column
        const waterColumn = MeshBuilder.CreateCylinder(
            "waterColumn",
            { height: 3, diameter: 0.5, tessellation: 12 },
            this.scene
        );
        waterColumn.position.y = 2;
        const waterMaterial = new StandardMaterial("waterMaterial", this.scene);
        waterMaterial.diffuseColor = new Color3(0.7, 0.9, 1.0); // Light cyan
        waterMaterial.emissiveColor = new Color3(0.4, 0.6, 0.8); // Glow effect
        waterMaterial.alpha = 0.7; // Semi-transparent
        waterColumn.material = waterMaterial;
        
        // Create a principal path (starting path) - this will be more prominent
        const principalPathLength = 20; // Length of the principal path
        const principalPathStart = new Vector3(0, 0, -principalPathLength); // Starting from further away
        const principalPathEnd = new Vector3(0, 0.5, -4); // Ending near the center platform
        
        // Create a prominent path with steps
        this.createPrincipalPath(principalPathStart, principalPathEnd);
        
        // Create fairy/sprite at the top of fountain
        const fairy = MeshBuilder.CreateSphere(
            "fairy",
            { diameter: 0.3, segments: 12 },
            this.scene
        );
        fairy.position.y = 4;
        const fairyMaterial = new StandardMaterial("fairyMaterial", this.scene);
        fairyMaterial.diffuseColor = new Color3(1, 1, 1);
        fairyMaterial.emissiveColor = new Color3(1, 1, 1); // Glow
        fairy.material = fairyMaterial;
        
        // Create fairy wings
        const wing1 = MeshBuilder.CreatePlane(
            "wing1",
            { width: 0.5, height: 0.8 },
            this.scene
        );
        wing1.position = new Vector3(0.2, 4, 0);
        wing1.rotation.y = Math.PI / 2;
        wing1.rotation.x = Math.PI / 6;
        
        const wing2 = MeshBuilder.CreatePlane(
            "wing2",
            { width: 0.5, height: 0.8 },
            this.scene
        );
        wing2.position = new Vector3(-0.2, 4, 0);
        wing2.rotation.y = Math.PI / 2;
        wing2.rotation.x = -Math.PI / 6;
        
        const wingMaterial = new StandardMaterial("wingMaterial", this.scene);
        wingMaterial.diffuseColor = new Color3(1, 1, 1);
        wingMaterial.alpha = 0.5; // Set transparency level
        wingMaterial.backFaceCulling = false; // Show both sides of the wings
        wing1.material = wingMaterial;
        wing2.material = wingMaterial;
        
        // Create outer platforms with grid pattern
        const platformsCount = 6; // Number of platforms around the hub
        const platformDistance = 12; // Distance from center
        const platformSize = 3; // Size of each platform
        const platformHeight = 0.4;
        
        // Create platforms in a circular pattern
        for (let i = 0; i < platformsCount; i++) {
            // Calculate position with slight elevation
            const angle = (i / platformsCount) * Math.PI * 2;
            const x = Math.sin(angle) * platformDistance;
            const z = Math.cos(angle) * platformDistance;
            const y = -0.5 + Math.sin(angle * 2) * 0.3; // Slight wave pattern in height
            
            // Create outer platform (circular)
            const platform = MeshBuilder.CreateCylinder(
                `platform_${i}`,
                { height: platformHeight, diameter: platformSize, tessellation: 24 },
                this.scene
            );
            platform.position = new Vector3(x, y + platformHeight/2, z);
            
            // Create material for the platform
            const platformMaterial = new StandardMaterial(`platformMaterial_${i}`, this.scene);
            
            // Alternate colors between blue and purple
            if (i % 2 === 0) {
                platformMaterial.diffuseColor = new Color3(0.6, 0.7, 0.9); // Light blue
            } else {
                platformMaterial.diffuseColor = new Color3(0.7, 0.6, 0.8); // Purple
            }
            
            platform.material = platformMaterial;
            
            // Create grid pattern on top of platform - making sure it's properly contained inside
            // Reduce grid size significantly to ensure it fits within the platform
            const gridSize = platformSize * 0.6; // 60% of platform size to ensure it's fully inside
            const grid = MeshBuilder.CreateGround(
                `grid_${i}`,
                { width: gridSize, height: gridSize, subdivisions: 5 },
                this.scene
            );
            
            // Position grid slightly above platform surface
            grid.position = new Vector3(x, y + platformHeight + 0.01, z);
            
            const gridMaterial = new StandardMaterial(`gridMaterial_${i}`, this.scene);
            if (i % 2 === 0) {
                gridMaterial.diffuseColor = new Color3(0.7, 0.9, 1.0); // Light cyan for blue platforms
            } else {
                gridMaterial.diffuseColor = new Color3(0.8, 0.7, 0.9); // Light purple for purple platforms
            }
            gridMaterial.wireframe = true;
            grid.material = gridMaterial;
            
            // Create connection path from center to platform (curved)
            this.createCurvedPath(centerPlatform.position, platform.position, i);
        }
        
        // Store the center platform as our environment mesh reference
        this.environmentMesh = centerPlatform;
        
        // Store altar reference for interaction
        this.altar = new TransformNode("altar", this.scene);
        this.altar.position = new Vector3(0, 0.5, 0);
        altarBase.parent = this.altar;
        waterColumn.parent = this.altar;
        
        console.log("Stylized fantasy environment created");
    }

    private createCurvedPath(start: Vector3, end: Vector3, index: number): void {
        const segments = 12; // Number of segments in the curved path
        const pathWidth = 0.8;
        const pathHeight = 0.1;
        
        // Calculate control points for a curved path
        const distance = Vector3.Distance(start, end);
        const direction = end.subtract(start).normalize();
        const midPoint = start.add(direction.scale(distance / 2));
        
        // Add some height to the middle point to create a curve
        midPoint.y += distance * 0.1;
        
        // Create segments
        const points: Vector3[] = [];
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            
            // Quadratic Bezier curve
            const point = this.quadraticBezier(start, midPoint, end, t);
            points.push(point);
        }
        
        // Create path segments
        for (let i = 0; i < segments; i++) {
            const segmentDir = points[i + 1].subtract(points[i]).normalize();
            
            // Calculate segment length
            const segLength = Vector3.Distance(points[i], points[i + 1]);
            
            // Create path segment
            const segment = MeshBuilder.CreateBox(
                `path_${index}_segment_${i}`,
                { width: pathWidth, height: pathHeight, depth: segLength },
                this.scene
            );
            
            // Position at midpoint of segment
            const midSegPoint = points[i].add(segmentDir.scale(segLength / 2));
            segment.position = midSegPoint;
            
            // Rotate to align with segment direction
            // Calculate rotation to face the next point
            const lookAt = Math.atan2(
                points[i + 1].x - points[i].x,
                points[i + 1].z - points[i].z
            );
            segment.rotation.y = lookAt;
            
            // Apply pitch (up/down) rotation
            const pitch = Math.atan2(
                points[i + 1].y - points[i].y,
                Math.sqrt(Math.pow(points[i + 1].x - points[i].x, 2) + Math.pow(points[i + 1].z - points[i].z, 2))
            );
            segment.rotation.x = -pitch;
            
            // Material for the path
            const pathMaterial = new StandardMaterial(`pathMaterial_${index}_${i}`, this.scene);
            pathMaterial.diffuseColor = new Color3(0.7, 0.6, 0.8); // Purple
            segment.material = pathMaterial;
        }
    }
    
    // Helper method for quadratic Bezier curve
    private quadraticBezier(p0: Vector3, p1: Vector3, p2: Vector3, t: number): Vector3 {
        const oneMinusT = 1 - t;
        const oneMinusTSquared = oneMinusT * oneMinusT;
        const tSquared = t * t;
        
        const x = oneMinusTSquared * p0.x + 2 * oneMinusT * t * p1.x + tSquared * p2.x;
        const y = oneMinusTSquared * p0.y + 2 * oneMinusT * t * p1.y + tSquared * p2.y;
        const z = oneMinusTSquared * p0.z + 2 * oneMinusT * t * p1.z + tSquared * p2.z;
        
        return new Vector3(x, y, z);
    }

    // Create principal path with steps
    private createPrincipalPath(start: Vector3, end: Vector3): void {
        // Create the main walkway
        const pathWidth = 3;
        const pathLength = Vector3.Distance(start, end);
        const direction = end.subtract(start).normalize();
        
        // Create main path with steps
        const stepsCount = 8;
        const stepLength = pathLength / stepsCount;
        
        for (let i = 0; i < stepsCount; i++) {
            const stepStart = start.add(direction.scale(i * stepLength));
            const stepHeight = 0.1 + (i / stepsCount) * 0.4; // Gradually increase height
            
            // Create step
            const step = MeshBuilder.CreateBox(
                `main_path_step_${i}`,
                { 
                    width: pathWidth, 
                    height: stepHeight, 
                    depth: stepLength * 0.95 // Slight gap between steps
                },
                this.scene
            );
            
            // Position step
            const stepPosition = stepStart.add(direction.scale(stepLength * 0.5));
            step.position = new Vector3(
                stepPosition.x, 
                stepStart.y + stepHeight * 0.5,  
                stepPosition.z
            );
            
            // Align step with direction
            const angle = Math.atan2(direction.x, direction.z);
            step.rotation.y = angle;
            
            // Material for path
            const pathMaterial = new StandardMaterial(`path_material_${i}`, this.scene);
            if (i % 2 === 0) {
                pathMaterial.diffuseColor = new Color3(0.7, 0.6, 0.9); // Light purple
            } else {
                pathMaterial.diffuseColor = new Color3(0.6, 0.5, 0.8); // Darker purple
            }
            step.material = pathMaterial;
            
            // Add glowing edges to the first and last steps
            if (i === 0 || i === stepsCount - 1) {
                const edgeWidth = 0.2;
                const edge = MeshBuilder.CreateBox(
                    `step_edge_${i}`,
                    {
                        width: pathWidth + edgeWidth, 
                        height: stepHeight + 0.05, 
                        depth: edgeWidth
                    },
                    this.scene
                );
                
                // Position at front or back of step
                let edgeOffset = i === 0 ? -stepLength * 0.5 : stepLength * 0.5;
                const edgePosition = new Vector3(
                    stepPosition.x + direction.x * edgeOffset,
                    stepPosition.y + 0.025,
                    stepPosition.z + direction.z * edgeOffset
                );
                edge.position = edgePosition;
                edge.rotation.y = angle;
                
                // Add glowing material
                const edgeMaterial = new StandardMaterial(`edge_material_${i}`, this.scene);
                edgeMaterial.diffuseColor = new Color3(0.8, 0.8, 1);
                edgeMaterial.emissiveColor = new Color3(0.5, 0.5, 0.9);
                edge.material = edgeMaterial;
            }
        }
        
        // Add decorative railings
        this.addPathRailings(start, end, pathWidth);
    }
    
    private addPathRailings(start: Vector3, end: Vector3, pathWidth: number): void {
        const direction = end.subtract(start).normalize();
        const pathLength = Vector3.Distance(start, end);
        
        // Get perpendicular vector to create railings
        const perpendicular = new Vector3(direction.z, 0, -direction.x).normalize();
        
        // Create railings on both sides
        for (let side = -1; side <= 1; side += 2) {
            const sideOffset = perpendicular.scale(side * (pathWidth / 2));
            
            // Create posts
            const postsCount = 6;
            const postSpacing = pathLength / postsCount;
            
            for (let i = 0; i <= postsCount; i++) {
                const postPosition = start.add(direction.scale(i * postSpacing)).add(sideOffset);
                
                // Post height increases as we get closer to the center
                const postHeight = 0.5 + (i / postsCount) * 0.5;
                
                const post = MeshBuilder.CreateCylinder(
                    `railing_post_${side}_${i}`,
                    { height: postHeight, diameter: 0.15, tessellation: 8 },
                    this.scene
                );
                
                post.position = new Vector3(
                    postPosition.x,
                    postHeight / 2 + postPosition.y,
                    postPosition.z
                );
                
                // Material for posts
                const postMaterial = new StandardMaterial(`post_material_${side}_${i}`, this.scene);
                postMaterial.diffuseColor = new Color3(0.8, 0.7, 0.9);
                post.material = postMaterial;
                
                // Add decorative top
                if (i % 2 === 0) {
                    const topSphere = MeshBuilder.CreateSphere(
                        `post_top_${side}_${i}`,
                        { diameter: 0.2, segments: 8 },
                        this.scene
                    );
                    topSphere.position = new Vector3(
                        postPosition.x,
                        postHeight + postPosition.y,
                        postPosition.z
                    );
                    const topMaterial = new StandardMaterial(`top_material_${side}_${i}`, this.scene);
                    topMaterial.diffuseColor = new Color3(0.9, 0.8, 1.0);
                    topMaterial.emissiveColor = new Color3(0.3, 0.2, 0.4);
                    topSphere.material = topMaterial;
                }
            }
        }
    }

    public getAltarPosition(): Vector3 {
        return this.altar.position;
    }

    public getPlatformPosition(): Vector3 {
        return this.platform.position;
    }
    
    // Fallback method to try loading environment model
    public async load(filePath: string = "test3_nice.glb"): Promise<void> {
        try {
            console.log("Attempting to load environment model:", filePath);
            
            // Try to directly verify if the file exists by checking network
            const verifyFileExists = async (url: string): Promise<boolean> => {
                try {
                    const response = await fetch(url, { method: 'HEAD' });
                    return response.ok;
                } catch (e) {
                    console.error("Error checking file existence:", e);
                    return false;
                }
            };

            const fileUrl = `assets/${filePath}`;
            const fileExists = await verifyFileExists(fileUrl);
            console.log(`File ${fileUrl} exists: ${fileExists}`);

            // If file doesn't exist, use the basic environment we already created
            if (!fileExists) {
                console.log("Model file not found, using basic environment");
                return;
            }

            // Try to load the model
            try {
                const result = await SceneLoader.ImportMeshAsync(
                    "",  // meshNames: empty string means import all meshes
                    "assets/", // rootUrl: relative to public directory
                    filePath,  // filename
                    this.scene
                );
                
                if (!result || !result.meshes || result.meshes.length === 0) {
                    throw new Error("No meshes were loaded");
                }

                this.environmentMesh = result.meshes[0]; // Root mesh
                console.log("Loaded meshes:", result.meshes.length);
                
                // Set initial scale - making it larger to be more visible
                this.setScale(2.0);
                
                // Raise it slightly above ground level and center it
                this.setPosition(new Vector3(0, 0.1, 0));
                
                console.log("Environment model loaded successfully");
            } catch (loadError) {
                console.error("Error loading model:", loadError);
                // We're already using the basic environment, so no fallback needed
            }
        } catch (error: any) {
            console.error("Failed to load environment:", error);
        }
    }

    public dispose(): void {
        if (this.environmentMesh) {
            this.environmentMesh.dispose();
            this.environmentMesh = null;
        }
        this.hub.dispose();
        this.pathway.dispose();
        this.platform.dispose();
        this.altar.dispose();
    }

    public getMesh(): AbstractMesh | null {
        return this.environmentMesh;
    }

    public setScale(scale: number): void {
        if (this.environmentMesh) {
            this.environmentMesh.scaling = new Vector3(scale, scale, scale);
            console.log("Scale set to:", scale);
        }
    }

    public setPosition(position: Vector3): void {
        if (this.environmentMesh) {
            this.environmentMesh.position = position;
            console.log("Position set to:", position);
        }
    }

    public setRotation(rotation: Vector3): void {
        if (this.environmentMesh) {
            this.environmentMesh.rotation = rotation;
            console.log("Rotation set to:", rotation);
        }
    }
}