// include p5.js

let config = null;


class ColorConfig {
    constructor(generator_) {
        this.generator = generator_;
        this.value = null;
    }

    getValue() {
        if (!this.value) {
            this.value = this.generator();
        }
        return this.value;
    }
}

class WallpaperConfig {
    constructor(config) {
        let self = this;
        this.config = config;
        this.tileSize = random(15, 60),
        this.passes = random(3, 12),
        this.baseColor = self.config.palette.gradientStart.getValue();
        this.secondaryColor = self.config.palette.gradientStop.getValue();
        this.patterns = [
            {
                name: 'squareWorms',
                generator: function (startX, startY) {
                    let strokeColor = lerpColor(
                        self.baseColor,
                        self.secondaryColor,
                        random(0.1, 0.9)
                    )
                    let tileSize = max(self.tileSize + random(-10, 10), 10);
                    push();
                    stroke(strokeColor)
                    strokeWeight(3);
                    let stop1 = tileSize * .6;
                    let stop2 = tileSize * .4;
                    let stop3 = tileSize;

                    maybe(function () {
                        line(startX, startY + stop1, startX + stop1, startY + stop1)
                    });
                    maybe(function () {
                        line(startX + stop1, startY + stop1, startX + stop1, startY)
                    });
                    maybe(function () {
                        line(startX + stop2, startY + stop2, startX + stop2, startY + stop3)
                    });
                    maybe(function () {
                        line(startX + stop2, startY + stop2, startX + stop3, startY + stop2)
                    });
                    maybe(function () {
                        line(startX + stop3, startY + stop2, startX + stop3, startY + stop1)
                    });
                    maybe(function () {
                        line(startX + stop2, startY + stop3, startX + stop1, startY + stop3)
                    });
                    pop();
                }
            },
            {
                name: 'stucco',
                generator: function(startX, startY) {
                    push();
                    for (let i = 0; i < random(10, 50); ++i) {
                        stroke(getRandomPaletteColor());
                        point(random(0, width), random(0, height))
                    }
                    pop();
                }
            }
        ];
    }
}

class Config {
    constructor() {
        const self = this;
        self.canvas = {
            height: 800,
            width: 800
        };

        self.palette = {
            gradientStart: new ColorConfig(getRandomColor),
            gradientStop: new ColorConfig(function () {
                let bgColor = self.palette.gradientStart.getValue();
                let seedColor = getRandomColor();
                return lerpColor(
                    bgColor,
                    seedColor,
                    random(.25, .99)
                );
            })
        }

        self.wallpaper = new WallpaperConfig(self)
        self.possibleSubjects = [];
    }
}

function getRandomPaletteColor() {
    return lerpColor(
        config.palette.gradientStart.getValue(),
        config.palette.gradientStop.getValue(),
        random(0.2, 0.8)
    )
}

function setup() {
    config = new Config();
    createCanvas(config.canvas.width, config.canvas.height);
    angleMode(DEGREES);
    noLoop();
}

function getRandomColor() {
    return color(
        random(0, 255),
        random(0, 255),
        random(0, 255),
    )
}

function maybe(fn) {
    if (random(0, 1) > 0.5) {
        fn();
    }
}

function tileShape(shape) {
    let tileSize = config.wallpaper.tileSize;
    let posX = 0;
    let posY = 0;
    while (posY < height) {
        while (posX < width) {
            shape.generator(posX, posY);
            posX += tileSize;
        }
        posY += tileSize;
        posX = 0;
    }
}

function paintBowl(baseColor) {
    let bowlStartX = random(width * .25, width * .75);
    let bowlStartY = 500;
    let bowlHeight = 300;
    let bowlWidth = 300;
    fill(getRandomPaletteColor())
    arc(bowlStartX, bowlStartY, bowlWidth, bowlHeight, 0, 180, OPEN);
}

function paintTable() {
    let baseColor = config.palette.gradientStart.getValue();
    let color = lerpColor(baseColor, getRandomColor(), .5);
    color = lerpColor(color, config.palette.gradientStop.getValue(), .5);
    fill(color);
    rect(0, 600, width, 300)
}

function paintWallpaper() {
    let bgColor = config.wallpaper.baseColor;
    let patterns = config.wallpaper.patterns;
    background(bgColor);

    let shapeIndex = floor(random(0, patterns.length))
    let shape = patterns[shapeIndex]
    for (let i = 0; i < config.wallpaper.passes; ++i) {
        tileShape(shape);
    }
}


function draw() {
    let backgroundColor = config.palette.gradientStart.getValue();
    paintWallpaper();
    paintTable(backgroundColor);
    paintBowl(backgroundColor);
}
