export class DonutAnimation {
    private width: number = 80;
    private height: number = 22;
    private bufferSize: number = this.width * this.height;

    // Phuong thuc tao mot khung hinh ASCII art cua Donut
    private generateDonutFrame(A: number, B: number): string {
        const b: string[] = new Array(this.bufferSize).fill(' ');
        const z: number[] = new Array(this.bufferSize).fill(0);

        for (let j = 0; j < 6.28; j += 0.14) {
            for (let i = 0; i < 6.28; i += 0.04) {
                const c = Math.sin(i);
                const d = Math.cos(j);
                const e = Math.sin(A);
                const f = Math.sin(j);
                const g = Math.cos(A);
                const h = d + 2;
                const D = 1 / (c * h * e + f * g + 5);
                const l = Math.cos(i);
                const m = Math.cos(B);
                const n = Math.sin(B);
                const t = c * h * g - f * e;

                const x = 40 + 30 * D * (l * h * m - t * n);
                const y = 12 + 15 * D * (l * h * n + t * m);
                const o = Math.floor(x) + this.width * Math.floor(y);
                const N = Math.floor(8 * ((f * e - c * d * g) * m - c * d * e - f * g - l * d * n));

                if (y > 0 && y < this.height && x > 0 && x < this.width && o >= 0 && o < this.bufferSize && D > z[o]) {
                    z[o] = D;
                    const index = N > 0 ? Math.min(Math.max(N, 0), 9) : 0;
                    b[o] = ".,-~:;=!*#$@"[index];
                }
            }
        }

        let output = '';
        for (let k = 0; k < this.bufferSize; k++) {
            if (k % this.width === 0) output += '\n';
            output += b[k] || ' ';
        }
        return output.length > 1800 ? output.substring(0, 1800) + '...' : output;
    }

    // Phuong thuc tao hieu ung xoay Donut qua nhieu khung hinh
    public generateAnimation(frameCount: number = 10): string[] {
        const frames: string[] = [];
        const totalAngle = 4 * Math.PI; // 2 vong = 4π radian
        const angleIncrement = totalAngle / (frameCount - 1); // Tang goc deu cho khung hinh
        for (let frame = 0; frame < frameCount; frame++) {
            const A = angleIncrement * frame; // Goc xoay A
            const B = angleIncrement * frame * 0.5; // Goc xoay B cham hon
            frames.push(this.generateDonutFrame(A, B));
        }
        return frames;
    }
}