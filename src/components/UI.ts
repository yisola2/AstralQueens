export class UI {
    private container: HTMLDivElement;
    private header: HTMLDivElement;
    private statsContainer: HTMLDivElement;
    private messageBox: HTMLDivElement;
    private queenCounter: HTMLDivElement;
    private regionCounter: HTMLDivElement;
    private instructionsButton: HTMLButtonElement;
    private queenCount: number = 0;
    private regionCount: number = 0;

    constructor() {
        // Create main container
        this.container = document.createElement('div');
        this.setupMainContainer();

        // Create header
        this.header = this.createHeader();
        this.container.appendChild(this.header);

        // Create stats container
        this.statsContainer = this.createStatsContainer();
        this.container.appendChild(this.statsContainer);

        // Create queen counter
        this.queenCounter = this.createCounter('Queens Placed: 0');
        this.statsContainer.appendChild(this.queenCounter);

        // Create region counter
        this.regionCounter = this.createCounter('Regions Filled: 0/7');
        this.statsContainer.appendChild(this.regionCounter);

        // Create message box
        this.messageBox = this.createMessageBox();
        this.container.appendChild(this.messageBox);

        // Create instructions button
        this.instructionsButton = this.createInstructionsButton();
        this.container.appendChild(this.instructionsButton);

        // Add to document
        document.body.appendChild(this.container);

        // Show initial instructions
        this.showInstructions();
    }

    private setupMainContainer(): void {
        this.container.style.position = 'absolute';
        this.container.style.top = '0';
        this.container.style.left = '0';
        this.container.style.right = '0';
        this.container.style.display = 'flex';
        this.container.style.flexDirection = 'column';
        this.container.style.alignItems = 'center';
        this.container.style.padding = '20px';
        this.container.style.fontFamily = 'Arial, sans-serif';
        this.container.style.color = 'white';
        this.container.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
        this.container.style.pointerEvents = 'none'; // Allow clicking through the container
    }

    private createHeader(): HTMLDivElement {
        const header = document.createElement('div');
        header.style.fontSize = '32px';
        header.style.fontWeight = 'bold';
        header.style.marginBottom = '20px';
        header.style.textAlign = 'center';
        header.innerHTML = 'Astral Queens:<br>Resonance Grid';
        return header;
    }

    private createStatsContainer(): HTMLDivElement {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.gap = '20px';
        container.style.marginBottom = '20px';
        return container;
    }

    private createCounter(text: string): HTMLDivElement {
        const counter = document.createElement('div');
        counter.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        counter.style.padding = '10px 20px';
        counter.style.borderRadius = '5px';
        counter.style.fontSize = '16px';
        counter.textContent = text;
        return counter;
    }

    private createMessageBox(): HTMLDivElement {
        const messageBox = document.createElement('div');
        messageBox.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        messageBox.style.padding = '10px 20px';
        messageBox.style.borderRadius = '5px';
        messageBox.style.fontSize = '16px';
        messageBox.style.textAlign = 'center';
        messageBox.style.display = 'none';
        messageBox.style.marginBottom = '20px';
        messageBox.style.maxWidth = '400px';
        return messageBox;
    }

    private createInstructionsButton(): HTMLButtonElement {
        const button = document.createElement('button');
        button.textContent = '?';
        button.style.position = 'fixed';
        button.style.bottom = '20px';
        button.style.right = '20px';
        button.style.width = '40px';
        button.style.height = '40px';
        button.style.borderRadius = '50%';
        button.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        button.style.color = 'white';
        button.style.border = '2px solid white';
        button.style.fontSize = '20px';
        button.style.cursor = 'pointer';
        button.style.pointerEvents = 'auto';
        button.style.transition = 'all 0.3s ease';

        button.addEventListener('mouseover', () => {
            button.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        });

        button.addEventListener('mouseout', () => {
            button.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        });

        button.addEventListener('click', () => {
            this.showInstructions();
        });

        return button;
    }

    private showInstructions(): void {
        const instructions = `
            🎯 Goal: Place queens in each region following these rules:
            
            • Each colored region must have exactly one queen
            • Queens attack their entire row and column
            • Queens attack only adjacent diagonal cells
            • No queen can attack another queen
            
            Click to place a queen, click again to remove.
            Green highlight shows valid moves.
        `;
        this.showMessage(instructions, false, 10000);
    }

    public updateQueenCount(count: number): void {
        this.queenCount = count;
        this.queenCounter.textContent = `Queens Placed: ${this.queenCount}`;
    }

    public updateRegionCount(filled: number, total: number): void {
        this.regionCount = filled;
        this.regionCounter.textContent = `Regions Filled: ${filled}/${total}`;
    }

    public showMessage(message: string, isError: boolean = true, duration: number = 3000): void {
        this.messageBox.style.backgroundColor = isError ? 'rgba(255, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.7)';
        this.messageBox.style.display = 'block';
        this.messageBox.innerHTML = message.replace(/\n/g, '<br>');

        if (duration > 0) {
            setTimeout(() => this.hideMessage(), duration);
        }
    }

    public hideMessage(): void {
        this.messageBox.style.display = 'none';
    }

    public showWinMessage(): void {
        const winMessage = `
            🎉 Congratulations! 🎉
            You've solved the Astral Queens puzzle!
            All queens are perfectly placed.
        `;
        this.showMessage(winMessage, false, 0);
    }

    public dispose(): void {
        document.body.removeChild(this.container);
    }
} 