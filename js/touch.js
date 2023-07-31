const TAP_MAX_DURATION_MILLISECONDS = 500;
const SWIPE_DOWN_MAX_DURATION_MILLISECONDS = 750;

const GestureType = {
    UNKNOWN: 'UNKNOWN',
    TAP: 'TAP',
    SWIPE_DOWN: 'SWIPE_DOWN',
    SWIPE_HORIZONTAL: 'SWIPE_HORIZONTAL',
}

class Gesture {
    constructor(startX, startY, significantMoveThreshold) {
        this.startTime = new Date();
        // this.startX = startX;
        // this.startY = startY;
        this.minX = startX;
        this.minY = startY;
        this.maxX = startX;
        this.maxY = startY;
        this.lastX = startX;
        this.lastY = startY;
        this.significantMoveThreshold = significantMoveThreshold;
    }

    update(x, y) {
        this.minX = Math.min(this.minX, x);
        this.minY = Math.min(this.minY, y);
        this.maxX = Math.max(this.maxX, x);
        this.maxY = Math.max(this.maxY, y);
        this.lastX = x;
        this.lastY = y;
    }

    getType() {
        const durationMilliseconds = new Date() - this.startTime;
        if (durationMilliseconds > SWIPE_DOWN_MAX_DURATION_MILLISECONDS) {
            // Long gestures are always considered horizontal swipes.
            return GestureType.SWIPE_HORIZONTAL;
        }
        const deltaX = this.maxX - this.minX;
        const deltaY = this.maxY - this.minY;
        const significantHorizontal = deltaX > this.significantMoveThreshold;
        const significantVertical = deltaY > this.significantMoveThreshold;
        if (durationMilliseconds < TAP_MAX_DURATION_MILLISECONDS && !significantHorizontal && !significantVertical) {
            return GestureType.TAP;
        }
        if (significantVertical && deltaY > 2 * deltaX) {
            return GestureType.SWIPE_DOWN;
        }
        if (significantHorizontal) {
            return GestureType.SWIPE_HORIZONTAL;
        }
        return GestureType.UNKNOWN;
    }
}

class TouchControls {
    static get EMULATE_WITH_MOUSE() { return false; }
    static fakeTouchEvent(clientX, clientY) {
        return {
            changedTouches: [
                {
                    identifier: 0,
                    clientX: clientX,
                    clientY: clientY,
                },
            ],
            preventDefault: () => undefined,
        };
    }

    /**
     * @param {HTMLElement} element 
     * @param {(x: number, y: number) => void} onTap 
     * @param {() => void} onSwipeDown 
     * @param {(xRelative: number) => void} onSwipeHorizontal 
     */
    constructor(element = null, onTap = null, onSwipeDown = null, onSwipeHorizontal = null) {
        this.element = element ?? document.body;
        this.element.addEventListener("touchstart", this.onTouchStart.bind(this));
        this.element.addEventListener("touchend", this.onTouchEnd.bind(this));
        this.element.addEventListener("touchmove", this.onTouchMove.bind(this));
        this.element.addEventListener("touchcancel", this.onTouchCancel.bind(this));

        /** @type {Map<number, Gesture>} */
        this.gestures = new Map();
        this.onTap = onTap;
        this.onSwipeDown = onSwipeDown;
        this.onSwipeHorizontal = onSwipeHorizontal;

        if (TouchControls.EMULATE_WITH_MOUSE) {
            console.warn('Emulating touch events with mouse clicks. Do not submit this.');
            this.element.addEventListener("mousedown", e => {
                if (e.button !== 0) return;
                this.onTouchStart(TouchControls.fakeTouchEvent(e.clientX, e.clientY));
                e.preventDefault();
            });
            document.body.addEventListener("mouseup", e => {
                if (this.gestures.size === 0) return;
                this.onTouchEnd(TouchControls.fakeTouchEvent(e.clientX, e.clientY));
                e.preventDefault();
            });
            document.body.addEventListener("mousemove", e => {
                if (this.gestures.size === 0) return;
                this.onTouchMove(TouchControls.fakeTouchEvent(e.clientX, e.clientY));
                e.preventDefault();
            });
        }
    }

    getSignificantMoveThreshold() {
        const rect = this.element.getBoundingClientRect();
        return Math.min(rect.width, rect.height) / 10;
    }

    toRelativeHorizontal(x) {
        const rect = this.element.getBoundingClientRect();
        return Math.max(0, Math.min(1, (x - rect.left) / rect.width));
    }

    /**
     * @param {TouchEvent} event 
     */
    onTouchStart(event) {
        event.preventDefault();
        const threshold = this.getSignificantMoveThreshold();
        for (const touch of event.changedTouches) {
            this.gestures.set(touch.identifier, new Gesture(touch.clientX, touch.clientY, threshold));
        }
    }

    /**
     * @param {TouchEvent} event 
     */
    onTouchMove(event) {
        event.preventDefault();
        for (const touch of event.changedTouches) {
            const gesture = this.gestures.get(touch.identifier);
            if (gesture !== null) {
                gesture.update(touch.clientX, touch.clientY);
            }
            if (this.onSwipeHorizontal && gesture.getType() === GestureType.SWIPE_HORIZONTAL) {
                this.onSwipeHorizontal(this.toRelativeHorizontal(gesture.lastX));
            }
        }
    }

    /**
     * @param {TouchEvent} event 
     */
    onTouchEnd(event) {
        event.preventDefault();
        for (const touch of event.changedTouches) {
            const gesture = this.gestures.get(touch.identifier);
            this.gestures.delete(touch.identifier);

            switch (gesture.getType()) {
                case GestureType.TAP:
                    if (this.onTap) this.onTap(gesture.lastX, gesture.lastY);
                    break;
                case GestureType.SWIPE_DOWN:
                    if (this.onSwipeDown) this.onSwipeDown();
                    break;
            }
        }
    }

    /**
     * @param {TouchEvent} event 
     */
    onTouchCancel(event) {
        event.preventDefault();
        for (const touch of event.changedTouches) {
            this.gestures.delete(touch.identifier);
        }
    }
}