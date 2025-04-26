function randomNumInRange(min: number, max: number, step?: number) {
    const range = Math.floor((max - min) / (step ?? 1));
    const randomStep = Math.floor(Math.random() * (range + 1));
    return min + randomStep * (step ?? 1);
}

export default randomNumInRange;