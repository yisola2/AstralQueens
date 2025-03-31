export class UI {
    private container: HTMLDivElement;
    private queenCounter: HTMLDivElement;
    private messageBox: HTMLDivElement;
    private queenCount: number = 0;

    constructor() {
        // Create main container
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '20px';
        this.container.style.left = '50%';
        this.container.style.transform = 'translateX(-50%)';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.alignItems = 'center';
        this.container.style.gap = '10px';
        this.container.style.zIndex = '1000';
        document.body.appendChild(this.container);

        // Create queen counter
        this.queenCounter = document.createElement('div');
        this.queenCounter.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.queenCounter.style.color = 'white';
        this.queenCounter.style.padding = '10px 20px';
        this.queenCounter.style.borderRadius = '5px';
        this.queenCounter.style.fontFamily = 'Arial, sans-serif';
        this.queenCounter.style.fontSize = '16px';
        this.container.appendChild(this.queenCounter);
        this.updateQueenCount(0);

        // Create message box
        this.messageBox = document.createElement('div');
        this.messageBox.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
        this.messageBox.style.color = 'white';
        this.messageBox.style.padding = '10px 20px';
        this.messageBox.style.borderRadius = '5px';
        this.messageBox.style.display = 'none';
        this.messageBox.style.fontFamily = 'Arial, sans-serif';
        this.messageBox.style.fontSize = '14px';
        this.container.appendChild(this.messageBox);
    }

    public updateQueenCount(count: number): void {
        this.queenCount = count;
        this.queenCounter.textContent = `Queens Placed: ${this.queenCount}`;
    }

    public showMessage(message: string, isError: boolean = true): void {
        this.messageBox.style.backgroundColor = isError ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 128, 0, 0.8)';
        this.messageBox.textContent = message;
        this.messageBox.style.display = 'block';
        setTimeout(() => this.hideMessage(), 3000);
    }

    public hideMessage(): void {
        this.messageBox.style.display = 'none';
    }

    public dispose(): void {
        document.body.removeChild(this.container);
    }
} 