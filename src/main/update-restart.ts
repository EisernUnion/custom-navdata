/** Defer update prompts/restarts while a database operation is active. */
export class UpdateRestartCoordinator {
    private pending = false;
    private prompting = false;
    private stopped = false;
    private timer: ReturnType<typeof setTimeout> | undefined;

    constructor(
        private readonly isBusy: () => boolean,
        private readonly askToRestart: () => Promise<boolean>,
        private readonly restart: () => void,
        private readonly retryDelay = 5000
    ) {}

    downloaded(): void {
        this.pending = true;
        void this.promptWhenIdle();
    }

    stop(): void {
        this.stopped = true;
        clearTimeout(this.timer);
    }

    private retry(): void {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => { void this.promptWhenIdle(); }, this.retryDelay);
        this.timer.unref();
    }

    private async promptWhenIdle(): Promise<void> {
        if (this.stopped || !this.pending || this.prompting) return;
        if (this.isBusy()) {
            this.retry();
            return;
        }
        this.prompting = true;
        try {
            const accepted = await this.askToRestart();
            if (this.stopped) return;
            if (!accepted) {
                this.pending = false;
                return;
            }
            // A new insertion may have started while the dialog was open.
            if (this.isBusy()) {
                this.retry();
                return;
            }
            this.pending = false;
            this.restart();
        } catch (error) {
            console.error('Unable to display the update prompt:', error);
        } finally {
            this.prompting = false;
        }
    }
}
