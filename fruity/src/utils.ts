export function shuffled<T>(array: T[]): T[] {
    const shuffled = array.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export function randomElement<T>(set: Set<T>): T {
    const array = Array.from(set);
    return array[Math.floor(Math.random() * array.length)];
}

export function randomInt(min: number, max: number): number {
    // return a random integer between min and max (inclusive)
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomBit(): boolean {
    return Math.random() < 0.5;
}

export function last<T>(array: T[]): T {
    return array[array.length - 1];
}
