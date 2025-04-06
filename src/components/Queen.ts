import {
    Scene,
    MeshBuilder,
    StandardMaterial,
    Color3,
    Vector3,
    TransformNode,
    Mesh,
    Animation,
    EasingFunction,
    CircleEase
} from '@babylonjs/core';

export class Queen extends TransformNode {
    private scene: Scene;
    private material: StandardMaterial;
    private mesh: TransformNode;
    // Initialize the animation in the declaration to satisfy TypeScript's strict initialization
    private placementAnimation: Animation = new Animation(
        "queenPlacementAnimation",
        "position.y",
        30, // frames per second
        Animation.ANIMATIONTYPE_FLOAT,
        Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    constructor(scene: Scene) {
        super('queen', scene);
        this.scene = scene;
        
        // Initialize properties
        this.material = new StandardMaterial('queen_material', this.scene);
        this.mesh = new TransformNode('queen_group', this.scene);
        
        // Create the queen mesh
        this.createMesh();
        
        // Set up the placement animation
        this.setupAnimation();
    }

    private createMesh(): void {
        // Create a group for the queen pieces
        this.mesh = new TransformNode('queen_group', this.scene);
        this.mesh.parent = this;

        // Create the base
        const base = MeshBuilder.CreateCylinder('queen_base', {
            height: 0.2,
            diameter: 0.6,
            tessellation: 16
        }, this.scene);
        base.parent = this.mesh;

        // Create the body
        const body = MeshBuilder.CreateCylinder('queen_body', {
            height: 1.2,
            diameterTop: 0.2,
            diameterBottom: 0.4,
            tessellation: 16
        }, this.scene);
        body.position.y = 0.7;
        body.parent = this.mesh;

        // Create the crown
        const crown = MeshBuilder.CreateCylinder('queen_crown', {
            height: 0.3,
            diameterTop: 0.4,
            diameterBottom: 0.2,
            tessellation: 16
        }, this.scene);
        crown.position.y = 1.45;
        crown.parent = this.mesh;

        // Create the top
        const top = MeshBuilder.CreateSphere('queen_top', {
            diameter: 0.3,
            segments: 16
        }, this.scene);
        top.position.y = 1.75;
        top.parent = this.mesh;

        // Create and apply material
        this.material.diffuseColor = new Color3(1, 1, 1);
        this.material.specularColor = new Color3(0.3, 0.3, 0.3);
        this.material.emissiveColor = new Color3(0.1, 0.1, 0.3); // Slight glow

        // Apply material to all meshes
        [base, body, crown, top].forEach(mesh => {
            mesh.material = this.material;
        });

        // Scale the entire group to make it fit nicely on the grid
        this.mesh.scaling = new Vector3(0.3, 0.3, 0.3);
        
        // Initially position slightly below the grid
        this.mesh.position.y = -0.5;
    }

    private setupAnimation(): void {
        // Animation keyframes
        const keyFrames = [
            {
                frame: 0,
                value: -0.5 // Starting below the grid
            },
            {
                frame: 15,
                value: 0.5 // Rising slightly above normal position
            },
            {
                frame: 30,
                value: 0.2 // Settling at final position
            }
        ];
        
        this.placementAnimation.setKeys(keyFrames);
        
        // Add easing for smoother animation
        const easingFunction = new CircleEase();
        easingFunction.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
        this.placementAnimation.setEasingFunction(easingFunction);
    }

    public setPosition(position: Vector3): void {
        // Position the queen at the grid cell location
        this.position = position.clone();
        
        // Play the placement animation
        this.scene.beginDirectAnimation(
            this, 
            [this.placementAnimation], 
            0, 
            30, 
            false, // not loop
            1.0 // speed ratio
        );
    }

    public dispose(): void {
        // Stop any running animations
        this.scene.stopAnimation(this);
        
        // Dispose of materials and meshes
        this.material.dispose();
        this.mesh.getChildMeshes().forEach(mesh => mesh.dispose());
        this.mesh.dispose();
        super.dispose();
    }
}